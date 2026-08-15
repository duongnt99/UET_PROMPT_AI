# Architecture

Modular monolith, Next.js App Router.

## Layers

- `src/app` — routes, Server Components, Route Handlers
- `src/server/actions` — Server Actions (auth + permission + zod)
- `src/server/services` — business use-cases
- `src/server/domain` — pure rules (scoring, deadlines, RBAC)
- `src/lib` — auth, db, email, storage, dates, logging
- `prisma` — schema, migrations, seed

## Auth

Auth.js v5 Credentials + JWT. Password bcrypt. Tokens SHA-256 hashed. Proxy (`src/proxy.ts`) gates private prefixes; layouts re-check roles. SUPER_ADMIN bypasses permission map.

## Settings

`Competition.settings` JSON validated by Zod (`src/config/competition-settings.ts`). No hardcoded rubric weights in scoring UI.

## Storage

S3-compatible (MinIO local). Private objects, signed GET, MIME/size/executable checks.

## Email

Outbox table + `processEmailOutbox`. Not sent inside a failing business transaction as the only commit path; idempotency keys prevent duplicates.

## Scoring

Decimal.js / Prisma Decimal. Normalize then average submitted scores. Round only for display (2 decimals). Ties → TIE_REVIEW / NEEDS_VERDICT.

## Audit

Append-only `AuditLog`. Secrets redacted by logger.

## Deployment

Single web process + PostgreSQL + object storage + SMTP. Cron hits `/api/cron/email` with `CRON_SECRET`.
