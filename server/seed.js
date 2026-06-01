import bcrypt from 'bcrypt'
import { query, pool } from './db.js'
import { initDb } from './db-init.js'

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

async function seedUsers() {
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    await query(
      `
        INSERT INTO users (
          username, email, password_hash, role, access_status, updated_at
        )
        VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT (username)
        DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          access_status = 'active',
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

async function main() {
  console.log('Initializing database...')
  await initDb()
  console.log('Seeding users and diseases...')
  await seedUsers()
  await seedDiseases()
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
