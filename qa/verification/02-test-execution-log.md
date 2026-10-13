# NHẬT KÝ THỰC THI KIỂM THỬ (TEST EXECUTION LOG)

**Dự án**: Hệ thống Quản trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group  
**Người thực hiện**: Senior QA / Test Architect (Độc lập)  
**Ngày thực hiện**: 12/10/2026  
**Nhánh kiểm thử**: `fix/qa-step1-findings`  
**Target Host**: `http://127.0.0.1:8798` (Wrangler Local Worker Runtime)

---

## 1. KIỂM THỬ T1: AUTHENTICATION BYPASS & TOKEN SECURITY

| Test ID | Mô Tả & Bước Thực Hiện | Lệnh / Request Thực Thi | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|---|---|---|
| **T1-AUTH-001** | Gọi `/api/auth/me` không có token | `GET /api/auth/me` (No Auth Header) | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **T1-AUTH-002** | Gọi `/api/business-trips` không có token | `GET /api/business-trips` | HTTP 401 Unauthorized | HTTP 200 OK (Trả về danh sách công tác) | ❌ **FAIL** |
| **T1-AUTH-003** | Gọi `/api/business-trips/invoices` không có token | `GET /api/business-trips/invoices` | HTTP 401 Unauthorized | HTTP 200 OK (Trả về dữ liệu hóa đơn) | ❌ **FAIL** |
| **T1-AUTH-004** | Gọi `/api/ci-kaizen` không có token | `GET /api/ci-kaizen` | HTTP 401 Unauthorized | HTTP 200 OK (Trả về danh sách toàn bộ Kaizen) | ❌ **FAIL** |
| **T1-AUTH-005** | Gọi `/api/ci-kaizen/judging/guests` không có token | `GET /api/ci-kaizen/judging/guests` | HTTP 401 Unauthorized | HTTP 200 OK | ❌ **FAIL** |
| **T1-AUTH-006** | Gọi `/api/ci-kaizen/judging/reports` không có token | `GET /api/ci-kaizen/judging/reports` | HTTP 401 Unauthorized | HTTP 200 OK (Báo cáo chấm điểm mở công khai) | ❌ **FAIL** |
| **T1-AUTH-007** | Gọi `/api/ci-kaizen/permissions` không có token | `GET /api/ci-kaizen/permissions` | HTTP 401 Unauthorized | HTTP 200 OK | ❌ **FAIL** |
| **T1-AUTH-008** | Gọi `/api/employees` không có token | `GET /api/employees` | HTTP 401 Unauthorized | HTTP 200 OK (Lộ danh bạ nhân sự) | ❌ **FAIL** |
| **T1-AUTH-009** | Gọi `/api/gemba/records` không có token | `GET /api/gemba/records` | HTTP 401 Unauthorized | HTTP 200 OK (Lộ nhật ký Gemba nhà máy) | ❌ **FAIL** |
| **T1-AUTH-010** | Gọi `/api/hr/attendance` không có token | `GET /api/hr/attendance` | HTTP 401 Unauthorized | HTTP 200 OK | ❌ **FAIL** |
| **T1-AUTH-011** | Gọi `/api/hr/contracts` không có token | `GET /api/hr/contracts` | HTTP 401 Unauthorized | HTTP 200 OK | ❌ **FAIL** |
| **T1-AUTH-012** | Gọi `/api/hr/payroll` không có token | `GET /api/hr/payroll` | HTTP 401 Unauthorized | HTTP 200 OK | ❌ **FAIL** |
| **T1-AUTH-013** | Gọi `/api/maintenance/tickets` không có token | `GET /api/maintenance/tickets` | HTTP 401 Unauthorized | HTTP 200 OK (Lộ toàn bộ phiếu bảo dưỡng) | ❌ **FAIL** |
| **T1-AUTH-014** | Gọi `/api/maintenance/machines` không có token | `GET /api/maintenance/machines` | HTTP 401 Unauthorized | HTTP 200 OK (Lộ danh mục máy móc) | ❌ **FAIL** |
| **T1-AUTH-015** | Gọi `/api/admin/notifications/broadcast` không có token | `GET /api/admin/notifications/broadcast` | HTTP 401 Unauthorized | HTTP 200 OK | ❌ **FAIL** |
| **T1-AUTH-016** | Gọi `/api/admin/permissions` không có token | `GET /api/admin/permissions` | HTTP 401 Unauthorized | HTTP 200 OK | ❌ **FAIL** |
| **T1-AUTH-017** | Gọi `/api/admin/proposals` không có token | `GET /api/admin/proposals` | HTTP 401 Unauthorized | HTTP 200 OK | ❌ **FAIL** |
| **T1-AUTH-018** | Gửi token chữ ký giả mạo đến `/api/tasks` | `GET /api/tasks` kèm `Authorization: Bearer <valid_payload.FAKESIG>` | HTTP 401 Unauthorized | HTTP 200 OK (Bypass thành công) | ❌ **FAIL** |
| **T1-AUTH-019** | Gửi token `alg: none` đến `/api/task-cards` | `GET /api/task-cards` kèm header `alg: none` JWT | HTTP 401 Unauthorized | HTTP 200 OK (Bypass thành công) | ❌ **FAIL** |
| **T1-AUTH-020** | Gửi Bearer MSNV thô `Bearer 202608001` đến `/api/tasks` | `GET /api/tasks` kèm `Authorization: Bearer 202608001` | HTTP 401 Unauthorized | HTTP 200 OK (Bypass và cấp session admin) | ❌ **FAIL** |
| **T1-AUTH-021** | Tái sử dụng token đã logout tại `/api/auth/logout` | `POST /api/auth/logout` sau đó gọi `GET /api/auth/me` | HTTP 401 Unauthorized | HTTP 200 OK (Token không bị thu hồi/blacklist) | ❌ **FAIL** |
| **T1-AUTH-022** | Đăng nhập với mật khẩu tuỳ ý tại `/api/auth/login` | `POST /api/auth/login` với body `{ empCode: "SA001", password: "wrong_password_123" }` | HTTP 401 Bad Credentials | HTTP 200 OK (`"success": true`, cấp token thành công) | ❌ **FAIL** |

