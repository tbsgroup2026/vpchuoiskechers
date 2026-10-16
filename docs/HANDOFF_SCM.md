# Bàn giao dự án TBS II (Văn phòng Chuỗi SKECHERS): trạng thái ngày 16/10/2026

Tài liệu cho agent tiếp quản (Antigravity). Đọc hết mục 1–4 trước khi sửa code hoặc deploy.
Spec gốc (nguyên văn yêu cầu của người dùng) của module "Kế hoạch chuẩn bị và trung tâm phân phối": `docs/SCM_SPEC.md`.

---

## 1. Nguồn code và môi trường

| Mục | Giá trị |
|---|---|
| **Nguồn đang chạy production** | Worktree `D:\Work\TBS-II-full`, nhánh `integrate/overview-dashboard` |
| Thư mục chính `D:\Work\TBS II` | Nhánh `feature/ttpp-demo`, còn nhiều thay đổi chưa commit. **Không phải nguồn production. Không deploy từ đây.** |
| Nhánh `main` | **Chưa merge** các thay đổi ở trên. Nếu deploy từ `main` sẽ mất hết các bản vá. Nên tạo PR `integrate/overview-dashboard` → `main` (hỏi người dùng trước). |
| Production | Cloudflare Worker `vpchuoiskechers`, D1 `vpchuoiskechers-db`, R2 `BUCKET` (`tbs-business-trips`) |
| Phiên bản production hiện tại | `2f1559f2` (SCM Bước 1) |
| Các phiên bản trước (để rollback) | `3d911bab` (Kho, vá duyệt Kaizen), `eab39530`, `de006078`, `67954c5f`, `37a45815`, `a64011bc`, `bcac83b7`, `709fc034`, `729bf0d2`, `ed838b46` |
| Rollback | `cd D:\Work\TBS-II-full && npx wrangler rollback` |

### Kiến trúc
- Next.js 14 build ra trang tĩnh (`output: 'export'`). **`web/src/app/api/*` KHÔNG chạy trên production.**
- Backend thật là `web/public/_worker.js` (khoảng 18k dòng). Wrangler bundle file này nên worker import được TypeScript, ví dụ `import { handleScmApi, runScmHourly } from "../src/modules/scm/server.ts"`.
- Cron (trong `wrangler.jsonc`):
  - `0 19 * * *`: đồng bộ Kaizen và backup (giữ nguyên);
  - `0 * * * *`: chỉ chạy việc của SCM.
  - `scheduled()` rẽ nhánh theo `event.cron`.
- Xác thực: JWT HS256 (`JWT_SECRET`), cookie HttpOnly `tbs_token`, kiểm tra bằng `verifyServerAuth(req, env)`.
- Tài khoản dev/control `202608001` (Phạm Nguyễn Anh Huy) bỏ qua kiểm tra quyền. Đây là yêu cầu của người dùng.
- Secret production: `JWT_SECRET`, `GEMBA_SHEET_SYNC_KEY`. Đặt bằng `wrangler secret put`, dùng bash với `< file`. Pipe từ PowerShell sẽ thêm ký tự xuống dòng vào secret.

### Build, kiểm tra, deploy
```bash
# worktree dùng junction node_modules (đã tạo sẵn). Nếu mất thì tạo lại:
cmd /c mklink /J "D:\Work\TBS-II-full\web\node_modules" "D:\Work\TBS II\web\node_modules"
cd D:\Work\TBS-II-full\web
npx tsc -p tsconfig.scm-check.json   # typecheck strict cho modules/scm và components/hub (next build đang tắt type-check)
npx vitest run src/modules/scm       # hiện 106 test đều đạt
npm run build
cd .. && npx wrangler deploy         # CHỈ khi người dùng đồng ý deploy
```
- `web/out/` được git theo dõi và sẽ thay đổi sau mỗi lần build. **Không commit `web/out`.**
- Migration production phải áp bằng tay: `npx wrangler d1 execute vpchuoiskechers-db --remote --file web/migrations/00xx.sql`.
  - Đã áp: 0014, 0015.
  - **Chưa áp: 0016.**
