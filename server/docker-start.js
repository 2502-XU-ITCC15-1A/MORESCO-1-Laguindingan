import { execFileSync } from 'node:child_process'

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
}

run('node', ['server/db-init.js'])
run('node', ['server/seed.js'])

await import('./index.js')
