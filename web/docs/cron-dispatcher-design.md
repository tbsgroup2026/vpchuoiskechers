# THIẾT KẾ HỆ THỐNG BACKGROUND JOB & NOTIFICATION DISPATCHER

Bản thiết kế này đáp ứng các yêu cầu về kiến trúc Claim/Lease, giới hạn Cloudflare Workers, cấu hình tuỳ chọn cá nhân và giới hạn các kênh gửi tin (Zalo, Web Push).

## 1. Kiến Trúc Cron & Job Dispatcher
Cloudflare Worker (ở file `web/public/_worker.js`) sẽ được cập nhật để hứng nhiều trigger cron từ `wrangler.jsonc`.
```json
  "triggers": {
    "crons": [
      "*/5 * * * *",   // Chạy mỗi 5 phút: Auto-release phòng
      "0 * * * *",     // Chạy mỗi giờ (0 phút): Gửi Digest Notifications
      "0 19 * * *"     // Chạy 19:00 UTC (2:00 AM VN): Daily Backup (Đã có)
    ]
  }
```

### 1.1 Cơ chế phân luồng (Dispatcher)
Hàm `scheduled(event, env, ctx)` sẽ rẽ nhánh dựa vào `event.cron`:
- Nếu `event.cron === "*/5 * * * *"`: Gọi `runRoomAutoRelease()`.
- Nếu `event.cron === "0 * * * *"`: Gọi `runNotificationDigest()`.

### 1.2 Giới hạn tài nguyên (Cloudflare Workers Limits)
- **CPU Time (Thời gian tính toán):** Ở gói Free/Bundled, Cron Triggers bị giới hạn **10ms CPU Time** (không phải wall-clock time). Do đó, không được dùng Worker để nén file hay tính toán vòng lặp lớn. Các cuộc gọi API ra ngoài (Fetch Zalo, Email) không tính vào CPU Time mà tính vào Wall-clock time. Wall-clock limit là **30 giây** (gói Free).
- **Giải pháp:** Nếu số lượng thông báo quá lớn (quá 30 giây chạy), ta sẽ giới hạn `LIMIT 100` cho mỗi chu kỳ 1 giờ, hoặc nâng cấp lên gói Paid (Unbound/Standard limit 15 phút).

---

## 2. Mô Hình Claim/Lease (Queue Nguyên Tử với D1)

Không dùng Transaction gộp chung với gọi API ngoài (vì nếu API sập, connection D1 bị giữ quá lâu).
Ta áp dụng **Claim/Lease Pattern** xử lý trạng thái Notification:
1. **PENDING:** Thông báo vừa được sinh ra.
2. **CLAIM:** Dispatcher chạy lệnh `UPDATE notifications SET status='PROCESSING', claim_id=?, locked_until=? WHERE status='PENDING' AND ... RETURNING id`. Lệnh này độc chiếm các dòng. (Thực thi bằng `db.batch()` nếu cần gộp nhiều thao tác).
3. **CALL API:** Node process gửi API tới Zalo/Web Push.
4. **RESOLVE:** 
   - Thành công: `UPDATE ... SET status='SENT' WHERE claim_id=?`
   - Thất bại: `UPDATE ... SET status='FAILED', attempts=attempts+1 WHERE claim_id=?`

*Thuộc tính `dedupe_key` sẽ được dùng kèm `UNIQUE INDEX` để tránh việc 1 sự kiện sinh ra 2 thông báo y hệt nhau.*

---

## 3. Quản Lý Quiet Hours & User Preferences

Đã tạo bảng `notification_preferences` (`migrations/0014_notification_preferences.sql`) lưu trữ:
- Cấu hình kênh: `channels_json` (mặc định ưu tiên Zalo + Web Push).
- Khung giờ yên tĩnh (Quiet Hours): `quiet_hours_start` (22:00) đến `quiet_hours_end` (07:00).
- `digest_enabled`: Nhận gom cụm 1 giờ/lần thay vì lẻ tẻ.

### Logic Xử Lý Quiet Hours (Múi giờ Asia/Ho_Chi_Minh)
1. Trong lúc tạo thông báo (chưa claim), hệ thống sẽ check `priority` của thông báo.
2. **Khẩn cấp (URGENT/HOT):** Báo cáo sự cố, Duyệt gấp, Cảnh báo huỷ phòng -> BỎ QUA Quiet Hours và Digest, đẩy thẳng vào hàng đợi gửi ngay (Trạng thái `PENDING_IMMEDIATE`).
3. **Bình thường:** Check giờ hiện tại theo `Asia/Ho_Chi_Minh`.
   - Nếu nằm trong Quiet Hours: Trạng thái là `DELAYED_QUIET_HOURS`, bị kẹt lại cho đến 07:00 AM hôm sau mới chuyển thành `PENDING`.
   - Nếu user chọn `digest_enabled`: Chuyển thành `PENDING_DIGEST`, đợi cron giờ chẵn gom gửi.

---

## 4. Ràng Buộc Nền Tảng: Zalo & iOS Web Push

Trước khi chốt luồng Code, cần lưu ý các ràng buộc kĩ thuật của 2 nền tảng:

**A. Zalo OA (Zalo Notification Service - ZNS)**
- **Chi phí & Ràng buộc Template:** Gửi ZNS tốn tiền (khoảng 200đ - 300đ/tin). Phải đăng ký trước Template với Zalo, không được chèn tuỳ ý 100% nội dung chữ. 
- **User Permission:** Nếu dùng Zalo Follower API (gửi tin nhắn qua OA miễn phí cho người đã theo dõi), người dùng bắt buộc phải tương tác (nhắn tin cho OA) thì OA mới được phản hồi lại trong vòng 7 ngày. Hết 7 ngày OA không thể chủ động nhắn nếu không dùng ZNS trả phí.
- **Dedupe Zalo:** Rất dễ bị block spam nếu đẩy 100 tin/phút cho 1 user. (Do đó tính năng Digest gom cụm là bắt buộc cho Zalo).

**B. Web Push (Đặc biệt trên iOS)**
- **iOS 16.4+ Requirement:** Apple đã hỗ trợ Web Push cho Safari, nhưng BẮT BUỘC người dùng phải dùng chức năng **"Add to Home Screen" (Thêm vào MH chính)** thành PWA thì ứng dụng mới có quyền gọi API cấp quyền Push Notification.
- **HTTPS & VAPID:** Web Push hoạt động qua Service Worker (`navigator.serviceWorker`), yêu cầu kết nối HTTPS chặt chẽ và cặp khoá VAPID chuẩn xác (đã có trong env). Tỉ lệ rớt Push trên iOS cao nếu bị chặn bởi chế độ Nguồn điện thấp (Low Power Mode).

**Kết luận Kênh Gửi:** Zalo sẽ là kênh Reliable (Tin cậy) nhưng cần dùng Template ZNS. Web Push (PWA) là kênh bổ trợ thời gian thực miễn phí.

> Vui lòng phản hồi nếu Thiết kế kiến trúc Claim/Lease và Zalo/Web Push này đã đạt yêu cầu để tôi chuyển sang viết mã triển khai thực tế.
