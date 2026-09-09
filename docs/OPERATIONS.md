# AI Arena Production Operations

Hướng dẫn vận hành production cho **ai-arena-vietnam.uet.edu.vn**.  
Viết cho người ít kinh nghiệm DevOps — mỗi bước có lệnh copy/paste.

> **Lưu ý bảo mật:** Không ghi password, token, hoặc nội dung `.env` vào chat, email, hoặc Git.

---

## 1. Architecture

```
Internet
   |
   | HTTPS :443  (HTTP :80 → redirect HTTPS)
   |
 Nginx (reverse proxy)
   |
   +---> App (Next.js + custom Node server)  localhost:3000
   |         |
   |         +-- WebSocket /api/live-screen/socket (WebRTC signaling)
   |         +-- Email outbox worker (in-process)
   |
   +---> [Docker internal network]
             |
             +-- PostgreSQL 16
             +-- MinIO (S3-compatible storage)

coturn (systemd) — TURN/STUN for WebRTC
   ports: 3478 (UDP/TCP), 5349 (TLS), 49160-49200 (relay UDP)
```

| Component | Technology |
|-----------|------------|
| Frontend + Backend | Next.js 16 App Router, React 19 |
| Custom server | `server.ts` (HTTP + WebSocket + email worker) |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | Auth.js (NextAuth v5 beta), JWT session 7 days |
| Authorization | Role-based: SUPER_ADMIN, ADMIN, TECH_OPERATOR, REVIEWER, JUDGE, PARTICIPANT |
| Storage | MinIO (S3 API) |
| Reverse proxy | Nginx + Let's Encrypt |
| Containers | Docker Compose (`deploy/compose.production.yml`) |
| CI | GitHub Actions (lint, test, build — **no auto-deploy**) |

---

## 2. Server Information

| Item | Value |
|------|-------|
| OS | Ubuntu 24.04.5 LTS |
| Kernel | 6.8.0-139-generic |
| CPU | 10 cores |
| RAM | ~10 GB |
| Disk | 502 GB (≈3% used at audit time) |
| Timezone | Asia/Ho_Chi_Minh |
| Domain | `ai-arena-vietnam.uet.edu.vn` |
| App directory | `/opt/ai-arena` |
| Deploy user | `ccne` |

---

## 3. SSH Access

```bash
ssh -p 23456 ccne@<SERVER_IP>
```

- SSH port: **23456** (not default 22)
- Password authentication: **enabled** (recommended to migrate to key-only)
- User `ccne` has sudo access

**Quy tắc an toàn khi đổi SSH config:**
1. Mở **2 terminal SSH** trước khi thay đổi
2. Xác nhận SSH key login hoạt động
3. Chỉ sau đó mới tắt password authentication

---

## 4. Project Directories

| Path | Purpose |
|------|---------|
| `/opt/ai-arena/` | Application source + Docker build context |
| `/opt/ai-arena/.env.production` | Production secrets (**never commit**) |
| `/opt/ai-arena/.initial-admin` | Bootstrap admin credentials (**server only**) |
| `/opt/ai-arena/deploy/` | Compose, nginx template, backup script |
| `/var/backups/ai-arena/` | Production backups (should exist after first backup) |
| `/var/log/nginx/` | Nginx access/error logs |
| `/etc/nginx/sites-enabled/ai-arena` | Active Nginx config |
| `/etc/letsencrypt/` | SSL certificates |

---

## 5. Services

| Service | How it runs | Auto-start |
|---------|-------------|------------|
| Application | Docker container `ai-arena-app-1` | `restart: unless-stopped` |
| PostgreSQL | Docker container `ai-arena-postgres-1` | `restart: unless-stopped` |
| MinIO | Docker container `ai-arena-minio-1` | `restart: unless-stopped` |
| Nginx | systemd `nginx.service` | enabled |
| Docker | systemd `docker.service` | enabled |
| coturn (TURN) | systemd `coturn.service` | enabled |
| Certbot renewal | systemd timer `certbot.timer` | active |

**Không dùng PM2** — app chạy trong Docker.

---

## 6. Check System Status

