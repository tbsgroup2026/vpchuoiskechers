# DANH SÁCH LỖI MỚI VÀ LỖI CHƯA ĐƯỢC KHẮC PHỤC (BUG REPORT)

**Dự án**: Hệ thống Quản trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group  
**Người thực hiện**: Senior QA / Test Architect (Độc lập)  
**Ngày thực hiện**: 12/10/2026  
**Nhánh kiểm thử**: `fix/qa-step1-findings`  

---

### BUG-VERIFY-001: 83% API Routes Cho Phép Truy Cập Hoàn Toàn Ẩn Danh (Anonymous Access)
- **Bug ID**: `BUG-VERIFY-001`
- **Tiêu đề**: 90/108 Endpoint API không yêu cầu xác thực, trả về dữ liệu nội bộ nhạy cảm cho người dùng ẩn danh
- **Module**: Toàn hệ thống (API Gateway / Worker Routing)
- **Mức độ nghiêm trọng (Severity)**: **CRITICAL**
- **Độ ưu tiên (Priority)**: **P0 (Blocker)**
- **Bước tái hiện**:
  1. Sử dụng công cụ curl hoặc Postman:
     ```bash
     curl -i -H "x-forwarded-proto: https" http://127.0.0.1:8798/api/business-trips
     curl -i -H "x-forwarded-proto: https" http://127.0.0.1:8798/api/ci-kaizen
     curl -i -H "x-forwarded-proto: https" http://127.0.0.1:8798/api/employees
     curl -i -H "x-forwarded-proto: https" http://127.0.0.1:8798/api/hr/payroll
     curl -i -H "x-forwarded-proto: https" http://127.0.0.1:8798/api/maintenance/tickets
     ```
  2. Không đính kèm bất kỳ header `Authorization` hay Cookie nào.
- **Thực tế**: Server phản hồi `HTTP 200 OK` và trả về toàn bộ dữ liệu nhạy cảm (danh sách công tác, hóa đơn, danh bạ nhân sự, lương, phiếu bảo trì máy móc, sáng kiến Kaizen).
- **Mong đợi**: Phản hồi `HTTP 401 Unauthorized` kèm JSON lỗi `{ "success": false, "error": "UNAUTHORIZED" }` cho toàn bộ các route ngoại trừ whitelist đăng nhập và tra cứu QR Kaizen công khai.
- **Bằng chứng**: File kết quả kiểm thử `web/scratch/qa/t1-route-audit.json`, xác nhận 90 route không có kiểm tra session.
- **Đề xuất**: Bổ sung middleware `getAuthSessionWorker(request)` ở đầu hàm `handleRequest` trong `web/worker/index.js` cho tất cả các đường dẫn bắt đầu bằng `/api/`, chỉ cho phép các path thuộc whitelist công khai đi qua.

---

### BUG-VERIFY-002: Lộ Thông Tin Khóa Bí Mật Private Key Trong Source Code Và Bundle Tĩnh
- **Bug ID**: `BUG-VERIFY-002`
- **Tiêu đề**: Khóa Google Service Account và Firebase Service Account bị commit vào mã nguồn và nhúng vào bundle tĩnh
- **Module**: Bảo mật mã nguồn & Quản lý Secrets
- **Mức độ nghiêm trọng (Severity)**: **CRITICAL**
- **Độ ưu tiên (Priority)**: **P0 (Blocker)**
- **Bước tái hiện**:
  1. Kiểm tra thư mục gốc: mở tệp `gdrive-key.json` dòng 5.
  2. Kiểm tra thư mục web: mở tệp `web/firebase-service-account.json` dòng 5.
  3. Mở mã nguồn worker: `web/worker/index.js` dòng 7042, 7429, 15162.
  4. Mở bundle tĩnh đã build: `web/out/_worker.js` dòng 6250.
  5. Mở script cấu hình: `put_secrets.js` dòng 4, 7.
- **Thực tế**: Khóa RSA Private Key và JWT_SECRET được hardcoded trực tiếp dưới dạng chuỗi thô.
- **Mong đợi**: Toàn bộ secrets phải được nạp qua Cloudflare Worker Secret bindings (`env.JWT_SECRET`, `env.GDRIVE_PRIVATE_KEY`), không xuất hiện bất kỳ chuỗi khóa thô nào trong kho mã nguồn.
- **Bằng chứng**: Báo cáo quét `web/scratch/qa/secrets-findings.json`, commit log `bf3561ad` và `228bb0e0`.
- **Đề xuất**: 
  1. Xoá ngay lập tức `gdrive-key.json`, `firebase-service-account.json` khỏi git và đưa vào `.gitignore`.
  2. Xoá bỏ các chuỗi khóa dự phòng trong `web/worker/index.js`.
  3. Bắt buộc xoay (rotate) Service Account Key trên Google Cloud Console và Firebase Console vì các khóa này đã bị lộ trong lịch sử Git.

