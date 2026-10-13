# BÁO CÁO KIỂM THỬ HỒI QUY 9 PHÂN HỆ (REGRESSION REPORT)

**Dự án**: Hệ thống Quản trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group  
**Người thực hiện**: Senior QA / Test Architect (Độc lập)  
**Ngày thực hiện**: 12/10/2026  
**Nhánh kiểm thử**: `fix/qa-step1-findings` (HEAD: `e0927d35`)  
**Môi trường kiểm thử**: Local Cloudflare Worker Runtime (`http://127.0.0.1:8798`, D1 Local, Miniflare)

---

## 1. TỔNG QUAN KẾT QUẢ HỒI QUY (EXECUTIVE REGRESSION SUMMARY)

| Phân Hệ | Tổng Test Cases | Happy Path | Negative Cases | Trạng Thái Phân Hệ | Nhận Xét & Đánh Giá |
|---|---|---|---|---|---|
| **1. Phân hệ 1-5-2** | 2 | 1 Pass | 1 Pass | ✅ **PASSED** | Dashboard gate mở tốt với role quản trị; PIN sai bị từ chối 400. |
| **2. MMTB (Máy móc Thiết bị)** | 4 | 2 Pass | 1 Pass (1 Calc) | ✅ **PASSED** | Lấy 4,497 máy móc, lịch bảo trì tốt; SLA downtime chuẩn 2.5h; danh mục sai trả 400. |
| **3. Kaizen (Cải tiến liên tục)** | 3 | 2 Pass | 1 Pass | ✅ **PASSED** | Leaderboard & stats hoạt động; AI duplicate check hoạt động; đơn rỗng trả 400. |
| **4. Gemba Walk (Hiện trường)** | 3 | 2 Pass | 1 Pass | ✅ **PASSED** | Dashboard & cây phân xưởng hoạt động; thiếu dữ liệu bắt buộc trả lỗi hợp lệ. |
| **5. Công Tác (Business Trips)** | 3 | 1 Pass | 2 Boundary Pass | ✅ **PASSED** | Danh sách công tác hoạt động; định tuyến biên < 5M (4,999,999) -> Trưởng phòng và >= 5M (5,000,000) -> Giám đốc chính xác. |
| **6. Đặt Phòng Họp (Rooms)** | 3 | 1 Pass | 2 Boundary Pass | ✅ **PASSED** | Lịch phòng hoạt động; biên tiếp nối (10:00-10:00) không trùng; biên giao nhau (09:00-10:30 & 10:00-11:00) báo trùng chuẩn. |
| **7. Tài Chính (Finance)** | 2 | 2 Pass | 0 | ✅ **PASSED** | Ngân sách mục tiêu và tạm ứng tài chính hoạt động bình thường. |
| **8. Nhân Sự (HR)** | 2 | 2 Pass | 0 | ✅ **PASSED** | Danh sách nhân viên mới (Onboarding) và đơn nghỉ phép (Leave) hoạt động bình thường. |
| **9. Quản Trị (Admin & RBAC)** | 2 | 2 Pass | 0 | ✅ **PASSED** | Cấu hình menu workspace và tra cứu nhật ký audit hoạt động bình thường. |
| **10. Cross-cutting (Unicode & Media)**| 1 | 1 Pass | 0 | ✅ **PASSED** | Tiếng Việt có dấu, ký tự đặc biệt hoạt động tốt; R2 loader chuyển đổi ảnh an toàn. |
| **TỔNG CỘNG** | **25** | **15 Pass** | **10 Pass** | ✅ **100% PASS** | Các tính năng cốt lõi của 9 phân hệ không bị phá vỡ sau bản vá. |

---

## 2. KẾT QUẢ KIỂM THỬ CHI TIẾT THEO TỪNG PHÂN HỆ

### 2.1. Phân hệ 1: Điều Hành 1-5-2
- **Happy Path (`M1-HP-01`)**: Gọi `GET /api/1-5-2/verify-gate` với session Admin/Giám đốc -> Server phản hồi `HTTP 200 OK` cho phép truy cập cổng điều hành 1-5-2.
- **Negative Case (`M1-NEG-01`)**: Gọi `POST /api/admin/module-152/verify-pin` với body `{ pin: "0000" }` sai -> Server phản hồi `HTTP 400 Bad Request` kèm mã lỗi `INVALID_PIN`.

