import bcrypt from 'bcrypt'
import express from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, identifier, password } = req.body
    const loginValue = String(identifier || username || '').trim()

    if (!loginValue || !password) {
      return res.status(400).json({ message: 'Username or email and password are required' })
    }

    const result = await query(
      `
        SELECT id, username, email, password_hash, role, access_status
        FROM users
        WHERE username = $1 OR LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [loginValue],
    )
    const user = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid username/email or password' })
    }

    if (user.access_status !== 'active') {
      return res.status(403).json({ message: 'This account is inactive. Please contact the IT Manager.' })
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

router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required' })
    }

    const result = await query(
      'SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1',
      [req.user.id],
    )
    const user = result.rows[0]
    if (!user || !(await bcrypt.compare(oldPassword, user.password_hash))) {
      return res.status(401).json({ message: 'Old password is incorrect' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, req.user.id],
    )

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