---

### BUG-VERIFY-003: Đăng Nhập Không Kiểm Tra Mật Khẩu & Không Có Rate Limiting
- **Bug ID**: `BUG-VERIFY-003`
- **Tiêu đề**: Endpoint `/api/auth/login` chấp nhận mọi mật khẩu sai và không giới hạn tần suất đăng nhập
- **Module**: Xác thực người dùng (`/api/auth/login`)
- **Mức độ nghiêm trọng (Severity)**: **CRITICAL**
- **Độ ưu tiên (Priority)**: **P0 (Blocker)**
- **Bước tái hiện**:
  1. Gửi request đăng nhập với mật khẩu sai bất kỳ:
     ```bash
     curl -i -X POST http://127.0.0.1:8798/api/auth/login \
       -H "Content-Type: application/json" \
       -H "x-forwarded-proto: https" \
       -d '{"empCode":"SA001","password":"sai_hoan_toan"}'
     ```
  2. Lặp lại request trên 15 lần liên tiếp.
- **Thực tế**: Server luôn trả về `HTTP 200 OK` kèm token hợp lệ và thông báo `"Đăng nhập thành công"`. Không có cơ chế kiểm tra mật khẩu hay chặn sau 10 lần sai.
- **Mong đợi**: 
  - Trả về `HTTP 401 Unauthorized` nếu mật khẩu không khớp với bảng `users`/`sys_users`.
  - Trả về `HTTP 429 Too Many Requests` kèm header `Retry-After` sau lần thử sai thứ 10 trong 5 phút.
- **Bằng chứng**: Đoạn mã xử lý tại `web/worker/index.js` dòng 8856 - 9143 hoàn toàn không có câu lệnh so sánh `password` với hash và không gọi D1 rate limit.
- **Đề xuất**: Bổ sung hàm kiểm tra mật khẩu (so sánh hash `users.password_hash`) và tích hợp middleware `checkRateLimit(clientIP, "/api/auth/login", 10, 300, env.DB)` vào đầu route `/api/auth/login`.

---

### BUG-VERIFY-004: Bypass Xác Thực Bằng Token Giả Mạo `alg: none` Và Token Legacy
- **Bug ID**: `BUG-VERIFY-004`
- **Tiêu đề**: Hàm `parseSessionWorker()` không xác minh chữ ký số của token JWT, cho phép mạo danh bất kỳ user nào
- **Module**: Quản lý phiên làm việc (`parseSessionWorker`)
- **Mức độ nghiêm trọng (Severity)**: **CRITICAL**
- **Độ ưu tiên (Priority)**: **P0 (Blocker)**
- **Bước tái hiện**:
  1. Tạo chuỗi JWT với header `{ "alg": "none" }` và payload `{ "empCode": "202608001", "roleCode": "SUPER_ADMIN", "roleLevel": 1 }`.
  2. Gửi request `GET /api/tasks` với header `Authorization: Bearer <alg_none_token>`.
  3. Hoặc gửi trực tiếp `Authorization: Bearer 202608001`.
- **Thực tế**: Server phân tích phần payload base64 mà không kiểm tra chữ ký (`web/worker/index.js` L149-166) hoặc lấy trực tiếp chuỗi sau `Bearer ` làm mã nhân viên (L178), từ đó gán toàn quyền Admin.
- **Mong đợi**: Server từ chối mọi token có `alg: none`, token không khớp HMAC chữ ký số bí mật (`env.JWT_SECRET`), và token không đúng chuẩn JWT (trả về 401).
- **Bằng chứng**: Báo cáo kiểm thử T1 xác nhận 14 route bị bypass bởi token sai chữ ký và token legacy.
- **Đề xuất**: Thay thế toàn bộ logic parse chuỗi thô trong `parseSessionWorker()` bằng thư viện `jose` hoặc Web Crypto API `crypto.subtle.verify` với `env.JWT_SECRET`. Loại bỏ triệt để đoạn mã cho phép đọc Bearer MSNV thô.

