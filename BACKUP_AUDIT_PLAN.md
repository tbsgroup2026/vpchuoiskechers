# KẾ HOẠCH BẢO MẬT, BẢO TRÌ & BẢO VỆ DỮ LIỆU (BACKUP & AUDIT LOG SYSTEM PLAN)
**Dự án**: TBS Group System (Monorepo Next.js + Shared Core + Cloudflare Worker + D1 Database)
**Mã tài liệu**: `BACKUP_AUDIT_PLAN.md`
**Ngày tạo**: 2026-09-10

---

## 1. TỔNG QUAN HỆ THỐNG DỮ LIỆU (DATA LANDSCAPE SCAN)

### 1.1 Danh sách Bảng Dữ liệu D1 (D1 SQLite Tables)
Hệ thống quản lý dữ liệu trên Cloudflare D1 (`vpchuoiskechers-db`) bao gồm các phân hệ sau:

| STT | Phân hệ (Module) | Tên bảng D1 (Table Name) | Nội dung dữ liệu | Quy tắc Bảo mật / Sanitization |
|---|---|---|---|---|
| 1 | **Tài khoản & Auth** | `users` / `sys_users` | Thông tin tài khoản, email, họ tên, vai trò, MSNV, vị trí | **LOẠI BỎ** `password_hash`, `password`, `salt`, `token` khi backup/log |
| 2 | **Hồ sơ Người dùng** | `user_profile` | Thông tin mở rộng nhân sự, phòng ban, nhà máy, quyền hạn | Giữ nguyên dữ liệu metadata nhân sự |
| 3 | **Phân quyền (RBAC)** | `roles`, `permissions`, `role_permissions` | Danh mục vai trò và bảng ma trận quyền hạn hệ thống | Backup nguyên vẹn |
| 4 | **Bảo mật & Rate Limit** | `token_blacklist`, `ci_kaizen_rate_limits`, `idempotency_keys` | Danh sách token thu hồi, rate limit IP, khóa trùng lặp request | **KHÔNG export** `token_blacklist` nhạy cảm; backup rate limit metadata |
| 5 | **Thông báo & Push** | `notifications`, `push_subscriptions` | Lịch sử thông báo hệ thống, Web Push Subscription keys | **LOẠI BỎ** `auth` key & `p256dh` secret của Web Push |
| 6 | **Cải tiến Kaizen (CI)** | `ci_kaizen_proposals`, `ci_kaizen_evaluations`, `ci_kaizen_merged_proposals` | Hồ sơ đề xuất cải tiến, chấm điểm sếp, đính kèm, lịch sử gộp | Backup đầy đủ nội dung & danh sách URL ảnh/video |
| 7 | **Bảo trì MMTB (Maintenance)** | `machines`, `maintenance_tickets`, `maintenance_schedule`, `maintenance_logs`, `maintenance_announcements`, `failure_categories` | Danh mục máy móc MMTB, phiếu báo hỏng, lịch bảo trì định kỳ, log xử lý | Backup đầy đủ thông số kỹ thuật & nhật ký bảo trì |
| 8 | **Gemba Walk** | `gemba_factories`, `gemba_workshops`, `gemba_lines`, `gemba_teams`, `gemba_categories`, `gemba_sequences`, `gemba_records`, `gemba_user_scopes`, `gemba_history`, `gemba_attachments` | Điểm Gemba thực địa, ghi nhận vi phạm 5S/An toàn, phân công quản lý | Backup đầy đủ hình ảnh & nhật ký khắc phục Gemba |
| 9 | **Nhân sự (HR)** | `hr_employees`, `hr_contracts`, `hr_requisitions`, `hr_onboarding` | Danh sách nhân viên, hợp đồng lao động, đề xuất tuyển dụng | Backup metadata nhân sự (Loại bỏ các thông tin nhạy cảm cá nhân nếu có) |
| 10 | **Tài chính & Mục tiêu** | `finance_targets` | Mục tiêu ngân sách & chỉ số tài chính | Backup số liệu ngân sách phòng ban |
| 11 | **Đặt phòng & Khách** | `meeting_rooms`, `room_bookings`, `visitors`, `business_trips` | Lịch đặt phòng họp, đăng ký đón khách, công tác phí | Backup lịch trình & thông tin đăng ký |
| 12 | **Công việc & Dự án** | `tasks`, `projects`, `landing_cms` | Nhiệm vụ phòng ban, tiến độ dự án, nội dung Cổng thông tin CMS | Backup đầy đủ nội dung tiến độ |

---

### 1.2 Nơi Lưu trữ Hình ảnh & Tệp tin (Media & File Storage Assets)

