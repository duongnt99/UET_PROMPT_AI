# Assumptions

Các quyết định kỹ thuật khi Ban Tổ chức chưa chốt:

| Mục | Quyết định hiện tại | Ghi chú |
| --- | --- | --- |
| Hình thức đăng ký | Seed development = `BOTH` | Production nên đặt `UNDECIDED` đến khi BTC chốt. Public copy nói rõ chưa chốt. |
| Sĩ số đội | `teamMinSize=2`, `teamMaxSize=4` | Có thể đổi trong `/admin/settings`. |
| Ngày chung kết | `2026-11-01` + `eventDateStatus=TENTATIVE` | Hiển thị “Dự kiến”. Ngày 03/11 vẫn là phương án. |
| Địa điểm | Hội trường ULIS theo kế hoạch, status TENTATIVE | |
| Bảng đấu | Loại trực tiếp 8 đội: tứ kết → bán kết → chung kết, không play-in | Đúng thể lệ 8 đội và không có suất miễn đấu. |
| Finalist count | 10 | |
| Giải thưởng | Chuỗi rỗng → “Đang cập nhật” | |
| Livestream URL | Rỗng, status HIDDEN | Chỉ nhúng khi bật + URL hợp lệ. |
| Ban giám khảo | Không hard-code tên | Admin tạo tài khoản và chuyển thông tin đăng nhập qua kênh tổ chức phù hợp. |
| Video Audition | Mặc định URL, không bắt buộc | Upload bật khi có object storage. |
| Tie | `MANUAL_VERDICT` | Không tự break tie. |
| Timezone hiển thị | Asia/Ho_Chi_Minh | DB lưu UTC. |
| Password hashing | bcryptjs cost 12 | |
| Auth session | Auth.js JWT, 7 ngày | |
| Rate limit | Bảng `AuthRateLimit` | Đủ cho single instance; có thể thay Redis sau. |
