# Database Migration Strategy — Production

## Overview

Production uses **Prisma Migrate** (`prisma migrate deploy`). Migrations are applied manually during deploy via `scripts/deploy.sh`.

**Critical rule:** Code rollback does **not** undo database schema changes.

---

## Migration Risk Classes

### A. Backward-compatible (safe to rollback code)

Old application code can run against the new schema without errors.

Examples in this project:
- `CREATE TABLE` for new features (old code ignores new tables)
- `ADD COLUMN ... DEFAULT ...` or nullable columns
- `CREATE INDEX` (non-blocking in most cases)
- Data backfill `UPDATE` statements
- `ALTER COLUMN ... DROP NOT NULL` (widens compatibility)

Most migrations in `prisma/migrations/` are additive:
- `20260814100000_init` — initial schema
- `20260824120000_match_challenges` — adds columns/tables with defaults
- `20260906190000_live_screen_sharing` — new tables
- `20260907060000_email_management` — new email tables
- etc.

### B. Breaking / contract migrations (code rollback may be unsafe)

Old code may crash or corrupt data if schema changed incompatibly.

Examples to watch for in future migrations:
- `DROP COLUMN` / `DROP TABLE`
- `ALTER COLUMN ... SET NOT NULL` without default on existing rows
- `RENAME COLUMN` without code deployed simultaneously
- Type changes that narrow data
- Constraint changes that old code violates

Known semi-breaking migration (already applied on production):
- `20260906231000_live_screen_individual_registration` — `teamId DROP NOT NULL`, index changes. **Breaking for old screen-share code** if rolled back after apply. Production already at latest schema.

---

## Expand → Migrate → Contract (recommended for future breaking changes)

1. **Expand:** Add new column/table alongside old (nullable or with default)
2. **Migrate:** Deploy code that writes to both / reads from new
3. **Contract:** Remove old column after all instances updated

Never combine expand and contract in a single production deploy without a maintenance window.

---

## Deploy Script Behavior

`scripts/deploy.sh` v2:

| Step | Action |
|------|--------|
| Pre-migrate | Mandatory backup (postgres + minio) |
| Migrate | `pnpm db:migrate:deploy` |
| Post-migrate | Sets `MIGRATION_RAN=1` |
| Health fail + migration ran | **WARN: DATABASE MAY HAVE CHANGED** |
| Rollback | Code/image only via `ai-arena-app:$OLD_COMMIT` + `git reset --hard` |
| DB restore | **Never automatic** — manual per `docs/OPERATIONS.md` |

---

## Operator Decision Matrix

| Situation | Action |
|-----------|--------|
| Health fail, migration NOT run | Safe code rollback via deploy script |
| Health fail, migration ran, additive migration | Try code rollback; monitor logs |
| Health fail, migration ran, breaking migration | **Stop.** Fix-forward or restore DB from backup |
| Migration SQL error mid-deploy | Do not restart app. Inspect `_prisma_migrations`. Restore from backup if needed |

---

## Pre-deploy Migration Review Checklist

Before merging migration PRs to `main`:

1. Read the generated `migration.sql`
2. Classify as A (backward-compatible) or B (breaking)
3. If B: plan two-phase deploy or maintenance window
4. Test `db:migrate:deploy` on staging copy
5. Ensure backup ran successfully before production migrate

---

## Verify Migration State (read-only)

```bash
cd /opt/ai-arena
docker compose --env-file .env.production -f deploy/compose.production.yml \
  exec -T postgres psql -U promptoff -d promptoff \
  -c 'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at;'
```