```bash
# SSH vào server trước
cd /opt/ai-arena

# Trạng thái containers
./deploy/up.sh ps

# Health check
curl -sS https://ai-arena-vietnam.uet.edu.vn/api/health

# Nginx
sudo systemctl status nginx

# TURN server
sudo systemctl status coturn

# Disk / RAM
df -h /
free -h

# Listening ports (overview)
sudo ss -tulpn | grep -E ':(80|443|3000|5432|3478|5349|23456)\b'
```

**Kết quả health mong đợi:**
```json
{"status":"ok","database":"ok","storage":"ok"}
```

---

## 7. View Logs

### Application (Docker)

```bash
cd /opt/ai-arena

# 100 dòng cuối
./deploy/up.sh logs app --tail 100

# Realtime
./deploy/up.sh logs app -f

# Lọc error
./deploy/up.sh logs app --tail 500 | grep -i error
```

### Nginx

```bash
# Access log
sudo tail -100 /var/log/nginx/access.log

# Error log
sudo tail -100 /var/log/nginx/error.log

# Realtime errors
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL / MinIO

```bash
cd /opt/ai-arena
./deploy/up.sh logs postgres --tail 50
./deploy/up.sh logs minio --tail 50
```

---

## 8. Restart Application

```bash
cd /opt/ai-arena

# Restart chỉ app (nhanh, ít ảnh hưởng)
./deploy/up.sh restart app

# Restart toàn stack
./deploy/up.sh restart

# Kiểm tra sau restart
curl -sS https://ai-arena-vietnam.uet.edu.vn/api/health
```

**Khi nào restart:**
- Sau khi đổi `.env.production`
- Sau deploy code mới
- Khi app treo hoặc health check fail

---

## 9. Update Production from GitHub

### Prerequisites

1. Working tree clean (see `docs/PRODUCTION_GIT_RECONCILIATION.md`)
2. On branch `main`
3. `.env.production` exists (gitignored)
4. Review `scripts/deploy.sh` before first use

### Standard deploy (recommended)

```bash
cd /opt/ai-arena
git status --porcelain    # must be empty (ignored secrets allowed)
./scripts/deploy.sh
```

Deploy script v2 performs:
- `flock` lock (no concurrent deploys)
- Preflight: disk, docker, compose config, dependencies healthy
- Git clean check via `git status --porcelain` (respects `.gitignore`)
- Tags Docker image `ai-arena-app:$OLD_COMMIT` before build
- **Mandatory backup** before migration (aborts if backup fails)
- Migration with `MIGRATION_RAN` tracking
- Health: internal + public + homepage
- On failure: code/image rollback; **warns if DB may have changed**

See `docs/MIGRATION_STRATEGY.md` for migration rollback rules.

### Deploy options

```bash
SKIP_MIGRATE=1 ./scripts/deploy.sh    # code-only, no DB changes
SKIP_BUILD=1 ./scripts/deploy.sh      # restart only (rare)
DRY_RUN=1 ./scripts/deploy.sh         # print steps only
```

> **Never** use `SKIP_BACKUP=1` with migrations enabled — deploy script refuses this combination.

---

## 10. Database Migration

Migration chạy **thủ công** trong cửa sổ bảo trì:

```bash
cd /opt/ai-arena

# Backup trước
bash deploy/backup-production.sh

# Chạy migration
docker compose --env-file .env.production -f deploy/compose.production.yml \
  run --rm --no-deps app corepack pnpm db:migrate:deploy
```

**KHÔNG chạy trên production:**
- `pnpm db:seed` — tạo dữ liệu demo
- `pnpm db:reset` — xóa toàn bộ database

---

## 11. Backup

### Chạy backup thủ công

```bash
cd /opt/ai-arena
bash deploy/backup-production.sh
```

Script in ra `BACKUP_POSTGRES=` và `BACKUP_MINIO=` và verify gzip/tar integrity.

Tạo file trong `/var/backups/ai-arena/`:
- `postgres-YYYYmmddTHHMMSSZ.sql.gz`
- `minio-YYYYmmddTHHMMSSZ.tar.gz`

Retention: 14 ngày.

### Lên lịch backup hàng ngày (systemd — khuyến nghị)

```bash
# Tạo thư mục log (chạy một lần)
sudo install -d -m 0750 -o ccne -g ccne /var/log/ai-arena
sudo install -d -m 0700 -o ccne -g ccne /var/backups/ai-arena

