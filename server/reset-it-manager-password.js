import 'dotenv/config'
import bcrypt from 'bcrypt'
import { initDb } from './db-init.js'
import { query, pool } from './db.js'

const DEFAULT_IDENTIFIER = 'itmanager'
const MIN_PASSWORD_LENGTH = 8

function printUsage() {
  console.log('Usage:')
  console.log('  npm run reset:it-manager -- "<new-password>"')
  console.log('  npm run reset:it-manager -- "<new-password>" "<username-or-email>"')
}

async function main() {
  const [newPassword, identifier = DEFAULT_IDENTIFIER] = process.argv.slice(2)

  if (!newPassword) {
    printUsage()
    process.exitCode = 1
    return
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`)
    process.exitCode = 1
    return
  }

  await initDb()

  const { rows } = await query(
    `
      SELECT id, username, email
      FROM users
      WHERE username = $1 OR LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [identifier],
  )

  const user = rows[0]

  if (!user) {
    console.error(`No user found for "${identifier}".`)
    console.error('Check the username/email, or run npm run db:seed if this is a fresh database.')
    process.exitCode = 1
    return
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await query(
    `
      UPDATE users
      SET
        password_hash = $1,
        role = 'IT Manager',
        access_status = 'active',
        failed_login_attempts = 0,
        lockout_stage = 0,
        locked_until = NULL,
        manually_locked = false,
        locked_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
    [passwordHash, user.id],
  )

  console.log(`IT Manager password reset successfully for ${user.username} (${user.email || 'no email'}).`)
}

main()
  .catch(error => {
    console.error('Failed to reset IT Manager password:')
    console.error(error.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
