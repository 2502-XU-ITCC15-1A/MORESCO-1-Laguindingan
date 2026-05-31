import bcrypt from 'bcrypt'
import express from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import { createRateLimiter } from '../middleware/rateLimit.js'

const router = express.Router()
const LOCKOUT_MINUTES = [1, 3, 5, 10, 15]
const MAX_ATTEMPTS_PER_STAGE = 3
const PROTECTED_DEFAULT_EMAILS = new Set(['itmanager@moresco.local'])
const loginRateLimiter = createRateLimiter({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60_000),
  maxRequests: Number(process.env.LOGIN_RATE_LIMIT_MAX || 30),
  message: 'Too many login attempts. Please wait a few minutes before trying again.',
  keyGenerator: req => {
    const forwardedFor = typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : ''
    const ip = forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown'
    const identifier = String(req.body?.identifier || req.body?.username || '').trim().toLowerCase()
    return `${ip}:${identifier || 'anonymous'}`
  },
})

function isProtectedDefaultUser(user) {
  return PROTECTED_DEFAULT_EMAILS.has(String(user?.email || '').trim().toLowerCase())
}

function formatRetryMessage(lockedUntil) {
  const remainingMs = Math.max(0, new Date(lockedUntil).getTime() - Date.now())
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000))
  return `Too many login attempts. Please wait ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} before trying again.`
}

async function resetLoginFailures(userId) {
  await query(
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
    `,
    [userId],
  )
}

async function registerFailedLogin(user) {
  const nextAttemptCount = Number(user.failed_login_attempts || 0) + 1

  if (nextAttemptCount < MAX_ATTEMPTS_PER_STAGE) {
    await query(
      `
        UPDATE users
        SET
          failed_login_attempts = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [nextAttemptCount, user.id],
    )
    return { status: 401, message: 'Invalid username/email or password' }
  }

  const currentStage = Number(user.lockout_stage || 0)

  if (currentStage >= LOCKOUT_MINUTES.length) {
    await query(
      `
        UPDATE users
        SET
          failed_login_attempts = 0,
          manually_locked = true,
          locked_at = CURRENT_TIMESTAMP,
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [user.id],
    )
    return {
      status: 423,
      message: 'This account has been locked. Please contact the IT Manager to unlock it.',
    }
  }

  const lockMinutes = LOCKOUT_MINUTES[currentStage]
  const nextStage = currentStage + 1
  const lockedUntil = new Date(Date.now() + lockMinutes * 60_000)

  await query(
    `
      UPDATE users
      SET
        failed_login_attempts = 0,
        lockout_stage = $1,
        locked_until = $2,
        locked_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
    [nextStage, lockedUntil, user.id],
  )

  return {
    status: 429,
    message: formatRetryMessage(lockedUntil),
  }
}

router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { username, identifier, password } = req.body
    const loginValue = String(identifier || username || '').trim()

    if (!loginValue || !password) {
      return res.status(400).json({ message: 'Username or email and password are required' })
    }

    const result = await query(
      `
        SELECT
          id,
          username,
          email,
          password_hash,
          role,
          access_status,
          failed_login_attempts,
          lockout_stage,
          locked_until,
          manually_locked
        FROM users
        WHERE username = $1 OR LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [loginValue],
    )
    const user = result.rows[0]
    const userIsProtectedDefault = isProtectedDefaultUser(user)

    if (!userIsProtectedDefault && user?.manually_locked) {
      return res.status(423).json({ message: 'This account has been locked. Please contact the IT Manager to unlock it.' })
    }

    if (!userIsProtectedDefault && user?.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return res.status(429).json({ message: formatRetryMessage(user.locked_until) })
    }

    if (!userIsProtectedDefault && user?.locked_until && new Date(user.locked_until).getTime() <= Date.now()) {
      await query(
        `
          UPDATE users
          SET
            failed_login_attempts = 0,
            locked_until = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [user.id],
      )
      user.failed_login_attempts = 0
      user.locked_until = null
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid username/email or password' })
    }

    if (!(await bcrypt.compare(password, user.password_hash))) {
      if (userIsProtectedDefault) {
        return res.status(401).json({ message: 'Invalid username/email or password' })
      }
      const failedLoginState = await registerFailedLogin(user)
      return res.status(failedLoginState.status).json({ message: failedLoginState.message })
    }

    if (user.access_status !== 'active') {
      return res.status(403).json({ message: 'This account is inactive. Please contact the IT Manager.' })
    }

    if (!userIsProtectedDefault && (user.failed_login_attempts || user.lockout_stage || user.locked_until || user.manually_locked)) {
      await resetLoginFailures(user.id)
    }

    const payload = { id: user.id, username: user.username, email: user.email, role: user.role }
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
    )

    res.json({
      token,
      user: payload,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
