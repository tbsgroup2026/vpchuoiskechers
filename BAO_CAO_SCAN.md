# BÁO CÁO KẾT QUẢ QUÉT HỆ THỐNG MÃ NGUỒN (SYSTEM SCAN REPORT)
**Hệ thống:** Nền tảng Quản Trị Vận Hành và Số Hóa Quy Trình Doanh Nghiệp TBS Group (Zone II)  
**Tên dự án mã nguồn:** `vpchuoiskechers` / `TBS II`  
**Đơn vị thực tập:** Công Ty CPĐT Thái Bình Kiên Giang – TBS Group (Zone II) – SKECHERS R&D Center  
**Thời điểm quét:** 15/10/2026  
**Người thực hiện:** Phạm Nguyễn Anh Huy (MSSV: 2224802010738)  

---

## 1. TỔNG QUAN CÔNG NGHỆ, FRAMEWORK & NỀN TẢNG

- **Kiến trúc chính:** Serverless Edge Computing kết hợp Static Site Generation (SSG) và Edge API Handlers.
- **Frontend Framework:**
  - Next.js 14.2.15 (App Router, Static Export `output: 'export'`)
  - React 18.3.1, TypeScript 5.x
  - Tailwind CSS 3.4.19 (Hệ thống thiết kế chuẩn thương hiệu TBS Group & Skechers)
  - Thư viện biểu đồ: Recharts 3.10.1 & Chart.js 4.4.4
  - Bộ icon: Tabler Icons React 3.19.0
  - Tiện ích xử lý dữ liệu: XLSX 0.18.5, JSZip 3.10.2, Pizzip 3.3.0, Jose 5.9.3 (JWT), QRCode 1.5.4
- **Backend Edge Platform:**
  - Cloudflare Workers (`web/public/_worker.js` với 17.000 dòng mã lệnh edge native)
  - Định tuyến RESTful API, Middleware bảo mật, Quản lý phiên và RBAC tại tầng biên (Edge)
  - Tích hợp Service Worker & Web Push API (chuẩn mã hóa VAPID)
- **Cơ sở dữ liệu & Lưu trữ phân tán:**
  - Cơ sở dữ liệu chính: Cloudflare D1 SQLite (`vpchuoiskechers-db`, ID: `ae3a7efd-ff5d-45c2-8c49-78d1518e3aa1`, 131 bảng dữ liệu)
  - Cơ sở dữ liệu vệ tinh liên kết: `thkiengiangshoes` (`176450d4-b81b-40d0-aee6-071ce67a626f`)
  - Lưu trữ đối tượng phân tán: Cloudflare R2 Buckets (`tbs-business-trips`, `tbs-img`)