### 2.2. Phân hệ 2: MMTB (Máy Móc Thiết Bị & Bảo Trì)
- **Happy Path 1 (`M2-HP-01`)**: Gọi `GET /api/maintenance/machines` -> Server phản hồi `HTTP 200 OK`, trả về danh sách 4,497 máy móc thiết bị nhà máy từ dữ liệu D1.
- **Happy Path 2 (`M2-HP-02`)**: Gọi `GET /api/maintenance/schedule` -> Server phản hồi `HTTP 200 OK` kèm danh sách lịch bảo dưỡng phân định theo upcoming/scheduled.
- **Negative Case (`M2-NEG-01`)**: Gọi `GET /api/maintenance/categories?type=INVALID_TYPE` -> Server phản hồi `HTTP 400 Bad Request` với thông báo `"Loại danh mục không hợp lệ"`.
- **SLA & Downtime Logic (`M2-CALC-01`)**:
  - Thời điểm tạo phiếu: `2026-10-12T08:00:00Z`
  - Thời điểm hoàn thành: `2026-10-12T10:30:00Z`
  - Công thức: $\text{Downtime} = \text{completedAt} - \text{createdAt} = 2.5\text{ giờ}$.
  - Kết quả: Khớp chính xác 100% với đặc tả SLA 2h/8h/24h/72h.

### 2.3. Phân hệ 3: Kaizen (Sáng Kiến Cải Tiến Liên Tục)
- **Happy Path 1 (`M3-HP-01`)**: Gọi `GET /api/ci-kaizen/stats` -> Server phản hồi `HTTP 200 OK`, cung cấp bảng xếp hạng thi đua và tổng hợp sáng kiến.
- **Happy Path 2 (`M3-HP-02`)**: Gọi `GET /api/ci-kaizen/check-duplicate?title=...` -> Server phản hồi `HTTP 200 OK`, thuật toán AI fuzzy so khớp hoạt động bình thường.
- **Negative Case (`M3-NEG-01`)**: Gọi `POST /api/ci-kaizen` với form rỗng -> Server phản hồi `HTTP 400 Bad Request` kèm lỗi `MISSING_FIELDS`.

### 2.4. Phân hệ 4: Gemba Walk (Nhật Ký Hiện Trường)
- **Happy Path 1 (`M4-HP-01`)**: Gọi `GET /api/gemba/dashboard` -> Server phản hồi `HTTP 200 OK` với các chỉ số KPI: tổng số, số đang xử lý, số hoàn thành.
- **Happy Path 2 (`M4-HP-02`)**: Gọi `GET /api/gemba/tree` -> Server phản hồi `HTTP 200 OK` trả về cấu trúc cây phân xưởng / chuyền may.
- **Negative Case (`M4-NEG-01`)**: Gọi `POST /api/gemba/records` thiếu xưởng/chuyền -> Server phản hồi `HTTP 400 Bad Request` kèm `VALIDATION_ERROR`.

### 2.5. Phân hệ 5: Công Tác (Business Trips & Phê Duyệt Chi Phí)
- **Giá Trị Biên 1 (`M5-BIEN-01`)**: Đơn công tác có kinh phí dự toán **4,999,999 VNĐ** (< 5 triệu) -> Định tuyến duyệt về **Trưởng Phòng**.
- **Giá Trị Biên 2 (`M5-BIEN-02`)**: Đơn công tác có kinh phí dự toán **5,000,000 VNĐ** (>= 5 triệu) -> Định tuyến duyệt lên **Giám Đốc**.
- **Happy Path (`M5-HP-01`)**: Gọi `GET /api/business-trips` -> Server phản hồi `HTTP 200 OK` danh sách công tác.

