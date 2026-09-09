# Production Git Reconciliation Guide

**Purpose:** Clean `/opt/ai-arena` working tree without losing secrets or data.

**Never run:** `git reset --hard`, `git clean -fd` until files are classified and backed up.

---

## File Classification (audit 2026-09-08)

| File / path | Class | Action |
|-------------|-------|--------|
| `Dockerfile` (modified) | **A — SHOULD BE IN GIT** | Server diff adds `COPY prisma` in deps stage + `RUN corepack enable` in runner. **Already fixed in repository.** After pull, server modification disappears. |
| `deploy/` (untracked) | **A — SHOULD BE IN GIT** | Track in GitHub: `compose.production.yml`, `backup-production.sh`, `nginx-ai-arena.conf`, `renew-turn-cert.sh`, `up.sh`, `systemd/` |
| `.dockerignore` (untracked) | **A — SHOULD BE IN GIT** | Commit to repo |
| `.env.production` | **C — SECRET** | Add to `.gitignore` (done). Keep on server only. |
| `.initial-admin` | **C — SECRET** | Add to `.gitignore` (done). `chmod 600` (already set). Delete after admin password changed. |
| `.turn-secret` | **C — SECRET** | Add to `.gitignore` (done). Keep on server only. |
| `deploy/up.sh` (server-only copy) | **A** | Now in repo — server copy can be replaced by git version |

---

## Reconciliation Steps (run on server)

### Step 1 — Backup server-only files (SAFE)

```bash
mkdir -p ~/production-secrets-backup-$(date +%F)
cp -a /opt/ai-arena/.env.production ~/production-secrets-backup-$(date +%F)/
cp -a /opt/ai-arena/.initial-admin ~/production-secrets-backup-$(date +%F)/
cp -a /opt/ai-arena/.turn-secret ~/production-secrets-backup-$(date +%F)/
chmod 700 ~/production-secrets-backup-$(date +%F)
```

### Step 2 — Pull updated repository (SAFE after backup)

```bash
cd /opt/ai-arena
git fetch origin main
git pull --ff-only origin main
```

If pull fails due to modified `Dockerfile`:

```bash
# SAFE: stash only Dockerfile (secrets stay untracked)
git stash push -m "server-dockerfile" -- Dockerfile
git pull --ff-only origin main
# Verify Dockerfile from repo has prisma copy + corepack enable
git stash drop   # only if repo version is correct
```

### Step 3 — Verify clean tree (SAFE)

```bash
git status --porcelain
# Expected: only ignored files (.env.production, .initial-admin, .turn-secret)
git check-ignore -v .env.production .initial-admin .turn-secret
```

### Step 4 — Restore secrets if accidentally moved (only if needed)

```bash
cp -a ~/production-secrets-backup-*/.env.production /opt/ai-arena/
chmod 600 /opt/ai-arena/.env.production
```

---

## Expected Final State

```
git status --porcelain
# (empty — all visible changes either committed or gitignored)

ls -la .env.production .initial-admin .turn-secret
# -rw------- ccne ccne  (mode 600)
```
