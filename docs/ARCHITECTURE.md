# Architecture

Modular monolith, Next.js App Router.

## Layers

- `src/app` — routes, Server Components, Route Handlers
- `src/server/actions` — Server Actions (auth + permission + zod)
- `src/server/services` — business use-cases
- `src/server/domain` — pure rules (scoring, deadlines, RBAC)
- `src/lib` — auth, db, notification, storage, dates, logging
- `prisma` — schema, migrations, seed

## Auth

Auth.js v5 Credentials + JWT. Password bcrypt. Tài khoản người tham gia được kích hoạt ngay sau khi đăng ký bằng email và mật khẩu, không có bước xác minh email. Proxy (`src/proxy.ts`) gates private prefixes; layouts re-check roles. SUPER_ADMIN bypasses permission map.

## Settings

`Competition.settings` JSON validated by Zod (`src/config/competition-settings.ts`). No hardcoded rubric weights in scoring UI.

## Storage

S3-compatible (MinIO local). Private objects, signed GET, MIME/size/executable checks.

## Notification

Các sự kiện nghiệp vụ được ghi vào `Notification` và hiển thị trong dashboard. Lời mời đội chỉ gửi tới tài khoản đang hoạt động, được chấp nhận hoặc từ chối trực tiếp trong hệ thống.

## Scoring

Decimal.js / Prisma Decimal. Normalize then average submitted scores. Round only for display (2 decimals). Ties → TIE_REVIEW / NEEDS_VERDICT.

## Audit

Append-only `AuditLog`. Secrets redacted by logger.

## Deployment

Single web process + PostgreSQL + object storage. Không cần SMTP, nhà cung cấp email hay email cron.