- Nếu build báo lỗi `EBUSY` trên `web/out`: có tiến trình `wrangler dev` đang chạy. Tắt nó trước khi build.

### Test ở máy (không đụng production)
- **TUYỆT ĐỐI không** chạy `wrangler dev` với `wrangler.jsonc` gốc: D1 đặt `"remote": true` nên sẽ ghi thẳng vào production.
- Có sẵn config test ở thư mục scratchpad của phiên trước: `C:\Users\Admin\AppData\Local\Temp\claude\d--Work-TBS-II\e2521a59-1f61-4f1a-9dbd-90168fd98be7\scratchpad\authtest\wrangler.fulltest.json`.
  - Chạy: `npx wrangler dev -c wrangler.fulltest.json --local --persist-to state5 --port 8806 --test-scheduled`.
  - Script test API: `scm_api_test.mjs` (34/34 đạt cho Bước 1).
  - Nếu thư mục này đã bị xóa, tạo config mới:
    - `main` trỏ tới `D:/Work/TBS-II-full/web/public/_worker.js`;
    - `assets` trỏ tới `web/out` với `run_worker_first: true`;
    - `vars`: `JWT_SECRET` là giá trị test tùy ý;
    - `d1_databases`: binding `DB`, **không có** `remote`;
    - `r2_buckets`: binding `BUCKET` (cần để test upload form).
- Tài khoản local:
  - `202608001` / `Admin@2026-Test` (dev);
  - `USR001` / `Usr@2026-Moi` (trưởng Kế hoạch);
  - `HR001` / `Wh@2026-Test` (trưởng Mua hàng);
  - `TEST001` / `Tbs@2026-Moi` (KD·CN·QC).
  - Các tài khoản này được gán trong `scm_dept_members` của D1 local.
- Seed (chỉ local): `node web/scripts/scm_seed_local.mjs > seed.sql`, rồi `npx wrangler d1 execute <db> --local --persist-to state5 --file seed.sql`. Tạo 24 đơn.
- Đăng nhập trên trình duyệt bằng `http://localhost:8806`. Không dùng `127.0.0.1` vì cookie Secure không hoạt động ở đó.

---

## 2. Ràng buộc từ người dùng (bắt buộc)
- **Không deploy production và không áp migration production khi chưa được đồng ý.** Làm xong mỗi bước SCM thì dừng để người dùng kiểm tra ("Xong thì dừng để tôi kiểm tra").
- Secret chỉ đặt bằng `wrangler secret put`. Không ghi vào `wrangler.jsonc`, không commit, không in ra.
- Không đọc hoặc in dữ liệu thật của production.
- Mọi thao tác ghi đều có audit log (ai, khi nào, trước, sau). Không log mật khẩu.
- `/work/kaizen/register` và các API nộp sáng kiến phải luôn công khai.
- Không làm hỏng các module đang chạy: Kaizen sync, Gemba, Backup & Audit Log, Task Board, 1-5-2.
- Quyền được kiểm tra ở server. Mọi bảng có tìm kiếm, lọc, sắp xếp, phân trang ở server.
- Mọi ngưỡng nằm trong `scm_settings`, không viết cứng.
- Giao diện tiếng Việt, responsive, ngày dd/mm/yyyy, múi giờ Asia/Ho_Chi_Minh.
- Thiết kế theo skill Taste ở chế độ "Redesign - Preserve" (VARIANCE 3, MOTION 2, DENSITY 6). Dùng lại style trang Nhân sự – Hành chính:
  - xanh `#006838` và cam `amber`;
  - thẻ `rounded-2xl`, nút dạng pill `rounded-full`;
  - không dùng dấu gạch dài em/en (–, —) trong chữ trên giao diện;
  - ô trạng thái phân biệt bằng độ sáng, viền và họa tiết, không chỉ bằng màu;
  - nút có `aria-label`;
  - đủ trạng thái loading (skeleton), trống, lỗi;
  - trên mobile, bảng chuyển thành dạng thẻ.
- Phân hệ dùng component chung `web/src/components/hub/Hub.tsx` (`HubSectionHeader`, `HubFeatureCard`, `HubQuickCard`, `SitePills`).

---

## 3. Đã hoàn thành (đã deploy production)

