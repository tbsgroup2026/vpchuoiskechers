# BÁO CÁO BƯỚC 0: CHUẨN BỊ & THIẾT LẬP KIỂM CHỨNG (PREPARATION REPORT)

**Dự án**: Hệ thống Quản trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group  
**Người thực hiện**: Senior QA / Test Architect (Độc lập)  
**Ngày thực hiện**: 12/10/2026  
**Nhánh kiểm thử**: `fix/qa-step1-findings` (HEAD: `e0927d35`)  
**So sánh với**: `main` (HEAD: `85475f8f`)  

---

## 1. TRẠNG THÁI BRANCH VÀ GIT LOG

### 1.1. Hiện trạng nhánh
- Khi bắt đầu, lệnh `git branch -a` và `git show-ref` xác nhận: **Nhánh `fix/qa-step1-findings` CHƯA TỒN TẠI trên repository**.
- Nhánh chứa bản vá mới nhất của Dev là `fix/remove-auth-fallback` (HEAD commit `e0927d35`), kế thừa từ `audit/staging-binding-isolation` (`b50cd8a1`).
- **Hành động QA**: Đã khởi tạo và checkout nhánh `fix/qa-step1-findings` trực tiếp từ commit `e0927d35` để bảo toàn lịch sử và phục vụ quy trình kiểm chứng.

### 1.2. Danh sách Commit từ `main` đến `fix/qa-step1-findings`
```text
e0927d35 fix(security): remove SUPER_ADMIN fallback, enforce requireAuth, and add regression tests
b50cd8a1 chore(config): explicitly isolate staging D1 and R2 bindings
594fcc5a feat(migration): migrate 100% media assets to Cloudflare R2 and update D1 URLs and loaders
bf3561ad fix(work): fix hydration errors 418/423, profile 401 auth, and malformed Cloudinary 404 URL
e22ccb00 Update booking form with MSNV lookup and department dropdown
0c597a5c feat(tasks): implement server-side pagination, N+1 query removal and DB index for Kanban board [Item (3)]
228bb0e0 fix(security): Phân quyền tài liệu liên phòng ban [Bảo mật]
e8859596 Fix .gitignore
b4c999f2 ignore sql files
04eaf882 wip: Remaining uncommitted files
98061fa7 wip: Work Hub tasks unfinished code
```

---

## 2. ĐỐI CHIẾU BÁO CÁO DEV (DEV CLAIM RECONCILIATION)

> [!WARNING]
> **Tệp `docs/fix-report.md` KHÔNG TỒN TẠI trong source code**.  
> QA đã tổng hợp các tuyên bố kỹ thuật của Dev dựa trên các tài liệu bàn giao trong repo (`TOM_TAT_SUA_LOI.md`, `SECURITY_REPORT.md`, `SECURITY_FIXES_URGENT_ACTIONS.md`, `DEPLOY_SECURITY_FIXES.md`), commit messages và mã nguồn thực tế.