---

### BUG-VERIFY-005: Lỗ Hổng Leo Quyền Và IDOR Trên Toàn Bộ Module Quản Trị
- **Bug ID**: `BUG-VERIFY-005`
- **Tiêu đề**: Nhân viên thường (CBCNV) truy cập thành công API Quản trị hệ thống (`/api/admin/*`)
- **Module**: Phân quyền RBAC (`/api/admin/*`)
- **Mức độ nghiêm trọng (Severity)**: **HIGH**
- **Độ ưu tiên (Priority)**: **P1**
- **Bước tái hiện**:
  1. Đăng nhập bằng tài khoản CBCNV (`202608002`).
  2. Gọi `GET /api/admin/workspace-config`.
  3. Gọi `GET /api/admin/permissions`.
- **Thực tế**: Cả 2 request đều trả về `HTTP 200 OK`. Riêng endpoint permissions tự động fallback trả về quyền hạn Trưởng phòng IT & CĐS của tài khoản `202608001`.
- **Mong đợi**: Server trả về `HTTP 403 Forbidden` do tài khoản không có quyền cấp `ADMIN` hoặc `SUPER_ADMIN`.
- **Bằng chứng**: Log thực thi `web/scratch/qa/t3-results.json` (`T3-RBAC-01`, `T3-RBAC-02`).
- **Đề xuất**: Bổ sung bộ lọc kiểm tra vai trò: `if (session.roleLevel > 2 && session.roleCode !== 'ADMIN') return new Response('Forbidden', { status: 403 });` cho tất cả các route `/api/admin/*`.

---

### BUG-VERIFY-006: Thiếu Bảng Phân Quyền Nhà Máy `user_factory_access`
- **Bug ID**: `BUG-VERIFY-006`
- **Tiêu đề**: Bảng `user_factory_access` không tồn tại, API không giới hạn phạm vi dữ liệu theo nhà máy
- **Module**: Cơ sở dữ liệu D1 & Scoping Dữ Liệu
- **Mức độ nghiêm trọng (Severity)**: **HIGH**
- **Độ ưu tiên (Priority)**: **P1**
- **Bước tái hiện**:
  1. Thực thi truy vấn `SELECT name FROM sqlite_master WHERE name='user_factory_access'` trên database D1.
  2. Gọi `GET /api/ci-kaizen` với tài khoản nhân viên nhà máy Kiên Giang.
- **Thực tế**:
  - Bảng không tồn tại trong DB.
  - API trả về danh sách Kaizen của tất cả các nhà máy trên toàn quốc.
- **Mong đợi**:
  - Bảng `user_factory_access` phải tồn tại để quản lý quan hệ user - nhà máy.
  - API phải tự động thêm điều kiện lọc `WHERE factory IN (SELECT factory_id FROM user_factory_access WHERE user_id = ?)` đối với cấp CBCNV/KTV.
- **Bằng chứng**: Kết quả kiểm tra SQLite master rỗng, mã nguồn `web/worker/index.js` L4210 `SELECT * FROM ci_kaizen_proposals LIMIT 500`.
- **Đề xuất**: Tạo migration bổ sung bảng `user_factory_access` và cập nhật logic truy vấn dữ liệu theo vai trò và nhà máy.

---

### BUG-VERIFY-007: Thiếu 3 Database Index Gây Full Table Scan Trên Dữ Liệu Lớn
- **Bug ID**: `BUG-VERIFY-007`
- **Tiêu đề**: Thiếu các chỉ mục bắt buộc trên `ci_kaizen_proposals`, `sys_notifications` và `tickets`
- **Module**: Tối ưu hóa Database D1
- **Mức độ nghiêm trọng (Severity)**: **MEDIUM**
- **Độ ưu tiên (Priority)**: **P2**
- **Bước tái hiện**:
  1. Chạy `EXPLAIN QUERY PLAN SELECT * FROM ci_kaizen_proposals WHERE status = 'CHO_DUYET' AND factory = 'TB1';`.
  2. Chạy `EXPLAIN QUERY PLAN SELECT * FROM sys_notifications WHERE target_user = '202608001';`.