**Các module khác**
- **Bảo mật:**
  - Đăng nhập bằng mật khẩu thật và JWT có chữ ký.
  - Đã chặn: `/api/test-backup`, tải `/_worker.js`, giả danh bằng header `X-User-Emp-Code`.
  - Đăng nhập tìm tài khoản trong cả `sys_users`, `users` và `hr_employees`.
- **Tổng quan:** dashboard nằm trong thẻ Tổng quan của `/work`.
- **Menu bên trái:** khôi phục các nút cho 3 tài khoản CI (`userProfiles.ts`). Mọi người thấy phân hệ `logistics` (`lib/rbac.ts`).
- **Gemba:**
  - Đổi tên thành "Phân xưởng Mẫu".
  - Đồng bộ hai chiều với Google Sheet Gemba.Pro Kiên Giang: API `/api/gemba/sheet-sync` và `/api/gemba/sheet-changes` cùng `/ack`, khóa `X-Sheet-Key`.
  - Apps Script ở `integrations/gemba-pro/TBS_Sync.gs`.
  - Mỗi nhà máy có file sheet riêng. Miền Đông và Phân xưởng Mẫu chưa làm, đang chờ mẫu sheet.
- **Kho `/warehouse`:**
  - Vị trí Kho → Khu → Kệ → Tầng → Ô.
  - Import Excel/CSV; quét barcode bằng camera (dự phòng ZXing ở `web/public/vendor/`) và bằng súng bắn mã; in nhãn.
  - Kiểm hàng về và kiểm kê.
  - Quyền: chỉ Quản lý kho sửa được và cấp thêm người sửa vị trí.
  - Code: `web/src/app/warehouse/page.tsx`, `web/src/modules/warehouse/*`, `/api/warehouse/*` trong worker.

**SCM Bước 1 (migration 0015, phiên bản `2f1559f2`)**, code trong `web/src/modules/scm/`:
- `config.ts`:
  - 10 bước, kèm phòng phụ trách và phụ thuộc;
  - phòng ban: KH, MH, KHO, KDCNQC, SH, BDH;
  - 7 site: VPC, PXM, NMMD, KG1, KG2, KG3, HTD;
  - `DEFAULT_SETTINGS`, 4 pha M1-M4.
- `engine.ts`:
  - hạn chót = ngày xuất − (lead time + vận chuyển + sản xuất + BOM);
  - hạn dự kiến theo chuỗi bước;
  - trạng thái hoàn thành, đang làm, trễ, bị chặn, chờ, không áp dụng, do server tính;
  - `canComplete`, `undoCascade`, điểm nghẽn, mức leo thang.
- `permissions.ts`: ma trận Xem/Sửa/Khóa, `mapUserToDept` tự map theo Phòng Ban/VTCV, admin chỉnh tay được.
- `server.ts`:
  - API `/api/scm/*` (danh sách ở mục 4);
  - `runScmHourly`;
  - `writeAudit`: tự ghi `audit_logs` theo các cột thật sự có, vì repo đang có 2 schema `audit_logs` khác nhau.
- `ScmModule.tsx`:
  - Tổng quan module, URL `/work?dept=logistics&scm=<slug>`;
  - slug: `tien-do`, `ke-hoach`, `mua-hang`, `kho`, `kd-cn-qc`, `so-hoa`, `kpi`, `phan-quyen`.
- `ScmProgress.tsx`: Tiến độ chung (bảng, thẻ mobile, ngăn chi tiết, Gantt, xuất PDF).
- Bản DEMO logistics cũ đã gỡ khỏi giao diện (người dùng chọn "Thay hẳn DEMO").
- Thẻ Kho tạm mở thẳng `/warehouse`.
- Production **chưa có đơn hàng**: seed chỉ chạy ở local.

---

## 4. ĐANG LÀM DỞ: SCM Bước 2 (Kế hoạch & CCƯ, Mua hàng)

Trạng thái: **chưa commit, chưa deploy, migration 0016 chưa áp ở đâu.** Backend xong; typecheck strict đạt; 106 test đạt (kiểm tra ngày 16/10/2026).

### File đã viết (uncommitted, trong `D:\Work\TBS-II-full`)

