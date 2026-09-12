#!/usr/bin/env bash
# Scale AI Arena app replicas on production (infra-only, no code change).
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/ai-arena}"
COMPOSE_FILE="${COMPOSE_FILE:-deploy/compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
REPLICAS="${APP_REPLICAS:-4}"

cd "$DEPLOY_DIR"

echo "Scaling app to $REPLICAS replicas..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --scale "app=$REPLICAS" --no-recreate app 2>/dev/null || \
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --scale "app=$REPLICAS" app

echo "Running containers:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps app

echo "Listening ports:"
ss -tlnp | grep -E ':300[0-3]' || true

echo "Health check (port 3000):"
curl -fsS http://127.0.0.1:3000/api/health | head -c 200
echo
