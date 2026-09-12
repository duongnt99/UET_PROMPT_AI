# Security Audit — AI Arena Viet Nam Production

**Audit date:** 2026-09-08  
**Scope:** Repository source code + read-only inspection of production server (`ai-arena-vietnam.uet.edu.vn`)  
**Auditor role:** DevOps + Security (read-only phase)  
**Production changes during audit:** None

---

## Executive Summary

AI Arena Viet Nam is a **Next.js 16 monolith** deployed via **Docker Compose** behind **Nginx + Let's Encrypt**. Core application security controls are present: bcrypt password hashing, JWT sessions (Auth.js), server-side role/permission guards, rate limiting on login, CSP headers, and database/storage not exposed to the public Internet.

**Primary risks** are operational rather than architectural: **SSH password authentication is enabled**, **fail2ban is not installed**, **automated backups are not scheduled**, and the **production server has uncommitted local changes** that could complicate safe updates. Email delivery is not configured for production.

**Security score: 6.5 / 10** (unchanged until production hardening applied)

---

## Remediation Status (Phase 2 — 2026-09-08)

| ID | Repository | Production |
|----|-------------|------------|
| SEC-001 | MITIGATED — `docs/SSH_HARDENING.md` | OPEN |
| SEC-002 | MITIGATED — `docs/FAIL2BAN.md` | OPEN |
| SEC-003 | FIXED — backup script v2 + systemd units in repo | OPEN — timer not installed yet |
| SEC-004 | FIXED — `.gitignore`, Dockerfile aligned, `deploy/` in repo | OPEN — server not reconciled |
| SEC-005 | MITIGATED — `docs/DEPENDENCY_AUDIT.md` | OPEN |
| SEC-006 | OPEN | OPEN |
| SEC-007 | OPEN | OPEN |
| SEC-008 | OPEN (by design) | OPEN |
| SEC-009 | OPEN (documented) | OPEN |
| SEC-010 | OPEN | OPEN |
| SEC-011 | FIXED IN REPO — `COPY scripts` in Dockerfile | OPEN — image not rebuilt |
| SEC-012 | MITIGATED — in SSH hardening guide | OPEN |
| SEC-013 | OPEN | OPEN |
| SEC-014 | OPEN | OPEN |
| SEC-015 | OPEN | OPEN |

**Legend:** FIXED IN REPO = code/docs updated locally; PRODUCTION VERIFIED = applied and tested on server.

---

## Critical Findings

*None identified at network/application layer during read-only audit.*

PostgreSQL (5432) and MinIO (9000) are **not** listening on public interfaces. Application port 3000 is bound to `127.0.0.1` only.

---

## High Findings

### SEC-001 — SSH password authentication enabled

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Component** | Server / SSH |
| **Description** | `PasswordAuthentication yes` is set via `/etc/ssh/sshd_config.d/50-cloud-init.conf`. Combined with a non-standard port, this still allows brute-force attacks. |
| **Evidence** | `sshd_config.d/50-cloud-init.conf`; `PubkeyAuthentication yes` also enabled; `ccne` has 1 authorized key |
| **Risk** | Credential stuffing / brute force against SSH |
| **Recommended fix** | Confirm SSH key login works in a **second session**, then set `PasswordAuthentication no`. Keep port 23456. |
| **Potential downtime** | None if key auth verified first |
| **Rollback plan** | Re-enable `PasswordAuthentication yes` via console/VNC if locked out |

### SEC-002 — No fail2ban or SSH intrusion prevention

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Component** | Server |
| **Description** | `fail2ban` is not installed or active |
| **Evidence** | `systemctl is-active fail2ban` → inactive/not-found |
| **Risk** | Unlimited SSH login attempts |
| **Recommended fix** | Install fail2ban with jail for sshd on port 23456 |
| **Potential downtime** | Low |
| **Rollback plan** | `systemctl stop fail2ban` |

### SEC-003 — No automated production backups

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Component** | Operations / Data |
| **Description** | `deploy/backup-production.sh` exists but `/var/backups/ai-arena` does not exist and no cron/systemd timer schedules backups |
| **Evidence** | Server inspection 2026-09-08 |
| **Risk** | Data loss on disk failure, bad migration, or operator error |
| **Recommended fix** | Schedule daily `deploy/backup-production.sh` via cron; test restore quarterly |
| **Potential downtime** | None for backup setup |
| **Rollback plan** | Remove cron entry |

