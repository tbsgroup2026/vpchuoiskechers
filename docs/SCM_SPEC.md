# Spec gốc module SCM (nguyên văn yêu cầu của người dùng)

dùng Taste thiết kế lại các màn hình "

<pasted_content id="ff35">
# Lệnh cho Claude Code: Module "Kế hoạch chuẩn bị và trung tâm phân phối": Số hóa vật tư và cung ứng

## 0. Bối cảnh và cách làm việc

Bạn đang làm việc trên hệ thống nội bộ TBS Group:
- Next.js chạy trên Cloudflare Workers.
- D1 làm database, R2 làm file storage.
- Đã có sẵn RBAC, `role_workspace_config`, `audit_logs` và backup lên Google Drive.

Module cần làm là card **"Kế hoạch chuẩn bị và trung tâm phân phối"** (trước đây là "Kho & Logistics"). Card này có tab theo từng site, giống module "Nhân sự - Hành chính".

**Trước khi viết code, bắt buộc làm các việc sau:**
1. Quét repo để nắm cấu trúc thư mục, cách tổ chức route, cách gọi D1 và migration, middleware RBAC, helper ghi `audit_logs` và component UI dùng chung.
2. Viết code theo đúng pattern đang có. Không tạo framework, thư viện UI hay cách auth mới.
3. Trình bày kế hoạch thực hiện (file sẽ tạo hoặc sửa, migration, API, màn hình) rồi chờ tôi duyệt mới code.
4. Không phá vỡ module đang chạy: Kaizen sync, Gemba, Backup & Audit Log, Task Board, 1-5-2.

**Ràng buộc chung:**
- Mọi API ghi hoặc sửa dữ liệu phải ghi `audit_logs` (ai, khi nào, giá trị cũ và mới), theo đúng helper đang dùng.
- Không hardcode cho một role. Phân quyền lấy từ cấu hình (xem mục 6), test phải lặp qua mọi role.
- Mọi ngưỡng có ghi "đề xuất" phải là giá trị cấu hình trong bảng `scm_settings`, không viết cứng trong code. Danh sách ngưỡng:
  - số ngày bàn giao No Silent
  - ngưỡng sai lệch tồn kho 2%
  - các cấp leo thang
  - giờ chốt 09:00 và giờ phát hành 11:00
  - SLA 3/7 ngày, 72 giờ, 2 ngày, 2 tuần
- Giao diện tiếng Việt, responsive đến màn hình điện thoại, nút có `aria-label` khi chỉ có icon.
- Ngày hiển thị theo định dạng dd/mm/yyyy, múi giờ Asia/Ho_Chi_Minh.

## 1. Mục tiêu

Chuyển quy trình quản lý vật tư kho và cung ứng từ báo cáo Excel thủ công sang hệ thống theo 4 nguyên tắc:
- Dữ liệu nhập một lần, tại nguồn.
- Mọi bộ phận xem được tiến độ chung nhưng chỉ sửa màn hình của bộ phận mình.
- Deadline tính ngược từ ngày xuất hàng.
- Mỗi hạng mục có đúng một người chịu trách nhiệm cuối.

Hệ thống phải quản lý **nhiều đơn hàng đồng thời** (hàng chục đến hàng trăm đơn). Mọi bảng đều có tìm kiếm, lọc, sắp xếp và phân trang phía server.

## 2. Luồng đơn hàng: 10 bước (xương sống của hệ thống)

Mỗi đơn hàng có 10 bước. Mỗi bước có bộ phận giữ việc, SLA và các bước phụ thuộc.

| Bước | Công việc | Bộ phận | SLA | Phụ thuộc |
|---|---|---|---|---|
| 1 | Bàn giao đơn hàng, BOM, Wink, Giày mẫu, Squatbook | Kinh doanh | Theo deadline tính ngược | — |
| 2 | Cung cấp Rập, định mức vật tư, thông tin kỹ thuật | Công nghệ | Trước khi hàng về | 1 |
| 3 | Kế hoạch phân bổ cuốn chiếu 4 tuần | Kế hoạch & CCƯ | Cập nhật hằng tuần | 1 |
| 4 | Ban hành Kế hoạch 312 | Kế hoạch & CCƯ | Hằng tuần (thứ Hai) | 3 |
| 5 | Bàn giao No Silent cho Mua hàng | Kế hoạch & CCƯ | Đúng thời hạn (cấu hình) | 3 |
| 6 | Kích hoạt và đặt hàng đơn đủ điều kiện | Mua hàng | ≤ 3 ngày từ khi có No Silent | 2, 5 |
| 7 | Kế hoạch dự kiến nhập hàng 4 tuần gửi Kho | Mua hàng | Hằng tuần (thứ Ba) | 4 |
| 8 | Tiếp nhận và kiểm tra hàng | Kho | Nội địa ≤ 3 ngày, nhập khẩu ≤ 7 ngày | 6 |
| 9 | Lab test (hóa tính, lý tính) và ký màu | QC | Lab ≤ 72 giờ, ký màu ≤ 2 ngày | 8 |
| 10 | Cân đối và cấp vật tư đồng bộ xuống sản xuất | Kho | Trước kế hoạch may ≥ 14 ngày | 8, 9 |

