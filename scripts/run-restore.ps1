param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $projectRoot 'backups\logs'
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir 'restore.log'

Set-Location $projectRoot

"[$timestamp] Starting restore from $BackupFile ..." | Tee-Object -FilePath $logFile -Append
npm run restore -- "$BackupFile" 2>&1 | Tee-Object -FilePath $logFile -Append
"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restore finished." | Tee-Object -FilePath $logFile -Append
