# Backup and restore

Admin CSV export **không** thay thế backup database.

## PostgreSQL

```bash
bash scripts/backup-db.sh
```

File: `backups/promptoff-YYYYmmddTHHMMSSZ.sql.gz` (gitignored).

Restore **chỉ** trên môi trường riêng:

```bash
bash scripts/restore-db.sh backups/promptoff-....sql.gz
```

Mã hóa: lưu bản dump trên disk encrypted hoặc bucket private với SSE. Không commit backup.

## Object storage

```bash
bash scripts/backup-storage.sh
```

Snapshot thủ công trước/sau: mở đăng ký, chốt finalist, ngày thi.

## Test restore

1. Tạo database `promptoff_restore`
2. Restore dump
3. `pnpm db:generate` và smoke `pnpm dev` với `DATABASE_URL` restore
4. Không trỏ production app vào bản restore
