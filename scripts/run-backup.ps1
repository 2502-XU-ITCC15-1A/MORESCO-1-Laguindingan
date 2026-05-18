$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $projectRoot 'backups\logs'
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir 'backup.log'

Set-Location $projectRoot

"[$timestamp] Starting backup..." | Tee-Object -FilePath $logFile -Append
npm run backup 2>&1 | Tee-Object -FilePath $logFile -Append
"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup finished." | Tee-Object -FilePath $logFile -Append
