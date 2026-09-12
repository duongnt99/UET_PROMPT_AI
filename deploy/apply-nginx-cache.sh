#!/usr/bin/env bash
# Apply Nginx micro-cache config on production host (run ON the server as root/sudo).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CACHE_CONF="/etc/nginx/conf.d/ai-arena-cache.conf"
SITE_CONF="/etc/nginx/sites-available/ai-arena"
BACKUP_DIR="/etc/nginx/backups/$(date +%Y%m%d-%H%M%S)"

echo "Backing up current nginx config to $BACKUP_DIR"
sudo mkdir -p "$BACKUP_DIR"
sudo cp -a /etc/nginx/nginx.conf "$BACKUP_DIR/" 2>/dev/null || true
sudo cp -a "$SITE_CONF" "$BACKUP_DIR/" 2>/dev/null || true
sudo cp -a "$CACHE_CONF" "$BACKUP_DIR/" 2>/dev/null || true

echo "Installing cache zone + upstream"
sudo cp "$SCRIPT_DIR/nginx-http-cache.conf" "$CACHE_CONF"

echo "Creating cache directory"
sudo mkdir -p /var/cache/nginx/ai-arena
sudo chown www-data:www-data /var/cache/nginx/ai-arena

if [[ -f "$SCRIPT_DIR/nginx-ai-arena-production.conf" ]]; then
  echo "Installing production site config (with SSL)"
  sudo cp "$SCRIPT_DIR/nginx-ai-arena-production.conf" "$SITE_CONF"
else
  echo "WARN: nginx-ai-arena-production.conf not found; only cache zone installed."
  echo "Merge location blocks from deploy/nginx-ai-arena.conf into $SITE_CONF manually."
fi

echo "Validating nginx config"
sudo nginx -t

echo "Reloading nginx (graceful)"
sudo systemctl reload nginx

echo "Done. Test with:"
echo "  curl -sI https://ai-arena-vietnam.uet.edu.vn/api/public/scoreboard | grep -i x-cache"
