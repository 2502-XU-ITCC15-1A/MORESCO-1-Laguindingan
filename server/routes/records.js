import express from 'express'
import { query } from '../db.js'
import auth from '../middleware/auth.js'
import { requireCompanyNurse } from '../middleware/roles.js'
import { imageUpload } from '../upload.js'
import { formatRecord } from '../utils/format.js'

const router = express.Router()
const upload = imageUpload('records')

function fileUrl(req) {
  return req.savedFileUrl
}

function rowToRecord(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    recordDate: row.record_date,
    bpVal: row.bp_val,
    o2Val: row.o2_val,
    hrVal: row.hr_val,
    tempVal: row.temp_val,
    complaints: row.complaints,
    diagnosis: row.diagnosis,
    remarks: row.remarks,
    photoUrl: row.photo_url,
  }
}

function recordData(body, req) {
  return {
    bpVal: body.bpVal || '',
    o2Val: body.o2Val || '',
    hrVal: body.hrVal || '',
    tempVal: body.tempVal || '',
    complaints: body.complaints || '',
    diagnosis: body.diagnosis || '',
    remarks: body.remarks || '',
    ...(fileUrl(req) ? { photoUrl: fileUrl(req) } : {}),
  }
}

router.get('/stats/diseases', auth, async (req, res) => {
  try {
    const month = req.query.month ? Number(req.query.month) : null
    const year = req.query.year ? Number(req.query.year) : null
    const params = [year, month]

    const totalResult = await query(
      `
        SELECT COUNT(*)::int AS total
        FROM health_records
        WHERE diagnosis IS NOT NULL
          AND BTRIM(diagnosis) <> ''
          AND ($1::int IS NULL OR EXTRACT(YEAR FROM record_date)::int = $1)
          AND ($2::int IS NULL OR EXTRACT(MONTH FROM record_date)::int = $2)
      `,
      params,
    )

    const statsResult = await query(
      `
        SELECT BTRIM(diagnosis) AS name, COUNT(*)::int AS count
        FROM health_records
        WHERE diagnosis IS NOT NULL
          AND BTRIM(diagnosis) <> ''
          AND ($1::int IS NULL OR EXTRACT(YEAR FROM record_date)::int = $1)
          AND ($2::int IS NULL OR EXTRACT(MONTH FROM record_date)::int = $2)
        GROUP BY BTRIM(diagnosis)
        ORDER BY count DESC, name ASC
        LIMIT 10
      `,
      params,
    )

    const total = totalResult.rows[0]?.total || 0
    const stats = statsResult.rows.map(row => ({
      name: row.name,
      count: row.count,
      percentage: total ? Math.round((row.count / total) * 100) : 0,
    }))

    res.json({ total, stats })
  } catch (error) {
    console.error('Disease stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:patientId', auth, async (req, res) => {
  try {
    const patientId = Number(req.params.patientId)
    const month = req.query.month ? Number(req.query.month) : null
    const year = req.query.year ? Number(req.query.year) : null
    const result = await query(
      `
        SELECT *
        FROM health_records
        WHERE patient_id = $1
          AND ($2::int IS NULL OR EXTRACT(MONTH FROM record_date)::int = $2)
          AND ($3::int IS NULL OR EXTRACT(YEAR FROM record_date)::int = $3)
        ORDER BY record_date DESC
      `,
      [patientId, month, year],
    )

    res.json(result.rows.map(row => formatRecord(rowToRecord(row))))
  } catch (error) {
    console.error('List records error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/:patientId', auth, requireCompanyNurse, upload.single('photo'), async (req, res) => {
  try {
    const data = recordData(req.body, req)
    const result = await query(
      `
        INSERT INTO health_records (
          patient_id, record_date, bp_val, o2_val, hr_val, temp_val,
          complaints, diagnosis, remarks, photo_url, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      [
        Number(req.params.patientId),
        req.body.recordDate ? new Date(req.body.recordDate) : new Date(),
        data.bpVal,
        data.o2Val,
        data.hrVal,
        data.tempVal,
        data.complaints,
        data.diagnosis,
        data.remarks,
        data.photoUrl || null,
      ],
    )
    res.status(201).json(formatRecord(rowToRecord(result.rows[0])))
  } catch (error) {
    console.error('Create record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:recordId', auth, requireCompanyNurse, upload.single('photo'), async (req, res) => {
  try {
    const data = recordData(req.body, req)
    const result = await query(
      `
        UPDATE health_records
        SET
          bp_val = $1,
          o2_val = $2,
          hr_val = $3,
          temp_val = $4,
          complaints = $5,
          diagnosis = $6,
          remarks = $7,
          photo_url = COALESCE($8, photo_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `,
      [
        data.bpVal,
        data.o2Val,
        data.hrVal,
        data.tempVal,
        data.complaints,
        data.diagnosis,
        data.remarks,
        data.photoUrl || null,
        Number(req.params.recordId),
      ],
    )
    const row = result.rows[0]
    if (!row) return res.status(404).json({ message: 'Record not found' })
    res.json(formatRecord(rowToRecord(row)))
  } catch (error) {
    console.error('Update record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:recordId', auth, requireCompanyNurse, async (req, res) => {
  try {
    await query('DELETE FROM health_records WHERE id = $1', [Number(req.params.recordId)])
    res.json({ message: 'Record deleted' })
  } catch (error) {
    console.error('Delete record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