**Sửa file có sẵn**
- `config.ts`: thêm ngưỡng `line_capacity_week` (9000) và `incident_escalate_day` (10).
- `schema.ts`:
  - 8 bảng mới: `scm_allocation_plans`, `scm_allocation_lines`, `scm_plant_capacity`, `scm_plan_changes`, `scm_purchase_orders`, `scm_inbound_plan`, `scm_incidents`, `scm_uploaded_forms`;
  - `SCM_ALTERS` thêm cột `bottleneck_note`, `bottleneck_by`, `bottleneck_at`, `eta_changed_from` vào `scm_orders`.
- `server.ts`:
  - gọi `handleScmStep2`;
  - chạy `SCM_ALTERS`;
  - hàm dùng chung `stepCompletion()`;
  - `notifyDept`;
  - env có thêm `BUCKET`;
  - bỏ qua parse JSON khi request là multipart;
  - `listItem` trả thêm `flag` (ghi chú điểm nghẽn);
  - cron gọi `escalateIncidents`.

**File mới**
- `web/migrations/0016_scm_planning_purchasing.sql` và `0016_scm_planning_purchasing_rollback.sql`.
- `planning.ts` (hàm thuần): `mondayOf`, `planWeeks`, `rankPriority`, `capacityByWeek`, `validatePlan`, `canIssue`, `rollForward`, `PLAN_TRANSITIONS`, `PLAN_STATUS`.
- `purchasing.ts` (hàm thuần): `orderConditions`, `poNumber` (`PO-YYMM-0001`), `expectedArrival`, `etaImpact`, `INCIDENT_PLANS`, `INCIDENT_STAGES`, `incidentDay`, `canEscalateIncident`, `nextIncidentStage`, `parseProcurementForm`.
  - `parseProcurementForm` chỉ là khung, trả `not_implemented`: đang chờ người dùng gửi mẫu form Mua hàng.
- `__tests__/planning-purchasing.test.ts`.
- `server-step2.ts`: các API liệt kê dưới đây. Mọi thao tác ghi đều kiểm tra quyền ở server và ghi audit.

### API Bước 2 (tiền tố `/api/scm/`)

**Kế hoạch (quyền Sửa: Kế hoạch)**

| Method | Path | Ghi chú |
|---|---|---|
| GET | `plans/current?site=&q=&filter=unallocated\|nosilent&page=&pageSize=` | Trả `plan`, `weeks`, `rows` (đã phân trang), `total`, `loads`, `errors`, `canIssue`, `changes`, `canEdit`, `canApprove` |
| POST | `plans` `{site}` | Tạo kế hoạch |
| PUT | `plans/:id/lines` `{orderId, week, plant, line}` | Chỉ khi DRAFT. `plant` rỗng thì bỏ phân bổ |
| POST | `plans/:id/move` `{orderId, fromWeek, toWeek, reason}` | `reason` tối thiểu 5 ký tự |
| PUT | `plans/:id/capacity` | |
| POST | `plans/:id/submit` | |
| POST | `plans/:id/approve` | Trưởng bộ phận hoặc bypass. Tự hoàn thành **bước 3** |
| POST | `plans/:id/reopen` | Bắt buộc lý do |
| POST | `plans/:id/issue` | Chặn nếu chưa duyệt hoặc tuần vượt năng lực. Tự hoàn thành **bước 4** |
| POST | `plans/:id/tier2` | |
| POST | `plans/:id/roll` | Thêm tuần mới, giữ 4 tuần |

**Mua hàng (quyền Sửa: Mua hàng)**

