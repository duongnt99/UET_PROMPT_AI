# Account Inventory — AI Arena Viet Nam Production

**Generated:** 2026-09-08  
**Method:** Read-only server inspection + read-only PostgreSQL queries  
**Note:** No passwords, hashes, tokens, or API keys are included in this document.

---

## Summary

| Category | Count |
|----------|-------|
| Linux login users | 1 (`ccne`) |
| Linux sudo users | 1 (`ccne`) |
| SSH key-enabled users | 1 (`ccne` — 1 authorized key) |
| Application users (active) | 1 |
| Application SUPER_ADMIN | 1 |
| Database roles (PostgreSQL) | 1 application user (`promptoff`) |

---

## Linux Accounts

### Login Users

| Username | UID | Home | Shell | Can login? | Notes |
|----------|-----|------|-------|------------|-------|
| `ccne` | 1000 | `/home/ccne` | `/bin/bash` | Yes | Primary deploy/ops account |

### System Users (non-login)

Standard Ubuntu system accounts (`www-data`, `postgres` via Docker, `turnserver`, `sshd`, etc.) — no interactive login shell (`/usr/sbin/nologin` or `/bin/false`).

| Username | Purpose |
|----------|---------|
| `root` | System root (SSH: `prohibit-password`) |
| `www-data` | Nginx worker user |
| `turnserver` | coturn service |
| `dnsmasq` | System service |

### Sudo Accounts

| Username | Groups | Notes |
|----------|--------|-------|
| `ccne` | `sudo` | Full sudo access (password required) |

### SSH-enabled Accounts

| Username | Port | Password auth | Key auth | Authorized keys |
|----------|------|---------------|----------|-----------------|
| `ccne` | 23456 | Enabled | Enabled | 1 key present |

**Assessment:** Only one human operator account. Root SSH login with password is prohibited.

---

## Application Accounts

**Database:** PostgreSQL 16 (`promptoff` database)  
**ORM table:** `"User"` with roles in `"RoleAssignment"`

### Active Users (as of 2026-09-08)

| ID | Email | Display name | Status | Email verified | Created (UTC) | Last login |
|----|-------|--------------|--------|----------------|---------------|------------|
| `cmtsh0ncw0000mx1bfejat1ov` | `admin@ai-arena-vietnam.uet.edu.vn` | SUPER_ADMIN | ACTIVE | Yes | 2026-09-08 09:32:14 | Never recorded |

### Users by Status

| Status | Count |
|--------|-------|
| ACTIVE | 1 |

### Role Assignments (active, not revoked)

| Email | Role | Assigned (UTC) |
|-------|------|----------------|
| `admin@ai-arena-vietnam.uet.edu.vn` | SUPER_ADMIN | 2026-09-08 09:32:14 |

---

## Admin / Privileged Accounts

### SUPER_ADMIN

| Email | Status | Risk flags |
|-------|--------|------------|
| `admin@ai-arena-vietnam.uet.edu.vn` | ACTIVE | Bootstrap account; no login recorded yet; password stored in server file `.initial-admin` (not in Git) |

### Other privileged roles

| Role | Count | Notes |
|------|-------|-------|
| ADMIN | 0 | — |
| TECH_OPERATOR | 0 | — |
| JUDGE | 0 | — |
| REVIEWER | 0 | — |
| PARTICIPANT | 0 | — |

**Assessment:** Clean initial state. Only one bootstrap SUPER_ADMIN exists. No duplicate admins, no inactive admins, no demo/seed accounts in production database.

---

## Database Accounts (PostgreSQL)

| User | Exposure | Purpose |
|------|----------|---------|
| `promptoff` | Docker internal network only (`172.18.0.x`) | Application database user |

PostgreSQL container port `5432` is **not** bound to host public interface.

---

## Service / Infrastructure Accounts

| Service | Account / credential | Storage |
|---------|---------------------|---------|
| MinIO (S3) | Access key configured in `.env.production` | `.env.production` (server only) |
| TURN (coturn) | Static user credential | `.env.production` + `/etc/turnserver.conf` |
| Let's Encrypt | Certificate files | `/etc/letsencrypt/live/ai-arena-vietnam.uet.edu.vn/` |

---

## Hard-coded Accounts in Source Code (NOT in production DB)

These exist in repository for **development/CI only**:

| Location | Type | Severity |
|----------|------|----------|
| `.env.example` | `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | Dev template |
| `prisma/seed.ts` | Demo accounts with `SEED_PASSWORD` | Dev only — seed not run in production |
| `.github/workflows/ci.yml` | CI database credentials | Ephemeral CI only |
| `docker-compose.yml` | Local `promptoff:promptoff`, `minioadmin` | Local dev only |

**Production database contains none of the seed demo accounts** (seed was not executed).

---

## Recommendations

1. **Change bootstrap admin password** after first login via Admin UI.
2. **Create separate ADMIN accounts** for daily operations; avoid sharing SUPER_ADMIN.
3. **Document** who holds SSH keys for `ccne`.
4. **Review** application users monthly during competition season.
5. **Delete or disable** test accounts immediately if created on production.
