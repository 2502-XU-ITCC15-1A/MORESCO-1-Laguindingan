import bcrypt from 'bcrypt'
import express from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../prisma.js'
import auth from '../middleware/auth.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user || !(await bcrypt.compare(oldPassword, user.passwordHash))) {
      return res.status(401).json({ message: 'Old password is incorrect' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    })

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
