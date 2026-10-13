# BÁO CÁO PHÂN TÍCH HỆ THỐNG - BƯỚC 1

**Dự án**: Hệ thống Quản trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group  
**Người thực hiện**: Senior QA/Tester  
**Ngày thực hiện**: 11/10/2026  
**Phiên bản hệ thống**: v1.1.0  

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Thông tin cơ bản

- **Tên hệ thống**: HỆ THỐNG QUẢN TRỊ VẬN HÀNH CHUỖI CUNG ỨNG & SẢN XUẤT SKECHERS — TBS GROUP (Zone II)
- **Tên miền production**: https://vpchuoiskechers.tbsgroup2026.workers.dev
- **Repository**: https://github.com/tbsgroup2026/vpchuoiskechers
- **Loại ứng dụng**: Enterprise Web Application (Serverless)
- **Mục đích**: Số hóa toàn diện quy trình vận hành nhà máy sản xuất giày SKECHERS

### 1.2. Kiến trúc tổng thể

#### **Tech Stack**

**Frontend:**
- Next.js 14.2.15 (App Router)
- React 18.3.1
- TypeScript
- TailwindCSS 3.4.19
- Chart.js 4.4.4, React-Chartjs-2 5.2.0
- Static Export Mode (out/)

**Backend:**
- Cloudflare Workers (Serverless V8 Runtime)
- Hono 4.13.13 (Fast Web Framework)
- Cloudflare D1 (Distributed SQLite Database)

**Database:**
- Cloudflare D1 SQL Database (SQLite-based)
- Better-SQLite3 13.0.3 (local development)

**Authentication:**
- JWT (jose 5.9.3)
- Session-based với LocalStorage

**File Storage:**
- Cloudinary CDN (Images)
- Google Drive Workspace (PDF Documents)

**Deployment:**
- Cloudflare Workers (Global Edge Network)
- Static Assets CDN

---

## 2. PHÂN TÍCH CHỨC NĂNG VÀ MODULE

### 2.1. Danh sách các phân hệ chính

Hệ thống bao gồm **9 phân hệ chức năng chính**:

#### **1. Khung Quản Trị Chiến Lược 1-5-2** (`/1-5-2`)
- Bảng điều hành tổng quan
- 1 Mục đích xuyên suốt + 5 Trụ cột vận hành + 2 Nền tảng quản trị
- Popup tài liệu hạ tầng Google Drive
- Báo cáo nhanh (Định hướng, Điều hành)

#### **2. Quản Lý Máy Móc Thiết Bị (MMTB)** (`/maintenance`)
- Danh mục máy móc thiết bị (CRUD)
- Phiếu sửa chữa khẩn cấp
- Lịch bảo dưỡng định kỳ
- Quét QR Code tra cứu thiết bị
- Báo cáo BI: MTTA, MTTR, MTTD, Availability Rate
- Sơ đồ nhà máy interactive (Floor Plan)
- Import/Export Excel hàng loạt

#### **3. Sáng Kiến Cải Tiến (CI/Kaizen 4.0)** (`/work/kaizen`)
- Form đề xuất 5 bước (Nội bộ cán bộ)
- Form Public QR Code (Công nhân tại chuyền)
- Thuật toán AI so sánh trùng lặp (N-Gram + Cosine Similarity)
- Workflow phê duyệt 5 bước
- Leaderboard xếp hạng sáng kiến

#### **4. Theo Dõi Gemba Walk** (`/work/gemba`)
- Nhật ký đi Gemba của lãnh đạo
- Phát hiện bất thường tại xưởng
- Giao việc khắc phục

#### **5. Đăng Ký Công Tác (Business Trip)** (`/business-trip`)
- Tạo đăng ký lịch công tác
- Workflow phê duyệt
- Quản lý chứng từ hoàn ứng
- Phân quyền theo ngưỡng giá trị (>= 5M VND)

#### **6. Đặt Phòng Họp (Room Booking)** (`/rooms`)
- Lịch phòng họp real-time
- Kiểm tra trùng khung giờ tự động
- Bảng hiển thị lễ tân

#### **7. Kế Toán Quản Trị & Tài Chính** (`/finance`)
- Thu chi & tạm ứng
- Ngân sách & dự toán
- Công nợ
- Khấu hao tài sản
- Quản lý vật tư kho