---

## 2. KIỂM THỬ T2: SECRETS QUÉT TOÀN BỘ MÃ NGUỒN & GIT HISTORY

| Test ID | Mô Tả & Bước Thực Hiện | Lệnh / Script Thực Thi | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|---|---|---|
| **T2-SEC-001** | Quét file cấu hình `wrangler.jsonc` | Static AST Scanner | Không chứa secret server | `VAPID_PUBLIC_KEY`, `GDRIVE_CLIENT_EMAIL` (public IDs, không lộ private key trong wrangler.jsonc) | **PASS** |
| **T2-SEC-002** | Quét repository tìm Private Keys | `node web/scratch/qa/scan-secrets.mjs` | 0 file chứa private key | Phát hiện 32 vị trí chứa RSA / Service Account Private Key | ❌ **FAIL** |
| **T2-SEC-003** | Kiểm tra file `gdrive-key.json` | File inspect tại root | File không tồn tại hoặc đã gitignore | `gdrive-key.json` L5 chứa full Google Service Account Private Key | ❌ **FAIL** |
| **T2-SEC-004** | Kiểm tra file `firebase-service-account.json` | File inspect tại `web/` | File không tồn tại hoặc đã gitignore | `web/firebase-service-account.json` L5 chứa full Firebase Private Key | ❌ **FAIL** |
| **T2-SEC-005** | Quét `web/worker/index.js` tìm hardcoded key | Grep `BEGIN RSA PRIVATE KEY` | 0 kết quả | 4 vị trí hardcoded (L7042, L7429, L15162, L15551) | ❌ **FAIL** |
| **T2-SEC-006** | Quét thư mục build tĩnh `web/out/` | Regex search trong bundle tĩnh | 0 kết quả secret | Tệp `web/out/_worker.js` (L6250, L6637, L14330) chứa private key | ❌ **FAIL** |
| **T2-SEC-007** | Kiểm tra tệp `put_secrets.js` | File inspect tại root | Chứa placeholder biến môi trường | Chứa `JWT_SECRET` và Private key thô (L4, L7) | ❌ **FAIL** |
| **T2-SEC-008** | Quét lịch sử Git commit | `git log -S "BEGIN PRIVATE KEY" --oneline` | Không tồn tại trong git log | Đã commit trong `bf3561ad`, `228bb0e0`, `e2699156` | ❌ **FAIL** (Coi như ĐÃ BỊ LỘ) |

---

