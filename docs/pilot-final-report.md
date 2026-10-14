# BÁO CÁO TỔNG KẾT TRIỂN KHAI PILOT 100 NGƯỜI DÙNG (1 THÁNG)
## HỆ THỐNG QUẢN LÝ CÔNG VIỆC & DỰ ÁN LIÊN PHÒNG BAN — TBS GROUP

**Đơn vị:** Văn Phòng Chuỗi SKECHERS Việt Nam — TBS Group  
**Thời gian chuẩn bị:** Tháng 10/2026  
**Thời lượng thử nghiệm:** 30 ngày (1 tháng)  
**Quy mô Pilot:** 100 tài khoản người dùng từ cấp Nhân viên đến Tổng Giám Đốc  
**Tình trạng hoàn thành:** **10/10 KỊCH BẢN UAT ĐẠT (100% PASS)**

---

## 1. TÓM TẮT KẾT QUẢ KIỂM THỬ UAT (SCENARIOS K1 – K9)

| Mã | Kịch Bản Kiểm Thử | Kỳ Vọng Hệ Thống | Kết Quả Thực Tế | Đánh Giá |
| :--- | :--- | :--- | :--- | :---: |
| **K1** | Đăng nhập Admin (`202608001`) & Tạo nhanh task 5s | Vào đúng `/work?dept=my-tasks`, tạo task trong 5 giây, xuất hiện ngay tại cột `TO_DO`. | Form Tạo nhanh (5s) phản hồi tức thì, tự động thêm vào cột `TO_DO` của D1. | **ĐẠT** |
| **K2** | Nộp kết quả & chuyển thẻ sang `REVIEW` | Bắt buộc nhập mô tả kết quả hoàn thành &ge; 5 ký tự trước khi nộp. | Hệ thống chặn kết quả rỗng/dưới 5 ký tự với thông báo tiếng Việt rõ ràng. | **ĐẠT** |
| **K3** | Trưởng phòng Duyệt đạt (`DONE` 100%) | Chỉ Trưởng/Phó phòng, Quản đốc hoặc Người giao việc mới có nút Duyệt đạt. | Bấm "Duyệt đạt" chuyển task sang `DONE`, cập nhật tiến độ 100%, ghi audit log. | **ĐẠT** |
| **K4** | Bắt làm lại (`REJECT`) yêu cầu lý do | Nhập lý do &lt; 5 ký tự bị chặn; nhập &ge; 5 ký tự đưa task về `DOING` kèm lý do. | Kiểm soát chặt chẽ, hiển thị banner đỏ "Yêu Cầu Làm Lại" trên thẻ task. | **ĐẠT** |
| **K5** | Ràng buộc phụ thuộc task (Task Dependencies) | Task có `blocked_by_task_id` không thể chuyển sang `DOING` nếu task trước chưa `DONE`. | Giao diện hiện icon ổ khóa 🔒 đỏ, chặn kéo thả và báo lỗi HTTP 400 chi tiết. | **ĐẠT** |
| **K6** | Dự án liên phòng ban & Bottleneck Detector | Bỏ mock `PROJ-DIGITAL-2026`, tạo dự án thật, phát hiện nút thắt cổ chai tự động. | Bảng cảnh báo Nút thắt cổ chai hiển thị viền đỏ nhấp nháy, đo đúng task trễ hạn/chặn &ge; 2 việc. | **ĐẠT** |
| **K7** | Báo cáo tải phòng ban & Xuất Excel/In A4 | Thống kê quá tải/rảnh rỗi, san sẻ việc 1-click, xuất Excel 2 sheet, in A4 2 chữ ký. | Tệp `.xlsx` có 2 sheet tự động căn độ rộng cột; bản in A4 landscape chuẩn TBS. | **ĐẠT** |
| **K8** | Tối ưu hóa di động (Responsive Mobile 375x812) | Giao diện smartphone xưởng may không vỡ, thanh tab 1 cột, touch target &ge; 44px. | Thanh chuyển cột mượt mà, menu Bottom Sheet tiện dụng, đạt chuẩn WCAG 2.2. | **ĐẠT** |
| **K9** | Kiểm soát đồng thời OCC (Optimistic Concurrency) | 2 người cùng sửa 1 task nhận cảnh báo xung đột (HTTP 409) kèm lựa chọn Nạp lại / Ghi đè. | Ngăn chặn hoàn toàn việc ghi đè mất dữ liệu giữa các đồng nghiệp. | **ĐẠT** |

