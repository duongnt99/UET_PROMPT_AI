# Event day runbook

1. Checklist mở hệ thống: DNS, TLS, `APP_URL`, `AUTH_SECRET`, health 200.
2. Database: `GET /api/health` database=ok; kết nối Prisma.
3. Object storage: health storage=ok; thử upload 1 file PDF.
4. Thông báo: tạo thử một thông báo/lời mời đội và kiểm tra tại `/dashboard/thong-bao`.
5. Tài khoản judge: đăng nhập 3 judge seed/production, mở `/judge`.
6. Stage/overlay: `/stage/current-match`, OBS browser source `/overlay/current-match`.
7. Backup: `bash scripts/backup-db.sh` + storage mirror.
8. Timer: Operations → Start/Pause/Resume; client chỉ render remaining từ server.
9. Mở chấm: chuyển match sang SCORING khi đủ judge assignment.
10. Lock/publish score: admin scoring; không công khai trước PUBLISHED.
11. Mất mạng: judge form lưu nháp server; không lưu token trên localStorage.
12. Nhập điểm thủ công sau sự cố: SUPER_ADMIN reopen + reason + audit.
13. Khôi phục backup: `docs/BACKUP_AND_RESTORE.md` trên môi trường riêng.
14. Kết thúc: backup lần nữa, unpublish overlay nếu cần, export score CSV.
15. Không làm trên production: `migrate reset`, seed demo, xóa audit/score, sửa bracket đã có điểm trừ SUPER_ADMIN + reason.