| Loại tài sản Media | Nơi lưu trữ (Storage Source) | Định dạng | Quy trình Backup |
|---|---|---|---|
| Ảnh minh chứng Kaizen (Trước/Sau) | Cloudinary CDN (`vpchuoiskechers`) / R2 Bucket | JPG, PNG, WEBP | Export Index danh mục URL đính kèm trong `ci_kaizen_proposals.attachments_json` |
| Ảnh thực địa Gemba Walk | Cloudinary CDN / R2 Bucket / Local Uploads | JPG, PNG | Export Index danh mục đính kèm trong `gemba_attachments` |
| Ảnh mã QR máy móc MMTB | Dynamic Server Generation / API QR | PNG | Re-generateable theo `machines.id` & `code` |
| Tài liệu số hóa (Document Digitization) | R2 / Cloudinary Assets | PDF, DOCX, XLSX | Export metadata index danh mục file & lưu trữ bản sao lên `/images-media/` |
| Avatar người dùng | Cloudinary / User Profile Links | JPG, PNG | Export URL index trong `user_profile` |

---

### 1.3 Các Điểm Thao tác Cập nhật Dữ liệu (CRUD API Points for Audit Logging)

Mọi thao tác ghi/sửa/xóa hoặc xác thực nhạy cảm dưới đây đều phải chạy qua **Audit Log Interceptor**:

```
[AUTH]
- POST /api/login                   -> Log sự kiện LOGIN (SUCCESS / FAIL). KHÔNG ghi nhận mật khẩu.
- POST /api/logout                  -> Log sự kiện LOGOUT.
- POST /api/users                   -> Log CREATE_USER.
- PUT  /api/users                   -> Log UPDATE_USER / CHANGE_ROLE.
- DELETE /api/users                 -> Log DELETE_USER.

[CI KAIZEN]
- POST /api/ci-kaizen               -> Log CREATE_KAIZEN_PROPOSAL.
- PUT  /api/ci-kaizen               -> Log UPDATE_KAIZEN / EVALUATE / APPROVE / REJECT / IMPLEMENT.
- DELETE /api/ci-kaizen             -> Log DELETE_KAIZEN_PROPOSAL.
- POST /api/ci-kaizen/preliminary-review -> Log PRELIMINARY_REVIEW.
- POST /api/ci-kaizen/rate          -> Log RATE_KAIZEN.
- POST /api/ci-kaizen/merge         -> Log MERGE_KAIZEN.
- POST /api/ci-kaizen/assign-reviewer -> Log ASSIGN_REVIEWER.

[MAINTENANCE MMTB]
- POST /api/maintenance/machines    -> Log CREATE_MACHINE.
- PUT  /api/maintenance/machines    -> Log UPDATE_MACHINE.
- DELETE /api/maintenance/machines  -> Log DELETE_MACHINE.
- POST /api/maintenance/tickets     -> Log CREATE_TICKET / UPDATE_STATUS.
- PUT  /api/maintenance/schedule    -> Log UPDATE_MAINTENANCE_SCHEDULE.

[GEMBA WALK]
- POST /api/gemba/records           -> Log CREATE_GEMBA_RECORD.
- PUT  /api/gemba/records           -> Log UPDATE_GEMBA_RECORD.
- DELETE /api/gemba/records         -> Log DELETE_GEMBA_RECORD.

[OPERATIONS & BOOKINGS]
- POST /api/rooms                   -> Log CREATE_ROOM_BOOKING / CANCEL_BOOKING.
- POST /api/business-trip           -> Log CREATE_BUSINESS_TRIP / APPROVE_TRIP.
- POST /api/admin/backup/run        -> Log MANUAL_BACKUP_TRIGGER.
```

---

### 1.4 Cấu trúc Xác thực & Phân quyền (Auth & RBAC Integration)
Xác thực người dùng dựa trên JWT Token chứa payload:
- `id` / `empCode`: Mã nhân sự người dùng
- `name`: Họ và tên
- `role` / `roleCode`: Vai trò hệ thống (`SUPER_ADMIN`, `ADMIN`, `EXECUTIVE`, `TRUONG_PHONG`, `CI_LEAD`, `QC`, `CONG_NHAN`, `NHAN_VIEN`)
- `department` / `factory`: Đơn vị phòng ban, nhà máy quản lý

Khi ghi Audit Log:
- Trích xuất thông tin người thực hiện từ `session.empCode` / `session.id` và `session.role`.
- Lấy IP nguồn từ Header `cf-connecting-ip` hoặc `x-forwarded-for`.
- Lấy User-Agent từ Header `user-agent`.

---

## 2. CẤU TRÚC LƯU TRỮ GOOGLE DRIVE BACKUP (GOOGLE DRIVE ARCHITECTURE)

Hệ thống sao lưu tự động đẩy dữ liệu lên Google Drive theo cấu trúc thư mục phân cấp tiêu chuẩn:

