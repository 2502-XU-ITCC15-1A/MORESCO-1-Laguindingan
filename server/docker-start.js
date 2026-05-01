import { execFileSync } from 'node:child_process'

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
}

run('npx', ['prisma', 'migrate', 'deploy'])
run('npx', ['prisma', 'db', 'seed'])

await import('./index.js')
