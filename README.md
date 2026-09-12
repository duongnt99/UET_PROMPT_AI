# AI Arena Viet Nam — Cổng thông tin cuộc thi

Hệ thống modular monolith (Next.js) cho đăng ký, nộp bài Audition, chấm, công bố finalist, bracket chung kết, giám khảo, sân khấu, chia sẻ màn hình WebRTC và vận hành.

## 1. Yêu cầu hệ thống

- Node.js 20.9+
- pnpm 10+
- Docker (PostgreSQL, MinIO)
- `psql` / `pg_dump` nếu dùng script backup trên máy host

## 2. Cài dependency

```bash
corepack enable
pnpm install
```

## 3. Chạy Docker services

Nếu có Docker:

```bash
docker compose up -d postgres minio minio-init
```

- PostgreSQL: `localhost:5433`
- MinIO API: `http://localhost:9000` (console `http://localhost:9001`)

Nếu chưa có Docker, có thể dùng PostgreSQL local (Homebrew `postgresql@16`) trên cổng 5432 và sửa `DATABASE_URL` trong `.env`.

## 4. Cấu hình env

```bash
cp .env.example .env
```

Đổi `AUTH_SECRET` thành chuỗi ngẫu nhiên ≥ 32 ký tự trước khi lên môi trường dùng chung.

## 5. Migrate

```bash
pnpm db:generate
pnpm db:migrate
```

Lần đầu, Prisma sẽ hỏi tên migration — dùng `20260814_init` nếu được hỏi. Trong CI dùng `pnpm db:migrate:deploy`.

## 6. Seed

```bash
pnpm db:seed
```

Chỉ dùng cho development. Không seed data demo lên production.

## 7. Development

```bash
pnpm dev
```

Mở `http://localhost:3000`. Development mặc định dùng console email transport nên không gửi email thật.

Lệnh `pnpm dev` chạy custom Next.js server để phục vụ cả HTTP và WebSocket signaling tại cùng origin.

Thiết lập email production và hướng dẫn vận hành: [docs/EMAIL_SYSTEM.md](docs/EMAIL_SYSTEM.md). Các luồng vẫn chỉ dùng thông báo nội bộ được ghi tại [docs/NO_EMAIL_WORKFLOWS.md](docs/NO_EMAIL_WORKFLOWS.md).

## 8. Test

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e   # cần app + DB đang chạy
```

## 9. Build

```bash
pnpm build
pnpm start
```

## 10. Tài khoản development

Mật khẩu mặc định (có thể đổi bằng `SEED_PASSWORD`): `DevPassword123!`

| Vai trò | Email |
| --- | --- |
| SUPER_ADMIN | `superadmin@promptoff.local` |
| ADMIN | `admin@promptoff.local` |
| TECH_OPERATOR | `tech@promptoff.local` |
| REVIEWER | `reviewer1@promptoff.local` … `reviewer3@promptoff.local` |
| JUDGE | `judge1@promptoff.local` … `judge3@promptoff.local` |
| PARTICIPANT | `student1@promptoff.local` … |

Cảnh báo: đây là credential development, không dùng trên production.

## 11. Tạo SUPER_ADMIN

```bash
ADMIN_SEED_EMAIL=you@example.edu.vn ADMIN_SEED_PASSWORD='a-long-secret' pnpm create-super-admin
```

## 12. Backup / restore

Xem `docs/BACKUP_AND_RESTORE.md`. Tóm tắt:

```bash
bash scripts/backup-db.sh
bash scripts/restore-db.sh backups/promptoff-YYYYMMDDTHHMMSSZ.sql.gz
```

## 13. Deploy

Xem `docs/DEPLOYMENT.md`. Migration production: `pnpm db:migrate:deploy` có kiểm soát, không tự seed.

## 14. Known limitations

- CAPTCHA/Turnstile chỉ bật khi có credential.
- Gemini API không bắt buộc; cổng chỉ quản lý hồ sơ/artifact.
- Logo Google/ĐHQGHN chính thức chưa được cung cấp — dùng placeholder trung tính và ô upload trong admin.
- Livestream, giải thưởng, ngày chính thức và hình thức cá nhân/đội có thể còn treo — cấu hình trong Cài đặt. Chung kết mặc định 8 đội, không bye, Sprint 5:00 (có thể thử 10:00), Pitch 1:00.
- Chia sẻ màn hình dùng WebRTC P2P. STUN mặc định phù hợp để phát triển nhưng production cần TURN để hoạt động ổn định giữa các mạng khác nhau; xem `docs/LIVE_SCREEN_SHARING.md`.