**Trạng thái của mỗi bước** do server tính, không cho người dùng tự đặt:
- **Hoàn thành:** bộ phận giữ việc đã xác nhận trên màn hình của mình.
- **Đang làm:** mọi bước phụ thuộc đã Hoàn thành, chưa quá hạn.
- **Trễ hạn:** mọi bước phụ thuộc đã Hoàn thành, đã quá hạn.
- **Bị chặn:** còn bước phụ thuộc chưa xong và đã đến hạn của bước này. Phải lưu kèm tên bước và bộ phận đang được chờ.
- **Chưa tới:** còn bước phụ thuộc chưa xong và chưa đến hạn.

Một bước chỉ được đánh dấu Hoàn thành khi mọi bước phụ thuộc đã Hoàn thành. Hoàn tác một bước thì các bước phụ thuộc vào nó cũng bị hoàn tác theo, có ghi lý do.

**Công thức hạn chót giao thông tin:**
```
Hạn chót KD/CN = Ngày xuất hàng − (Lead time bình quân NCC + Thời gian vận chuyển + 30 ngày sản xuất + 3 ngày xử lý định mức/BOM)
```
Ví dụ: xuất hàng 18/12/2026, lead time 35 ngày, vận chuyển 10 ngày thì hạn chót là 01/10/2026.

Khi đổi ngày xuất hàng, hệ thống tự tính lại mọi hạn chót của đơn và thông báo cho Mua hàng và Kinh doanh.

**Leo thang tự động.** Chạy bằng cron trong `scheduled()` dispatcher hiện có, không tạo thêm cron entry trùng:

| Cấp | Điều kiện | Gửi tới | Yêu cầu phản hồi |
|---|---|---|---|
| 1 | Còn ≤ 1 ngày đến hạn mà bước chưa xong | Người giữ việc | Cập nhật trạng thái trong ngày |
| 2 | Đã quá hạn | Trưởng bộ phận | Nêu nguyên nhân và ngày hoàn tất dự kiến |
| 3 | Quá hạn ≥ 3 ngày | Ban điều hành | Họp xử lý trong 1 ngày làm việc |

## 3. Database D1 (đề xuất, chỉnh theo convention của repo)

Dùng tiền tố `scm_`. Mọi bảng có `created_at`, `updated_at`, `created_by`, `updated_by`.

**Đơn hàng và luồng 10 bước:**
- `scm_orders`: id, code, site, plant, line, qty, ship_date, supplier_lead_time, transport_days, info_deadline, no_silent (bool), status_cache.
- `scm_order_steps`: order_id, step_no (1–10), owner_dept, due_at, done_at, done_by, late_days, blocked_by (JSON), escalation_level.
- `scm_handover_items`: order_id, item, delivered_at, delivered_by. Giá trị của `item` là một trong: bom, wink, giay_mau, squatbook, rap, dinh_muc.

**Kế hoạch:**
- `scm_allocation_plans`: tuần bắt đầu, trạng thái. Trạng thái đi theo thứ tự nháp → chờ duyệt → đã duyệt → đã ban hành.
- `scm_allocation_lines`: plan_id, order_id, week, plant, line, priority_312, tier2_sent.
- `scm_plant_capacity`: plant, line, week, capacity.

**Mua hàng:**
- `scm_purchase_orders`: po_no, order_id, supplier_id, activated_at, issued_at.
- `scm_inbound_plan`: po_id, eta, eta_changed_from, week.
- `scm_suppliers`: master NCC, lead_time_avg.
- `scm_incidents` (sự cố vật tư không đạt): order/po, supplier, material, issue, plan, stage, opened_at, closed_at, escalation.

**Kho:**
- `scm_receipts` (lô tiếp nhận): doc_no, po_id, type (nội địa/nhập khẩu), received_at, due_at, stage, unplanned (bool).
- `scm_bin_locations`: zone, code, labeled, scanned.
- `scm_stock_snapshots`: dữ liệu ZMB52 và Barcode theo ngày.
- `scm_daily_balance` (báo cáo cân đối hằng ngày): date, cutoff_at, validated_at, published_at, note, adjusted_reason.
- `scm_issue_slips` (phiếu cấp vật tư): order_id, sew_date, issue_date (= ngày may − 14), stage, confirmed_by_production_at.

**QC:**
- `scm_lab_requests`: type (lab/ky_mau), receipt_id, received_at, deadline_at, result, round, previous_result_id.
- `scm_qc_standards`: material, version, sent_to_wh_at.

