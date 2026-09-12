#!/usr/bin/env bash
# AI Arena Viet Nam — production deploy script (v2)
#
# Usage (on server):
#   cd /opt/ai-arena
#   ./scripts/deploy.sh
#
# Options:
#   DEPLOY_BRANCH=main       Branch to deploy (default: main)
#   SKIP_MIGRATE=1           Skip database migration
#   SKIP_BUILD=1             Skip Docker image build (restart only)
#   SKIP_BACKUP=1            Skip pre-migration backup (not recommended)
#   DRY_RUN=1                Print steps without executing destructive actions
#
# Safety:
#   - Uses flock to prevent concurrent deploys
#   - Requires clean git tree (ignored production-only files allowed)
#   - Mandatory backup before migration (unless SKIP_BACKUP=1)
#   - Tags Docker images with Git SHA for rollback
#   - Does NOT auto-restore database after failed migration

set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/ai-arena}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-deploy/compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_SCRIPT="${BACKUP_SCRIPT:-deploy/backup-production.sh}"
LOCK_FILE="${LOCK_FILE:-/var/lock/ai-arena-deploy.lock}"
LOG_DIR="${LOG_DIR:-/var/log/ai-arena}"
PUBLIC_HEALTH_URL="${PUBLIC_HEALTH_URL:-https://ai-arena-vietnam.uet.edu.vn/api/health}"
INTERNAL_HEALTH_URL="${INTERNAL_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
HOMEPAGE_URL="${HOMEPAGE_URL:-https://ai-arena-vietnam.uet.edu.vn/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
MIN_DISK_GB="${MIN_DISK_GB:-5}"

MIGRATION_RAN=0
OLD_COMMIT=""
NEW_COMMIT=""
BACKUP_POSTGRES=""
BACKUP_MINIO=""

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

