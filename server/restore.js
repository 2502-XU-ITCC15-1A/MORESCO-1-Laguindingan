import 'dotenv/config'
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

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
    input: options.input,
    shell: false,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const stderr =
      typeof result.stderr === 'string'
        ? result.stderr.trim()
        : result.stderr
          ? result.stderr.toString('utf8').trim()
          : ''
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

function getBackupPath() {
  const cliValue = process.argv[2]?.trim()
  const envValue = String(process.env.RESTORE_FILE || '').trim()
  const backupPath = cliValue || envValue

  if (!backupPath) {
    throw new Error('Backup file path is required. Usage: npm run restore -- "<path-to-backup-file>"')
  }

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`)
  }

  return backupPath
}

function restoreArgs({ host, port, user, database }, backupPath) {
  return [
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-privileges',
    '-h', host,
    '-p', port,
    '-U', user,
    '-d', database,
    backupPath,
  ]
}

function restoreWithDocker(backupPath) {
  const containerName = process.env.BACKUP_DOCKER_CONTAINER || 'moresco-db'
  if (!commandExists('docker') || !dockerContainerRunning(containerName)) {
    return false
  }

  const buffer = fs.readFileSync(backupPath)
  runCommand(
    'docker',
    [
      'exec',
      '-i',
      containerName,
      'sh',
      '-lc',
      'pg_restore --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
    ],
    {
      input: buffer,
      encoding: null,
    },
  )

  return true
}

function restoreWithPgRestore(backupPath) {
  if (!commandExists('pg_restore')) {
    throw new Error('pg_restore is not installed or not available in PATH.')
  }

  const config = parseDatabaseUrl(process.env.DATABASE_URL)
  if (!config) {
    throw new Error('DATABASE_URL is missing or invalid.')
  }

  runCommand(
    'pg_restore',
    restoreArgs(config, backupPath),
    {
      env: {
        ...process.env,
        PGPASSWORD: config.password,
      },
    },
  )
}

function main() {
  try {
    const backupPath = getBackupPath()
    console.warn('Restore operation started. This may overwrite current database contents.')

    if (!restoreWithDocker(backupPath)) {
      restoreWithPgRestore(backupPath)
    }

    console.log(`Restore completed successfully from: ${backupPath}`)
  } catch (error) {
    console.error('Restore failed:')
    console.error(error.message || error)
    process.exit(1)
  }
}

main()
