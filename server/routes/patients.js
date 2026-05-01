import express from 'express'
import prisma from '../prisma.js'
import auth from '../middleware/auth.js'
import { requireAdmin } from '../middleware/roles.js'
import { imageUpload } from '../upload.js'
import { formatPatient, parseJsonArray, toBloodEnum } from '../utils/format.js'

const router = express.Router()
const upload = imageUpload('patients')

const includeHealth = {
  allergies: true,
  chronicConditions: true,
}

function fileUrl(req) {
  return req.file ? `/uploads/patients/${req.file.filename}` : undefined
}

function patientData(body, req) {
  return {
    firstName: body.firstName?.trim(),
    middleName: body.middleName?.trim() || null,
    lastName: body.lastName?.trim(),
    birthDate: body.birthDate ? new Date(body.birthDate) : new Date(),
    position: body.position?.trim() || '',
    status: body.status || 'Single',
    sex: body.sex || 'Male',
    height: body.height || '',
    weight: body.weight || '',
    permAddress: body.permAddress || '',
    presAddress: body.presAddress || '',
    bloodType: toBloodEnum(body.bloodType),
    ...(fileUrl(req) ? { photoUrl: fileUrl(req) } : {}),
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: includeHealth,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })
    res.json(patients.map(formatPatient))
  } catch (error) {
    console.error('List patients error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: Number(req.params.id) },
      include: includeHealth,
    })
    if (!patient) return res.status(404).json({ message: 'Patient not found' })
    res.json(formatPatient(patient))
  } catch (error) {
    console.error('Get patient error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const allergies = parseJsonArray(req.body.allergies)
    const chronicConditions = parseJsonArray(req.body.chronicConditions)
    const idNumber = req.body.idNumber || `M${Date.now().toString().slice(-10)}`

    const patient = await prisma.patient.create({
      data: {
        ...patientData(req.body, req),
        idNumber,
        allergies: { create: allergies.map(allergyName => ({ allergyName })) },
        chronicConditions: { create: chronicConditions.map(conditionName => ({ conditionName })) },
      },
      include: includeHealth,
    })

    res.status(201).json(formatPatient(patient))
  } catch (error) {
    console.error('Create patient error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const allergies = parseJsonArray(req.body.allergies)
    const chronicConditions = parseJsonArray(req.body.chronicConditions)

    await prisma.$transaction([
      prisma.allergy.deleteMany({ where: { patientId: id } }),
      prisma.chronicCondition.deleteMany({ where: { patientId: id } }),
      prisma.patient.update({
        where: { id },
        data: {
          ...patientData(req.body, req),
          allergies: { create: allergies.map(allergyName => ({ allergyName })) },
          chronicConditions: { create: chronicConditions.map(conditionName => ({ conditionName })) },
        },
      }),
    ])

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: includeHealth,
    })
    res.json(formatPatient(patient))
  } catch (error) {
    console.error('Update patient error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await prisma.patient.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Patient deleted' })
  } catch (error) {
    console.error('Delete patient error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