| Task ID | Tên Lỗ Hổng / Hạng Mục | Dev tuyên bố đã sửa gì | Các file Dev đã thay đổi | Test Dev đã bổ sung | Đánh giá sơ bộ của QA |
|---|---|---|---|---|---|
| **T1** | Authentication Bypass | Bỏ fallback `202608001`, trả về `null` trong `parseSessionWorker()`, tạo helper `requireAuth()` trả 401 | `web/src/lib/require-auth.ts`<br>`web/src/app/api/tasks/route.ts`<br>`web/src/app/api/ci-kaizen/judging/reports/route.ts`<br>`web/src/app/api/ci-kaizen/approve/route.ts`<br>`web/src/app/api/ci-kaizen/route.ts`<br>`web/worker/index.js` | `web/src/app/api/__tests__/auth-required.test.ts`<br>`scripts/check-no-hardcoded-admin.js`<br>`scripts/check-no-hardcoded-admin.sh` | Cần xác minh kỹ `web/worker/index.js` vì còn tồn tại fallback ở các route khác (dòng 10071, 10121, 4848). |
| **T2** | Lộ Secrets Hardcoded | Chuyển secrets sang Cloudflare Secrets/Env vars, cô lập binding staging D1 & R2 riêng biệt trong `wrangler.jsonc` | `wrangler.jsonc`<br>`scripts/put_secrets.js`<br>`.staging-credentials.json` | `scripts/check-no-hardcoded-admin.sh` | Secrets cũ vẫn còn trong lịch sử git commit (`git log -p`), coi như ĐÃ BỊ LỘ nếu chưa revoke/rotate. |
| **T3** | IDOR / Phân quyền | Kiểm tra quyền sở hữu task trước khi DELETE (chỉ chủ thẻ hoặc roleLevel <= 2), bỏ header client `x-user-emp-code` | `web/src/lib/taskPermissions.ts`<br>`web/src/app/api/tasks/route.ts`<br>`web/src/lib/require-auth.ts` | `web/tests/task-permissions.test.js` | Mới áp dụng trên `/api/tasks` và một số route kaizen; các phân hệ khác (business-trips, rooms, maintenance) chưa thấy sửa IDOR. |
| **T4** | Rate Limiting Login | Tạo bảng `RATE_LIMIT` trong D1, giới hạn số lần thử đăng nhập sai | `web/migrations/0007b_create_rate_limit.sql`<br>`web/worker/index.js` | Chưa có automated unit test riêng cho rate limit | Cần kiểm chứng hành vi thực tế khi sai 10 lần liên tiếp và kiểm tra header IP spoofing. |
| **T5** | Data Scoping theo Nhà Máy | Áp dụng scoping theo factory/department cho MMTB và Task | `web/src/lib/services/taskScope.ts`<br>`web/migrations/0009_mmtb_data_scope.sql` | Chưa có test tự động | Bảng `user_factory_access` cần xác nhận có tồn tại trong schema D1 thật hay không. |
| **T6** | Index D1 Database | Tạo các index tăng tốc cho Kanban tasks và tickets | `web/migrations/0013_tasks_performance_indexes.sql` | Chưa có script benchmark | Cần chạy `EXPLAIN QUERY PLAN` để chứng minh query thực sự hit index. |
| **T7** | Notification Retry & Audit | Thiết lập bảng hàng đợi notification và ghi audit logs | `web/migrations/0016_notification_dispatcher.sql`<br>`web/migrations/0011_audit_logs_and_backup.sql` | `web/tests/dispatcher.test.js`<br>`web/tests/better_dispatcher.test.js` | Cần kiểm tra kịch bản provider timeout/500 và khả năng chống gửi trùng lặp. |

---

## 3. KẾT QUẢ CHẠY TEST GỐC CỦA DỰ ÁN (BASELINE TEST RUN)

### 3.1. Unit / Integration Tests (Vitest)
- **Lệnh thực thi**: `npx vitest run` tại thư mục `web/`
- **Kết quả tổng thể**:
  - **Test Files**: **14 PASSED**, **5 FAILED** (Tổng số: 19 file)
  - **Tests**: **175 PASSED**, **11 FAILED** (Tổng số: 186 test)
- **Danh sách 5 test file FAILED và nguyên nhân gốc rễ**:
  1. `web/tests/security.test.ts`: `TypeError: fetch failed (connect ECONNREFUSED ::1:3001)` do test script mặc định kết nối vào server cục bộ cổng 3001 chưa khởi động.
  2. `web/tests/integration.test.ts`: `TypeError: fetch failed (connect ECONNREFUSED ::1:3001)` - cùng nguyên nhân server 3001.
  3. `web/tests/idor.test.ts`: `TypeError: fetch failed (connect ECONNREFUSED ::1:3001)` - cùng nguyên nhân server 3001.
  4. `web/tests/rbac.test.ts`: `TypeError: generateTestToken is not a function` và `ECONNREFUSED ::1:3001` (lỗi cú pháp import helper test).
  5. `web/src/lib/hrConfig.guard.test.ts`: `AssertionError: PIT_BRACKETS: expected 'CHƯA XÁC MINH' to match /^https?:\/\//` (hằng số pháp lý có ghi chú chưa xác minh).
- **Test File mới của Dev**:
  - `web/src/app/api/__tests__/auth-required.test.ts`: **8/8 PASSED** (Xác minh cơ chế 401 cho anonymous request và 403 cho staff trên route admin).

### 3.2. TypeScript Typecheck
- **Lệnh thực thi**: `npx tsc --noEmit` tại thư mục `web/`
- **Kết quả**: **FAILED** (Exit code: 1, 140+ lỗi type trong `CIModule.tsx`, `DepartmentDashboardView.tsx`, `rooms/page.tsx`, `maintenance/page.tsx`, `rbac.test.ts`).
- **Ghi chú kiến trúc**: File `web/next.config.mjs` có cấu hình `typescript: { ignoreBuildErrors: true }` và `eslint: { ignoreDuringBuilds: true }`. Vì vậy lỗi typecheck không chặn build Next.js nhưng là nợ kỹ thuật lớn.

### 3.3. Static Export Build
- **Lệnh thực thi**: `npm run build` tại thư mục `web/`
- **Kết quả**: **SUCCESSFUL** (Exit code: 0).
- Tạo thành công 237 static HTML pages trong thư mục `web/out/` sẵn sàng deploy làm Cloudflare Worker Assets.

---

## 4. KIỂM TRA MIGRATION D1 CỤC BỘ & TÍNH IDEMPOTENT