- **Thực tế**: Cả hai câu truy vấn đều báo cáo `SCAN` (quét toàn bộ bảng từ đầu đến cuối).
- **Mong đợi**: Phải hiển thị `SEARCH ... USING INDEX`.
- **Bằng chứng**: Log lệnh `npx wrangler d1 execute DB --local` báo cáo `SCAN ci_kaizen_proposals` và `SCAN sys_notifications`.
- **Đề xuất**: Bổ sung migration tạo các index:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_kaizen_status_factory ON ci_kaizen_proposals(status, factory);
  CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON sys_notifications(target_user);
  ```

---

### BUG-VERIFY-008: Cấu Hình CORS Wildcard `*` Phản Hồi Cho Mọi Origin Lạ
- **Bug ID**: `BUG-VERIFY-008`
- **Tiêu đề**: Header `Access-Control-Allow-Origin: *` được áp dụng rộng rãi trên các API nhạy cảm
- **Module**: Bảo mật CORS & Network Gateway
- **Mức độ nghiêm trọng (Severity)**: **MEDIUM**
- **Độ ưu tiên (Priority)**: **P2**
- **Bước tái hiện**:
  1. Gửi request `GET /api/users` kèm header `Origin: https://malicious-attacker-website.com`.
- **Thực tế**: Server vẫn phản hồi `Access-Control-Allow-Origin: *`.
- **Mong đợi**: Chỉ cho phép các domain tin cậy thuộc TBS Group (`https://*.workers.dev`, `https://*.tbsgroup.vn`), từ chối hoặc không phản hồi ACAO cho domain lạ.
- **Bằng chứng**: Báo cáo kiểm thử bảo mật `SEC-CORS-01`.
- **Đề xuất**: Kiểm tra `request.headers.get("origin")` so với whitelist domain hợp lệ trước khi gán header ACAO.

---

### BUG-VERIFY-009: Thiếu Các Security Headers Cốt Lõi Trên Worker Responses
- **Bug ID**: `BUG-VERIFY-009`
- **Tiêu đề**: Thiếu các header bảo mật phòng vệ tầng giao vận và trình duyệt
- **Module**: Security Headers
- **Mức độ nghiêm trọng (Severity)**: **LOW**
- **Độ ưu tiên (Priority)**: **P3**
- **Bước tái hiện**:
  1. Gọi `GET /api/auth/me` và kiểm tra response headers.
- **Thực tế**: Thiếu hoàn toàn các header:
  - `X-Content-Type-Options: nosniff` (phòng chống MIME-sniffing)
  - `X-Frame-Options: DENY` (phòng chống Clickjacking)
  - `Strict-Transport-Security` (ép buộc HTTPS / HSTS)
- **Mong đợi**: Bổ sung đầy đủ các header này vào response mặc định của Worker.
- **Bằng chứng**: Báo cáo kiểm thử bảo mật `SEC-HEAD-01`, `SEC-HEAD-02`, `SEC-HEAD-03`.
- **Đề xuất**: Tích hợp hàm `getSecurityHeaders()` từ `web/src/lib/security.ts` vào tất cả các `new Response()` trong `web/worker/index.js`.

---

### BUG-VERIFY-010: 10 Lỗ Hổng Bảo Mật Dependency Trong Thư Viện Frontend (`npm audit`)
- **Bug ID**: `BUG-VERIFY-010`
- **Tiêu đề**: 1 Critical, 7 High vulnerabilities phát hiện trong `next@14.2.15`, `xlsx`, `postcss`, `braces`
- **Module**: Quản lý Thư viện Phụ thuộc (Dependencies)
- **Mức độ nghiêm trọng (Severity)**: **HIGH**
- **Độ ưu tiên (Priority)**: **P1**
- **Bước tái hiện**:
  1. Chạy lệnh `npm audit --audit-level=moderate` tại thư mục `web/`.
- **Thực tế**: Phát hiện 10 lỗ hổng bảo mật:
  - `next`: 1 Critical (DoS qua Server Actions, Server Components, SSRF, Cache Poisoning).
  - `xlsx`: High (Prototype Pollution và ReDoS trong SheetJS).
  - `postcss`: High (XSS via unescaped `</style>`, Path Traversal qua sourceMappingURL).
  - `braces`/`micromatch`: High (Stack exhaustion DoS).
- **Mong đợi**: Cập nhật các bản vá an toàn cho các dependencies không gây breaking change.
- **Bằng chứng**: Output báo cáo `npm audit` trong log kiểm thử Bước 3.
- **Đề xuất**: Nâng cấp Next.js và TailwindCSS theo lộ trình nâng cấp an toàn, thay thế SheetJS `xlsx` bằng giải pháp an toàn hơn hoặc cập nhật bản vá mới nhất.
