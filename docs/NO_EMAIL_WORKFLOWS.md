# Các luồng nghiệp vụ chưa tự động gửi email

Các luồng bên dưới tiếp tục hoạt động bằng thông báo nội bộ và không phụ thuộc email. Hệ thống nay có trang **Thông báo email** để admin chủ động liên lạc; xem `docs/EMAIL_SYSTEM.md`.

| Luồng | Cách hoạt động hiện tại |
| --- | --- |
| Đăng ký tài khoản | Người dùng nhập email, mật khẩu và xác nhận mật khẩu; tài khoản hoạt động ngay. |
| Mời thành viên đội | Chỉ mời tài khoản đã tồn tại. Lời mời xuất hiện tại **Đội thi** và **Thông báo** để chấp nhận hoặc từ chối. |
| Xác nhận nộp hồ sơ đăng ký | Tạo thông báo trực tiếp trong tài khoản. |
| Xác nhận nộp bài vòng loại | Tạo thông báo trực tiếp trong tài khoản. |
| Yêu cầu bổ sung hồ sơ | Tạo thông báo trực tiếp trong tài khoản kèm đường dẫn về hồ sơ. |
| Công bố đội vào chung kết | Tạo thông báo trực tiếp cho người dùng liên quan. |
| Quên mật khẩu | Người dùng liên hệ Ban Tổ chức; quản trị viên đặt mật khẩu mới tại **Quản trị → Tài khoản**. |
| Tài khoản nhân sự | Quản trị viên tạo tài khoản và phân quyền trực tiếp; không gửi liên kết mời qua email. |

`EmailOutbox` hiện được dùng làm delivery queue cho các batch do admin gửi. `VerificationToken`, `PasswordResetToken` và `StaffInvitation` vẫn là cấu trúc cũ được giữ lại để tương thích dữ liệu/migration; đăng ký tài khoản hiện chưa xác minh email.

## Quy tắc lời mời đội

- Email được dùng làm tên đăng nhập và để tìm đúng tài khoản, không dùng làm kênh gửi thư.
- Không cho tự mời chính mình.
- Không cho gửi lời mời nếu tài khoản nhận đã có một suất đăng ký trong cùng cuộc thi.
- Lời mời cũ hợp lệ được migration gắn với tài khoản tương ứng và tạo thông báo nội bộ.
- Người nhận phải đăng nhập đúng tài khoản được mời mới có thể chấp nhận hoặc từ chối.