### 2.6. Phân hệ 6: Đặt Phòng Họp (Meeting Room Bookings)
- **Happy Path (`M6-HP-01`)**: Gọi `GET /api/rooms` -> Server phản hồi `HTTP 200 OK` trạng thái danh sách phòng họp và các booking hiện hữu.
- **Kiểm Tra Trùng Giờ Tiếp Nối (`M6-BIEN-01`)**: Khung giờ 1 (09:00 - 10:00) và Khung giờ 2 (10:00 - 11:00) có mốc biên trùng nhau `10:00` -> **KHÔNG BỊ COI LÀ TRÙNG LỊCH** (`overlap = false`).
- **Kiểm Tra Trùng Giờ Giao Nhau (`M6-BIEN-02`)**: Khung giờ 1 (09:00 - 10:30) và Khung giờ 2 (10:00 - 11:00) giao nhau 30 phút -> **BỊ PHÁT HIỆN TRÙNG LỊCH CHÍNH XÁC** (`overlap = true`).

### 2.7. Phân hệ 7: Tài Chính (Finance)
- **Happy Path 1 (`M7-HP-01`)**: `GET /api/finance/targets` -> `HTTP 200 OK`.
- **Happy Path 2 (`M7-HP-02`)**: `GET /api/finance/advance` -> `HTTP 200 OK`.

### 2.8. Phân hệ 8: Quản Lý Nhân Sự (HR Portal)
- **Happy Path 1 (`M8-HP-01`)**: `GET /api/hr/onboarding` -> `HTTP 200 OK`.
- **Happy Path 2 (`M8-HP-02`)**: `GET /api/hr/leave` -> `HTTP 200 OK`.

### 2.9. Phân hệ 9: Quản Trị Hệ Thống (Admin & RBAC)
- **Happy Path 1 (`M9-HP-01`)**: `GET /api/workspace/menu` -> `HTTP 200 OK` (cung cấp menu định tuyến cho giao diện).
- **Happy Path 2 (`M9-HP-02`)**: `GET /api/admin/audit-search` -> `HTTP 200 OK` (tra cứu sự kiện hệ thống).

### 2.10. Cross-cutting: Xử Lý Tiếng Việt Unicode & Media R2
- **Tiếng Việt (`XC-UNICODE-01`)**: Gửi chuỗi `"Cải tiến dây chuyền may giày Skechers D Lites - Nhà máy Kiên Giang #@!%&*()_+"` qua API check-duplicate -> Phản hồi `HTTP 200 OK`, chuỗi Unicode có dấu được mã hoá và giải mã toàn vẹn.
- **Media Asset Migration**: Tệp `web/src/lib/cloudinaryLoader.ts` đã chuyển hướng toàn bộ asset sang Cloudflare R2 bucket (`https://pub-4f6913e79588469588d95eecea9146ea.r2.dev`) an toàn, không còn phụ thuộc vào Cloudinary API Secret.

---

## 3. KIỂM TRA GIAO DIỆN FRONTEND & TÍNH ỔN ĐỊNH

1. **Static Export Build**:
   - Chạy lệnh `npm run build` tại thư mục `web/`: **Thành công 100% (Exit code: 0)**.
   - 237 trang HTML tĩnh được xuất ra thư mục `web/out/` sẵn sàng deploy lên Cloudflare Worker Assets.
2. **Khả năng phục hồi khi gặp lỗi xác thực (401/403 Circuit Breaker)**:
   - Module `web/src/lib/apiClient.ts` trang bị hàm `handleUnauthorized()`:
     - Dừng khẩn cấp toàn bộ các bộ đếm polling ngầm (`stopAllPolling()`).
     - Có cờ chặn `isRedirectingToLogin` ngăn chặn hiện tượng vòng lặp redirect vô tận (infinite redirect loop).
     - Điều hướng thân thiện về `/login?expired=1&redirect_uri=...`.
3. **Kết luận hồi quy**: **TÍNH NĂNG NGHIỆP VỤ CŨ HOẠT ĐỘNG ỔN ĐỊNH, KHÔNG BỊ PHÁ VỠ (NO REGRESSION DETECTED TRÊN CÁC LUỒNG CŨ)**.