## 3. KIỂM THỬ T3: IDOR & PHÂN QUYỀN RBAC

| Test ID | Mô Tả & Bước Thực Hiện | Lệnh / Request Thực Thi | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|---|---|---|
| **T3-RBAC-001** | CBCNV truy cập API cấu hình quản trị hệ thống | `GET /api/admin/workspace-config` với token CBCNV | HTTP 403 Forbidden | HTTP 200 OK | ❌ **FAIL** |
| **T3-RBAC-002** | CBCNV gọi API phân quyền quản trị | `GET /api/admin/permissions` với token CBCNV | HTTP 403 Forbidden | HTTP 200 OK (Trả về quyền của Admin `202608001`) | ❌ **FAIL** |
| **T3-IDOR-001** | CBCNV xoá đặt phòng của nhân viên khác | `DELETE /api/rooms/booking?id=booking_b` với token User A | HTTP 403 Forbidden | HTTP 200 OK | ❌ **FAIL** |
| **T3-IDOR-002** | CBCNV cập nhật phiếu bảo dưỡng máy móc | `PUT /api/maintenance/tickets` với token User A | HTTP 403 Forbidden | HTTP 500 Internal Server Error (Lộ stack trace SQLite) | ❌ **FAIL** |
| **T3-EDGE-001** | Truy vấn tài nguyên với ID không tồn tại | `GET /api/ci-kaizen/not_exist_99999` | HTTP 404 Not Found | HTTP 200 OK | ❌ **FAIL** |
| **T3-EDGE-002** | Truy vấn với payload SQL Injection trên URL | `GET /api/ci-kaizen/%27%20OR%201%3D1--` | HTTP 400 Bad Request / 404 | HTTP 200 OK | ❌ **FAIL** |
| **T3-MASS-001** | CBCNV gửi POST Kaizen kèm trường `status: APPROVED` | `POST /api/ci-kaizen` body `{ status: "APPROVED" }` | Bị ép về DRAFT/PENDING | HTTP 400 (bị chặn schema validation) | **PASS** |

---

## 4. KIỂM THỬ T4: RATE LIMITING ĐĂNG NHẬP

| Test ID | Mô Tả & Bước Thực Hiện | Lệnh / Request Thực Thi | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|---|---|---|
| **T4-RATE-001** | Gửi 15 yêu cầu đăng nhập sai mật khẩu liên tiếp | 15 x `POST /api/auth/login` với sai mật khẩu | Từ lần 11 trả về HTTP 429 kèm `Retry-After` | Cả 15 lần đều trả HTTP 200 OK | ❌ **FAIL** |
| **T4-RATE-002** | Kiểm tra thông báo lỗi sai user vs sai mật khẩu | So sánh response giữa user không tồn tại và sai mật khẩu | Thông báo nhất quán, không lộ username enumeration | Cả 2 đều trả `200 OK` đăng nhập thành công | ❌ **FAIL** |
| **T4-RATE-003** | Kiểm tra cơ chế khoá tài khoản (Account Lockout) | Sau 10 lần sai, đăng nhập đúng mật khẩu | HTTP 423 Locked hoặc 429 Too Many Requests | HTTP 200 OK | ❌ **FAIL** |
| **T4-RATE-004** | Kiểm tra bảng lưu trữ rate limit trong D1 Worker | Kiểm tra câu lệnh gọi `rate_limit_log` trong `web/worker/index.js` | Có câu lệnh D1 query vào `rate_limit_log` tại `/api/auth/login` | Không có bất kỳ câu lệnh nào gọi đến bảng `rate_limit_log` tại route login | ❌ **FAIL** |

---

## 5. KIỂM THỬ T5: DATA SCOPING THEO NHÀ MÁY

| Test ID | Mô Tả & Bước Thực Hiện | Lệnh / Request Thực Thi | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|---|---|---|
| **T5-SCOPE-001** | Kiểm tra bảng `user_factory_access` trong cơ sở dữ liệu | `SELECT name FROM sqlite_master WHERE name='user_factory_access'` | Bảng tồn tại | Trả về rỗng `[]` (Bảng KHÔNG TỒN TẠI) | ❌ **FAIL** |
| **T5-SCOPE-002** | CBCNV Nhà máy A lấy danh sách Kaizen qua API | `GET /api/ci-kaizen` với user Kiên Giang vs Miền Đông | Chỉ trả về dữ liệu Kaizen thuộc nhà máy của user | Trả về toàn bộ bản ghi Kaizen của mọi nhà máy (`SELECT * ... LIMIT 500`) | ❌ **FAIL** |
| **T5-SCOPE-003** | Kiểm tra tham số scope trên module MMTB | `GET /api/maintenance/overview-report?scope=EAST` | Backend tự xác thực scope dựa trên session user | Backend hoàn toàn dựa vào query param `?scope=` do client tự truyền lên | ❌ **FAIL** |

