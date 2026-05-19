#!/usr/bin/env sh
set -eu

TIME_VALUE=${1:-00:00}

case "$TIME_VALUE" in
  [0-2][0-9]:[0-5][0-9]) ;;
  *)
    echo "Usage: ./scripts/register-daily-backup.sh [HH:MM]" >&2
    exit 1
    ;;
esac

HOUR=${TIME_VALUE%:*}
MINUTE=${TIME_VALUE#*:}

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
RUNNER_SCRIPT="$PROJECT_ROOT/scripts/run-backup.sh"
CRON_ENTRY="$MINUTE $HOUR * * * cd \"$PROJECT_ROOT\" && \"$RUNNER_SCRIPT\""

TMP_FILE=$(mktemp)
trap 'rm -f "$TMP_FILE"' EXIT

crontab -l 2>/dev/null | grep -F -v "$RUNNER_SCRIPT" > "$TMP_FILE" || true
printf '%s\n' "$CRON_ENTRY" >> "$TMP_FILE"
crontab "$TMP_FILE"

echo "Daily backup cron job registered for $TIME_VALUE"
echo "Entry: $CRON_ENTRY"
