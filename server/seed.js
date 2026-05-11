import bcrypt from 'bcrypt'
import { query, withTransaction, pool } from './db.js'
import { initDb } from './db-init.js'
import { SAMPLE_PATIENTS, SAMPLE_RECORDS } from '../src/data/patients.js'

const USERS = [
  { username: 'admin', email: 'admin@moresco.local', password: 'admin123', role: 'HR Admin' },
  { username: 'nurse1', email: 'nurse1@moresco.local', password: 'nurse123', role: 'Company Nurse' },
  { username: 'itmanager', email: 'itmanager@moresco.local', password: 'itmanager123', role: 'IT Manager' },
]

const DISEASES = [
  { name: 'Cough', aliases: ['Ubo'] },
  { name: 'Fever', aliases: ['Lagnat'] },
  { name: 'Hypertension', aliases: ['High blood pressure'] },
  { name: 'Asthma', aliases: [] },
  { name: 'Migraine', aliases: [] },
  { name: 'Viral Syndrome', aliases: [] },
]

function toBloodEnum(value) {
  const map = {
    'A+': 'A_PLUS',
    'A-': 'A_MINUS',
    'B+': 'B_PLUS',
    'B-': 'B_MINUS',
    'AB+': 'AB_PLUS',
    'AB-': 'AB_MINUS',
    'O+': 'O_PLUS',
    'O-': 'O_MINUS',
  }
  return map[value] || 'UNKNOWN'
}

async function seedUsers() {
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    await query(
      `
        INSERT INTO users (
          username, email, password_hash, role, access_status,
          access_granted_at, invitation_confirmed_at, updated_at
        )
        VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (username)
        DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          access_status = 'active',
          access_granted_at = COALESCE(users.access_granted_at, CURRENT_TIMESTAMP),
          invitation_confirmed_at = COALESCE(users.invitation_confirmed_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      `,
      [user.username, user.email, passwordHash, user.role],
    )
  }
}

async function seedDiseases() {
  for (const disease of DISEASES) {
    await query(
      `
        INSERT INTO diseases (name, aliases, active, updated_at)
        VALUES ($1, $2::text[], true, CURRENT_TIMESTAMP)
        ON CONFLICT (name)
        DO UPDATE SET
          aliases = EXCLUDED.aliases,
          active = true,
          updated_at = CURRENT_TIMESTAMP
      `,
      [disease.name, disease.aliases],
    )
  }
}

async function seedPatients() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM patients')
  if (rows[0]?.count > 0) {
    console.log('Patients already exist. Skipping sample patient seed.')
    return
  }

  for (const [index, patient] of SAMPLE_PATIENTS.entries()) {
    await withTransaction(async client => {
      const insertedPatient = await client.query(
        `
          INSERT INTO patients (
            first_name, middle_name, last_name, id_number, birth_date,
            position, status, sex, height, weight, perm_address,
            pres_address, blood_type, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
          RETURNING id, first_name, last_name
        `,
        [
          patient.firstName,
          patient.middleName || null,
          patient.lastName,
          patient.idNumber,
          new Date(patient.birthDate),
          patient.position,
          patient.status,
          patient.sex,
          patient.height || '',
          patient.weight || '',
          patient.permAddress || '',
          patient.presAddress || '',
          toBloodEnum(patient.bloodType),
        ],
      )

      const patientId = insertedPatient.rows[0].id

      for (const allergyName of patient.allergies || []) {
        await client.query(
          'INSERT INTO allergies (patient_id, allergy_name) VALUES ($1, $2)',
          [patientId, allergyName],
        )
      }

      for (const conditionName of patient.chronicConditions || []) {
        await client.query(
          'INSERT INTO chronic_conditions (patient_id, condition_name) VALUES ($1, $2)',
          [patientId, conditionName],
        )
      }

      if (index === 0) {
        for (const record of SAMPLE_RECORDS) {
          await client.query(
            `
              INSERT INTO health_records (
                patient_id, record_date, bp_val, o2_val, hr_val, temp_val,
                complaints, diagnosis, remarks, photo_url, updated_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
            `,
            [
              patientId,
              new Date(record.date),
              record.bpVal,
              record.o2Val,
              record.hrVal,
              record.tempVal,
              record.complaints,
              record.diagnosis,
              record.remarks,
              record.photoUrl,
            ],
          )
        }
      }
    })
  }
}

async function main() {
  console.log('Initializing database...')
  await initDb()
  console.log('Seeding users and diseases...')
  await seedUsers()
  await seedDiseases()
  console.log('Seeding sample patients...')
  await seedPatients()
  console.log('Database seeding completed.')
}

main()
  .catch(error => {
    console.error('Seeding failed:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
