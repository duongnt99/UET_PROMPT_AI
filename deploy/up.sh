#!/usr/bin/env bash
# Wrapper for docker compose with production env file.
# Usage: ./deploy/up.sh ps | up -d | logs app -f | restart app
set -euo pipefail
cd "$(dirname "$0")/.."
exec docker compose --env-file .env.production -f deploy/compose.production.yml "$@"
