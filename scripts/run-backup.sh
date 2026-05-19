#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
LOG_DIR="$PROJECT_ROOT/backups/logs"
LOG_FILE="$LOG_DIR/backup.log"

mkdir -p "$LOG_DIR"
cd "$PROJECT_ROOT"

printf '[%s] Starting backup...\n' "$(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
npm run backup 2>&1 | tee -a "$LOG_FILE"
printf '[%s] Backup finished.\n' "$(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
