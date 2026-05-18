#!/usr/bin/env sh
set -eu

if [ "${1:-}" = "" ]; then
  echo "Usage: ./scripts/run-restore.sh <path-to-backup-file>" >&2
  exit 1
fi

BACKUP_FILE=$1
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
LOG_DIR="$PROJECT_ROOT/backups/logs"
LOG_FILE="$LOG_DIR/restore.log"

mkdir -p "$LOG_DIR"
cd "$PROJECT_ROOT"

printf '[%s] Starting restore from %s ...\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$BACKUP_FILE" | tee -a "$LOG_FILE"
npm run restore -- "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"
printf '[%s] Restore finished.\n' "$(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
