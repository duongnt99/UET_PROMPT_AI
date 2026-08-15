#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/backup.sql.gz" >&2
  exit 1
fi

FILE="$1"
if [[ ! -f "$FILE" ]]; then
  echo "Backup file not found: $FILE" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" && -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

echo "Restoring $FILE into DATABASE_URL"
gzip -dc "$FILE" | psql "$DATABASE_URL"
echo "Restore completed"
