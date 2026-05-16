import express from 'express'
import { query, withTransaction } from '../db.js'
import auth from '../middleware/auth.js'
import {
  isCompanyNurse,
  requireCompanyNurse,
  requirePatientPersonalEditor,
} from '../middleware/roles.js'
import { imageUpload } from '../upload.js'
import { formatPatient, parseJsonArray, toBloodEnum } from '../utils/format.js'

const router = express.Router()
const upload = imageUpload('patients')

function fileUrl(req) {
  return req.savedFileUrl
}

function rowToPatient(row, allergies = [], chronicConditions = []) {
  return {
    id: row.id,
    idNumber: row.id_number,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    position: row.position,
    status: row.status,
    sex: row.sex,
    height: row.height,
    weight: row.weight,
    emergencyContact: row.emergency_contact,
    contactNumber: row.contact_number,
    permAddress: row.perm_address,
    presAddress: row.pres_address,
    photoUrl: row.photo_url,
    bloodType: row.blood_type,
    allergies: allergies.map(allergyName => ({ allergyName })),
    chronicConditions: chronicConditions.map(conditionName => ({ conditionName })),
  }
}

async function loadPatientRelations(ids) {
  if (ids.length === 0) {
    return { allergiesByPatient: new Map(), chronicByPatient: new Map() }
  }

  const [allergyResult, chronicResult] = await Promise.all([
    query(
      'SELECT patient_id, allergy_name FROM allergies WHERE patient_id = ANY($1::int[]) ORDER BY id ASC',
      [ids],
    ),
    query(
      'SELECT patient_id, condition_name FROM chronic_conditions WHERE patient_id = ANY($1::int[]) ORDER BY id ASC',
      [ids],
    ),
  ])

  const allergiesByPatient = new Map()
  for (const row of allergyResult.rows) {
    const list = allergiesByPatient.get(row.patient_id) || []
    list.push(row.allergy_name)
    allergiesByPatient.set(row.patient_id, list)
  }

  const chronicByPatient = new Map()
  for (const row of chronicResult.rows) {
    const list = chronicByPatient.get(row.patient_id) || []
    list.push(row.condition_name)
    chronicByPatient.set(row.patient_id, list)
  }

  return { allergiesByPatient, chronicByPatient }
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
    emergencyContact: body.emergencyContact?.trim() || '',
    contactNumber: body.contactNumber?.trim() || '',
    permAddress: body.permAddress || '',
    presAddress: body.presAddress || '',
    bloodType: toBloodEnum(body.bloodType),
    ...(fileUrl(req) ? { photoUrl: fileUrl(req) } : {}),
  }
}

function mergePatientDataForRole(existingRow, body, req) {
  const base = patientData(body, req)
  if (isCompanyNurse(req)) return base

  return {
    ...base,
    bloodType: existingRow.blood_type,
  }
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&')
}