| Method | Path | Ghi chú |
|---|---|---|
| GET | `purchasing/conditions?site&q&status=ready\|missing\|issued&page` | |
| POST | `purchasing/orders/:id/activate` | Chỉ khi đủ điều kiện |
| POST | `purchasing/orders/:id/issue-po` | Hoàn thành **bước 6** (cần bước 2 và 5); tạo dòng nhập hàng |
| POST | `purchasing/orders/:id/report-bottleneck` | Ghi `bottleneck_note` |
| PUT | `purchasing/orders/:id/lead-time` | |
| PUT | `purchasing/orders/:id/eta` `{eta, reason}` | Trả ảnh hưởng; báo Kế hoạch nếu trễ |
| GET | `purchasing/inbound?site` | |
| POST | `purchasing/inbound/send` `{site}` | Hoàn thành **bước 7**; báo Kho |
| GET, POST | `purchasing/incidents` | |
| PUT | `purchasing/incidents/:id` `{plan, note}` | |
| POST | `purchasing/incidents/:id/next` | |
| POST | `purchasing/incidents/:id/escalate` | Từ ngày 10 |
| POST | `purchasing/incidents/:id/confirm` | Quyền Sửa Kho hoặc KD·CN·QC. Chỉ đóng sự cố được sau bước này |

**Form**

| Method | Path | Ghi chú |
|---|---|---|
| GET | `forms` | |
| POST | `forms` | Multipart, field `file`. Định dạng xlsx/xls/csv/pdf/docx, tối đa 10MB. Lưu R2 key `scm-forms/mua-hang/<ngày>/<id>-<tên>` |
| GET | `forms/:id/download` | |

**API có sẵn từ Bước 1, giao diện dùng lại**
- `POST orders`: nhận đơn.
- `PUT orders/:id/ship-date`.
- `POST orders/:id/steps/5/complete`: gửi No Silent.

### Việc còn lại của Bước 2 (làm theo thứ tự)
1. **Viết `web/src/modules/scm/ScmPlanning.tsx`** (spec mục 4.2):
   - **Site:** kế hoạch tính theo từng site. Nếu đang chọn "Tất cả" thì yêu cầu người dùng chọn một site.
   - **Thanh trạng thái** Nháp → Chờ duyệt → Đã duyệt → Đã ban hành, kèm các nút:
     - Gửi duyệt;
     - Trưởng bộ phận phê duyệt;
     - Mở lại nháp (bắt buộc nhập lý do);
     - **Ban hành Kế hoạch 312**: phần tử có `id="ke-hoach-312"`; khi `canIssue.ok` là false thì khóa nút và hiện lý do;
     - Chuyển Tầng 2;
     - Thêm tuần mới.
   - **Nút "+ Nhận đơn từ Kinh doanh":** form gọi `POST orders`.
   - **Bảng 4 tuần:**
     - cột ưu tiên, mã, số lượng, ngày xuất;
     - 4 ô tuần, sửa được khi kế hoạch ở trạng thái Nháp;
     - nút Gửi No Silent, Dời tuần (bắt buộc lý do), Đổi ngày xuất.
   - **Dòng tải / năng lực:** đánh dấu tuần vượt năng lực.
   - Tìm kiếm, lọc, phân trang dùng tham số của server.
   - Chuyển qua lại Tầng 1 / Tầng 2 (Tầng 2 chỉ xem, theo nhà máy·chuyền × tuần).
   - Nhật ký thay đổi.
2. **Viết `ScmPurchasing.tsx`** (spec mục 4.3):
   - Nút **"Tải form lên"** ở góc trên bên phải: `id="tai-form"`, có danh sách form và nút tải xuống.
   - Công cụ tính hạn chót:
     - hiển thị dạng "35 + 10 + 30 + 3 = 78 ngày";
     - dùng `infoDeadline` / `infoDeadlineFormula` trong `engine.ts`, kết hợp `me.settings`;
     - nút "Áp hạn chót cho đơn".
   - Bảng điều kiện:
     - lọc Đủ / Thiếu / Đã phát hành PO, có hiện số lượng;
     - nút Kích hoạt đặt hàng, Phát hành PO, Báo điểm nghẽn.
   - Kế hoạch nhập 4 tuần:
     - nút "Gửi kế hoạch cho Kho";
     - mỗi dòng có "NCC báo đổi ngày" và hiển thị ảnh hưởng.
   - Thẻ sự cố:
     - thanh ngày x/14 và dropdown phương án;
     - nút sang bước kế tiếp;
     - nút Leo thang, hiện từ ngày 10;
     - nút "+ Ghi nhận sự cố".
