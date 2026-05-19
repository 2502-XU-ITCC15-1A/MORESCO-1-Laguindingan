import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

function pad(value) {
  return String(value).padStart(2, '0')
}

function timestampParts(date = new Date()) {
  return {
    year: String(date.getFullYear()),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes()),
    second: pad(date.getSeconds()),
  }
}

function defaultBackupDir() {
  return path.join(process.cwd(), 'backups')
}

function buildBackupPath() {
  const { year, month, day, hour, minute, second } = timestampParts()
  const dir = path.join(process.env.BACKUP_DIR || defaultBackupDir(), year, month)
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `moresco_health_${year}-${month}-${day}_${hour}-${minute}-${second}.backup`)
}

function parseDatabaseUrl(connectionString) {
  if (!connectionString) return null

  try {
    const parsed = new URL(connectionString)
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    }
  } catch {
    return null
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.stdio || 'pipe',
    encoding: options.encoding || 'utf8',
    env: options.env || process.env,
    shell: false,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : ''
    throw new Error(stderr || `${command} exited with status ${result.status}`)
  }

  return result
}

function commandExists(command) {
  try {
    runCommand(process.platform === 'win32' ? 'where.exe' : 'which', [command])
    return true
  } catch {
    return false
  }
}

function dockerContainerRunning(containerName) {
  try {
    const result = runCommand('docker', ['ps', '--filter', `name=^/${containerName}$`, '--format', '{{.Names}}'])
    return result.stdout.split(/\r?\n/).map(item => item.trim()).includes(containerName)
  } catch {
    return false
  }
}

function backupWithDocker(outputPath) {
  const containerName = process.env.BACKUP_DOCKER_CONTAINER || 'moresco-db'
  if (!commandExists('docker') || !dockerContainerRunning(containerName)) {
    return false
  }

  const dump = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      containerName,
      'sh',
      '-lc',
      'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c',
    ],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      encoding: null,
    },
  )

  if (dump.error || dump.status !== 0) {
    const stderr = dump.stderr ? dump.stderr.toString('utf8').trim() : ''
    throw new Error(stderr || 'Docker backup failed.')
  }

  fs.writeFileSync(outputPath, dump.stdout)
  return true
}

function backupWithPgDump(outputPath) {
  if (!commandExists('pg_dump')) {
    throw new Error('pg_dump is not installed or not available in PATH.')
  }

  const config = parseDatabaseUrl(process.env.DATABASE_URL)
  if (!config) {
    throw new Error('DATABASE_URL is missing or invalid.')
  }

  runCommand(
    'pg_dump',
    [
      '-h', config.host,
      '-p', config.port,
      '-U', config.user,
      '-d', config.database,
      '-F', 'c',
      '-f', outputPath,
    ],
    {
      env: {
        ...process.env,
        PGPASSWORD: config.password,
      },
    },
  )
}

function pruneOldBackups() {
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 365)
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return

  const rootDir = process.env.BACKUP_DIR || defaultBackupDir()
  if (!fs.existsSync(rootDir)) return

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        const remaining = fs.readdirSync(fullPath)
        if (remaining.length === 0) {
          fs.rmdirSync(fullPath)
        }
        continue
      }

      const stats = fs.statSync(fullPath)
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(fullPath)
      }
    }
  }

  walk(rootDir)
}

function main() {
  const outputPath = buildBackupPath()

  try {
    if (!backupWithDocker(outputPath)) {
      backupWithPgDump(outputPath)
    }
    pruneOldBackups()
    console.log(`Backup created successfully: ${outputPath}`)
  } catch (error) {
    console.error('Backup failed:')
    console.error(error.message || error)
    process.exit(1)
  }
}

main()
