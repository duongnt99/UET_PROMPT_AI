# Chia sẻ màn hình trực tiếp

## Kiến trúc

- Media đi trực tiếp từ trình duyệt thí sinh tới trình duyệt Admin qua WebRTC; hệ thống không chụp, upload hoặc lưu video.
- WebSocket cùng origin tại `/api/live-screen/socket` chỉ chuyển tiếp offer, answer và ICE candidate sau khi xác thực Auth.js.
- PostgreSQL lưu metadata phiên chia sẻ và là nguồn quyết định slot. Mỗi hồ sơ dự thi/phiên thi có tối đa 2 slot; partial unique index bảo vệ giới hạn khi có request đồng thời.
- `Match.id` là `contestSessionId`. Chủ hồ sơ cá nhân hoặc thành viên đã chấp nhận của đội thuộc trận hiện tại được phát. SUPER_ADMIN, ADMIN và TECH_OPERATOR được xem.
- Bình luận MC/Admin mở rộng `InternalNote`, gắn với hồ sơ dự thi và trận; không hiển thị cho thí sinh.

## Environment

```dotenv
WEBRTC_STUN_URLS=stun:stun.l.google.com:19302
WEBRTC_TURN_URLS=turns:turn.example.org:5349?transport=tcp,turn:turn.example.org:3478?transport=udp
WEBRTC_TURN_USERNAME=promptoff
WEBRTC_TURN_CREDENTIAL=replace-with-secret
LIVE_SCREEN_ALLOWED_ORIGINS=https://promptoff.example.org
LIVE_SCREEN_DISCONNECT_GRACE_SECONDS=12
```

Không commit credential TURN. Static TURN credential được trả về chỉ qua API đã xác thực, nhưng production nên ưu tiên TURN credential ngắn hạn nếu hạ tầng hỗ trợ. STUN chỉ giúp khám phá địa chỉ; nó không relay media và không bảo đảm kết nối qua NAT/firewall doanh nghiệp.

## Reverse proxy Nginx

```nginx
location /api/live-screen/socket {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header Origin $http_origin;
    proxy_read_timeout 75s;
}
```

## Vận hành

1. Chạy migration trước khi bật tính năng.
2. Ban Tổ chức chọn trận hiện tại và chuyển trạng thái sang Check-in, Sẵn sàng, Thi nhanh, Thuyết trình hoặc Đang chấm điểm.
3. Thành viên mở `/dashboard/thi-truc-tiep` và chọn **Chia sẻ màn hình**.
4. Admin mở chi tiết trận, chọn **Theo dõi màn hình trực tiếp** tại đội hoặc thí sinh cá nhân cần xem.
5. Khi kết thúc trận, server từ chối publisher mới; heartbeat hiện tại cũng đóng quyền chia sẻ.

Trang chi tiết trận hiển thị thêm hai màn hình song song: Đội A ở bên trái và Đội B ở bên phải. Mỗi bên ưu tiên luồng của chủ hồ sơ cá nhân hoặc nhóm trưởng; Admin vẫn có thể mở trang theo dõi riêng để xem tối đa 2 luồng của một đội và ghi bình luận nội bộ.

Với nhiều app instance, signaling map trong process cần sticky session. Để có failover ngang thực sự, thay event broker bằng Redis/pub-sub; metadata slot trong PostgreSQL đã dùng chung giữa các instance.
