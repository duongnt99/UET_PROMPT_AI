# Build status

Repository ban đầu chỉ có kế hoạch tổ chức (`Ke_hoach_to_chuc_Prompt-Off_Vietnam_2026-v2.md`). Hệ thống được khởi tạo mới trên Next.js 16 App Router.

## P0

- [x] Project setup (pnpm, Next.js, Tailwind, TypeScript)
- [x] Database Prisma + PostgreSQL
- [x] Authentication email/password; tài khoản hoạt động ngay, không xác minh email
- [x] Public landing
- [x] Competition Settings
- [x] Participant profile
- [x] Individual/team registration
- [x] Registration receipt
- [x] Audition submission
- [x] File/link handling
- [x] Participant dashboard
- [x] Admin registrations/submissions
- [x] CSV export
- [x] Thông báo nội bộ cho lời mời đội, biên nhận và kết quả
- [x] Deadline enforcement
- [x] Audit cơ bản
- [x] Backup/restore scripts
- [x] README + deployment docs

## P1

- [x] Reviewer management / assignment
- [x] Rubric 40/30/30 versioned
- [x] Audition scoring + ranking
- [x] Selection lock + publish finalists
- [x] Review progress

## P2

- [x] Custom bracket for 10 finalists
- [x] Judge scoring
- [x] Sprint/Pitch/Verdict timer
- [x] On-stage Twist
- [x] Public scoreboard + OBS overlay
- [x] Rehearsal competition in seed
- [x] Operations dashboard + incident log
- [x] Event-day runbook

## Verification

Đã chạy trên máy phát triển này (2026-08-14):

- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm test` — 32+ tests pass (unit + integration với PostgreSQL)
- `pnpm build` — production build pass (Next.js 16.3.1)
- `pnpm e2e` — Playwright Chromium pass (homepage, login, dashboard, public PII check)
- `prisma migrate deploy` — `20260814100000_init`
- `pnpm db:seed` — pass

Docker Compose chưa chạy được trên máy này vì `docker` CLI không có trong PATH; PostgreSQL 16 local (Homebrew) đã dùng để migrate/seed.
