# AI Arena Vietnam — Operations Runbook

Quick reference for production operators. All commands assume you are logged in as `ccne` on the server.

**SSH:**
```bash
ssh -p 23456 ccne@<SERVER_IP>
```

**Always start here:**
```bash
cd /opt/ai-arena
```

---

## QUICK COMMANDS

### Check status

```bash
cd /opt/ai-arena && ./deploy/up.sh ps
```

```bash
curl -sS https://ai-arena-vietnam.uet.edu.vn/api/health
```

```bash
sudo systemctl status nginx coturn docker --no-pager
```

### Check Docker

```bash
docker ps -a
```

```bash
cd /opt/ai-arena && ./deploy/up.sh ps
```

```bash
docker images | grep ai-arena
```

### Check application

```bash
curl -sS http://127.0.0.1:3000/api/health
```

```bash
curl -sSI https://ai-arena-vietnam.uet.edu.vn/ | head -15
```

### Check Nginx

```bash
sudo nginx -t
```

```bash
sudo tail -50 /var/log/nginx/error.log
```

### Check disk

```bash
df -h /
df -i /
```

### Check RAM

```bash
free -h
```

### Check ports

```bash
sudo ss -tulpn | grep -E 'LISTEN|UNCONN' | grep -E ':(80|443|3000|5432|3478|5349|23456|9000)\b'
```

Expected:
- `443`, `80` — nginx (public)
- `3000` — app on `127.0.0.1` only
- `23456` — SSH (public)
- `3478`, `5349` — coturn (public, required for WebRTC)
- `5432`, `9000` — Docker internal only (not on 0.0.0.0)

### View logs

```bash
cd /opt/ai-arena && ./deploy/up.sh logs app --tail 100
```

```bash
cd /opt/ai-arena && ./deploy/up.sh logs app -f
```

```bash
cd /opt/ai-arena && ./deploy/up.sh logs app --tail 500 | grep -i error
```

```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart

```bash
cd /opt/ai-arena && ./deploy/up.sh restart app
```

```bash
cd /opt/ai-arena && ./deploy/up.sh restart
```

```bash
sudo systemctl reload nginx
```

### Deploy (after git tree clean + review script)

```bash
cd /opt/ai-arena
git status --porcelain
./scripts/deploy.sh
```

### Deploy dry-run

```bash
DRY_RUN=1 ./scripts/deploy.sh
```

### Backup (manual + verify)

```bash
cd /opt/ai-arena && bash deploy/backup-production.sh
ls -lh /var/backups/ai-arena/
```

### Rollback (code only — migration must NOT have run)

```bash
cd /opt/ai-arena
OLD_COMMIT=<hash>
docker tag ai-arena-app:${OLD_COMMIT} ai-arena-app:production
./deploy/up.sh up -d app
git reset --hard "$OLD_COMMIT"
curl -sS https://ai-arena-vietnam.uet.edu.vn/api/health
```

### Backup

```bash
cd /opt/ai-arena && bash deploy/backup-production.sh
```

```bash
ls -lh /var/backups/ai-arena/
```

### Database migration only

```bash
cd /opt/ai-arena
bash deploy/backup-production.sh
docker compose --env-file .env.production -f deploy/compose.production.yml \
  run --rm --no-deps app corepack pnpm db:migrate:deploy
```

### List application users (read-only)

```bash
docker compose --env-file .env.production -f deploy/compose.production.yml \
  exec -T postgres psql -U promptoff -d promptoff \
  -c "SELECT email, status FROM \"User\" WHERE \"deletedAt\" IS NULL;"
```

### SSL check

```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

### Firewall check

```bash
sudo ufw status verbose
```

### Git state

```bash
cd /opt/ai-arena && git status -sb && git log -1 --oneline
```

---

## INCIDENT CHEAT SHEET

| Problem | First command |
|---------|---------------|
| Site down | `curl -sS https://ai-arena-vietnam.uet.edu.vn/api/health` |
| 502 error | `./deploy/up.sh logs app --tail 50` |
| DB error in health | `./deploy/up.sh restart postgres && ./deploy/up.sh restart app` |
| Disk full | `df -h /` then `docker system df` |
| After bad deploy | `git log --oneline -3` then rollback section above |
| SSL warning | `sudo certbot certificates` |

---

## IMPORTANT REMINDERS

1. Always use `--env-file .env.production` with docker compose
2. Never run `pnpm db:seed` or `pnpm db:reset` on production
3. Backup before migration
4. Do not share `.env.production` or `.initial-admin` contents
5. Keep one SSH session open when changing SSH/firewall settings

---

## FILE LOCATIONS

| What | Where |
|------|-------|
| App code | `/opt/ai-arena` |
| Env secrets | `/opt/ai-arena/.env.production` |
| Compose helper | `/opt/ai-arena/deploy/up.sh` |
| Deploy script | `/opt/ai-arena/scripts/deploy.sh` |
| Backups | `/var/backups/ai-arena/` |
| Nginx config | `/etc/nginx/sites-enabled/ai-arena` |
| SSL certs | `/etc/letsencrypt/live/ai-arena-vietnam.uet.edu.vn/` |

See `docs/OPERATIONS.md` for full procedures.