```text
/Backup-TBS-System/
├── /database/
│   └── /2026-09-10/
│       ├── users_sanitized_2026-09-10.json
│       ├── roles_permissions_2026-09-10.json
│       ├── ci_kaizen_proposals_2026-09-10.json
│       ├── maintenance_machines_2026-09-10.json
│       ├── maintenance_tickets_2026-09-10.json
│       ├── gemba_records_2026-09-10.json
│       ├── hr_employees_2026-09-10.json
│       └── room_bookings_2026-09-10.json
├── /images-media/
│   └── /2026-09-10/
│       ├── kaizen_media_index_2026-09-10.json
│       ├── gemba_attachments_index_2026-09-10.json
│       └── document_digitization_index_2026-09-10.json
├── /audit-logs/
│   └── /2026-09-10/
│       ├── audit_logs_daily_2026-09-10.json
│       └── audit_logs_daily_2026-09-10.csv
└── /system-config/
    └── /2026-09-10/
        ├── d1_schema_ddl_2026-09-10.sql
        ├── wrangler_sanitized_2026-09-10.json
        └── env_template_2026-09-10.env
```

---

## 3. THIẾT KẾ BẢNG AUDIT LOG & QUY TẮC BẢO MẬT (AUDIT LOG & SECURITY RULES)

### 3.1 Cấu trúc Bảng `audit_logs` trong D1 Database

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_role TEXT,
  action_type TEXT NOT NULL, -- LOGIN | LOGOUT | CREATE | UPDATE | DELETE | EXPORT | MANUAL_BACKUP
  target_table TEXT NOT NULL,
  target_id TEXT,
  changes_json TEXT, -- Metadata thay đổi đã làm sạch (No Secrets)
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'SUCCESS', -- SUCCESS | FAIL
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type, target_table);
```

### 3.2 Quy tắc Bảo mật Tuyệt đối (Strict Security Constraints)
1. **KHÔNG BAO GIỜ GHI MẬT KHẨU**:
   - Khi ghi log sự kiện Đăng nhập (`LOGIN`), chỉ lưu: `user_id`, `timestamp`, `ip_address`, `user_agent`, `status` (`SUCCESS` / `FAIL`).
   - **CẤM** lưu giá trị mật khẩu (dù là Plaintext, MD5, SHA-256 hay Bcrypt Hash).
2. **LOẠI BỎ TRƯỜNG NHẠY CẢM**:
   - Tự động strip/delete các key: `password`, `password_hash`, `passwordHash`, `salt`, `token`, `secret`, `jwt`, `apiKey`, `authorization`, `privateKey`, `vapidKey`.
3. **SANITIZATION TRƯỚC KHU XUẤT DRIVE**:
   - Mọi bản sao lưu xuất file JSON/CSV đẩy lên Google Drive bắt buộc phải đi qua hàm `sanitizeRecordData(...)`.

---

## 4. LỊCH SAO LƯU TỰ ĐỘNG (AUTOMATED BACKUP SCHEDULE)

- **Cloudflare Worker Scheduled Cron**:
  - Cấu hình Cron Trigger trong `wrangler.jsonc`: `"crons": ["0 2 * * *"]` (Tự động thực thi vào lúc 2:00 AM UTC / 9:00 AM GMT+7 hàng ngày).
- **Quy trình Thực thi Job**:
  1. Khởi tạo thư mục ngày `/Backup-TBS-System/database/yyyy-mm-dd/` trên Google Drive via Google Drive API v3.
  2. Truy vấn dữ liệu từ D1, thực hiện Sanitize loại bỏ bí mật.
  3. Chuyển đổi dữ liệu sang định dạng JSON & CSV.
  4. Đẩy file lên Google Drive với cơ chế Retry (tối đa 3 lần nếu đứt kết nối mạng).
  5. Xóa/Dọn dẹp các thư mục backup đã cũ hơn **90 ngày** trên Google Drive để tối ưu dung lượng.
  6. Ghi log hoàn tất vào bảng `backup_history`.

---

## 5. GIAO DIỆN QUẢN TRỊ (ADMIN AUDIT & BACKUP DASHBOARD)

Tích hợp vào Trang Quản trị Hệ thống (`/work/admin/audit-logs`):
1. **Phân hệ Audit Logs**:
   - Bộ lọc chi tiết theo: Ngày bắt đầu / kết quả, Người thực hiện (MSNV/User ID), Loại thao tác (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`...), Bảng dữ liệu target.
   - Ô tìm kiếm từ khóa nâng cao.
   - Modal xem chi tiết Metadata thay đổi (`changes_json`) định dạng JSON màu đẹp mắt.
2. **Phân hệ Backup Manager**:
   - Hiển thị trạng thái kết nối Google Drive API & Thư mục sao lưu gốc.
   - Nút **"Sao Lưu Ngay (Manual Backup)"** dành riêng cho Admin/Super Admin.
   - Lịch sử danh sách các bản sao lưu theo ngày kèm liên kết xem file trên Google Drive.