**Số hóa:**
- `scm_rollout_tasks`: các hạng mục 1.1–4.5, progress.
- `scm_milestones`: M1–M4, approved_by, approved_at.
- `scm_report_migration`: tên báo cáo, trạng thái excel / song song / hệ thống.
- `scm_integrations`: SAP ZMB52, Barcode, form nguồn; trạng thái, last_sync, last_error.

**KPI:**
- `scm_kpi_definitions`: dept, name, direction (up/down/zero), target, unit, weight.
- `scm_kpi_values`: dept, kpi_id, period (tuần), actual, level, points.
- `scm_kpi_reports`: period, published_at.

**Phân quyền và cấu hình:**
- `scm_screen_permissions`: screen, dept, quyền (view/edit/locked), có trạng thái chờ duyệt.
- `scm_settings`: các ngưỡng cấu hình đã nêu ở mục 0.

**Form Mua hàng (để sẵn):**
- `scm_uploaded_forms`: id, dept, file_key (R2), file_name, uploaded_by, uploaded_at.

Viết migration theo đúng cách repo đang làm. Có seed dữ liệu demo khoảng 24 đơn với trạng thái đa dạng: đủ cả trễ hạn, bị chặn, đúng tiến độ và hoàn thành.

## 4. Màn hình và nút chức năng

Thanh tab trong module gồm 8 mục: **Tổng quan · Tiến độ chung · Kế hoạch & CCƯ · Mua hàng · Kho · KD·CN·QC · Số hóa · Dashboard KPI**. Mọi thao tác đều có toast phản hồi và ghi `audit_logs`.

### 4.0 Tổng quan module (trang mở đầu, bắt buộc theo style hệ thống hiện có)

Trang đầu tiên khi bấm vào card "Kế hoạch chuẩn bị và trung tâm phân phối".

**Style:** dùng lại đúng component, màu, bo góc và icon đang dùng ở trang chủ "Văn phòng Chuỗi SKECHERS". Cụ thể là cấu trúc nhóm "HÀNH CHÍNH" (thẻ "Quản lý phòng họp", "Đăng ký công tác") và nhóm "NHÂN SỰ" (thẻ "Hồ sơ cá nhân", "Nghỉ phép"...). Tìm component card và section header đang có trong repo để tái sử dụng, không tạo style mới.

**Cấu trúc trang:**
- **Header và sidebar:** giữ nguyên layout chung của hệ thống (tiêu đề hai màu, dòng phụ "Hệ thống Điều Hành & Vận Hành Chuỗi SKECHERS – TBS Group", chuông, menu ứng dụng, toàn màn hình, thẻ tài khoản).
- **Banner xanh đậm:**
  - tiêu đề "Số hóa vật tư & cung ứng", dòng mô tả, tuần hiện tại
  - hàng nút chọn site dạng viên bo tròn viền trắng: Văn phòng chuỗi, Phân xưởng mẫu, Nhà máy Miền Đông, Nhà máy Kiên Giang 1, 2, 3, Hoàn thiện đế
  - site đang chọn lọc dữ liệu của mọi màn hình bên trong và được lưu theo người dùng
- **Nhóm chức năng:** mỗi nhóm có section header gồm icon vuông viền xanh nhạt, tiêu đề in hoa và dòng mô tả xám. Bên dưới là lưới 2 thẻ lớn, màu xen kẽ xanh lá và cam như "Quản lý phòng họp" / "Đăng ký công tác".

**Thành phần của mỗi thẻ lớn:**
- icon trong ô bo góc nền nhạt
- tên màn hình (đậm)
- nhãn quyền dạng pill xám, ví dụ "Sửa: Kho"
- mô tả 1 dòng
- đường kẻ mảnh
- danh sách 3–4 chức năng chính có dấu tích cùng màu với thẻ
- nút mũi tên tròn ở góc dưới phải để mở màn hình

**Các nhóm và thẻ:**

| Nhóm | Thẻ xanh lá | Thẻ cam |
|---|---|---|
| ĐIỀU HÀNH CHUNG | Tiến độ chung (Mọi bộ phận: Xem) | Dashboard KPI (Theo phạm vi vai trò) |
| KẾ HOẠCH & CUNG ỨNG | Kế hoạch & Chuỗi cung ứng (Sửa: Kế hoạch) | Mua hàng (Sửa: Mua hàng) |
| KHO & CHẤT LƯỢNG | Trung tâm phân phối / Kho (Sửa: Kho) | Kinh doanh · Công nghệ · QC (Sửa: KD·CN·QC) |
| SỐ HÓA & QUẢN TRỊ | Số hóa & Dữ liệu (Sửa: Số hóa) | Phân quyền màn hình (Duyệt: Ban điều hành) |

**Danh sách chức năng trên từng thẻ** (lấy từ các nút ở mục 4.1–4.7):