#### **8. Quản Trị Nhân Sự** (`/hr`)
- Hồ sơ cán bộ công nhân viên
- Sơ đồ tổ chức
- Theo dõi tuyển dụng

#### **9. Cổng Quản Trị Hệ Thống** (`/admin`)
- Quản lý tài khoản người dùng
- Phân quyền RBAC
- Danh mục nhà máy, khu vực, chuyền

---

### 2.2. Ma trận chức năng theo vai trò

| Chức năng | SUPER_ADMIN | ADMIN | GIAM_DOC | TRUONG_PHONG | LEADER | CBCNV | Công nhân | Public |
|-----------|-------------|-------|----------|--------------|--------|-------|-----------|--------|
| Đăng nhập | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xem Dashboard 1-5-2 | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Quản lý User (Admin) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Xem MMTB | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Tạo Phiếu Sửa Chữa | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Phê duyệt Kaizen bước 1 | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Phê duyệt Kaizen bước 2 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Đăng ký Kaizen Public | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo Business Trip | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Phê duyệt Trip < 5M | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Phê duyệt Trip >= 5M | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Đặt phòng họp | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Quản lý Finance | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Xem HR | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ |

**Chú thích:**
- ✅ = Có quyền đầy đủ
- ⚠️ = Có quyền hạn chế (xem dữ liệu của nhà máy/phòng ban mình)
- ❌ = Không có quyền

---

### 2.3. Luồng nghiệp vụ chính

#### **Luồng 1: Đề xuất Sáng Kiến Kaizen (5 bước)**

```
[Tác giả] Nhập tiêu đề, nội dung sáng kiến
    ↓
[AI Engine] Kiểm tra trùng lặp (N-Gram + Cosine Similarity)
    ↓
    ├─→ Trên 80%: Cảnh báo ĐỎ → Xác nhận tiếp tục?
    ├─→ 50-80%: Cảnh báo VÀNG → Tham khảo đề xuất tương tự
    └─→ Dưới 50%: Xác nhận độc lập → Lưu vào DB
    ↓
[Bước 1] Sơ duyệt - Trưởng Ban CI / Thư ký
    ├─→ Không đạt: Từ chối / Trả về sửa
    └─→ Đạt: Chuyển bước 2
    ↓
[Bước 2] Duyệt Tính Khả Thi - Giám Đốc Nhà Máy
    ├─→ Không khả thi: Từ chối
    └─→ Khả thi: Chuyển bước 3
    ↓
[Bước 3] Triển Khai Thực Hiện Gemba
    ↓
[Bước 4] Đánh Giá Kết Quả & Chấm Điểm
    ↓
[Bước 5] Vinh Danh Leaderboard & Khen Thưởng
```

#### **Luồng 2: Xử Lý Phiếu Sửa Chữa MMTB**

```
[Công nhân/Quản lý chuyền] Báo máy hỏng
    ↓
Tạo phiếu (Status: pending)
    ↓
[Hệ thống] Tính SLA deadline theo mức ưu tiên
    ├─→ Khẩn cấp (Urgent): 2 giờ
    ├─→ Cao (High): 8 giờ
    ├─→ Trung bình (Normal): 24 giờ
    └─→ Thấp (Low): 72 giờ
    ↓
[Trưởng BP Bảo trì] Phân công KTV (Status: assigned)
    ↓
[KTV] Nhận việc (Status: in_progress, ghi acceptedAt)
    ↓
[KTV] Sửa chữa tại Gemba
    ├─→ Thay phụ tùng: Ghi nhận mã phụ tùng & số lượng
    └─→ Không thay: Tiếp tục
    ↓
[KTV] Hoàn thành (Status: completed, ghi completedAt)
    ↓
[Hệ thống] Tự động tính Downtime = completedAt - createdAt
    ↓
[Hệ thống] Cập nhật BI Report: MTTA, MTTR, MTTD
```

#### **Luồng 3: Lập Lịch Bảo Dưỡng Định Kỳ MMTB**

