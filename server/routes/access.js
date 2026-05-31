import bcrypt from 'bcrypt'
import express from 'express'
import auth from '../middleware/auth.js'
import { requireItManager } from '../middleware/roles.js'
import { query } from '../db.js'

const router = express.Router()
const AVAILABLE_ROLES = new Set(['HR Admin', 'Company Nurse', 'IT Manager'])
const AVAILABLE_STATUSES = new Set(['active', 'inactive'])
const PROTECTED_DEFAULT_EMAILS = new Set(['itmanager@moresco.local'])

function normalizeValue(value) {
  return String(value || '').trim()
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeRole(role) {
  return String(role || '').trim()
}

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase()
}

function isProtectedDefaultUser(user) {
  return PROTECTED_DEFAULT_EMAILS.has(normalizeEmail(user?.email))
}

async function buildUserPayload(body, { requirePassword }) {
  const idNumber = normalizeValue(body.idNumber)
  const username = normalizeValue(body.username)
  const email = normalizeEmail(body.email)
  const role = normalizeRole(body.role)
  const accessStatus = normalizeStatus(body.accessStatus || 'active')
  const password = String(body.password || '')

  if (!idNumber) return { error: 'Company ID is required.' }
  if (!username) return { error: 'Username is required.' }
  if (!email) return { error: 'Email is required.' }
  if (!AVAILABLE_ROLES.has(role)) return { error: 'Please choose a valid role.' }
  if (!AVAILABLE_STATUSES.has(accessStatus)) return { error: 'Please choose a valid access status.' }
  if (requirePassword && password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' }
  }

  let passwordHash = null
  if (password) {
    if (password.length < 8) {
      return { error: 'Password must be at least 8 characters long.' }
    }
    passwordHash = await bcrypt.hash(password, 10)
  }

  return {
    idNumber,
    username,
    email,
    role,
    accessStatus,
    passwordHash,
  }
}

router.get('/users', auth, requireItManager, async (req, res) => {
  try {
    const result = await query(
      `
        SELECT
          id,
          id_number AS "idNumber",
          username,
          email,
          role,
          access_status AS "accessStatus",
          manually_locked AS "manuallyLocked",
          locked_until AS "lockedUntil",
          locked_at AS "lockedAt",
          lockout_stage AS "lockoutStage",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM users
        ORDER BY created_at ASC
      `,
    )

    res.json(result.rows)
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ message: 'Unable to load user access records.' })
  }
})

router.post('/users', auth, requireItManager, async (req, res) => {
  try {
    const payload = await buildUserPayload(req.body, { requirePassword: true })
    if (payload.error) {
      return res.status(400).json({ message: payload.error })
    }

    const result = await query(
      `
        INSERT INTO users (
          id_number, username, email, password_hash, role, access_status, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING
          id,
          id_number AS "idNumber",
          username,
          email,
          role,
          access_status AS "accessStatus",
          manually_locked AS "manuallyLocked",
          locked_until AS "lockedUntil",
          locked_at AS "lockedAt",
          lockout_stage AS "lockoutStage",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [payload.idNumber, payload.username, payload.email, payload.passwordHash, payload.role, payload.accessStatus],
    )

    res.status(201).json({
      user: result.rows[0],
      message: 'User account created successfully.',
    })
  } catch (error) {
    console.error('Create user error:', error)
    if (error.code === '23505') {
      return res.status(409).json({ message: 'That company ID, username, or email is already assigned to another account.' })
    }
    res.status(500).json({ message: 'Unable to create the user account.' })
  }
})

router.put('/users/:userId', auth, requireItManager, async (req, res) => {
  try {
    const payload = await buildUserPayload(req.body, { requirePassword: false })
    if (payload.error) {
      return res.status(400).json({ message: payload.error })
    }

    const { rows } = await query(
      'SELECT id, email FROM users WHERE id = $1 LIMIT 1',
      [req.params.userId],
    )
    const user = rows[0]

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (user.id === req.user.id) {
      if (payload.role !== req.user.role) {
        return res.status(400).json({ message: 'You cannot change your own role while using this account.' })
      }

      if (payload.accessStatus !== 'active') {
        return res.status(400).json({ message: 'You cannot deactivate the account you are currently using.' })
      }
    }

    if (isProtectedDefaultUser(user) && payload.role !== 'IT Manager') {
      return res.status(400).json({ message: 'The default IT Manager account must remain an IT Manager.' })
    }

    if (isProtectedDefaultUser(user) && payload.accessStatus !== 'active') {
      return res.status(400).json({ message: 'The default IT Manager account must remain active.' })
    }

    const updated = await query(
      payload.passwordHash
        ? `
            UPDATE users
            SET
              id_number = $1,
              username = $2,
              email = $3,
              role = $4,
              access_status = $5,
              password_hash = $6,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING
              id,
              id_number AS "idNumber",
              username,
              email,
              role,
              access_status AS "accessStatus",
              manually_locked AS "manuallyLocked",
              locked_until AS "lockedUntil",
              locked_at AS "lockedAt",
              lockout_stage AS "lockoutStage",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
          `
        : `
            UPDATE users
            SET
              id_number = $1,
              username = $2,
              email = $3,
              role = $4,
              access_status = $5,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING
              id,
              id_number AS "idNumber",
              username,
              email,
              role,
              access_status AS "accessStatus",
              manually_locked AS "manuallyLocked",
              locked_until AS "lockedUntil",
              locked_at AS "lockedAt",
              lockout_stage AS "lockoutStage",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
          `,
      payload.passwordHash
        ? [payload.idNumber, payload.username, payload.email, payload.role, payload.accessStatus, payload.passwordHash, user.id]
        : [payload.idNumber, payload.username, payload.email, payload.role, payload.accessStatus, user.id],
    )

    res.json({
      user: updated.rows[0],
      message: 'User account updated successfully.',
    })
  } catch (error) {
    console.error('Update user error:', error)
    if (error.code === '23505') {
      return res.status(409).json({ message: 'That company ID, username, or email is already assigned to another account.' })
    }
    res.status(500).json({ message: 'Unable to update the user account.' })
  }
})

router.post('/users/:userId/unlock', auth, requireItManager, async (req, res) => {
  try {
    const result = await query(
      `
        UPDATE users
        SET
          failed_login_attempts = 0,
          lockout_stage = 0,
          locked_until = NULL,
          manually_locked = false,
          locked_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING
          id,
          id_number AS "idNumber",
          username,
          email,
          role,
          access_status AS "accessStatus",
          manually_locked AS "manuallyLocked",
          locked_until AS "lockedUntil",
          locked_at AS "lockedAt",
          lockout_stage AS "lockoutStage",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [req.params.userId],
    )

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'User not found.' })
    }

    res.json({
      user: result.rows[0],
      message: 'User account unlocked successfully.',
    })
  } catch (error) {
    console.error('Unlock user error:', error)
    res.status(500).json({ message: 'Unable to unlock the user account.' })
  }
})

router.delete('/users/:userId', auth, requireItManager, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, email FROM users WHERE id = $1 LIMIT 1',
      [req.params.userId],
    )
    const user = rows[0]

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete the account you are currently using.' })
    }

    if (isProtectedDefaultUser(user)) {
      return res.status(400).json({ message: 'The default IT Manager account cannot be deleted.' })
    }

    await query('DELETE FROM users WHERE id = $1', [user.id])

    res.json({ message: 'User deleted successfully.' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Unable to delete user.' })
  }
})

export default router