| Thẻ | Chức năng |
|---|---|
| Tiến độ chung | Bảng đơn hàng tìm, lọc, phân trang · Điểm nghẽn theo bộ phận · Nhắc cấp 1 & Leo thang · Gantt 4 pha & mốc M1–M4 |
| Dashboard KPI | Chọn kỳ & xem công thức · Chi tiết chỉ số theo phòng ban · Phát hành báo cáo KPI tuần · Kế hoạch cải thiện 4 tuần |
| Kế hoạch & CCƯ | Phân bổ cuốn chiếu & thêm tuần mới · Gửi duyệt → Phê duyệt → Ban hành KH312 · Gửi No Silent · Chuyển kế hoạch Tầng 2 |
| Mua hàng | Tải form lên & tính hạn chót · Kích hoạt đặt hàng & phát hành PO · Gửi kế hoạch nhập 4 tuần cho Kho · Xử lý sự cố NCC trong 2 tuần |
| Kho | Tiếp nhận & kiểm tra 3/7 ngày · Quét Barcode nhập ô kệ · Chốt 09:00 & phát hành trước 11:00 · Cấp vật tư đồng bộ trước 2 tuần |
| KD·CN·QC | Bàn giao BOM, Wink, Giày mẫu, Rập, định mức · Lab test 72 giờ & ký màu 2 ngày · Ghi kết quả / Test lại · Gửi tiêu chuẩn kiểm hàng cho Kho |
| Số hóa | Cập nhật hạng mục Pha 1 & xác nhận M1 · Đồng bộ & kiểm tra kết nối · Lộ trình bỏ Excel · Tiến độ Dashboard Pha 3 |
| Phân quyền | Ma trận Xem / Sửa / Khóa · Gửi Ban điều hành duyệt · Khôi phục mặc định |

**Nhóm "THAO TÁC NHANH":** 4 thẻ nhỏ cùng style với hàng "Hồ sơ cá nhân / Nghỉ phép / Chấm công / Đánh giá". Mỗi thẻ có icon, tên, mô tả ngắn và mũi tên. Mũi tên mở thẳng màn hình đích và cuộn tới khối chức năng tương ứng.
- Tải form Mua hàng
- Ban hành Kế hoạch 312 (thứ Hai)
- Chốt dữ liệu 09:00
- Báo cáo KPI tuần (thứ Sáu)

**Quy tắc hiển thị theo quyền:**
- Thẻ của màn hình mà người dùng không có quyền xem thì ẩn hẳn. Thẻ có quyền xem nhưng không có quyền sửa vẫn hiện, nhãn quyền đổi thành "Chỉ xem".
- Lấy quyền từ cùng nguồn với mục 6, không viết lại logic quyền riêng.
- Responsive: lưới 2 cột về 1 cột trên điện thoại, hàng 4 thẻ nhỏ về 2 cột rồi 1 cột.

**Các màn hình chi tiết (4.1–4.7):**
- Dùng chung header, sidebar và component nút, bảng, pill của hệ thống. Nút chính dùng màu xanh đậm của hệ thống, nút cảnh báo dùng màu cam.
- Mỗi màn có nút hoặc breadcrumb "← Tổng quan" để quay về.

### 4.1 Tiến độ chung
Mọi bộ phận đều xem được, không ai được sửa. Màn hình chỉ hiện trạng thái và lý do chờ, không hiện số liệu chi tiết của từng bộ phận.
- **Thẻ tổng:**
  - số đơn đang theo dõi
  - số đơn đúng tiến độ
  - số đơn có bước trễ
  - số đơn có bước bị chặn
  - số đơn xuất hàng trong 45 ngày
- **Điểm nghẽn theo bộ phận:** với mỗi phòng, đếm số bước phòng đó đang trễ, cộng số bước phòng đó đang làm bước sau bị chặn, tính trên mọi đơn. Bấm vào một phòng để lọc bảng đơn.
- **Bảng đơn hàng:**
  - Cột: mã đơn, nhà máy·chuyền, ngày xuất (còn N ngày), số lượng, dải 10 ô trạng thái, % tiến độ, tình trạng, "đang vướng ở".
  - Dải 10 ô: mỗi ô có số bước và tooltip, màu phải khác cả độ sáng chứ không chỉ khác sắc độ.
  - Có tìm theo mã đơn hoặc nhà máy, lọc nhà máy, lọc tình trạng (Bị chặn / Trễ hạn / Đúng tiến độ / Hoàn thành), sắp xếp (ngày xuất / tiến độ thấp / rủi ro), phân trang 10 đơn.
- **Chi tiết đơn:** 10 bước của đơn đang chọn, hạn chót giao thông tin và các nút Nhắc cấp 1, Leo thang.
- **Nút chung:** Làm mới, Xuất báo cáo (PDF theo bộ lọc hiện tại).
- **Gantt 4 pha** (T1 = tuần 42/2026, 18 tuần) với các mốc M1 cuối T4, M2 cuối T9, M3 cuối T13, M4 cuối T18.