```
[Hệ thống] Quét định kỳ (cron job)
    ↓
Kiểm tra next_due_date của từng máy
    ├─→ Quá hạn: Đánh dấu overdue (cảnh báo đỏ)
    ├─→ Sắp đến hạn (7 ngày): Đánh dấu upcoming
    └─→ Đã lên lịch: Đánh dấu scheduled
    ↓
Phân công KTV phụ trách
    ↓
[KTV] Thực hiện kiểm tra Gemba
    ├─→ Phát hiện hư hỏng: Tự động tạo Phiếu Sửa Chữa
    └─→ Đạt tiêu chuẩn: Xác nhận nghiệm thu
    ↓
[Hệ thống] Cập nhật last_maintenance_date = Today
[Hệ thống] Tính next_due_date = Today + Chu kỳ
```

#### **Luồng 4: Đăng Ký & Phê Duyệt Công Tác**

```
[Nhân viên] Tạo đăng ký công tác
    ↓
Nhập địa điểm, mục đích, thời gian, danh sách người đi
    ↓
[Hệ thống] Kiểm tra ngưỡng giá trị ước tính
    ├─→ < 5M VND: Route đến Trưởng Phòng (L1)
    └─→ >= 5M VND: Route đến Giám Đốc (L2)
    ↓
[Người phê duyệt] Xem phiếu
    ├─→ Từ chối: Status = rejected
    └─→ Đồng ý: Status = approved
    ↓
[Nhân viên] Đi công tác & Nộp chứng từ hoàn ứng
    ↓
Status = completed
```

---

## 3. CƠ SỞ DỮ LIỆU

### 3.1. Thông tin kỹ thuật

- **Loại CSDL**: Cloudflare D1 (Distributed SQLite)
- **Tên database**: `vpchuoiskechers-db`
- **ORM**: SQLite Prepared Statements (backend), better-sqlite3 (local dev)
- **Migration tool**: SQL scripts trong `web/migrations/`
- **Số lượng migrations**: 17 files chính

### 3.2. Các bảng dữ liệu chính

#### **Nhóm Authentication & User**
- `SYSTEM_USERS` - Người dùng hệ thống
- `SYSTEM_ROLES` - Vai trò
- `TOKEN_BLACKLIST` - Token đã thu hồi
- `RATE_LIMIT` - Rate limiting theo IP

#### **Nhóm MMTB (Maintenance)**
- `maintenance_machines` - Danh mục máy móc
- `maintenance_tickets` - Phiếu sửa chữa
- `maintenance_schedule` - Lịch bảo dưỡng
- `maintenance_categories` - Danh mục (Nhà máy, Khu vực, Chuyền, Loại máy, Phụ tùng)
- `maintenance_parts_usage` - Sử dụng phụ tùng

#### **Nhóm CI/Kaizen**
- `ci_kaizen_proposals` - Đề xuất sáng kiến
- `kaizen_rankings` - Xếp hạng theo vùng

#### **Nhóm Business Trip**
- `business_trips` - Đơn công tác
- `business_trips_participants` - Người tham gia
- `business_trip_logistics` - Logistics (Xe, khách sạn, vé máy bay)
- `business_trip_payments` - Thanh toán
- `business_trip_files` - Files đính kèm

#### **Nhóm Room Booking**
- `meeting_rooms` - Phòng họp
- `room_bookings` - Đặt phòng

#### **Nhóm Notification**
- `notifications` - Thông báo
- `notification_preferences` - Tùy chọn thông báo
- `push_subscriptions` - Push notification subscription
- `notification_queue` - Hàng đợi gửi thông báo

#### **Nhóm Audit & Security**
- `AUDIT_LOGS` - Log kiểm toán
- `backup_audit_logs` - Backup của audit logs

#### **Khác**
- `152_STRATEGIC_INITIATIVES` - Sáng kiến chiến lược
- `GEMBA_WALK_LOGS` - Nhật ký Gemba Walk
- `pph_production_data` - Dữ liệu sản xuất

### 3.3. Schema SQL quan trọng

**Ví dụ: Bảng `maintenance_tickets`**
```sql
CREATE TABLE maintenance_tickets (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    machine_id TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    priority TEXT DEFAULT 'normal', -- 'urgent', 'high', 'normal', 'low'
    assigned_employee_id TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    completed_at DATETIME,
    downtime_minutes REAL DEFAULT 0,
    FOREIGN KEY(machine_id) REFERENCES maintenance_machines(id)
);
```