run() {
  if [[ "${DRY_RUN:-}" == "1" ]]; then
    log "DRY_RUN: $*"
    return 0
  fi
  log "RUN: $*"
  eval "$@"
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

require_file() {
  [[ -f "$1" ]] || die "required file not found: $1"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

# Allow only gitignored production-only files in working tree.
validate_git_clean() {
  local unexpected=()
  local line status file

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    status="${line:0:2}"
    file="${line:3}"
    if [[ "$file" == *" -> "* ]]; then
      file="${file##* -> }"
    fi
    if git check-ignore -q "$file" 2>/dev/null; then
      continue
    fi
    unexpected+=("$line")
  done < <(git status --porcelain)

  if ((${#unexpected[@]} > 0)); then
    log "ERROR: production working tree is not clean"
    printf '  %s\n' "${unexpected[@]}"
    die "resolve tracked modifications or unexpected untracked files before deploy"
  fi
}

preflight() {
  log "=== Preflight checks ==="

  [[ "$(pwd)" == "$DEPLOY_DIR" ]] || die "must run from $DEPLOY_DIR (current: $(pwd))"
  require_file "$ENV_FILE"
  require_file "$COMPOSE_FILE"
  require_command git
  require_command docker
  require_command curl
  require_command flock

  if ! docker info >/dev/null 2>&1; then
    die "Docker daemon is not running or not accessible"
  fi

  compose config --quiet >/dev/null || die "docker compose config validation failed"

  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" != "$DEPLOY_BRANCH" ]]; then
    die "current branch is '$branch', expected '$DEPLOY_BRANCH'"
  fi

  validate_git_clean

  if ! git remote get-url origin >/dev/null 2>&1; then
    die "git remote 'origin' is not configured"
  fi

  run "git fetch origin '$DEPLOY_BRANCH'"
  if ! git rev-parse "origin/$DEPLOY_BRANCH" >/dev/null 2>&1; then
    die "cannot resolve origin/$DEPLOY_BRANCH"
  fi

  local avail_gb
  avail_gb="$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')"
  if [[ "$avail_gb" =~ ^[0-9]+$ ]] && (( avail_gb < MIN_DISK_GB )); then
    die "insufficient disk space on / (${avail_gb}G available, need >= ${MIN_DISK_GB}G)"
  fi

  compose ps postgres minio >/dev/null 2>&1 || true
  if ! compose ps --status running --format '{{.Service}}' 2>/dev/null | grep -qx postgres; then
    log "WARN: postgres not running — starting dependencies"
    run "compose up -d postgres minio"
  fi
  if ! compose ps --status running --format '{{.Service}}' 2>/dev/null | grep -qx minio; then
    run "compose up -d minio"
  fi

  local pre_health
  pre_health="$(curl -fsS "$PUBLIC_HEALTH_URL" 2>/dev/null || true)"
  if [[ -z "$pre_health" ]]; then
    log "WARN: pre-deploy public health check failed — continuing with caution"
  elif ! health_json_ok "$pre_health"; then
    log "WARN: pre-deploy health not fully ok — continuing with caution"
  else
    log "Pre-deploy health: ok"
  fi

  install -d -m 0750 "$LOG_DIR"
  install -d -m 0700 "$(dirname "$LOCK_FILE")" 2>/dev/null || true

  OLD_COMMIT="$(git rev-parse HEAD)"
  log "OLD_COMMIT=$OLD_COMMIT"
}

health_json_ok() {
  local body="$1"
  [[ "$body" == *'"status":"ok"'* ]] || return 1
  [[ "$body" == *'"database":"ok"'* ]] || return 1
  [[ "$body" == *'"storage":"ok"'* ]] || return 1
  return 0
}

health_check_all() {
  local attempt=1
  local internal public homepage_code

  while (( attempt <= HEALTH_RETRIES )); do
    internal="$(curl -fsS "$INTERNAL_HEALTH_URL" 2>/dev/null || true)"
    public="$(curl -fsS "$PUBLIC_HEALTH_URL" 2>/dev/null || true)"
    homepage_code="$(curl -sS -o /dev/null -w '%{http_code}' "$HOMEPAGE_URL" 2>/dev/null || echo "000")"

    if health_json_ok "$internal" && health_json_ok "$public" && [[ "$homepage_code" == "200" ]]; then
      log "Health checks passed (attempt $attempt): internal, public, homepage=200"
      return 0
    fi

    log "Health check waiting... ($attempt/$HEALTH_RETRIES) internal=$(health_field "$internal" status) public=$(health_field "$public" status) homepage=$homepage_code"
    sleep "$HEALTH_INTERVAL"
    attempt=$((attempt + 1))
  done
  return 1
}

health_field() {
  local body="$1"
  local field="$2"
  if [[ "$body" == *"\"$field\":"* ]]; then
    echo "present"
  else
    echo "missing"
  fi
}

tag_current_image() {
  local commit="$1"
  if docker image inspect ai-arena-app:production >/dev/null 2>&1; then
    run "docker tag ai-arena-app:production ai-arena-app:${commit}"
    log "Tagged current image as ai-arena-app:${commit}"
  else
    log "WARN: ai-arena-app:production not found — no image to tag for rollback"
  fi
}

run_backup() {
  require_file "$BACKUP_SCRIPT"
  log "Running pre-deploy backup via $BACKUP_SCRIPT"

  local backup_output
  if ! backup_output="$(bash "$BACKUP_SCRIPT")"; then
    die "backup script failed — deploy aborted"
  fi

  BACKUP_POSTGRES="$(printf '%s\n' "$backup_output" | sed -n 's/^BACKUP_POSTGRES=//p' | tail -1)"
  BACKUP_MINIO="$(printf '%s\n' "$backup_output" | sed -n 's/^BACKUP_MINIO=//p' | tail -1)"

  [[ -n "$BACKUP_POSTGRES" && -s "$BACKUP_POSTGRES" ]] || die "postgres backup artifact missing or empty: ${BACKUP_POSTGRES:-<unset>}"
  [[ -n "$BACKUP_MINIO" && -s "$BACKUP_MINIO" ]] || die "minio backup artifact missing or empty: ${BACKUP_MINIO:-<unset>}"

  run "gzip -t '$BACKUP_POSTGRES'"
  run "tar -tzf '$BACKUP_MINIO' >/dev/null"

  log "BACKUP_POSTGRES=$BACKUP_POSTGRES"
  log "BACKUP_MINIO=$BACKUP_MINIO"
}

rollback_code() {
  local target_commit="$1"
  log "=== CODE ROLLBACK to $target_commit ==="

  if [[ -n "$target_commit" ]] && docker image inspect "ai-arena-app:${target_commit}" >/dev/null 2>&1; then
    log "Rolling back Docker image to ai-arena-app:${target_commit}"
    run "docker tag ai-arena-app:${target_commit} ai-arena-app:production"
    run "compose up -d app"
  elif [[ "${SKIP_BUILD:-}" != "1" ]]; then
    log "WARN: image ai-arena-app:${target_commit} not found — rebuilding from git"
    run "git reset --hard '$target_commit'"
    run "compose build app"
    run "docker tag ai-arena-app:production ai-arena-app:${target_commit}"
    run "compose up -d app"
  else
    die "cannot rollback code: image tag missing and SKIP_BUILD=1"
  fi

  if [[ "$(git rev-parse HEAD)" != "$target_commit" ]]; then
    log "Syncing git branch $DEPLOY_BRANCH to $target_commit"
    run "git reset --hard '$target_commit'"
  fi

  if ! health_check_all; then
    die "rollback health checks failed — manual intervention required"
  fi
  log "Code rollback completed"
}

handle_deploy_failure() {
  log "=== DEPLOY FAILED ==="
  if [[ "$MIGRATION_RAN" == "1" ]]; then
    log "CRITICAL: DATABASE MAY HAVE CHANGED — migration was applied before failure"
    log "Do NOT assume code rollback alone is safe."
    log "Review prisma migration history and backup artifacts:"
    log "  BACKUP_POSTGRES=${BACKUP_POSTGRES:-<none>}"
    log "  BACKUP_MINIO=${BACKUP_MINIO:-<none>}"
    log "Manual options: fix-forward deploy, or restore DB from backup (see docs/OPERATIONS.md)"
    log "Attempting code-only rollback to OLD_COMMIT=$OLD_COMMIT for best-effort recovery"
  else
    log "Migration did not run — code rollback should be safe"
  fi
  rollback_code "$OLD_COMMIT"
  die "deploy failed — rolled back to $OLD_COMMIT"
}

main() {
  require_command flock
  exec 200>"$LOCK_FILE"
  if ! flock -n 200; then
    die "another deploy is already running (lock: $LOCK_FILE)"
  fi

  cd "$DEPLOY_DIR"

  local log_file
  log_file="$LOG_DIR/deploy-$(date -u +%Y%m%dT%H%M%SZ).log"
  exec > >(tee -a "$log_file") 2>&1

  log "=== AI Arena deploy started ==="
  log "Deploy log: $log_file"

  preflight

  NEW_COMMIT="$(git rev-parse "origin/$DEPLOY_BRANCH")"
  if [[ "$OLD_COMMIT" == "$NEW_COMMIT" ]]; then
    log "Already up to date ($OLD_COMMIT). Nothing to deploy."
    exit 0
  fi
  log "NEW_COMMIT=$NEW_COMMIT"

  tag_current_image "$OLD_COMMIT"

  if [[ "${SKIP_BACKUP:-}" != "1" && "${SKIP_MIGRATE:-}" != "1" ]]; then
    run_backup
  elif [[ "${SKIP_MIGRATE:-}" != "1" ]]; then
    die "migration enabled but SKIP_BACKUP=1 — refuse to migrate without backup"
  fi

  run "git pull --ff-only origin '$DEPLOY_BRANCH'"
  NEW_COMMIT="$(git rev-parse HEAD)"
  log "Checked out $NEW_COMMIT"

  if [[ "${SKIP_BUILD:-}" != "1" ]]; then
    run "compose build app"
    run "docker tag ai-arena-app:production ai-arena-app:${NEW_COMMIT}"
    log "Tagged new image as ai-arena-app:${NEW_COMMIT}"
  fi

  run "compose up -d postgres minio"
  run "compose up minio-init"

  if [[ "${SKIP_MIGRATE:-}" != "1" ]]; then
    log "Applying database migrations..."
    run "compose run --rm --no-deps app corepack pnpm db:migrate:deploy"
    MIGRATION_RAN=1
    log "MIGRATION_RAN=1"
  fi

  run "compose up -d app"

  if ! health_check_all; then
    handle_deploy_failure
  fi

  log "=== Deploy completed successfully ==="
  log "Deployed: $OLD_COMMIT -> $NEW_COMMIT"
  log "Docker images: ai-arena-app:production, ai-arena-app:$NEW_COMMIT, ai-arena-app:$OLD_COMMIT (previous)"
  if [[ -n "$BACKUP_POSTGRES" ]]; then
    log "Backup postgres: $BACKUP_POSTGRES"
    log "Backup minio: $BACKUP_MINIO"
  fi
}

main "$@"