### 4.2 Kế hoạch & Chuỗi cung ứng
Chỉ phòng Kế hoạch được sửa.
- **Thanh trạng thái kế hoạch:** Nháp → Chờ duyệt → Đã duyệt → Đã ban hành. Các nút đi kèm:
  - **Gửi duyệt**
  - **Trưởng bộ phận phê duyệt** (chỉ role trưởng phòng)
  - **Ban hành Kế hoạch 312**: khóa khi chưa duyệt hoặc khi có tuần vượt năng lực
  - **Chuyển kế hoạch Tầng 2**
- **Bảng phân bổ cuốn chiếu 4 tuần:**
  - Cột: ưu tiên 312 (tự xếp theo ngày xuất), mã đơn, số lượng, ngày xuất, 4 cột tuần (nhà máy·chuyền), No Silent, thao tác.
  - Dòng cuối hiện tải so với năng lực từng tuần, đánh dấu tuần vượt.
  - Bảng có tìm kiếm, lọc và phân trang.
- **Nút trên từng dòng:**
  - **Gửi No Silent**: bắt đầu đếm 3 ngày cho Mua hàng.
  - **Dời tuần**: bắt buộc nhập lý do.
  - **Đổi ngày xuất**: tính lại hạn chót.
- **Nút chung:**
  - **+ Nhận đơn từ Kinh doanh**
  - **Thêm tuần mới (cuốn chiếu)**: luôn giữ đủ 4 tuần, đơn của tuần cũ chuyển sang sản xuất.
- **Toggle Tầng 1 / Tầng 2:** Tầng 2 là màn hình xem kết quả chuyển giao cho nhà máy.
- **Nhật ký thay đổi kế hoạch:** ghi kèm lý do.
- **Quy tắc kiểm tra:**
  - luôn đủ 4 tuần liên tục
  - mỗi đơn gắn đúng một nhà máy·chuyền trong mỗi tuần
  - không ban hành khi chưa duyệt
  - mỗi đơn có một thứ tự ưu tiên duy nhất

### 4.3 Mua hàng
Chỉ phòng Mua hàng được sửa.
- **Nút "Tải form lên"** đặt ở góc trên bên phải. Hiện tại làm sẵn:
  - Bấm vào mở panel hoặc modal có vùng chọn file (hỗ trợ .xlsx, .xls, .csv, .pdf, .docx, tối đa 10MB).
  - Upload lên R2 và lưu bản ghi vào `scm_uploaded_forms`.
  - Hiện danh sách form đã tải kèm nút tải xuống.
  - **Chưa parse nội dung form.** Để sẵn một hàm `parseProcurementForm()` trả về `not_implemented` và ghi TODO; tôi sẽ gửi mẫu form sau để làm tiếp.
- **Công cụ tính hạn chót:**
  - Đầu vào: ngày xuất, lead time NCC, vận chuyển.
  - Hiện phép tính, ví dụ "35 + 10 + 30 + 3 = 78 ngày", và kết quả ngày hạn chót.
  - Nút **Áp hạn chót cho đơn**.
- **Bảng kiểm tra điều kiện đặt hàng:**
  - Cột: BOM, Wink, Giày mẫu, No Silent (kèm "ngày x/3"), trạng thái.
  - Có tìm kiếm, lọc (Đủ điều kiện / Thiếu điều kiện / Đã phát hành PO) và phân trang.
  - Nút theo trạng thái của đơn:
    - Đủ điều kiện: **Kích hoạt đặt hàng**, sau đó **Phát hành PO** (sinh số PO tự động).
    - Thiếu điều kiện: **Báo điểm nghẽn**. Ghi rõ mục thiếu và bộ phận chịu trách nhiệm: BOM, Wink, Giày mẫu thuộc Kinh doanh; No Silent thuộc Kế hoạch. Thông tin này đẩy lên màn Tiến độ chung.
  - Không cho kích hoạt khi thiếu bất kỳ điều kiện nào.
- **Kế hoạch dự kiến nhập hàng 4 tuần:**
  - Tự tổng hợp từ PO, không có Excel riêng.
  - Nút **Gửi kế hoạch cho Kho** (thứ Ba).
  - Nút trên từng dòng **NCC báo đổi ngày**: cập nhật ETA và hiện ảnh hưởng đến ngày cấp vật tư của đơn.
- **Xử lý vật tư không đạt:**
  - Thẻ sự cố có thanh đếm "ngày x/14".
  - Dropdown phương án: Đổi hàng / Bù thiếu / Giảm giá / Trả hàng.
  - Nút bước tiếp theo đi qua các giai đoạn: Liên hệ NCC → Ghi phương án → Chờ Kho/QC xác nhận → Đóng sự cố & ghi KPI NCC.
  - Chỉ đóng được khi Kho hoặc QC đã xác nhận.
  - Nút **Leo thang** hiện từ ngày 10. Quá 14 ngày thì báo trưởng Mua hàng, sau đó báo Ban điều hành.