---

## 6. KIỂM THỬ T6: DATABASE INDEX VÀ HIỆU NĂNG QUERY PLAN

| Test ID | Mô Tả & Bước Thực Hiện | Lệnh / Query Thực Thi | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|---|---|---|
| **T6-IDX-001** | Kiểm tra index trùng giờ đặt phòng họp | `EXPLAIN QUERY PLAN SELECT * FROM room_bookings WHERE room_id=? AND booking_date=? AND time_slot=? AND status!='CANCELLED'` | Dùng index `idx_room_booking_slot` | `SEARCH room_bookings USING INDEX idx_room_booking_slot` | **PASS** |
| **T6-IDX-002** | Kiểm tra index lọc Kanban task theo phòng ban | `EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE department_id=?` | Dùng index `idx_tasks_dept` | `SEARCH tasks USING INDEX idx_tasks_dept` | **PASS** |
| **T6-IDX-003** | Kiểm tra index lọc Kaizen theo status và factory | `EXPLAIN QUERY PLAN SELECT * FROM ci_kaizen_proposals WHERE status=? AND factory=?` | Dùng index hỗn hợp (status, factory) | `SCAN ci_kaizen_proposals` (Quét toàn bảng) | ❌ **FAIL** |
| **T6-IDX-004** | Kiểm tra index thông báo hệ thống | `EXPLAIN QUERY PLAN SELECT * FROM sys_notifications WHERE target_user=?` | Dùng index trên `target_user` | `SCAN sys_notifications` (Quét toàn bảng) | ❌ **FAIL** |
| **T6-IDX-005** | Kiểm tra index trên bảng phiếu bảo dưỡng `tickets` | `PRAGMA index_list(tickets)` | Tồn tại index `(status, priority)` | Bảng `tickets` không tồn tại trong schema local `DB` | ❌ **FAIL** |

---

## 7. KIỂM THỬ T7: NOTIFICATION DISPATCHER RETRY & AUDIT

| Test ID | Mô Tả & Bước Thực Hiện | Lệnh / Script Thực Thi | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|---|---|---|
| **T7-NOTIF-001** | Kiểm tra cơ chế Claim/Lease đa luồng tránh gửi trùng | `node web/tests/better_dispatcher.test.js` | 2 Worker cùng xử lý: chỉ 1 worker nhận job | `[✅ PASS]` Lease lock hoạt động an toàn | **PASS** |
| **T7-NOTIF-002** | Kiểm tra Quiet Hours (trì hoãn gửi từ 22h đến 7h) | Unit test giả lập mốc thời gian đêm | Tin nhắn thường chuyển `PENDING` đến 7h sáng | `[✅ PASS]` Tin nhắn thường bị hoãn, `URGENT` gửi ngay | **PASS** |
| **T7-NOTIF-003** | Kiểm tra Exponential Backoff khi gặp lỗi | Test lỗi và kiểm tra trường `deliver_after` | `deliver_after = now + 2^attempts * 60s` | `[✅ PASS]` Backoff tính toán chính xác | **PASS** |
| **T7-NOTIF-004** | Kiểm tra ghi `AUDIT_LOGS` khi dispatch thông báo thất bại | Inspect hàm `handleNotificationQueue` trong `web/worker/index.js` L17566-17585 | Ghi bản ghi vào bảng `AUDIT_LOGS` | **KHÔNG CÓ** câu lệnh INSERT vào `audit_logs` khi failed | ❌ **FAIL** |
| **T7-NOTIF-005** | Kiểm tra tích hợp provider thật (Zalo / Firebase) | Inspect logic gửi tin L17556 trong Worker | Gọi API Zalo Webhook / FCM HTTP v1 | Chỉ là dòng lệnh `console.log` giả lập | ❌ **FAIL** |