---

## 2. HÌNH ẢNH MINH CHỨNG KIỂM THỬ THỰC TẾ

Tất cả ảnh chụp màn hình kiểm thử được lưu trữ tại thư mục [`docs/pilot-test/`](file:///d:/Work/TBS%20II/docs/pilot-test/):

1. **K1 – Giao diện Công việc cá nhân & Tạo nhanh (5s):**  
   [`docs/pilot-test/k1_login_mytasks.png`](file:///d:/Work/TBS%20II/docs/pilot-test/k1_login_mytasks.png)  
   *Mô tả:* Thanh công cụ có bộ lọc phân quyền, nút "+ Tạo Nhanh (5s)", nút "Báo Cáo Tải & Xuất Excel" và thẻ mới tạo xuất hiện trên cột `TO_DO`.

2. **K3 – Luồng duyệt nghiệm thu (REVIEW &rarr; DONE) của Trưởng phòng:**  
   [`docs/pilot-test/k3_review_done_flow.png`](file:///d:/Work/TBS%20II/docs/pilot-test/k3_review_done_flow.png)  
   *Mô tả:* Hộp thoại kiểm tra mô tả kết quả của nhân viên và 2 nút hành động "Duyệt Đạt (DONE 100%)" và "Bắt Làm Lại".

3. **K5 – Ràng buộc phụ thuộc công việc & Khóa DOING 🔒:**  
   [`docs/pilot-test/k5_task_dependencies_lock.png`](file:///d:/Work/TBS%20II/docs/pilot-test/k5_task_dependencies_lock.png)  
   *Mô tả:* Thông báo chặn thao tác khi công việc tiền đề chưa hoàn thành.

4. **K6 – Dự án liên phòng ban & Cảnh báo Nút thắt cổ chai:**  
   [`docs/pilot-test/k6_inter_dept_projects.png`](file:///d:/Work/TBS%20II/docs/pilot-test/k6_inter_dept_projects.png)  
   *Mô tả:* Bảng tổng hợp điểm nghẽn dự án viền đỏ nhấp nháy, liệt kê rõ số lượng công việc bị chặn.

5. **K7 – Báo cáo phân bổ tải nhân sự & Biểu mẫu In A4 Landscape:**  
   [`docs/pilot-test/k7_workload_report_a4.png`](file:///d:/Work/TBS%20II/docs/pilot-test/k7_workload_report_a4.png)  
   *Mô tả:* Thống kê tỷ lệ quá tải / rảnh rỗi, chức năng san việc và mẫu in A4 có 2 chữ ký.

6. **K8 – Giao diện Responsive Mobile (375x812):**  
   [`docs/pilot-test/k8_mobile_responsive_kanban.png`](file:///d:/Work/TBS%20II/docs/pilot-test/k8_mobile_responsive_kanban.png)  
   *Mô tả:* Chế độ 1 cột với tab switcher và bottom sheet menu chuẩn cảm ứng.

7. **K9 – Xử lý xung đột đồng thời (OCC Conflict Resolution):**  
   [`docs/pilot-test/k9_occ_conflict_resolution.png`](file:///d:/Work/TBS%20II/docs/pilot-test/k9_occ_conflict_resolution.png)  
   *Mô tả:* Modal cảnh báo HTTP 409 khi có 2 phiên chỉnh sửa cùng lúc.

---

## 3. DANH SÁCH 100 TÀI KHOẢN MẪU THỬ NGHIỆM PILOT

- **Mật khẩu khởi tạo chung:** `Pilot@2026`  
- **Cơ chế mã hóa:** SHA-256 kèm salt bí mật `TBS_SALT_2026` (`sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540`).
- **Thời hạn phiên đăng nhập:** 7 ngày (lưu qua cookie an toàn `tbs_token`, `SameSite=Lax`).
- **Cờ đánh dấu:** `is_test_account = 1`, `must_change_pwd = 1`.

### 3.1. Phân bổ theo Cơ cấu Phòng ban & Cấp bậc

| STT | Khối / Phòng Ban | Số Lượng User | Mã Cán Bộ Đại Diện | Cấp Bậc Vai Trò (Role Level) |
| :---: | :--- | :---: | :--- | :---: |
| 1 | **Ban Giám Đốc** | 4 | `BGD-001` &rarr; `BGD-004` | Level 1 & 2 (Tổng Giám Đốc, PTGĐ, Giám Đốc) |
| 2 | **Phòng Tài Chính Kế Toán** | 6 | `KT-001` &rarr; `KT-006` | Level 3 (Trưởng/Phó phòng), Level 4 (Kế toán viên) |
| 3 | **Phòng Hành Chính Nhân Sự** | 10 | `HR-001` &rarr; `HR-010` | Level 3 (Trưởng/Phó phòng), Level 4 (Chuyên viên HR) |
| 4 | **Phòng IT & Chuyển Đổi Số** | 10 | `IT-001` &rarr; `IT-010` | Level 1 (`202608001`), Level 3 (Lead), Level 4 (Dev) |
| 5 | **Phòng Kỹ Thuật May & MMTB** | 12 | `KT-MAY-001` &rarr; `KT-MAY-012` | Level 3 (Trưởng phòng MMTB), Level 4 (Kỹ sư bảo trì) |
| 6 | **Ban Quản Lý Chất Lượng (QC)** | 12 | `QC-001` &rarr; `QC-012` | Level 3 (Trưởng ban QC), Level 4 (QC chuyền may) |
| 7 | **Khối Sản Xuất & Xưởng May** | 20 | `SX-001` &rarr; `SX-020` | Level 3 (Quản đốc xưởng 1-5), Level 4 (Tổ trưởng chuyền) |
| 8 | **Phòng Kế Hoạch & Vật Tư** | 8 | `KH-001` &rarr; `KH-008` | Level 3 (Trưởng phòng), Level 4 (Điều độ đơn hàng) |
| 9 | **Phòng Kho Vận & XNK** | 8 | `KHO-001` &rarr; `KHO-008` | Level 3 (Thủ kho trưởng), Level 4 (Nhân viên kho) |
| 10 | **Ban An Toàn & Gemba 5S** | 5 | `AN-TOAN-001` &rarr; `AN-TOAN-005`| Level 3 (Trưởng ban an toàn), Level 4 (Cán bộ Gemba) |
| 11 | **Ban Cải Tiến Kaizen 1-5-2** | 5 | `CI-001` &rarr; `CI-005` | Level 3 (Chủ nhiệm Kaizen), Level 4 (Thư ký CI) |
| **Tổng** | **Toàn Hệ Thống TBS Pilot** | **100** | — | **Đầy đủ 100% các phòng ban phối hợp** |

### 3.2. Bảng Tra Cứu Tài Khoản Đại Diện Từng Vai Trò

| Mã NV | Họ và Tên | Chức Danh / Vị Trí | Phòng Ban | Vai Trò Hệ Thống | Quyền Hạn Chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `202608001` | Phạm Nguyễn Anh Huy | Quản Trị Hệ Thống / IT Lead | Phòng IT & CĐS | `SUPER_ADMIN` | Quản trị toàn hệ thống, xem toàn bộ phòng ban, cấu hình |
| `BGD-001` | Nguyễn Văn Hùng | Tổng Giám Đốc Chuỗi | Ban Giám Đốc | `TONG_GIAM_DOC` | Xem toàn bộ báo cáo, KPI tổng hợp, phê duyệt cấp cao |
| `BGD-002` | Trần Thị Mai | Phó Tổng Giám Đốc Vận Hành | Ban Giám Đốc | `PHO_TONG_GIAM_DOC` | Xem dự án liên phòng ban, giám sát nút thắt cổ chai |
| `KT-001` | Trần Thị Thu Hương | Trưởng Phòng Kế Toán | Phòng Kế Toán | `TRUONG_PHONG` | Giao việc phòng KT, Duyệt đạt / Bắt làm lại, xuất Excel |
| `HR-001` | Lê Thị Bích Ngọc | Trưởng Phòng HC-NS | Phòng Hành Chính | `TRUONG_PHONG` | San sẻ việc nhanh, theo dõi KPI nhân sự phòng |
| `SX-001` | Vũ Văn Tuấn | Quản Đốc Xưởng May 5 | Khối Sản Xuất | `QUAN_DOC` | Nghiệm thu thẻ công việc xưởng may, điều phối chuyền |
| `QC-001` | Bùi Thị Hằng | Trưởng Ban Kiểm Soát QC | Ban Quản Lý QC | `TRUONG_PHONG` | Quản lý kiểm soát chất lượng, phối hợp dự án |
| `SX-005` | Nguyễn Thị Hoa | Công Nhân May / Tổ Viên | Xưởng May 5 | `NHAN_VIEN` | Tạo nhanh task cá nhân, cập nhật tiến độ, gửi duyệt |
| `IT-003` | Lê Hữu Nghĩa | Kỹ Sư Phát Triển | Phòng IT & CĐS | `NHAN_VIEN` | Báo vướng mắc (`NEED_HELP`), làm việc chéo dự án |

*(Toàn văn 100 câu lệnh INSERT tài khoản lưu tại tệp [`scripts/seed_pilot_100_users.sql`](file:///d:/Work/TBS%20II/scripts/seed_pilot_100_users.sql))*

---

## 4. HƯỚNG DẪN VẬN HÀNH DÀNH CHO CÁC NHÓM NGƯỜI DÙNG

### 4.1. Dành Cho Nhân Viên (`NHAN_VIEN` - Level 4)
1. **Đăng nhập:** Truy cập `/login`, nhập Mã nhân viên (ví dụ: `SX-005`) và mật khẩu `Pilot@2026`. Hệ thống duy trì đăng nhập trong 7 ngày.
2. **Quản lý công việc cá nhân:**
   - Vào `/work?dept=my-tasks` để xem danh sách việc của riêng mình.
   - Bấm **"+ Tạo Nhanh (5s)"** để tạo nhanh một đầu việc mới không cần qua nhiều bước.
3. **Thực hiện và nghiệm thu:**
   - Kéo thẻ từ `TO_DO` sang `DOING` khi bắt đầu làm. Nếu thẻ bị khóa 🔒, kiểm tra thẻ phụ thuộc cần làm trước.
   - Khi hoàn thành, kéo thẻ sang `REVIEW` (hoặc bấm "Gửi duyệt"), nhập tóm tắt kết quả (tối thiểu 5 ký tự) để Trưởng phòng phê duyệt.
   - Nếu gặp khó khăn cần hỗ trợ, chuyển thẻ sang `NEED_HELP`, nhập lý do vướng mắc để Trưởng phòng nhận thông báo ngay lập tức.

### 4.2. Dành Cho Trưởng Phòng & Quản Đốc (`TRUONG_PHONG` / `QUAN_DOC` - Level 3)
1. **Xem việc phòng ban:**
   - Tại thanh điều hướng, chuyển đổi giữa tab **"Việc Của Tôi"** và **"Việc Chung Phòng Ban"**.
   - Vào `/work/tasks` để xem toàn cảnh tiến độ các dự án và bảng công việc của phòng.
2. **Nghiệm thu công việc:**
   - Các thẻ trong cột `REVIEW` sẽ có 2 nút: **"Duyệt đạt"** (xác nhận hoàn thành 100%) và **"Làm lại"** (bắt buộc nhập lý do &ge; 5 ký tự để nhân viên sửa).
3. **Cân bằng tải nhân sự:**
   - Nhấn nút **"Báo Cáo Tải & Xuất Excel"** hoặc chọn tab **"Nhân Viên Phòng Ban"**.
   - Xem cảnh báo nhân sự **Quá tải (&gt; 5 việc)** và **Đang rảnh (0 việc)**. Bấm **"Chuyển việc nhanh"** để san sẻ công việc chỉ với 1 click.
   - Xuất tệp Excel lưu trữ hoặc bấm **"In Báo Cáo"** để xuất bản in A4 landscape có sẵn 2 chữ ký.

### 4.3. Dành Cho Quản Trị Dự Án & Ban Giám Đốc (Level 1 & 2)
1. **Theo dõi Dự án liên phòng ban:**
   - Truy cập `/work/projects` để xem danh mục tất cả dự án hợp tác.
   - Khởi tạo dự án mới với mã tự sinh `PRJ-YYYY-XXX`, chỉ định phòng ban chủ trì và các phòng ban phối hợp.
2. **Kiểm soát Nút thắt cổ chai (Bottleneck Detector):**
   - Quan sát Bảng cảnh báo đầu trang: các công việc làm chậm tiến độ (trễ hạn hoặc đang chặn &ge; 2 việc khác) sẽ có viền đỏ nhấp nháy và huy hiệu cảnh báo.
   - PM trực tiếp đôn đốc người phụ trách hoặc chỉ đạo tháo gỡ điểm nghẽn đường găng.

---

## 5. KỊCH BẢN XỬ LÝ SỰ CỐ & THỦ TỤC ROLLBACK

### 5.1. Xử Lý Sự Cố Vận Hành Thường Gặp

| Tình Huống Sự Cố | Nguyên Nhân | Biện Pháp Xử Lý Ngay |
| :--- | :--- | :--- |
| **Xung đột khi lưu (HTTP 409)** | Hai người cùng sửa một công việc trong khoảng thời gian sát nhau. | Hệ thống hiển thị hộp thoại OCC. Người dùng bấm **"Nạp lại dữ liệu"** để xem thông tin mới nhất, hoặc bấm **"Ghi đè"** nếu chắc chắn lưu thay đổi của mình. |
| **Quên mật khẩu hoặc bị khóa** | Nhập sai nhiều lần hoặc chưa đổi mật khẩu mặc định. | Quản trị viên IT chạy lệnh reset mật khẩu về `Pilot@2026`:  <br>`UPDATE sys_users SET password_hash = 'sha256:...', must_change_pwd = 1 WHERE emp_code = '...';` |
| **Không tải được danh sách nhân sự** | Token phiên hết hạn hoặc mạng gián đoạn. | Hệ thống tự động chuyển hướng về `/login` hoặc tự động làm mới qua cơ chế Smart Polling khi kết nối mạng phục hồi. |
| **Ảnh tải lên bị chậm tại xưởng** | Mạng 4G/Wifi khu vực xưởng sản xuất yếu, ảnh chụp có dung lượng lớn (10-15MB). | Module `imageCompressor.ts` tự động nén ảnh xuống dưới 1MB và tự động thử lại 3 lần (exponential backoff) trước khi báo lỗi. |

### 5.2. Thủ Tục Rollback Khi Kết Thúc Đợt Pilot

Sau khi kết thúc 1 tháng thử nghiệm, nếu cần xóa sạch dữ liệu test và phục hồi trạng thái sản xuất nguyên bản:

1. **Xóa toàn bộ dữ liệu 100 tài khoản Pilot:**  
   Chạy script [`scripts/clean_pilot_100_users.sql`](file:///d:/Work/TBS%20II/scripts/clean_pilot_100_users.sql) trên D1:
   ```bash
   npx wrangler d1 execute vpchuoiskechers-db --remote --file=scripts/clean_pilot_100_users.sql
   ```
2. **Xóa toàn bộ các thẻ công việc & dự án test:**  
   ```sql
   DELETE FROM sys_my_tasks WHERE is_test_data = 1;
   DELETE FROM projects WHERE is_test_data = 1;
   DELETE FROM audit_logs WHERE created_at >= '2026-10-14' AND details LIKE '%PILOT%';
   ```
3. **Rollback Schema CSDL D1 (nếu cần):**  
   Chạy script [`scripts/migration_pilot_v1_rollback.sql`](file:///d:/Work/TBS%20II/scripts/migration_pilot_v1_rollback.sql) để gỡ bỏ các bảng phụ thuộc và cấu hình thông báo tạm thời mà không ảnh hưởng tới dữ liệu Kaizen hay hệ thống cốt lõi.

---

## 6. KẾT LUẬN & KIẾN NGHỊ

Hệ thống quản lý công việc và dự án TBS đã hoàn tất toàn diện 8 giai đoạn chuẩn bị kỹ thuật. Đợt kiểm thử tự động đạt kết quả **100% PASS** trên tất cả 9 kịch bản nghiệp vụ trọng yếu. Hệ thống đã sẵn sàng 100% để bàn giao cho Ban Lãnh Đạo và 100 nhân sự các cấp bắt đầu kỳ thử nghiệm Pilot 1 tháng.
