import crypto from 'node:crypto'
import { query } from '../db.js'

const TABLES = [
  'users',
  'patients',
  'health_records',
  'health_record_images',
  'allergies',
  'chronic_conditions',
  'diseases',
]

async function tableFingerprint(tableName) {
  const result = await query(
    `
      SELECT
        COUNT(*)::int AS row_count,
        COALESCE(
          md5(string_agg(md5(row_to_json(t)::text), '' ORDER BY t.id)),
          md5('')
        ) AS checksum
      FROM (
        SELECT *
        FROM ${tableName}
        ORDER BY id
      ) AS t
    `,
  )

  return {
    rowCount: result.rows[0].row_count,
    checksum: result.rows[0].checksum,
  }
}

export async function captureDatabaseFingerprint() {
  const tables = {}

  for (const tableName of TABLES) {
    tables[tableName] = await tableFingerprint(tableName)
  }

  const signature = crypto
    .createHash('sha256')
    .update(JSON.stringify(tables))
    .digest('hex')

  return {
    capturedAt: new Date().toISOString(),
    tables,
    signature,
  }
}
