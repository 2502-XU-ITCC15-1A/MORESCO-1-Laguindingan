import express from 'express'
import prisma from '../prisma.js'
import auth from '../middleware/auth.js'
import { imageUpload } from '../upload.js'
import { formatRecord } from '../utils/format.js'

const router = express.Router()
const upload = imageUpload('records')

function fileUrl(req) {
  return req.file ? `/uploads/records/${req.file.filename}` : undefined
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
    const { month, year } = req.query
    const rows = await prisma.healthRecord.findMany({
      where: { diagnosis: { not: null } },
      select: { diagnosis: true, recordDate: true },
    })
    const counts = {}
    rows.filter(row => {
      if (year && String(row.recordDate.getFullYear()) !== String(year)) return false
      if (month && String(row.recordDate.getMonth() + 1) !== String(month)) return false
      return true
    }).forEach(row => {
      const diagnosis = row.diagnosis?.trim()
      if (diagnosis) counts[diagnosis] = (counts[diagnosis] || 0) + 1
    })
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    const stats = Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: total ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    res.json({ total, stats })
  } catch (error) {
    console.error('Disease stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:patientId', auth, async (req, res) => {
  try {
    const { month, year } = req.query
    const records = await prisma.healthRecord.findMany({
      where: { patientId: Number(req.params.patientId) },
      orderBy: { recordDate: 'desc' },
    })

    const filtered = records.filter(record => {
      const date = record.recordDate
      if (year && String(date.getFullYear()) !== String(year)) return false
      if (month && String(date.getMonth() + 1) !== String(month)) return false
      return true
    })

    res.json(filtered.map(formatRecord))
  } catch (error) {
    console.error('List records error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/:patientId', auth, upload.single('photo'), async (req, res) => {
  try {
    const record = await prisma.healthRecord.create({
      data: {
        patientId: Number(req.params.patientId),
        recordDate: req.body.recordDate ? new Date(req.body.recordDate) : new Date(),
        ...recordData(req.body, req),
      },
    })
    res.status(201).json(formatRecord(record))
  } catch (error) {
    console.error('Create record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:recordId', auth, upload.single('photo'), async (req, res) => {
  try {
    const record = await prisma.healthRecord.update({
      where: { id: Number(req.params.recordId) },
      data: recordData(req.body, req),
    })
    res.json(formatRecord(record))
  } catch (error) {
    console.error('Update record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:recordId', auth, async (req, res) => {
  try {
    await prisma.healthRecord.delete({ where: { id: Number(req.params.recordId) } })
    res.json({ message: 'Record deleted' })
  } catch (error) {
    console.error('Delete record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
