# Hệ thống email

## Kiến trúc

Email do quản trị viên soạn được lưu vào `EmailBatch`. Danh sách người nhận do server truy vấn từ `User` và vai trò; mỗi người nhận trở thành một bản ghi `EmailOutbox`. Worker trong `server.ts` lấy từng nhóm nhỏ, claim delivery bằng cập nhật có điều kiện rồi gửi với giới hạn đồng thời. Cách này giúp request tạo batch trả về nhanh, lưu được tiến độ và không gửi lại khi tải lại trang.

Provider production hỗ trợ SMTP (tương thích cấu hình sẵn có của project) và Resend qua API HTTPS. Development mặc định dùng console transport: chỉ ghi nhận message giả, không gửi thư thật. Console transport bị từ chối khi `NODE_ENV=production`.

## Cấu hình

```env
EMAIL_PROVIDER=resend
EMAIL_FROM_ADDRESS=noreply@your-verified-domain.example
EMAIL_FROM_NAME=AI Arena Vietnam
RESEND_API_KEY=re_...
EMAIL_SEND_CONCURRENCY=3
EMAIL_BATCH_SIZE=25
EMAIL_MAX_ATTEMPTS=3
EMAIL_WORKER_INTERVAL_MS=5000
```

Hoặc dùng SMTP:

```env
EMAIL_PROVIDER=smtp
EMAIL_FROM=AI Arena Vietnam <noreply@your-domain.example>
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_SECURE=false
```

Không commit API key/mật khẩu SMTP. Địa chỉ gửi phải thuộc domain đã xác minh với provider. Khi provider chưa cấu hình hoặc credential sai, app vẫn chạy; delivery được đánh dấu thất bại với lý do để admin xem và gửi lại sau khi sửa cấu hình.

## Vận hành

1. Chạy migration: `pnpm db:migrate:deploy`.
2. Cấu hình các biến môi trường ở trên.
3. Build và chạy bằng `pnpm build && pnpm start`. Lệnh `pnpm start` khởi động cả web server, signaling và email worker.
4. Vào **Quản trị → Thông báo email** để gửi và xem lịch sử.

Worker retry tối đa `EMAIL_MAX_ATTEMPTS` đối với timeout, HTTP 429 và lỗi 5xx. Lỗi vĩnh viễn được giữ ở trạng thái thất bại; admin có thể bấm **Gửi lại email lỗi** sau khi xử lý nguyên nhân.

## Phạm vi hiện tại

- Hỗ trợ gửi đến tất cả người dùng đang hoạt động, tất cả thí sinh đang hoạt động hoặc một nhóm user cụ thể. Mỗi người đồng thời nhận một thông báo trong tài khoản.
- Nội dung admin là plain text, được escape trước khi dựng HTML email và luôn có bản text fallback.
- Email đăng ký là bắt buộc, được trim/lowercase và bảo vệ bằng unique constraint `emailNormalized`.
- Email hiện chỉ được thu thập từ người dùng, **chưa được xác minh**; đăng ký không có bước gửi link xác minh.
- Các thông báo nghiệp vụ hiện hữu vẫn là thông báo trong hệ thống. Email service/outbox đã sẵn sàng để tích hợp theo từng sự kiện khi Ban tổ chức chốt nội dung và thời điểm gửi; hiện chưa tự động phát sinh email cho các sự kiện đó.

## Kiểm thử thủ công

1. Đăng ký bằng email hợp lệ, sau đó kiểm tra email lưu ở dạng lowercase; thử lại cùng email với chữ hoa để xác nhận lỗi trùng.
2. Trong development, giữ `EMAIL_PROVIDER=console`, vào `/admin/email`, chọn một user, xem trước và xác nhận gửi; kiểm tra batch chuyển sang Hoàn tất.
3. Chọn nhiều user hoặc tất cả thí sinh; kiểm tra số recipient và không có email trùng.
4. Đặt `EMAIL_PROVIDER=resend` nhưng bỏ key để kiểm tra delivery thất bại, lịch sử vẫn lưu và nút gửi lại hoạt động.
5. Đăng nhập participant rồi mở `/admin/email`; hệ thống phải chuyển đến trang 403.
