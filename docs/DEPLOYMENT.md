# Deployment

## Runtime

- Node 20.9+
- PostgreSQL 16
- S3-compatible bucket
- SMTP (hoặc Resend qua SMTP)

## Steps

1. Set env from `.env.example` (strong `AUTH_SECRET`, production `DATABASE_URL`, `APP_URL`).
2. `pnpm install --frozen-lockfile`
3. `pnpm db:generate`
4. `pnpm db:migrate:deploy` — **có kiểm soát**, chạy trong cửa sổ bảo trì, backup trước.
5. **Không** chạy `pnpm db:seed` trên production.
6. `pnpm build && pnpm start`
7. Cron mỗi phút: `POST /api/cron/email` header `Authorization: Bearer $CRON_SECRET`
8. Health: `GET /api/health`

## Docker

`Dockerfile` build standalone Next.js. Compose local chỉ hạ tầng (DB/MinIO/Mailpit); app chạy trên host cho DX, hoặc containerize khi deploy.

## GitHub Actions

CI lint, typecheck, unit test, build. Production migration không chạy tự động từ CI mặc định.