3. Cập nhật kiểu dữ liệu trong `client.ts`: các kiểu của Bước 2 và trường `flag` trong `OrderItem`.
4. Trong `ScmModule.tsx`, thay placeholder `Pending` của `ke-hoach` và `mua-hang` bằng 2 màn mới.
5. Trong `ScmProgress.tsx`, hiện `flag` ở cột "Đang vướng ở" và trong ngăn chi tiết.
6. **Lưu ý:**
   - Dữ liệu BOM, Wink, Giày mẫu lấy từ `scm_handover_items`, nhưng màn nhập liệu này thuộc Bước 3. Trước đó, mọi đơn đều hiện "Thiếu".
   - Để test ở local, seed thêm `scm_handover_items`, ví dụ trong `scm_seed_local.mjs`.
7. Test API Bước 2 trên local:
   1. Áp 0016 vào D1 local.
   2. Kiểm tra quyền: Kế hoạch, Mua hàng, KD·CN·QC, dev; vai không có quyền nhận 403.
   3. Luồng kế hoạch:
      - duyệt thì bước 3 hoàn thành;
      - ban hành thì bước 4 hoàn thành;
      - ban hành bị chặn khi tuần vượt năng lực;
      - dời tuần bắt buộc lý do.
   4. Luồng mua hàng:
      - phát hành PO thì bước 6 hoàn thành;
      - gửi kế hoạch nhập thì bước 7 hoàn thành.
   5. Sự cố: chỉ đóng được sau khi Kho xác nhận.
   6. Upload form lên R2 local.
   7. Có dòng audit cho mọi thao tác ghi.
8. Build. Xem giao diện ở 1440px và 390px. Commit (không commit `web/out`).
9. **Dừng, báo người dùng kiểm tra.** Khi được duyệt:
   1. Áp migration lên production: `npx wrangler d1 execute vpchuoiskechers-db --remote --file web/migrations/0016_scm_planning_purchasing.sql`.
   2. `npx wrangler deploy`.

---

## 5. Bước 3 và Bước 4 (chưa bắt đầu; xem `docs/SCM_SPEC.md`)
- **Bước 3: Kho và KD·CN·QC.**
  - Màn Kho nên dùng lại module `/warehouse` (vị trí, quét barcode). Không tạo bảng vị trí trùng.
  - Khi xong, bỏ đoạn code cho thẻ Kho mở thẳng `/warehouse`.
  - Cron chốt số liệu lúc 09:00 theo `scm_settings`: thêm vào `runScmHourly`.
  - Màn KD·CN·QC ghi `scm_handover_items` và hoàn thành bước 1, 2, 9.
  - Thêm giao diện xác nhận sự cố cho Kho/QC. API đã có sẵn.
- **Bước 4: Số hóa, ma trận phân quyền, Dashboard KPI.**
  - Ma trận phân quyền: thay đổi ở trạng thái PENDING, chỉ Ban điều hành duyệt (`canApprovePermissions`).
  - Màn quản trị `scm_dept_rules`, `scm_dept_members`, `scm_settings`.
  - Cron KPI chạy vào thứ Sáu.

---

## 6. Việc tồn đọng cần báo người dùng
- Sheet Gemba.Pro đang chia sẻ công khai và có 88 mật khẩu dạng văn bản thường. Cần chuyển chia sẻ sang chế độ "Bị hạn chế".
- `wrangler.jsonc` còn secret dạng văn bản thường trong `vars` (ví dụ `GDRIVE_PRIVATE_KEY`). Cần chuyển sang `wrangler secret put` và đổi khóa.
- Có 2 schema `audit_logs` xung đột nhau, nên audit đăng nhập chưa ghi được dòng nào. Cần thống nhất.
- Trong worker còn khoảng 13 chỗ fallback về `202608001` khi không có phiên đăng nhập (task, hồ sơ, lương...). Cần thêm kiểm tra quyền.
- Nhánh `integrate/overview-dashboard` chưa merge vào `main`. Thư mục `D:\Work\TBS II` thiếu các tính năng mới.
- Đồng bộ sheet cho Miền Đông và Phân xưởng Mẫu: chờ người dùng gửi mẫu tiêu đề cột.
- Form Mua hàng: chờ mẫu để viết `parseProcurementForm`.