### 4.4 Trung tâm phân phối / Kho
Chỉ Kho được sửa.
- **Thẻ tổng:**
  - % ô kệ đã quét Barcode
  - số lô đang tiếp nhận và số lô sắp hết hạn kiểm
  - trạng thái báo cáo cân đối hôm nay
  - số đơn cấp đủ trước 2 tuần
- **Tiếp nhận và kiểm tra:** bảng lô có cột "còn x/3 ngày" hoặc "còn x/7 ngày". Nút theo giai đoạn của lô:
  - Hàng đã về: **Đối chiếu chứng từ/PO**.
  - Đang kiểm: **Đạt**, **Chuyển QC**, hoặc **Không đạt · lập biên bản** (bắt buộc kèm ảnh; tự tạo sự cố bên Mua hàng).
  - Đạt: **Quét Barcode nhập ô kệ**. Không ghi nhận tồn khi chưa quét mã.
  - Đã nhập kệ: **Phát hành báo cáo tiếp nhận**.
- **Nút "Ghi nhận hàng ngoài kế hoạch":** tự báo Mua hàng.
- **Hàng về từng phần:** tách lô, mỗi lô tính hạn riêng.
- **Báo cáo cân đối đồng bộ hằng ngày:**
  - Timeline 08:00 → 09:00 → 09:00–10:00 → 11:00.
  - Các nút, mỗi nút chỉ bật đúng thời điểm:
    - **Chốt dữ liệu 09:00**
    - **Kiểm tra hợp lệ** (phát hiện trùng, thiếu, sai định dạng)
    - **Sửa dữ liệu lỗi**
    - **Phát hành báo cáo**
    - **Phát hành kèm ghi chú dữ liệu chưa đủ** (dùng khi quá 10:00 vẫn còn lỗi)
  - Cron 09:00 tự chốt và tạo snapshot dự phòng.
  - Dữ liệu phát sinh sau 09:00 tính vào báo cáo hôm sau.
  - Không sửa tay sau khi phát hành; chỉ phát hành bản điều chỉnh có ghi lý do.
  - Bảng kết quả: % đồng bộ theo đơn, phần thiếu, hạn cấp, cảnh báo đơn thiếu trong 2 tuần tới (gửi Mua hàng và Kế hoạch).
- **Cấp vật tư đồng bộ:** ngày cấp = ngày may − 14. Nút theo giai đoạn:
  - **Lập phiếu xuất & quét mã** → **Giao xuống sản xuất** → chờ sản xuất xác nhận nhận đủ.
  - Khi thiếu vật tư: **Cảnh báo Mua hàng & Kế hoạch**.
  - Cấp từng phần chỉ khi Kế hoạch quyết định trên hệ thống. Kho không tự đổi lịch may.
- **Quét Barcode theo khu:** % theo từng khu, nút **Quét tiếp**.

### 4.5 Kinh doanh · Công nghệ · QC
Chỉ nhóm này được sửa.
- **Theo dõi bàn giao:**
  - Bảng đơn × 6 hạng mục: BOM, Wink, Giày mẫu, Squatbook (Kinh doanh); Rập, Định mức (Công nghệ).
  - Mỗi ô là nút **Giao / Đã giao**. Kinh doanh chỉ bấm được 4 cột của mình, Công nghệ chỉ bấm được 2 cột của mình.
  - Hạn chót tô đỏ khi trễ.
  - Nút trên từng dòng: **Báo đổi ngày xuất**, **Chuyển No Silent → Kế hoạch**.
  - Có tìm kiếm và phân trang.
- **Lab test và ký màu:**
  - Lọc: Tất cả / Lab test / Ký màu.
  - Đếm ngược theo giờ nhận (72 giờ / 48 giờ).
  - Nút theo giai đoạn: **Ghi giờ nhận & bắt đầu** → **Ghi kết quả Đạt** / **Không đạt**. Không đạt thì tự chuyển sang quy trình xử lý hàng không đạt.
  - Nút **Test lại**: tạo lần mới và giữ kết quả lần trước.
  - Quá hạn thì tự cảnh báo trưởng QC.
- **Tiêu chuẩn kiểm hàng và dập:** thẻ theo vật tư, có phiên bản. Nút **Gửi Kho**, **Cập nhật tiêu chuẩn** (tăng phiên bản và yêu cầu gửi lại).