**Ví dụ: Bảng `ci_kaizen_proposals`**
```sql
CREATE TABLE ci_kaizen_proposals (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Sản xuất',
    factory TEXT NOT NULL,
    region TEXT NOT NULL,
    proposer_name TEXT NOT NULL,
    proposer_code TEXT,
    department TEXT,
    current_state TEXT,
    solution TEXT,
    expected_benefit TEXT,
    image_before TEXT,
    image_after TEXT,
    status TEXT DEFAULT 'pending_preliminary',
    status_label TEXT DEFAULT 'Chờ sơ duyệt',
    preliminary_reviewer TEXT,
    preliminary_date TEXT,
    preliminary_note TEXT,
    feasibility_approver TEXT,
    feasibility_date TEXT,
    feasibility_note TEXT,
    evaluation_score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API ENDPOINTS

### 4.1. Nhóm Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Thông tin session hiện tại
- `POST /api/auth/refresh` - Làm mới token (nếu có)

### 4.2. Nhóm MMTB (Maintenance)
- `GET /api/maintenance/machines` - Danh sách máy móc
- `POST /api/maintenance/machines` - Tạo/cập nhật máy móc
- `POST /api/maintenance/machines/import-excel` - Import Excel
- `GET /api/maintenance/tickets` - Danh sách phiếu
- `POST /api/maintenance/tickets` - Tạo/cập nhật phiếu
- `GET /api/maintenance/schedule` - Lịch bảo dưỡng
- `GET /api/maintenance/categories` - Danh mục
- `GET /api/maintenance/overview-report` - Báo cáo BI

### 4.3. Nhóm CI/Kaizen
- `GET /api/ci-kaizen` - Danh sách đề xuất
- `POST /api/ci-kaizen` - Tạo đề xuất
- `PUT /api/ci-kaizen/:id` - Cập nhật đề xuất
- `DELETE /api/ci-kaizen/:id` - Xóa đề xuất
- `POST /api/ai/compare-kaizen` - AI so sánh trùng lặp

### 4.4. Nhóm Business Trip
- `GET /api/business-trips` - Danh sách đơn công tác
- `POST /api/business-trips` - Tạo đơn
- `PUT /api/business-trips/:id` - Cập nhật
- `DELETE /api/business-trips/:id` - Xóa

### 4.5. Nhóm Room Booking
- `GET /api/room-bookings` - Danh sách đặt phòng
- `POST /api/room-bookings` - Đặt phòng
- `PUT /api/room-bookings/:id` - Cập nhật
- `DELETE /api/room-bookings/:id` - Hủy đặt

### 4.6. Nhóm Notification
- `GET /api/notifications` - Danh sách thông báo
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `DELETE /api/notifications/:id` - Xóa thông báo

---

## 5. TÍCH HỢP BÊN NGOÀI

### 5.1. Cloudinary
- **Mục đích**: Lưu trữ hình ảnh (Kaizen before/after, MMTB)
- **API**: Upload thông qua Cloudinary Upload API
- **Config**: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- **Folder**: `vpchuoiskechers/`

### 5.2. Google Drive Workspace
- **Mục đích**: Lưu trữ file PDF hạ tầng, biểu mẫu
- **API**: Google Drive API v3
- **Service Account**: `tbs-backup-sa@photocloudapp-465001.iam.gserviceaccount.com`
- **Config**: GDRIVE_CLIENT_EMAIL, GDRIVE_PRIVATE_KEY

### 5.3. Zalo Bot (nếu có)
- **Mục đích**: Gửi thông báo qua Zalo
- **Config**: ZALO_BOT_TOKEN (trong wrangler.jsonc hoặc Secrets)

### 5.4. Firebase (nếu có)
- **Mục đích**: Push notifications
- **Config**: `web/.env.local` chứa FIREBASE_* keys

---

## 6. VAI TRÒ NGƯỜI DÙNG

### 6.1. Danh sách vai trò

| Mã Role | Tên Hiển Thị | Role Level | Quyền chính |
|---------|--------------|------------|-------------|
| SUPER_ADMIN | Quản trị viên tối cao | 1 | Full quyền hệ thống |
| ADMIN | Quản trị viên | 2 | Quản lý user, cấu hình hệ thống |
| GIAM_DOC | Giám đốc | 2 | Phê duyệt cấp cao, xem báo cáo toàn bộ |
| TRUONG_PHONG | Trưởng phòng | 3 | Phê duyệt phòng ban, quản lý team |
| LEADER | Tổ trưởng/Nhóm trưởng | 4 | Quản lý nhóm, phê duyệt thấp |
| CBCNV | Cán bộ công nhân viên | 5 | Tạo đề xuất, đăng ký công tác, xem dữ liệu |
| KTV_BAOTRI | Kỹ thuật viên bảo trì | 5 | Nhận & xử lý phiếu MMTB |
| CONG_NHAN | Công nhân | 6 | Báo hỏng máy, đăng ký Kaizen công khai |

### 6.2. Phạm vi dữ liệu (Data Scoping)

- **SUPER_ADMIN / ADMIN / GIAM_DOC**: Xem tất cả nhà máy
- **TRUONG_PHONG / LEADER**: Xem nhà máy thuộc phạm vi quản lý (REAL_FACTORIES)
- **CBCNV / KTV_BAOTRI**: Xem nhà máy của mình
- **CONG_NHAN**: Xem dữ liệu công khai

**Cơ chế scoping trong SQL:**
```sql
-- Ví dụ query có scoping
SELECT * FROM maintenance_machines 
WHERE factory_id IN (
  SELECT factory_id FROM user_factory_access 
  WHERE user_id = :currentUserId
);
```

---

## 7. CÁC ĐIỂM CHƯA RÕ / MÂU THUẪN / RỦI RO

### 7.1. Bảo mật

#### ❌ **RỦI RO 1: Authentication Bypass đã được sửa (SECURITY_REPORT.md)**
- **Mô tả**: Hàm `parseSessionWorker()` trước đây trả về admin mặc định khi token null.
- **Trạng thái**: ✅ **ĐÃ SỬA** (trả về null thay vì admin)
- **Tác động**: Đã loại bỏ rủi ro bypass authentication
- **Khuyến nghị**: Cần kiểm thử lại sau khi deploy

#### ⚠️ **RỦI RO 2: JWT_SECRET và secrets hardcoded**
- **Mô tả**: Các secret bị hardcode trong `wrangler.jsonc`
- **Tác động**: Lộ secret nếu file config bị leak
- **Trạng thái**: ⚠️ **CHƯA SỬA** (cần di chuyển sang Cloudflare Secrets)
- **Khuyến nghị**: **KHẨN CẤP** - Di chuyển tất cả secrets sang `wrangler secret put`

#### ⚠️ **RỦI RO 3: IDOR (Insecure Direct Object Reference)**
- **Mô tả**: Một số endpoint DELETE/PUT không kiểm tra ownership
- **Ví dụ**: User A có thể xóa đề xuất Kaizen của User B
- **Trạng thái**: ⚠️ **CHƯA SỬA**
- **Khuyến nghị**: **CAO** - Thêm ownership check trước mọi operation DELETE/PUT

#### ⚠️ **RỦI RO 4: Không có Rate Limiting**
- **Mô tả**: Endpoint `/api/auth/login` không có rate limit
- **Tác động**: Dễ bị brute force attack
- **Trạng thái**: ⚠️ **CHƯA SỬA**
- **Khuyến nghị**: **TRUNG BÌNH** - Implement rate limiting (max 10 attempts/5 phút)

### 7.2. Chức năng

#### ⚠️ **CHƯA RÕ 1: Data Isolation theo Nhà Máy**
- **Vấn đề**: Không rõ WORKER có xem được dữ liệu của tất cả nhà máy hay chỉ nhà máy mình?
- **Hiện trạng**: Backend không có department-level filtering rõ ràng
- **Câu hỏi cho stakeholder**: 
  - CBCNV/WORKER có được xem incidents của nhà máy khác không?
  - Dữ liệu MMTB có được phân tách theo nhà máy không?

#### ⚠️ **CHƯA RÕ 2: Offline Mode cho Mobile**
- **Vấn đề**: Không rõ mobile app có hỗ trợ offline reporting không?
- **Tác động**: Nếu mạng yếu tại xưởng, công nhân không thể báo cáo
- **Câu hỏi cho stakeholder**: Mobile app có cần queue offline incidents không?

#### ⚠️ **CHƯA RÕ 3: SLA Threshold**
- **Vấn đề**: SLA deadline trong code:
  - Urgent: 2h
  - High: 8h
  - Normal: 24h
  - Low: 72h
- **Câu hỏi cho stakeholder**: Các ngưỡng này có đúng với thực tế sản xuất không?

#### ⚠️ **CHƯA RÕ 4: Business Trip Threshold**
- **Vấn đề**: Ngưỡng 5M VND để route lên Giám Đốc
- **Câu hỏi cho stakeholder**: Giá trị này có phù hợp không? Có cần điều chỉnh theo từng loại công tác không?

#### ⚠️ **MÂU THUẪN 1: Phê duyệt Kaizen**
- **Vấn đề**: Không rõ ai có quyền phê duyệt bước 1 (Sơ duyệt):
  - README nói: "Trưởng Ban / Thư ký CI"
  - Code có check role: `TRUONG_PHONG` hoặc `LEADER`?
- **Câu hỏi cho stakeholder**: Vai trò nào được phép sơ duyệt Kaizen?

### 7.3. Rủi ro kỹ thuật

#### ⚠️ **RỦI RO 5: Performance khi số lượng dữ liệu lớn**
- **Vấn đề**: Database không có indexes rõ ràng
- **Tác động**: Query chậm khi có hàng nghìn incidents/machines
- **Khuyến nghị**: **TRUNG BÌNH** - Thêm indexes trên:
  - `maintenance_tickets (status, priority, created_at)`
  - `ci_kaizen_proposals (status, factory, created_at)`
  - `maintenance_machines (factory_id, status_id)`

#### ⚠️ **RỦI RO 6: Không có backup strategy rõ ràng**
- **Vấn đề**: Cloudflare D1 có tự động backup không?
- **Tác động**: Mất dữ liệu nếu có sự cố
- **Khuyến nghị**: **CAO** - Xác nhận backup policy và test restore

#### ⚠️ **RỦI RO 7: Notification không được gửi**
- **Vấn đề**: Nhiều workflow phụ thuộc vào notification (Kaizen phê duyệt, MMTB assign)
- **Hiện trạng**: Notification backend có nhưng chưa verify delivery
- **Tác động**: Workflow bị gián đoạn nếu notification fail
- **Khuyến nghị**: **CAO** - Implement notification retry & audit log

---

## 8. KẾT LUẬN BƯỚC 1

### 8.1. Tóm tắt hiểu biết

- ✅ Đã nắm được kiến trúc tổng thể: Next.js + Cloudflare Workers + D1
- ✅ Đã liệt kê được 9 phân hệ chính và vai trò người dùng
- ✅ Đã phân tích được 4 luồng nghiệp vụ quan trọng
- ✅ Đã xác định được cấu trúc database (17 nhóm bảng chính)
- ✅ Đã liệt kê được API endpoints theo nhóm chức năng
- ⚠️ Đã xác định được 7 rủi ro bảo mật/chức năng cần làm rõ

### 8.2. Các câu hỏi cần xác nhận với stakeholder

1. **Data Isolation**: WORKER xem được dữ liệu của tất cả nhà máy hay chỉ nhà máy mình?
2. **Offline Mode**: Mobile app có cần hỗ trợ offline incident reporting không?
3. **SLA Thresholds**: Các ngưỡng SLA (2h/8h/24h/72h) có đúng không?
4. **Business Trip Threshold**: Ngưỡng 5M VND có phù hợp không?
5. **Kaizen Approval**: Vai trò nào được sơ duyệt Kaizen bước 1?
6. **Deployment Timeline**: Ngày dự kiến Go-Live là bao giờ?
7. **Security Priority**: Có cần fix urgent tất cả security issues trước khi test không?

### 8.3. Đề xuất hành động tiếp theo

#### **Ngay lập tức (trước khi test)**
1. ✅ Xác nhận với dev team: VULN-02, VULN-03 đã được di chuyển sang Secrets chưa?
2. ✅ Kiểm tra xem VULN-01 (Auth Bypass) đã được deploy lên production chưa?
3. ❓ Hỏi stakeholder về 7 câu hỏi trên

#### **Chuẩn bị cho Bước 2 (Test Plan)**
1. Lập danh sách test case dựa trên 9 phân hệ
2. Xác định test data cần chuẩn bị
3. Xác định môi trường test (local dev / staging / production)

---

**CHUYỂN SANG BƯỚC 2: LẬP TEST PLAN**

👉 Anh có muốn tôi tiếp tục sang Bước 2 ngay không, hay cần tôi làm rõ thêm điều gì ở Bước 1?
