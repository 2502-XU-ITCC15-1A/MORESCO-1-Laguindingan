import bcrypt from 'bcrypt'
import express from 'express'
import auth from '../middleware/auth.js'
import { requireItManager } from '../middleware/roles.js'
import { query } from '../db.js'

const router = express.Router()
const AVAILABLE_ROLES = new Set(['HR Admin', 'Company Nurse', 'IT Manager'])
const AVAILABLE_STATUSES = new Set(['active', 'inactive'])

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

async function buildUserPayload(body, { requirePassword }) {
  const username = normalizeValue(body.username)
  const email = normalizeEmail(body.email)
  const role = normalizeRole(body.role)
  const accessStatus = normalizeStatus(body.accessStatus || 'active')
  const password = String(body.password || '')

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
          username,
          email,
          role,
          access_status AS "accessStatus",
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
          username, email, password_hash, role, access_status,
          access_granted_at, invitation_confirmed_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING
          id,
          username,
          email,
          role,
          access_status AS "accessStatus",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [payload.username, payload.email, payload.passwordHash, payload.role, payload.accessStatus],
    )

    res.status(201).json({
      user: result.rows[0],
      message: 'User account created successfully.',
    })
  } catch (error) {
    console.error('Create user error:', error)
    if (error.code === '23505') {
      return res.status(409).json({ message: 'That username or email is already assigned to another account.' })
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
      'SELECT id FROM users WHERE id = $1 LIMIT 1',
      [req.params.userId],
    )
    const user = rows[0]

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const updated = await query(
      payload.passwordHash
        ? `
            UPDATE users
            SET
              username = $1,
              email = $2,
              role = $3,
              access_status = $4,
              password_hash = $5,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING
              id,
              username,
              email,
              role,
              access_status AS "accessStatus",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
          `
        : `
            UPDATE users
            SET
              username = $1,
              email = $2,
              role = $3,
              access_status = $4,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING
              id,
              username,
              email,
              role,
              access_status AS "accessStatus",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
          `,
      payload.passwordHash
        ? [payload.username, payload.email, payload.role, payload.accessStatus, payload.passwordHash, user.id]
        : [payload.username, payload.email, payload.role, payload.accessStatus, user.id],
    )

    res.json({
      user: updated.rows[0],
      message: 'User account updated successfully.',
    })
  } catch (error) {
    console.error('Update user error:', error)
    if (error.code === '23505') {
      return res.status(409).json({ message: 'That username or email is already assigned to another account.' })
    }
    res.status(500).json({ message: 'Unable to update the user account.' })
  }
})

router.delete('/users/:userId', auth, requireItManager, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id FROM users WHERE id = $1 LIMIT 1',
      [req.params.userId],
    )
    const user = rows[0]

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete the account you are currently using.' })
    }

    await query('UPDATE users SET invited_by = NULL WHERE invited_by = $1', [user.id])
    await query('DELETE FROM users WHERE id = $1', [user.id])

    res.json({ message: 'User deleted successfully.' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Unable to delete user.' })
  }
})

export default router
