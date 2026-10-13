# MA TRẬN KIỂM CHỨNG BẢN SỬA LỖI (VERIFICATION MATRIX)

**Dự án**: Hệ thống Quản trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group  
**Người thực hiện**: Senior QA / Test Architect (Độc lập)  
**Ngày thực hiện**: 12/10/2026  
**Nhánh kiểm thử**: `fix/qa-step1-findings` (HEAD: `e0927d35`)  
**Môi trường kiểm thử**: Local Cloudflare Worker Runtime (`http://127.0.0.1:8798`, D1 Local, Miniflare)

---

## 1. TỔNG QUAN MA TRẬN 7 TASK BẢO MẬT

| Task ID | Tên Hạng Mục / Lỗ Hổng | Trạng Thái QA Độc Lập | Tóm Tắt Bằng Chứng Thực Nghiệm | Ghi Chú & Rủi Ro |
|---|---|---|---|---|
| **T1** | Authentication Bypass | ❌ **NOT FIXED** | - 90/108 (83.3%) route API trả về `200 OK` khi gọi **hoàn toàn ẩn danh (không token)**.<br>- Dữ liệu nhạy cảm rò rỉ: công tác, hóa đơn, kaizen, tickets MMTB, nhân sự, bảng lương.<br>- Token giả mạo `alg: none` và chữ ký sai vẫn trả `200 OK`.<br>- Bearer `202608001` bỏ qua xác thực và nhận quyền Admin.<br>- Token sau khi logout vẫn sử dụng bình thường (`200 OK` tại `/api/auth/me`).<br>- `/api/auth/login` không kiểm tra mật khẩu, mọi mật khẩu đều trả `200 OK`. | **CRITICAL** - Rủi ro hệ thống bị chiếm quyền và lộ toàn bộ dữ liệu nội bộ. |
| **T2** | Hardcoded Secrets | ⚠️ **PARTIALLY FIXED / MỞ** | - Vẫn còn 52 vị trí chứa secrets trong active source code.<br>- `gdrive-key.json` L5 và `web/firebase-service-account.json` L5 chứa full Google & Firebase Service Account Private Key.<br>- `web/worker/index.js` (L7042, L7429, L15162...) và bundle tĩnh `web/out/_worker.js` chứa hardcoded RSA Private Key.<br>- `put_secrets.js` (L4, L7) chứa `JWT_SECRET` và Private Key thô.<br>- Git history ghi nhận commit private keys trong các commit `bf3561ad`, `228bb0e0`, `e2699156`. | **CRITICAL** - Toàn bộ secrets đã commit vào git được coi là **ĐÃ LỘ**, bắt buộc phải revoke & rotate trên Google Cloud / Firebase / Cloudflare. |
| **T3** | IDOR / Phân Quyền (RBAC) | ❌ **NOT FIXED** | - CBCNV gọi `/api/admin/workspace-config` và `/api/admin/permissions` đều trả `200 OK` (không chặn 403).<br>- Endpoint admin permissions trả về thông tin Admin của `202608001`.<br>- CBCNV xoá booking của người khác (`/api/rooms/booking?id=...`) trả `200 OK`.<br>- ID không tồn tại và SQLi payload trong ID trả `200 OK` fallback thay vì 404/400.<br>- Update ticket MMTB trả `500 Internal Server Error` làm lộ raw SQLite error message. | **HIGH** - Phân quyền ngang (IDOR) và phân quyền dọc (Privilege Escalation) chưa được kiểm soát. |
| **T4** | Rate Limiting Đăng Nhập | ❌ **NOT FIXED** | - `/api/auth/login` không kiểm tra mật khẩu, 15 lần sai liên tiếp đều trả `HTTP 200 OK`.<br>- Bảng `rate_limit_log` có trong migration nhưng Worker runtime `web/worker/index.js` **không gọi hàm kiểm tra rate limit** trong route login.<br>- Không có cơ chế 429 Too Many Requests, không có header `Retry-After`, không có account lockout. | **HIGH** - Rủi ro brute-force tấn công dò tài khoản nhân viên. |
| **T5** | Data Scoping theo Nhà Máy | ❌ **NOT FIXED** | - Bảng `user_factory_access` **HOÀN TOÀN KHÔNG TỒN TẠI** trong D1 schema và migrations.<br>- Route `/api/ci-kaizen` thực hiện `SELECT * FROM ci_kaizen_proposals LIMIT 500` không có mệnh đề lọc theo nhà máy của user.<br>- Dữ liệu MMTB chỉ dựa vào tham số client `?scope=` tuỳ ý truyền lên. | **HIGH** - CBCNV nhà máy này thấy và thao tác được dữ liệu của nhà máy khác. |
| **T6** | Index D1 Database | ⚠️ **PARTIALLY FIXED** | - **2/5 index đạt yêu cầu**: `idx_room_booking_slot` (phòng họp) và `idx_tasks_dept` (tasks) hoạt động tốt, câu lệnh `EXPLAIN QUERY PLAN` chứng minh dùng index.<br>- **3/5 index thiếu**: `ci_kaizen_proposals(status, factory)` quét toàn bảng (`SCAN`), `sys_notifications` quét toàn bảng (`SCAN`), không có index trên `tickets`. | **MEDIUM** - Nguy cơ suy giảm hiệu năng nghiêm trọng khi bảng phình to. |
| **T7** | Notification Retry & Audit | ⚠️ **PARTIALLY FIXED** | - Đã bổ sung migration claim/lease (`0016_notification_dispatcher.sql`) và test logic backoff.<br>- Gửi thông báo trong Worker cron chỉ là `console.log` giả lập, chưa kết nối provider thật.<br>- Khi thất bại **KHÔNG ghi vào bảng AUDIT_LOGS** (vi phạm yêu cầu kiểm toán an toàn). | **MEDIUM** - Hàng đợi retry cơ bản chạy được nhưng thiếu kiểm toán và chưa tích hợp provider thật. |

---

## 2. KẾT LUẬN TỔNG HỢP BƯỚC 1

- **Số lượng task FIXED**: **0/7** (0%)
- **Số lượng task PARTIALLY FIXED**: **3/7** (T2, T6, T7)
- **Số lượng task NOT FIXED**: **4/7** (T1, T3, T4, T5)
- **Đánh giá khuyến nghị ban đầu**: **KHÔNG ĐẠT ĐIỀU KIỆN GO-LIVE / NO-GO CHO MERGE**.
  - Điều kiện tối thiểu: *Không còn bug Critical/High mở ở T1, T2, T3*.
  - Hiện tại cả T1, T2, T3 đều có lỗi Critical/High mở.
