# Deployment

## Runtime

- Node 20.9+
- PostgreSQL 16
- S3-compatible bucket
- TURN server có TLS cho chia sẻ màn hình ổn định qua Internet
- SMTP hoặc tài khoản Resend với domain người gửi đã xác minh

## Steps

1. Set env from `.env.example` (strong `AUTH_SECRET`, production `DATABASE_URL`, `APP_URL` và email provider theo `docs/EMAIL_SYSTEM.md`).
2. `pnpm install --frozen-lockfile`
3. `pnpm db:generate`
4. `pnpm db:migrate:deploy` — **có kiểm soát**, chạy trong cửa sổ bảo trì, backup trước.
5. **Không** chạy `pnpm db:seed` trên production.
6. `pnpm build && pnpm start`
7. Health: `GET /api/health`

`pnpm start` phải là tiến trình chạy lâu dài vì tiến trình này đồng thời xử lý `EmailOutbox`. Khi rolling restart, cho instance cũ thời gian drain; delivery đang xử lý quá 5 phút sẽ được worker mới thu hồi.

## WebSocket và WebRTC

- Reverse proxy phải chuyển tiếp HTTP Upgrade cho `/api/live-screen/socket` tới cùng instance chạy `pnpm start`.
- Cấu hình `LIVE_SCREEN_ALLOWED_ORIGINS` bằng origin HTTPS chính thức.
- Cấu hình STUN/TURN theo `docs/LIVE_SCREEN_SHARING.md`. STUN-only không bảo đảm kết nối giữa mọi mạng.
- Nếu chạy nhiều app instance, cần sticky session hoặc thay broker signaling trong process bằng Redis/pub-sub dùng chung.

## Docker

`Dockerfile` chạy custom Next.js/WebSocket server. Compose local có DB/MinIO; app chạy trên host cho DX, hoặc containerize khi deploy.

## GitHub Actions

CI lint, typecheck, unit test, build. Production migration không chạy tự động từ CI mặc định.
