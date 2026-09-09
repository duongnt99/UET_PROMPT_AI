#!/usr/bin/env bash
# Production backup: PostgreSQL dump + MinIO volume archive.
# Outputs artifact paths to stdout for deploy.sh verification.
#
# Usage:
#   cd /opt/ai-arena
#   bash deploy/backup-production.sh

set -euo pipefail

deploy_dir="${DEPLOY_DIR:-/opt/ai-arena}"
backup_dir="${BACKUP_DIR:-/var/backups/ai-arena}"
compose_file="${COMPOSE_FILE:-deploy/compose.production.yml}"
env_file="${ENV_FILE:-.env.production}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

postgres_file="${backup_dir}/postgres-${stamp}.sql.gz"
minio_file="${backup_dir}/minio-${stamp}.tar.gz"

install -d -m 0700 "$backup_dir"
cd "$deploy_dir"

[[ -f "$env_file" ]] || { echo "ERROR: $env_file not found" >&2; exit 1; }
[[ -f "$compose_file" ]] || { echo "ERROR: $compose_file not found" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

compose() {
  docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

if ! compose ps --status running --format '{{.Service}}' 2>/dev/null | grep -qx postgres; then
  echo "ERROR: postgres container is not running" >&2
  exit 1
fi

compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$postgres_file"

if [[ ! -s "$postgres_file" ]]; then
  echo "ERROR: postgres backup is empty: $postgres_file" >&2
  exit 1
fi
gzip -t "$postgres_file"

docker run --rm --user "$(id -u):$(id -g)" \
  -v ai-arena_minio_data:/source:ro \
  -v "${backup_dir}:/backup" \
  alpine:3.22 tar -czf "/backup/minio-${stamp}.tar.gz" -C /source .

if [[ ! -s "$minio_file" ]]; then
  echo "ERROR: minio backup is empty: $minio_file" >&2
  exit 1
fi
tar -tzf "$minio_file" >/dev/null

find "$backup_dir" -type f -mtime +14 -delete

echo "BACKUP_POSTGRES=$postgres_file"
echo "BACKUP_MINIO=$minio_file"
echo "backup completed at $stamp" >&2
