import express from 'express'
import prisma from '../prisma.js'
import auth from '../middleware/auth.js'
import { requireAdmin } from '../middleware/roles.js'

const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const diseases = await prisma.disease.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    res.json(diseases)
  } catch (error) {
    console.error('List diseases error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const name = req.body.name?.trim()
    const aliases = Array.isArray(req.body.aliases) ? req.body.aliases.map(a => a.trim()).filter(Boolean) : []
    if (!name) return res.status(400).json({ message: 'Disease name is required' })

    const disease = await prisma.disease.upsert({
      where: { name },
      update: { aliases, active: true },
      create: { name, aliases },
    })
    res.status(201).json(disease)
  } catch (error) {
    console.error('Create disease error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await prisma.disease.update({
      where: { id: Number(req.params.id) },
      data: { active: false },
    })
    res.json({ message: 'Disease removed' })
  } catch (error) {
    console.error('Delete disease error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