# Copy unit files từ repo (sau git pull)
sudo cp /opt/ai-arena/deploy/systemd/ai-arena-backup.service /etc/systemd/system/
sudo cp /opt/ai-arena/deploy/systemd/ai-arena-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ai-arena-backup.timer

# Verify
systemctl list-timers ai-arena-backup.timer
```

Logs: `/var/log/ai-arena/backup.log`

### Backup cấu hình (không chứa secret trong Git)

```bash
sudo tar -czf ~/nginx-backup-$(date +%F).tar.gz /etc/nginx/sites-available/ai-arena
# .env.production: backup riêng, lưu encrypted, không public
```

---

## 12. Restore

### Restore database (chỉ khi hiểu rõ hậu quả)

```bash
# 1. Dừng app
cd /opt/ai-arena
./deploy/up.sh stop app

# 2. Restore (thay TIMESTAMP bằng file backup thực tế)
gunzip -c /var/backups/ai-arena/postgres-TIMESTAMP.sql.gz | \
  docker compose --env-file .env.production -f deploy/compose.production.yml \
  exec -T postgres psql -U promptoff -d promptoff

# 3. Khởi động lại
./deploy/up.sh up -d app
curl -sS https://ai-arena-vietnam.uet.edu.vn/api/health
```

### Restore MinIO files

```bash
# Tham khảo deploy/backup-production.sh — giải nén volume minio
# Liên hệ DevOps nếu chưa có kinh nghiệm
```

**Khuyến nghị:** Test restore trên máy staging trước khi restore production.

---

## 13. Rollback

### Code rollback (safe when migration did NOT run)

Deploy script tự rollback khi health fail **trước migration**.

Thủ công:

```bash
cd /opt/ai-arena
OLD_COMMIT=<commit-hash>
docker tag ai-arena-app:${OLD_COMMIT} ai-arena-app:production
./deploy/up.sh up -d app
git reset --hard "$OLD_COMMIT"    # stays on main branch, not detached HEAD
curl -sS https://ai-arena-vietnam.uet.edu.vn/api/health
```

### Rollback after migration ran

**Không an toàn** để chỉ rollback code. Xem `docs/MIGRATION_STRATEGY.md`.

1. Kiểm tra log deploy: `DATABASE MAY HAVE CHANGED`
2. Quyết định: fix-forward hoặc restore DB từ backup
3. **Không** tự restore DB mù quáng

---

## 14. Nginx

### Kiểm tra config

```bash
sudo nginx -t
```

### Reload (không downtime)

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Config hiện tại

- File: `/etc/nginx/sites-enabled/ai-arena`
- Proxy tới: `http://127.0.0.1:3000`
- WebSocket upgrade: `/api/live-screen/socket`
- Upload limit: `100m`
- HTTP → HTTPS redirect: có

**Không sửa Nginx khi chưa chạy `nginx -t`.**

---

## 15. SSL Certificate

- Provider: Let's Encrypt (Certbot)
- Domain: `ai-arena-vietnam.uet.edu.vn`
- Expiry (audit): 2026-12-07
- Auto-renewal: `certbot.timer` active

```bash
# Kiểm tra certificate
sudo certbot certificates

# Test renewal (không thay đổi thật)
sudo certbot renew --dry-run

# Sau renew TURN cert (nếu có script)
bash /opt/ai-arena/deploy/renew-turn-cert.sh
```

---

## 16. User / Account Management

### Tạo SUPER_ADMIN (khẩn cấp)

```bash
cd /opt/ai-arena
# Cần mount scripts vào container hoặc sửa Dockerfile
docker compose --env-file .env.production -f deploy/compose.production.yml \
  run --rm -v /opt/ai-arena/scripts:/app/scripts \
  -e ADMIN_SEED_EMAIL="admin@example.com" \
  -e ADMIN_SEED_PASSWORD="<strong-password-12+chars>" \
  --no-deps app corepack pnpm create-super-admin
```

### Quản lý user thường

Dùng giao diện Admin: https://ai-arena-vietnam.uet.edu.vn/admin

### Liệt kê user trong database (read-only)