### 4.6 Số hóa & Dữ liệu
Chỉ phòng Số hóa được sửa, có quyền quản trị kỹ thuật.
- **Thẻ tổng:** % Pha 1, % báo cáo đã bỏ Excel, số kết nối ổn định trên 3, số mốc nghiệm thu đã đạt.
- **Hạng mục Pha 1 (1.1–1.6):** có thanh % và nút **+20%**, **Hoàn thành**. Nút **Xác nhận đạt mốc M1** chỉ bật khi mọi hạng mục đạt 100%.
- **Mốc M1–M4:** hiện tiêu chí qua cổng và người duyệt.
- **Kết nối:** SAP ZMB52, Barcode, form nguồn. Mỗi kết nối có nút **Đồng bộ ngay**, **Kiểm tra kết nối**, **Nhật ký lỗi**.
  - Kết nối SAP ZMB52 chưa có thì làm adapter interface và mock trước.
- **Lộ trình bỏ Excel theo báo cáo:** Excel → Chạy song song → Hệ thống.
- **Tiến độ Dashboard 3.1–3.6.**
- **Ma trận phân quyền màn hình:**
  - Bấm vào ô để đổi Xem / Sửa / Khóa.
  - Dòng Tiến độ chung, dòng RACI và cột Ban điều hành bị khóa ở quyền Xem.
  - Nút **Khôi phục mặc định**, **Gửi Ban điều hành duyệt**. Thay đổi chỉ có hiệu lực sau khi Ban điều hành duyệt.

### 4.7 Dashboard KPI phòng ban
Phạm vi xem:
- Mỗi người xem KPI của mình.
- Trưởng bộ phận xem KPI của bộ phận.
- Ban điều hành xem tất cả.

Nội dung màn hình:
- **Nhãn chế độ:** "Chạy thử · không tính thưởng phạt" cho đến khi qua mốc M4.
- **Nút:** chọn kỳ (tuần), **Xem công thức**, **Xuất báo cáo KPI**, **Phát hành báo cáo tuần** (thứ Sáu; khóa sau khi đã phát hành).
- **Thẻ tổng:** điểm trung bình (kèm chênh lệch so với tuần trước), số phòng xếp loại Tốt trở lên, số chỉ số chưa đạt, số phòng dưới 70 điểm.
- **7 thẻ phòng ban:** Kế hoạch & CCƯ, Mua hàng, Kho, KD·CN·QC, Số hóa, NCC, Sản xuất. Mỗi thẻ hiện điểm, xếp loại, số chỉ số đạt và mini chart 4 tuần.
- **Chi tiết phòng đang chọn:**
  - Bảng: chỉ số, chỉ tiêu, thực tế, trọng số, thanh mức đạt, điểm, tổng điểm.
  - Biểu đồ xu hướng 4 tuần.
  - Ô "Kéo điểm xuống nhiều nhất".
  - Nút **Xem KPI cá nhân**, **Lập kế hoạch cải thiện 4 tuần** (chỉ bật khi dưới 70 điểm).

**Công thức tính:**
- Mức đạt:
  - Chỉ số "càng cao càng tốt": thực tế ÷ chỉ tiêu, tối đa 100%.
  - Chỉ số "không quá": đạt 100% khi thực tế ≤ chỉ tiêu, vượt thì bằng chỉ tiêu ÷ thực tế.
  - Chỉ số có chỉ tiêu bằng 0: 0 lỗi đạt 100%, 1 lỗi đạt 50%, từ 2 lỗi đạt 0%.
- Điểm phòng = Σ(mức đạt × trọng số). Trọng số trong mỗi phòng cộng lại bằng 100%.
- Xếp loại:
  - Từ 95: Xuất sắc
  - 85 đến dưới 95: Tốt
  - 70 đến dưới 85: Đạt
  - Dưới 70: Cần cải thiện

**Seed bộ chỉ số mặc định:**

| Phòng | Chỉ số (chỉ tiêu, trọng số) |
|---|---|
| Kế hoạch & CCƯ | Ban hành kế hoạch đúng hạn (100%, 30) · Đủ 4 tuần liên tục (100%, 25) · No Silent bàn giao đúng hạn (100%, 25) · Đơn đổi lịch do kế hoạch sai (≤ 5%, 20) |
| Mua hàng | Đặt No Silent trong 3 ngày (100%, 30) · NCC giao đúng hạn (≥ 90%, 30) · Sự cố đóng trong 2 tuần (100%, 25) · Kế hoạch nhập gửi đúng hạn (100%, 15) |
| Kho | Đồng bộ 100% số lượng và chất lượng (30) · Cấp trước 2 tuần (25) · Báo cáo trước 11:00 (20) · Ô kệ quét mã (15) · Sai lệch kiểm kê (≤ 2%, 10) |
| KD·CN·QC | Bàn giao đúng deadline (35) · Rập và định mức trước khi hàng về (20) · Lab test 72 giờ (25) · Ký màu 2 ngày (20) |
| Số hóa | Mốc nghiệm thu đúng hạn (40) · Báo cáo bỏ Excel theo mục tiêu pha (30) · Dữ liệu cập nhật đúng lịch (≥ 99%, 30) |
| NCC | Giao đúng hạn (≥ 90%, 40) · Lô đạt chất lượng (≥ 98%, 35) · Thời gian xử lý sự cố (≤ 14 ngày, 25) |
| Sản xuất | Kết đơn hàng đúng kế hoạch (60) · Xác nhận nhận vật tư trong ngày (40) |

