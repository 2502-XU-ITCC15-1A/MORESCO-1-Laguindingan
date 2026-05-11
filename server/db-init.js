import { query } from './db.js'

const statements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_type_enum') THEN
        CREATE TYPE blood_type_enum AS ENUM (
          'A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS',
          'AB_PLUS', 'AB_MINUS', 'O_PLUS', 'O_MINUS', 'UNKNOWN'
        );
      END IF;
    END $$;
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      access_status TEXT NOT NULL DEFAULT 'active',
      invitation_token TEXT,
      invited_by INTEGER REFERENCES users(id),
      invitation_sent_at TIMESTAMP(3),
      access_granted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      invitation_confirmed_at TIMESTAMP(3),
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'passwordHash'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_hash'
      ) THEN
        ALTER TABLE users RENAME COLUMN "passwordHash" TO password_hash;
      END IF;
    END $$;
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS access_status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS invitation_token TEXT,
    ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS invitation_confirmed_at TIMESTAMP(3);
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
    ON users (LOWER(email))
    WHERE email IS NOT NULL;
  `,
  `
    CREATE UNIQUE INDEX IF NOT EXISTS users_invitation_token_unique_idx
    ON users (invitation_token)
    WHERE invitation_token IS NOT NULL;
  `,
  `
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      middle_name TEXT,
      last_name TEXT NOT NULL,
      id_number TEXT NOT NULL UNIQUE,
      birth_date TIMESTAMP(3) NOT NULL,
      position TEXT NOT NULL,
      status TEXT NOT NULL,
      sex TEXT NOT NULL,
      height TEXT,
      weight TEXT,
      perm_address TEXT,
      pres_address TEXT,
      photo_url TEXT,
      blood_type blood_type_enum DEFAULT 'UNKNOWN',
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS health_records (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      record_date TIMESTAMP(3) NOT NULL,
      bp_val TEXT,
      o2_val TEXT,
      hr_val TEXT,
      temp_val TEXT,
      complaints TEXT,
      diagnosis TEXT,
      remarks TEXT,
      photo_url TEXT,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS allergies (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      allergy_name TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS chronic_conditions (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      condition_name TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS diseases (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      aliases TEXT[] DEFAULT ARRAY[]::TEXT[],
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
]

export async function initDb() {
  for (const statement of statements) {
    await query(statement)
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  initDb()
    .then(() => {
      console.log('Database schema is ready.')
      process.exit(0)
    })
    .catch(error => {
      console.error('Database initialization failed:')
      console.error(error)
      process.exit(1)
    })
}
