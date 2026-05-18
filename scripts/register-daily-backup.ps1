param(
  [string]$TaskName = 'MORESCO Daily PostgreSQL Backup',
  [string]$Time = '00:00'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$runnerScript = Join-Path $PSScriptRoot 'run-backup.ps1'
$triggerTime = [datetime]::ParseExact($Time, 'HH:mm', $null)
$currentUser = "$env:USERDOMAIN\$env:USERNAME"

$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runnerScript`""

$trigger = New-ScheduledTaskTrigger `
  -Daily `
  -At $triggerTime

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Runs the MORESCO PostgreSQL backup script every day from $projectRoot." `
  -User $currentUser `
  -Force | Out-Null

Write-Host "Scheduled task created: $TaskName"
Write-Host "Runs daily at $Time"
