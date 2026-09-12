# Gmail API (OAuth 2.0) cho AI Arena Viet Nam

Dùng khi tài khoản Google Workspace **không thể** dùng SMTP username/password (ví dụ: không bật 2-Step Verification, không tạo App Password, lỗi `535 BadCredentials`).

Provider này gửi email qua **Gmail API** với scope tối thiểu `https://www.googleapis.com/auth/gmail.send` — chỉ gửi thư, không đọc/sửa/xóa hộp thư.

SMTP vẫn giữ nguyên; chọn provider bằng `EMAIL_PROVIDER`.

## Biến môi trường

```env
EMAIL_PROVIDER=gmail-api

# Địa chỉ hiển thị trên thư gửi đi (phải khớp mailbox đã ủy quyền)
EMAIL_FROM=AI Arena Viet Nam <ai_arena_vietnam@vnu.edu.vn>
# Hoặc:
# EMAIL_FROM_ADDRESS=ai_arena_vietnam@vnu.edu.vn
# EMAIL_FROM_NAME=AI Arena Viet Nam

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_GMAIL_USER=ai_arena_vietnam@vnu.edu.vn
```

**Không** commit secret/token vào git. **Không** ghi client secret, access token hay refresh token vào log ứng dụng.

## Bước 1 — Bật Gmail API trong Google Cloud

1. Mở [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo project mới (hoặc chọn project hiện có), ví dụ `ai-arena-vietnam-mail`.
3. Vào **APIs & Services → Library**, tìm **Gmail API**, bấm **Enable**.

## Bước 2 — Tạo OAuth 2.0 Client ID

1. **APIs & Services → OAuth consent screen**
   - User type: **Internal** (nếu chỉ dùng trong VNU Google Workspace) hoặc **External** (nếu cần test bên ngoài).
   - Điền tên ứng dụng, email hỗ trợ.
   - Scopes: thêm `https://www.googleapis.com/auth/gmail.send` (không thêm `mail.google.com` hay scope đọc/sửa).
   - Lưu.

2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application** (hoặc **Desktop** nếu dùng OAuth Playground / script local).
   - Authorized redirect URIs (nếu dùng OAuth Playground):
     - `https://developers.google.com/oauthplayground`
   - Lưu **Client ID** và **Client secret** → đặt vào `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

> Nếu Workspace admin chặn ứng dụng OAuth, cần admin **cho phép ứng dụng** trong Admin Console (Security → API controls / App access control).

## Bước 3 — Ủy quyền `ai_arena_vietnam@vnu.edu.vn` và lấy refresh token

Cách an toàn nhất cho one-time setup: [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).

1. Bấm biểu tượng ⚙️ (OAuth 2.0 configuration).
2. Bật **Use your own OAuth credentials**, nhập Client ID và Client secret.
3. Trong danh sách scope, nhập thủ công:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
4. Bấm **Authorize APIs**, đăng nhập bằng **`ai_arena_vietnam@vnu.edu.vn`** (tài khoản sẽ gửi thư).
5. Bấm **Exchange authorization code for tokens**.
6. Copy **Refresh token** → lưu vào secret manager / `.env.production` trên server: `GOOGLE_REFRESH_TOKEN=...`

Refresh token dài hạn; access token ngắn hạn được app tự làm mới trên server.

## Bước 4 — Cấu hình production

Trên server (`/opt/ai-arena/.env.production` hoặc tương đương):

```env
EMAIL_PROVIDER=gmail-api
EMAIL_FROM=AI Arena Viet Nam <ai_arena_vietnam@vnu.edu.vn>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_GMAIL_USER=ai_arena_vietnam@vnu.edu.vn
```

Rebuild và restart app:

```bash
docker compose -f deploy/compose.production.yml build app
docker compose -f deploy/compose.production.yml up -d app
```

## Kiểm tra gửi thử

Trên máy có file `.env` đã điền (không log secret):

```bash
pnpm exec tsx scripts/test-gmail-api-connection.ts
pnpm exec tsx scripts/test-gmail-api-connection.ts your.email@example.com
```

Hoặc trong admin: **Quản trị → Gửi thông báo email** — banner hiển thị **Gmail API** khi `EMAIL_PROVIDER=gmail-api`.

## Lỗi thường gặp

| Lỗi | Ý nghĩa | Hướng xử lý |
|-----|---------|-------------|
| `invalid_grant` | Refresh token hết hạn / thu hồi / sai client | Ủy quyền lại, lấy refresh token mới |
| `insufficient_scope` | Token thiếu `gmail.send` | Ủy quyền lại chỉ với scope gửi |
| `admin_policy_enforced` | Workspace chặn OAuth app | Liên hệ IT VNU cho phép app/client ID |
| `access_denied` | User/admin từ chối quyền | Ủy quyền lại hoặc whitelist app |
| Gmail API 401 | Access token không hợp lệ | App tự refresh; nếu lặp lại → kiểm tra refresh token |
| Gmail API 403 | Không đủ quyền / policy | Kiểm tra scope, `GOOGLE_GMAIL_USER`, admin policy |
| Gmail API 429 | Rate limit | Worker sẽ retry; giảm `EMAIL_SEND_CONCURRENCY` |

## Chuyển về SMTP

Đặt `EMAIL_PROVIDER=smtp` và cấu hình SMTP như trước — không cần xóa biến Google.