### SEC-004 — Production git working tree is dirty

| Field | Value |
|-------|-------|
| **Severity** | HIGH (operational) |
| **Component** | Deployment |
| **Description** | Server repo has modified `Dockerfile` and untracked production files (`deploy/`, `.env.production`, `.initial-admin`, `.turn-secret`) |
| **Evidence** | `git status` on `/opt/ai-arena` |
| **Risk** | `git pull` may fail or overwrite local deploy customizations; rollback ambiguity |
| **Recommended fix** | Commit deploy assets to GitHub (excluding secrets) or document server-only files; align Dockerfile with repo |
| **Potential downtime** | Low during reconciliation |
| **Rollback plan** | `git stash` / restore from backup of `/opt/ai-arena` |

### SEC-005 — Dependency vulnerabilities (7 high)

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Component** | Application dependencies |
| **Description** | `pnpm audit` reports 7 high-severity issues (transitive: `fast-uri`, `effect`, `deepmerge-ts`, `nodemailer`) |
| **Evidence** | Local `pnpm audit` on lockfile |
| **Risk** | Depends on exploitability in runtime paths; `fast-uri` host confusion is most actionable |
| **Recommended fix** | Update lockfile after patch releases; monitor advisories; do not rush major upgrades |
| **Potential downtime** | Low–medium during dependency update + rebuild |
| **Rollback plan** | Redeploy previous Docker image tag |

---

## Medium Findings

### SEC-006 — Email provider not configured in production

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Component** | Application |
| **Description** | `EMAIL_PROVIDER`, `RESEND_API_KEY`, `SMTP_PASSWORD` not set in `.env.production` |
| **Evidence** | Env audit (names only) |
| **Risk** | Email verification, notifications, and password workflows may fail silently |
| **Recommended fix** | Configure Resend or SMTP per `docs/EMAIL_SYSTEM.md` |
| **Potential downtime** | App restart only |
| **Rollback plan** | Remove email env vars |

### SEC-007 — No HSTS header at reverse proxy

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Component** | Nginx |
| **Description** | Application sets CSP and other headers but `Strict-Transport-Security` is absent |
| **Evidence** | `curl -I https://ai-arena-vietnam.uet.edu.vn/` |
| **Risk** | SSL stripping on first visit (mitigated once user has HTTPS bookmark) |
| **Recommended fix** | Add HSTS in Nginx after confirming HTTPS stable for 1+ week |
| **Potential downtime** | None |
| **Rollback plan** | Remove HSTS header from Nginx config |

### SEC-008 — Overlay/stage routes intentionally unauthenticated

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Component** | Application |
| **Description** | `/overlay/*` routes have no auth middleware (broadcast displays). CSP allows `frame-ancestors *` on overlay. |
| **Evidence** | `src/app/(overlay)/layout.tsx`, `next.config.ts` |
| **Risk** | Information disclosure if overlay URLs are guessed during live event |
| **Recommended fix** | Use unguessable tokens or network restriction for overlay URLs on event day |
| **Potential downtime** | None |
| **Rollback plan** | Revert overlay auth changes |

### SEC-009 — Single-process architecture (web + WebSocket + email worker)

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Component** | Architecture |
| **Description** | `server.ts` runs HTTP, WebSocket signaling, and email outbox worker in one Node process |
| **Evidence** | `server.ts`, `docs/DEPLOYMENT.md` |
| **Risk** | Email worker load or WS spike can affect HTTP; no horizontal scaling without sticky sessions |
| **Recommended fix** | Accept for current scale; plan Redis pub/sub if multi-instance needed |
| **Potential downtime** | N/A (design) |
| **Rollback plan** | N/A |

### SEC-010 — Auth.js beta version

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Component** | Authentication |
| **Description** | `next-auth@5.0.0-beta.32` in use |
| **Evidence** | `package.json` |
| **Risk** | Beta API/security fixes may lag stable releases |
| **Recommended fix** | Track stable 5.x release and plan upgrade in maintenance window |
| **Potential downtime** | Low–medium |
| **Rollback plan** | Revert package version + redeploy |