- **Lệnh thực thi**: `npx wrangler d1 migrations apply DB --local`
- **Kết quả**: **FAILED NGAY LẦN CHẠY THỨ 1**
- **Chi tiết lỗi**:
  ```text
  X [ERROR] table zalo_bot_chat_history already exists at offset 13: SQLITE_ERROR
  ```
- **Phân tích lỗi**:
  - File `web/migrations/0000_schema_init.sql` dòng 2 sử dụng câu lệnh `CREATE TABLE zalo_bot_chat_history (...)` mà **KHÔNG CÓ** mệnh đề `IF NOT EXISTS`.
  - Trong cơ sở dữ liệu local `.wrangler/state/v3/d1`, bảng đã tồn tại nhưng bảng quản lý `d1_migrations` lại trống rỗng (`[]`).
  - Khi wrangler áp dụng migration, SQLite văng lỗi `SQLITE_ERROR` và dừng toàn bộ quá trình migration.
  - **Kết luận**: Migration **KHÔNG ĐẠT TÍNH IDEMPOTENT**. Không thể chạy lặp lại 2 lần liên tiếp an toàn mà không phát sinh lỗi.

---

## 5. KIỂM TRA PHẠM VI DIFF (SCOPE CREEP AUDIT)

So sánh giữa `main` (`85475f8f`) và `fix/qa-step1-findings` (`e0927d35`):
- **Quy mô diff**: **615 files thay đổi, +102,637 dòng thêm, -2,314 dòng xóa**.
- **Các phát hiện ngoài phạm vi 7 task bảo mật (Scope Creep Findings)**:

1. **FINDING-DIFF-01 (Nghiêm trọng - Rủi ro mất dữ liệu)**: File migration `web/migrations/0001_unified_tasks.sql` chứa các lệnh DROP TABLE nguy hiểm:
   ```sql
   DROP TABLE IF EXISTS project_members;
   DROP TABLE IF EXISTS tasks;
   DROP TABLE IF EXISTS projects;
   ```
   Nếu áp dụng lên database có sẵn dữ liệu, toàn bộ dữ liệu dự án và công việc sẽ bị xoá vĩnh viễn. Ngoài ra, việc đặt tên trùng tiền tố `0001_` với `0001_concurrency_rbac.sql` gây xung đột thứ tự migration trong Cloudflare D1.

2. **FINDING-DIFF-02 (Cấu trúc repo)**: Tệp `web/migrations/rollback_0015.sql` bị đặt trực tiếp trong thư mục `web/migrations/` thay vì thư mục con `rollbacks/`. Wrangler D1 nhận diện nhầm file rollback này là một migration tiến và cố gắng thực thi nó.

3. **FINDING-DIFF-03 (Phình to Git Repository)**: Toàn bộ thư mục build tĩnh `web/out/` (hơn 500 file HTML, JS chunk, CSS) đã bị commit trực tiếp vào git trong commit `594fcc5a`. Điều này vi phạm best practice quản lý mã nguồn (build output phải nằm trong `.gitignore`).

4. **FINDING-DIFF-04 (File rác/Backup trong source)**: Tệp `web/public/_worker.js.bak` nặng 16,461 dòng mã nguồn đã bị commit vào kho mã nguồn thay vì xoá bỏ.

5. **FINDING-DIFF-05 (Thay đổi tính năng ngoài phạm vi)**:
   - Thay đổi toàn diện cơ chế tải ảnh từ Cloudinary sang Cloudflare R2 (`web/src/lib/cloudinaryLoader.ts`).
   - Sửa đổi giao diện và luồng nghiệp vụ đặt phòng họp `web/src/app/book-room/page.tsx` (thêm tra cứu mã nhân viên MSNV và dropdown phòng ban).
   - Tái cấu trúc giao diện Kanban Task Board và Project Overview (`TaskBoardView.tsx`, `ProjectsOverviewPage.tsx`) với hơn 800 dòng mã thay đổi.

---

## 6. KẾT LUẬN BƯỚC 0 & KIẾN NGHỊ

1. Môi trường kiểm thử đã được thiết lập trên branch độc lập `fix/qa-step1-findings`.
2. Hệ thống build tĩnh hoạt động tốt, 14/19 test suites vitest sẵn sàng (5 test suite còn lại yêu cầu mock server hoặc tinh chỉnh môi trường chạy).
3. Cơ chế Migration D1 hiện tại **chưa an toàn** (thiếu `IF NOT EXISTS`, có chứa `DROP TABLE` trong `0001_unified_tasks.sql`).
4. Sẵn sàng bước vào **BƯỚC 1: KIỂM CHỨNG TỪNG TASK (T1 ĐẾN T7)**.
