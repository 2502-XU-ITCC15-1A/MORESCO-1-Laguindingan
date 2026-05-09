import bcrypt from 'bcrypt'
import express from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    const result = await query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1 LIMIT 1',
      [username.trim()],
    )
    const user = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const payload = { id: user.id, username: user.username, role: user.role }
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
