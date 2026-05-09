import express from 'express'
import { query } from '../db.js'
import auth from '../middleware/auth.js'
import { requireDiseaseManager } from '../middleware/roles.js'

const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, name, aliases, active, created_at, updated_at FROM diseases WHERE active = true ORDER BY name ASC',
    )
    res.json(rows.map(row => ({
      id: row.id,
      name: row.name,
      aliases: row.aliases || [],
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })))
  } catch (error) {
    console.error('List diseases error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', auth, requireDiseaseManager, async (req, res) => {
  try {
    const name = req.body.name?.trim()
    const aliases = Array.isArray(req.body.aliases) ? req.body.aliases.map(a => a.trim()).filter(Boolean) : []
    if (!name) return res.status(400).json({ message: 'Disease name is required' })

    const { rows } = await query(
      `
        INSERT INTO diseases (name, aliases, active, updated_at)
        VALUES ($1, $2::text[], true, CURRENT_TIMESTAMP)
        ON CONFLICT (name)
        DO UPDATE SET
          aliases = EXCLUDED.aliases,
          active = true,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, name, aliases, active, created_at, updated_at
      `,
      [name, aliases],
    )
    const disease = rows[0]
    res.status(201).json({
      id: disease.id,
      name: disease.name,
      aliases: disease.aliases || [],
      active: disease.active,
      createdAt: disease.created_at,
      updatedAt: disease.updated_at,
    })
  } catch (error) {
    console.error('Create disease error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', auth, requireDiseaseManager, async (req, res) => {
  try {
    await query(
      'UPDATE diseases SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [Number(req.params.id)],
    )
    res.json({ message: 'Disease removed' })
  } catch (error) {
    console.error('Delete disease error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