### SEC-011 — Docker image missing admin scripts

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Component** | Deployment |
| **Description** | `Dockerfile` does not copy `scripts/` directory; `create-super-admin` fails inside running container without volume mount |
| **Evidence** | `Dockerfile`, deploy experience |
| **Risk** | Operational friction during incident recovery |
| **Recommended fix** | Add `COPY scripts ./scripts` to Dockerfile |
| **Potential downtime** | Rebuild required |
| **Rollback plan** | Previous image |

---

## Low Findings

### SEC-012 — X11Forwarding enabled on SSH

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Component** | SSH |
| **Description** | `X11Forwarding yes` in sshd_config |
| **Recommended fix** | Set `X11Forwarding no` |
| **Rollback plan** | Re-enable if needed |

### SEC-013 — Dev/default credentials in repository (not production)

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Component** | Repository |
| **Description** | `.env.example`, `docker-compose.yml`, `prisma/seed.ts`, CI workflow contain dev passwords |
| **Evidence** | Repo scan |
| **Risk** | Low if production uses unique secrets (confirmed: production secrets configured separately) |
| **Recommended fix** | Keep dev values clearly labeled; never copy to production |

### SEC-014 — Rate limiting stored in PostgreSQL

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Component** | Application |
| **Description** | Not distributed-safe across multiple app instances |
| **Recommended fix** | Accept for single instance; use Redis if scaling |

### SEC-015 — Server header exposes nginx version

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Component** | Nginx |
| **Description** | `Server: nginx/1.24.0 (Ubuntu)` in responses |
| **Recommended fix** | `server_tokens off;` in nginx.conf |

---

## Secrets Inventory (values NOT shown)

| Secret type | Location | Committed to Git? | Status |
|-------------|----------|-------------------|--------|
| `AUTH_SECRET` | `/opt/ai-arena/.env.production` | No | configured |
| `DATABASE_URL` | `/opt/ai-arena/.env.production` | No | configured |
| `S3_SECRET_ACCESS_KEY` | `/opt/ai-arena/.env.production` | No | configured |
| `WEBRTC_TURN_CREDENTIAL` | `/opt/ai-arena/.env.production` | No | configured |
| `RESEND_API_KEY` | — | No | NOT FOUND |
| `SMTP_PASSWORD` | — | No | NOT FOUND |
| Admin bootstrap password | `/opt/ai-arena/.initial-admin` | No | configured (server only) |
| TURN shared secret | `/opt/ai-arena/.turn-secret` | No | configured (server only) |
| Dev seed passwords | `.env.example`, `prisma/seed.ts` | Yes (dev only) | documented dev values |

---

## API Security Summary

| Method | Endpoint | Auth | Role | Risk |
|--------|----------|------|------|------|
| GET | `/api/health` | Public | — | Low (no secrets leaked) |
| GET/POST | `/api/auth/*` | Public | — | Medium (brute force mitigated by rate limit) |
| GET | `/api/public/*` | Public | — | Low (feature-flagged data) |
| GET | `/api/live-screen/config` | Session JWT | Any authenticated | Low |
| GET | `/api/live-screen/current-match` | Session JWT | Watch permission | Low |
| WS | `/api/live-screen/socket` | Session cookie + origin | Publisher/viewer rules | Medium |
| POST | `/api/uploads` | Session JWT | Any user | Medium (rate limited 20/hr) |
| GET | `/api/admin/export-registrations` | Session JWT | `export:pii` permission | High sensitivity (protected) |

Server Actions (admin, participant, judge, etc.) enforce `requirePermission()` / `requireUser()` at entry. IDOR protection is implemented in service layer (e.g. review assignments check `reviewerId`).

---

## Recommended Remediation Priority

| Priority | ID | Action |
|----------|-----|--------|
| DO NOW | SEC-003 | Schedule automated backups |
| DO NOW | SEC-004 | Reconcile dirty git tree on server |
| DO THIS WEEK | SEC-001, SEC-002 | SSH key-only + fail2ban |
| DO THIS WEEK | SEC-006 | Configure email provider |
| DO THIS WEEK | SEC-005 | Patch dependency vulnerabilities |
| OPTIONAL | SEC-007 | Enable HSTS |
| OPTIONAL | SEC-011 | Fix Dockerfile scripts copy |
| OPTIONAL | SEC-012, SEC-015 | SSH/Nginx hardening |