Giá trị "thực tế" phải tính tự động từ dữ liệu các bảng ở mục 3. Ví dụ, "Lab test trong 72 giờ" bằng số lab request có `result_at − received_at ≤ 72h` chia cho tổng số lab request trong kỳ. Chỉ số nào chưa có nguồn dữ liệu tự động thì cho nhập tay, có đánh dấu "nhập tay".

Cron thứ Sáu tự tính KPI tuần và lưu vào `scm_kpi_values`. Thời điểm chạy theo `scm_settings`.

## 5. API (route handlers theo pattern của repo)

Gom theo nhóm `/api/scm/...`: orders, steps, allocation, purchasing, receipts, balance, issues, lab, standards, rollout, permissions, kpi, forms.

Yêu cầu chung cho mọi API:
- Kiểm tra quyền ở server, không chỉ ẩn nút ở client.
- Validate input.
- Phân trang theo dạng `?page=&pageSize=&q=&status=&plant=&sort=`.
- Trả lỗi bằng tiếng Việt, rõ ràng.
- Mọi API ghi dữ liệu phải ghi `audit_logs`.

## 6. Phân quyền màn hình (mặc định, chờ Ban điều hành duyệt)

| Màn hình | Kế hoạch | Mua hàng | Kho | KD·CN·QC | Số hóa | Ban điều hành |
|---|---|---|---|---|---|---|
| Tiến độ chung | Xem | Xem | Xem | Xem | Xem | Xem |
| Kế hoạch & CCƯ | Sửa | Khóa | Khóa | Khóa | Khóa | Xem |
| Mua hàng | Khóa | Sửa | Khóa | Khóa | Khóa | Xem |
| Kho | Khóa | Khóa | Sửa | Khóa | Khóa | Xem |
| KD·CN·QC | Khóa | Khóa | Khóa | Sửa | Khóa | Xem |
| Số hóa & cấu hình | Khóa | Khóa | Khóa | Khóa | Sửa | Xem |
| Dashboard KPI | theo phạm vi ở mục 4.7 | | | | | Xem tất cả |

**Map người dùng vào phòng ban và role:** dùng `role_workspace_config` và dữ liệu import CB-CNV đã có (cột Phòng Ban dùng để chia workspace, cột VTCV dùng để xác định role).

**Tài khoản dev/control của tôi** (Phạm Nguyễn Anh Huy) vẫn bypass quyền như hiện tại.

**Còn chờ Ban điều hành quyết:** quyền xem của Số hóa đối với nội dung nghiệp vụ của bộ phận khác. Làm thành một cờ cấu hình.

## 7. Thứ tự triển khai và tiêu chí xong

1. **Bước 1:** migration + seed + API đơn hàng / luồng 10 bước + màn **Tổng quan module** (theo style hệ thống, mục 4.0) + màn **Tiến độ chung** (bao gồm logic trạng thái và điểm nghẽn). Xong thì dừng để tôi kiểm tra.
2. **Bước 2:** màn Kế hoạch & CCƯ và Mua hàng (gồm nút **Tải form lên**).
3. **Bước 3:** màn Kho và KD·CN·QC (gồm cron chốt 09:00).
4. **Bước 4:** màn Số hóa, ma trận phân quyền, Dashboard KPI và cron KPI thứ Sáu.

**Tiêu chí xong cho mỗi bước:**
- Build production thành công.
- Unit test cho:
  - logic trạng thái và phụ thuộc
  - công thức hạn chót tính ngược
  - công thức KPI (cả 3 loại chỉ số)
  - phân quyền: test lặp qua mọi role
- Không có lỗi TypeScript.
- Audit log ghi đủ.
- Giao diện dùng được trên màn hình điện thoại.

## 8. Các điểm còn chờ xác nhận

Làm thành cấu hình, chưa hardcode:
- Số ngày cụ thể của "đúng thời hạn" khi bàn giao No Silent.
- Ngưỡng sai lệch tồn kho, đề xuất 2%.
- Các ngưỡng leo thang và lịch vận hành hằng ngày, hằng tuần.
- Công thức KPI cuối cùng, sẽ chốt ở Pha 3.
- Có cần màn hình riêng cho Sản xuất hay không.
- Mẫu form Mua hàng, tôi sẽ gửi sau.

Hãy bắt đầu bằng việc quét repo và trình kế hoạch cho Bước 1.
</pasted_content id="ff35">

"
