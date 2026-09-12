#!/usr/bin/env bash
# Sample host/app/db/nginx metrics during load tests (run ON production host).
# Usage: ./loadtests/metrics-sampler.sh /tmp/auth-ramp-metrics.log 20
set -euo pipefail

OUT="${1:-/tmp/loadtest-metrics.log}"
INTERVAL="${2:-15}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/ai-arena/deploy/compose.production.yml}"
ENV_FILE="${ENV_FILE:-/opt/ai-arena/.env.production}"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

echo "# started $(date -u +%Y-%m-%dT%H:%M:%SZ) interval=${INTERVAL}s" >>"$OUT"

while true; do
  TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  {
    echo "=== $TS ==="
    echo "-- host --"
    uptime
    free -m | awk '/Mem:/{print "mem_total_mb="$2," mem_used_mb="$3," mem_avail_mb="$7}'
    echo "-- docker app --"
    docker stats --no-stream --format '{{.Name}} CPU={{.CPUPerc}} MEM={{.MemUsage}}' 2>/dev/null | grep 'ai-arena-app' || true
    echo "-- db --"
    compose exec -T postgres psql -U promptoff -d promptoff -t -A -F'|' -c \
      "SELECT count(*) total,
              count(*) FILTER (WHERE state='active') active,
              count(*) FILTER (WHERE state='idle') idle,
              count(*) FILTER (WHERE wait_event_type='Lock') lock_waits
       FROM pg_stat_activity WHERE datname=current_database();" 2>/dev/null || echo "db_query_failed"
    echo "-- health --"
    curl -fsS http://127.0.0.1:3000/api/health 2>/dev/null || echo "health_failed"
    echo
  } >>"$OUT"
  sleep "$INTERVAL"
done