- **Tích hợp bên ngoài:**
  - Google Drive API (Service Account RSA-2048: Sao lưu tự động Incremental & Full Snapshot)
  - Zalo Bot Notification API & Webhook (Đồng bộ mã kết nối, thông báo tiến độ)
  - TBS May Moc API (`tbs-may-moc-admin.tbs-quanlymaymoc.workers.dev`: Dữ liệu MMTB)
  - Cloudinary Image Storage

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
d:\Work\TBS II\
├── web/                           # Ứng dụng Web & Worker chính
│   ├── src/                       # Mã nguồn TypeScript/React (472 files, 144.560 dòng code)
│   │   ├── app/                   # Next.js App Router (108 route API, các trang nghiệp vụ)
│   │   │   ├── api/               # API routes (Auth, Tasks, CI-Kaizen, Gemba, PPH, Zalo...)
│   │   │   ├── work/              # Cổng làm việc trung tâm (/work, my-tasks, tasks, projects...)
│   │   │   ├── hr/                # Phân hệ Nhân sự & Cổng thông tin cá nhân (/hr/me/...)
│   │   │   ├── maintenance/       # Phân hệ Bảo trì MMTB, QR Gemba, Chart Lab
│   │   │   └── structure/         # Sơ đồ cơ cấu tổ chức TBS Group (Zone II)
│   │   ├── components/            # UI Components tái sử dụng (Header, Footer, Modals, Guards)
│   │   ├── modules/               # Các module nghiệp vụ chuyên sâu:
│   │   │   ├── tasks/             # My Tasks, Kanban Boards, Checklist, Assignment
│   │   │   ├── projects/          # Liên phòng ban, Tiến độ, Bottleneck Detector
│   │   │   ├── gemba/             # Gemba Walk, Checklist xưởng may, QR Audit
│   │   │   ├── ci/                # Sáng kiến Kaizen, Chấm điểm BGK, Xếp hạng
│   │   │   ├── hr/                # Định biên nhân sự, Điều chuyển, Phép năm
│   │   │   └── rd/                # Phân hệ R&D phát triển mẫu giày Skechers
│   │   ├── lib/                   # RBAC, Authorization Engine, Session, User Profiles, Crypto
│   │   └── constants/             # Hằng số hệ thống, cấu hình module
│   ├── public/                    # Assets tĩnh, ảnh KGLV thực tế & _worker.js (17.000 dòng)
│   ├── migrations/                # 19 file SQL migrations cho cơ sở dữ liệu Cloudflare D1
│   ├── out/                       # Bản build tĩnh xuất xưởng sẵn sàng deploy Edge
│   └── package.json               # Cấu hình gói và phụ thuộc
├── wrangler.jsonc                 # Cấu hình Cloudflare Workers, D1, R2, Cron triggers
├── scripts/                       # 46 scripts kiểm thử tự động, UAT, crawl ảnh, benchmark
├── tests/                         # Kịch bản kiểm thử bảo mật & tải hệ thống
└── docs/                          # Tài liệu kiến trúc, kiểm thử & ảnh chụp màn hình UAT
```

---

## 3. CÁC PHÂN HỆ & CHỨC NĂNG NGHIỆP VỤ CHÍNH

1. **Công việc cá nhân (Personal Tasks / My Tasks):**
   - Quản lý công việc cá nhân, lọc hạn chót, danh sách việc cần xử lý trong ngày.
   - Kéo thả Kanban, tạo nhanh task trong 5 giây, giao nhận việc và xác nhận bàn giao.
   - Nghiệm thu công việc: Bắt buộc nhập mô tả kết quả (>= 5 ký tự) khi chuyển trạng thái DONE.
2. **Bảng công việc phòng ban (Department Task Board):**
   - Mô hình Kanban chuẩn hóa theo luồng: `TO_DO -> DOING -> REVIEW -> DONE`.
   - Phân công thành viên, gắn nhãn (Labels), checklist con, đính kèm tệp tin.
   - Cơ chế kiểm soát tương tranh lạc quan (OCC) chống ghi đè dữ liệu đồng thời.
3. **Dự án liên phòng ban (Cross-Department Projects):**
   - Phối hợp đa phòng ban, theo dõi tiến độ tổng thể của các dự án số hóa và tự động hóa.
   - Thuật toán *Bottleneck Detector*: Tự động phát hiện cá nhân hoặc khâu đang bị nghẽn (>= 2 việc trễ hạn).
4. **Kiểm soát hiện trường GEMBA Walk:**
   - Số hóa quy trình kiểm tra Gemba Walk tại các xưởng may, xưởng hoàn thiện, kho vật tư.
   - Quét mã QR tại vị trí chuyền/máy, chấm điểm tiêu chuẩn 5S và an toàn lao động.
5. **Sáng kiến cải tiến liên tục (CI-Kaizen):**
   - Đăng ký ý kiến Kaizen trực tuyến, đính kèm ảnh hiện trạng trước và sau cải tiến.
   - Luồng duyệt sơ bộ, hàng đợi thẩm định tính khả thi của kỹ sư IE (Industrial Engineering).
   - Hội đồng giám khảo chấm điểm theo 5 tiêu chí chuẩn hóa, tự động xếp hạng Realtime.
6. **Quản lý sản lượng PPH nhà máy (Pieces Per Hour):**
   - Theo dõi sản lượng thực tế theo từng giờ của từng tổ/chuyền may so với kế hoạch.
   - Hệ thống mã màu 5 cấp độ trực quan hóa hiệu suất tức thời trên màn hình TV xưởng.
7. **Bảo trì máy móc thiết bị (MMTB):**
   - Số hóa yêu cầu sửa chữa, nhật ký vận hành máy may, máy ép đế, máy chặt tự động.
   - Chỉ số KPI so sánh 6 nhà máy, đo lường thời gian đáp ứng (MTTD, MTTR) và phân tích lỗi Pareto.
8. **Hệ thống quản trị 1-5-2:**
   - Bảng điều khiển quản trị chiến lược: 1 mục đích cốt lõi, 5 trụ cột phát triển, 2 ranh giới vận hành.
   - Xác thực bảo mật PIN riêng biệt cho lãnh đạo và cán bộ quản lý cấp cao.
9. **Nhân sự & Hành chính (HR & Admin):**
   - Quản lý cơ cấu định biên nhân sự, hồ sơ CBNV, điều chuyển nội bộ.
   - Đăng ký công tác xe công ty, quản lý và đặt lịch phòng họp trực tuyến.
10. **Kế hoạch chuẩn bị và trung tâm phân phối (Phân hệ Logistics):**
    - Điều phối chuỗi cung ứng vật tư, kế hoạch chuẩn bị sản xuất và kho thành phẩm SKECHERS.
11. **Thông báo đa kênh & Nhật ký bảo mật (Audit Log):**
    - Thông báo đẩy trình duyệt Web Push (VAPID) kết hợp tin nhắn Zalo Notification.
    - Ghi nhận lịch sử truy vết hệ thống (Audit Trail) và sao lưu định kỳ sang Google Drive.

---

## 4. SCHEMA CƠ SỞ DỮ LIỆU & PHÂN QUYỀN RBAC

- **Cơ sở dữ liệu Cloudflare D1 (`vpchuoiskechers-db`):** 131 bảng dữ liệu, các bảng cốt lõi gồm:
  - Quản trị người dùng & phân quyền: `sys_users`, `roles`, `permissions`, `role_permissions`, `role_workspace_config`, `user_profile`.
  - Quản lý công việc & dự án: `tasks`, `task_boards`, `task_board_columns`, `task_cards`, `task_card_checklist_items`, `task_reviews`, `projects`, `project_members`.
  - Nghiệp vụ Kaizen & Gemba: `ci_kaizen_proposals`, `ci_kaizen_evaluations`, `ci_kaizen_scores`, `gemba_records`, `gemba_attachments`.
  - Sản xuất & Thiết bị: `pph_entries`, `pph_org`, `machines`, `maintenance_tickets`, `production_metrics`.
  - Bảo mật & Giám sát: `sys_audit_logs`, `idempotency_keys`, `token_blacklist`, `push_subscriptions`.
- **Phân cấp bảo mật 7 tầng (RBAC Hierarchy):**
  1. *Super Admin / System Admin:* Toàn quyền cấu hình tham số, phân quyền và kiểm toán dữ liệu.
  2. *Ban Tổng Giám Đốc (CEO / Directors - Level 1 & 2):* Toàn quyền giám sát chỉ số, duyệt ngân sách và dự án.
  3. *Trưởng phòng ban (Managers / Dept Heads - Level 3):* Quản lý công việc phòng ban, duyệt nghiệm thu, chấm Kaizen.
  4. *Cán bộ nhân viên (CBCNV / Staff - Level 4):* Quản lý công việc cá nhân, đăng ký sáng kiến, báo cáo Gemba.
  5. *Kỹ sư IE & Quản lý chất lượng (IE / QC Specialist):* Thẩm định định mức công đoạn, kiểm tra chất lượng AQL.
  6. *Ban Giám Khảo Kaizen (Judge / Guest Scorer):* Chấm điểm độc lập theo tài khoản bảo mật.
  7. *Bộ phận Lễ tân & Hành chính (Receptionist):* Quản lý đăng ký xe, phòng họp và khách đến liên hệ.

---

## 5. ĐÁNH GIÁ MỨC ĐỘ HOÀN THIỆN & KẾT QUẢ KIỂM THỬ

- **Mức độ hoàn thiện:**
  - 100% các phân hệ nghiệp vụ cốt lõi đã hoàn thành xây dựng và tích hợp trên nền tảng Serverless Edge.
  - Pilot thành công trên 100 tài khoản người dùng thực tế với 8 giai đoạn hoàn chỉnh.
  - Triển khai chính thức lên Production tại địa chỉ: `https://vpchuoiskechers.tbsgroup2026.workers.dev`.
- **Kết quả kiểm thử tự động:**
  - **Kiểm thử tình huống người dùng (Pilot UAT):** 10/10 kịch bản đạt (100% PASS - `test_pilot_scenarios.mjs`).
  - **Kiểm thử ma trận phân quyền (Multi-Role QA):** 15/15 kịch bản đạt (100% PASS - `MULTI_ROLE_QA_REPORT.md`).
  - **Kiểm định bảo mật (Security Audit):** 14/14 điểm kiểm tra đạt (Đã vá toàn bộ lỗ hổng BOLA, IDOR, Auth Bypass và rò rỉ dữ liệu PII - `SYSTEM_QA_SECURITY_REPORT.md`).
  - **Kiểm tra tương thích mã nguồn:** 0 lỗi sót từ khóa cũ trong toàn bộ thư mục `web/src`.