```bash
docker compose --env-file .env.production -f deploy/compose.production.yml \
  exec -T postgres psql -U promptoff -d promptoff \
  -c 'SELECT email, status, "createdAt" FROM "User" WHERE "deletedAt" IS NULL;'
```

Chi tiết: `docs/ACCOUNT_INVENTORY.md`

---

## 17. Common Incidents

### 502 Bad Gateway

| | |
|---|---|
| **Symptoms** | Browser shows 502; Nginx cannot reach app |
| **Check** | `./deploy/up.sh ps` — app container running? `curl http://127.0.0.1:3000/api/health` |
| **Fix** | `./deploy/up.sh restart app`; check `./deploy/up.sh logs app` |
| **Rollback** | Deploy previous commit if recent deploy caused it |

### 504 Gateway Timeout

| | |
|---|---|
| **Symptoms** | Request hangs then 504 |
| **Check** | App logs, high CPU/RAM (`top`), slow DB queries |
| **Fix** | Restart app; scale investigation if during live event |
| **Rollback** | Restart first; rollback code if persistent |

### Database unavailable

| | |
|---|---|
| **Symptoms** | Health returns `"database":"error"` |
| **Check** | `./deploy/up.sh ps postgres`; `./deploy/up.sh logs postgres` |
| **Fix** | `./deploy/up.sh restart postgres`; then restart app |
| **Rollback** | Restore from backup if data corrupted |

### Disk full

| | |
|---|---|
| **Symptoms** | Writes fail; Docker cannot start |
| **Check** | `df -h /`; `docker system df` |
| **Fix** | Clean old Docker images: `docker image prune -f`; rotate logs; expand disk |
| **Rollback** | N/A — prevent with monitoring |

### Application won't start

| | |
|---|---|
| **Symptoms** | Container exits or unhealthy |
| **Check** | `./deploy/up.sh logs app --tail 200` |
| **Fix** | Verify `.env.production`; run migrations; rebuild image |
| **Rollback** | Checkout previous commit + rebuild |

### SSL expired

| | |
|---|---|
| **Symptoms** | Browser certificate warning |
| **Check** | `sudo certbot certificates` |
| **Fix** | `sudo certbot renew`; `sudo systemctl reload nginx` |
| **Rollback** | N/A |

### Git pull conflict

| | |
|---|---|
| **Symptoms** | `git pull` fails; `git status` shows modified files |
| **Check** | `git status`; `git diff` |
| **Fix** | **Do not** `git reset --hard` blindly. Stash or commit server-only files (`.env.production` should stay untracked). Align `Dockerfile` with GitHub. |
| **Rollback** | `git checkout -- <file>` for individual files after backup |

---

## 18. CI/CD Notes

- GitHub repo: `https://github.com/duongnt99/UET_PROMPT_AI`
- Branch production: `main`
- CI runs on push/PR: lint, typecheck, test, build, migrate (ephemeral DB)
- **Production deploy: manual via SSH** (recommended for this scale)

So sánh:
| | Manual SSH deploy | GitHub Actions deploy |
|--|-------------------|----------------------|
| Security | Good (no deploy keys in CI) | Needs SSH key/secrets in GitHub |
| Simplicity | High | Medium |
| Maintainability | Good for small team | Better at scale |

**Đề xuất:** Giữ manual deploy + `scripts/deploy.sh` cho giai đoạn hiện tại.

---

## 19. Related Documents

| Document | Purpose |
|----------|---------|
| `docs/RUNBOOK.md` | Quick copy/paste commands |
| `docs/SECURITY_AUDIT.md` | Security findings |
| `docs/ACCOUNT_INVENTORY.md` | User inventory |
| `docs/DEPLOYMENT.md` | Technical deployment notes |
| `docs/BACKUP_AND_RESTORE.md` | Backup details |
| `docs/MIGRATION_STRATEGY.md` | Migration safety rules |
| `docs/PRODUCTION_GIT_RECONCILIATION.md` | Fix dirty git tree on server |
| `docs/SSH_HARDENING.md` | SSH key-only migration |
| `docs/FAIL2BAN.md` | Fail2ban setup |
| `docs/DEPENDENCY_AUDIT.md` | CVE assessment |