router.get('/', auth, async (req, res) => {
  try {
    const rawSearch = String(req.query.q || '').trim()
    const sort = String(req.query.sort || 'name-asc')
    const whereClauses = []
    const values = []

    if (rawSearch) {
      const normalizedSearch = rawSearch.replace(/\s+/g, ' ').trim()
      const startsWithPattern = `${escapeLike(normalizedSearch)}%`
      const containsWordPattern = `% ${escapeLike(normalizedSearch)}%`

      values.push(startsWithPattern)
      const startsWithParam = `$${values.length}`
      values.push(containsWordPattern)
      const containsWordParam = `$${values.length}`

      whereClauses.push(`(
        first_name ILIKE ${startsWithParam} ESCAPE '\\'
        OR middle_name ILIKE ${startsWithParam} ESCAPE '\\'
        OR last_name ILIKE ${startsWithParam} ESCAPE '\\'
        OR CONCAT_WS(' ', first_name, last_name) ILIKE ${startsWithParam} ESCAPE '\\'
        OR CONCAT_WS(' ', first_name, last_name) ILIKE ${containsWordParam} ESCAPE '\\'
        OR CONCAT_WS(' ', first_name, middle_name, last_name) ILIKE ${startsWithParam} ESCAPE '\\'
        OR CONCAT_WS(' ', first_name, middle_name, last_name) ILIKE ${containsWordParam} ESCAPE '\\'
        OR id_number ILIKE ${startsWithParam} ESCAPE '\\'
        OR position ILIKE ${startsWithParam} ESCAPE '\\'
        OR position ILIKE ${containsWordParam} ESCAPE '\\'
      )`)
    }

    let orderBy = 'last_name ASC, first_name ASC'
    if (sort === 'name-desc') {
      orderBy = 'last_name DESC, first_name DESC'
    } else if (sort === 'id-asc') {
      orderBy = 'id_number ASC, last_name ASC, first_name ASC'
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
    const result = await query(
      `SELECT * FROM patients ${whereSql} ORDER BY ${orderBy}`,
      values,
    )
    const ids = result.rows.map(row => row.id)
    const { allergiesByPatient, chronicByPatient } = await loadPatientRelations(ids)
    const patients = result.rows.map(row => rowToPatient(
      row,
      allergiesByPatient.get(row.id) || [],
      chronicByPatient.get(row.id) || [],
    ))
    res.json(patients.map(formatPatient))
  } catch (error) {
    console.error('List patients error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const result = await query('SELECT * FROM patients WHERE id = $1 LIMIT 1', [id])
    const row = result.rows[0]
    if (!row) return res.status(404).json({ message: 'Patient not found' })

    const { allergiesByPatient, chronicByPatient } = await loadPatientRelations([id])
    const patient = rowToPatient(
      row,
      allergiesByPatient.get(id) || [],
      chronicByPatient.get(id) || [],
    )
    res.json(formatPatient(patient))
  } catch (error) {
    console.error('Get patient error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', auth, requireCompanyNurse, upload.single('photo'), async (req, res) => {
  try {
    const allergies = parseJsonArray(req.body.allergies)
    const chronicConditions = parseJsonArray(req.body.chronicConditions)
    const idNumber = req.body.idNumber || `M${Date.now().toString().slice(-10)}`

    const patient = await withTransaction(async client => {
      const data = patientData(req.body, req)
      const inserted = await client.query(
        `
          INSERT INTO patients (
            first_name, middle_name, last_name, id_number, birth_date, position,
            status, sex, height, weight, emergency_contact, contact_number,
            perm_address, pres_address, photo_url, blood_type, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
          RETURNING *
        `,
        [
          data.firstName,
          data.middleName,
          data.lastName,
          idNumber,
          data.birthDate,
          data.position,
          data.status,
          data.sex,
          data.height,
          data.weight,
          data.emergencyContact,
          data.contactNumber,
          data.permAddress,
          data.presAddress,
          data.photoUrl || null,
          data.bloodType,
        ],
      )

      const row = inserted.rows[0]

      for (const allergyName of allergies) {
        await client.query(
          'INSERT INTO allergies (patient_id, allergy_name) VALUES ($1, $2)',
          [row.id, allergyName],
        )
      }

      for (const conditionName of chronicConditions) {
        await client.query(
          'INSERT INTO chronic_conditions (patient_id, condition_name) VALUES ($1, $2)',
          [row.id, conditionName],
        )
      }

      return rowToPatient(row, allergies, chronicConditions)
    })

    res.status(201).json(formatPatient(patient))
  } catch (error) {
    console.error('Create patient error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', auth, requirePatientPersonalEditor, upload.single('photo'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const allergies = parseJsonArray(req.body.allergies)
    const chronicConditions = parseJsonArray(req.body.chronicConditions)

    const patient = await withTransaction(async client => {
      const existingResult = await client.query('SELECT * FROM patients WHERE id = $1 LIMIT 1', [id])
      const existingRow = existingResult.rows[0]
      if (!existingRow) throw new Error('Patient not found')

      const isFullEditor = isCompanyNurse(req)
      const mergedData = mergePatientDataForRole(existingRow, req.body, req)
      const updated = await client.query(
        `
          UPDATE patients
          SET
            first_name = $1,
            middle_name = $2,
            last_name = $3,
            birth_date = $4,
            position = $5,
            status = $6,
            sex = $7,
            height = $8,
            weight = $9,
            emergency_contact = $10,
            contact_number = $11,
            perm_address = $12,
            pres_address = $13,
            blood_type = $14,
            photo_url = COALESCE($15, photo_url),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $16
          RETURNING *
        `,
        [
          mergedData.firstName,
          mergedData.middleName,
          mergedData.lastName,
          mergedData.birthDate,
          mergedData.position,
          mergedData.status,
          mergedData.sex,
          mergedData.height,
          mergedData.weight,
          mergedData.emergencyContact,
          mergedData.contactNumber,
          mergedData.permAddress,
          mergedData.presAddress,
          mergedData.bloodType,
          mergedData.photoUrl || null,
          id,
        ],
      )

      const row = updated.rows[0]
      if (!row) throw new Error('Patient not found')

      let finalAllergies = allergies
      let finalChronicConditions = chronicConditions

      if (isFullEditor) {
        await client.query('DELETE FROM allergies WHERE patient_id = $1', [id])
        await client.query('DELETE FROM chronic_conditions WHERE patient_id = $1', [id])

        for (const allergyName of allergies) {
          await client.query(
            'INSERT INTO allergies (patient_id, allergy_name) VALUES ($1, $2)',
            [id, allergyName],
          )
        }

        for (const conditionName of chronicConditions) {
          await client.query(
            'INSERT INTO chronic_conditions (patient_id, condition_name) VALUES ($1, $2)',
            [id, conditionName],
          )
        }
      } else {
        const { allergiesByPatient, chronicByPatient } = await loadPatientRelations([id])
        finalAllergies = allergiesByPatient.get(id) || []
        finalChronicConditions = chronicByPatient.get(id) || []
      }

      return rowToPatient(row, finalAllergies, finalChronicConditions)
    })
    res.json(formatPatient(patient))
  } catch (error) {
    console.error('Update patient error:', error)
    res.status(error.message === 'Patient not found' ? 404 : 500).json({
      message: error.message === 'Patient not found' ? error.message : 'Server error',
    })
  }
})

router.delete('/:id', auth, requireCompanyNurse, async (req, res) => {
  try {
    await query('DELETE FROM patients WHERE id = $1', [Number(req.params.id)])
    res.json({ message: 'Patient deleted' })
  } catch (error) {
    console.error('Delete patient error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
