# 🛡️ BÁO CÁO KIỂM THỬ TỰ ĐỘNG ĐA VAI TRÒ & KẾT QUẢ VÁ LỖI TOÀN DIỆN
*(AUTOMATED MULTI-ROLE QA & SECURITY VERIFICATION REPORT)*

- **Hệ thống:** TBS Group II - Văn Phòng Chuỗi Skechers Platform
- **Thời gian thực hiện:** 2026-10-14 20:47:54
- **Chức năng được kiểm thử:**
  1. **Công việc cá nhân** (*Personal Tasks / My Tasks*)
  2. **Bảng công việc phòng ban** (*Department Task Board & Kanban*)
  3. **Dự án Liên phòng ban** (*Cross-Department Projects & Bottlenecks*)
- **Phân cấp vai trò kiểm thử (Multi-Role Hierarchy):**
  - 👑 **Cấp cao:** Tổng Giám Đốc / Ban Giám Đốc (`roleLevel <= 2`, tài khoản: `TGĐ-001` - Nguyễn Đức Thuấn, `200405004` - Trần Văn Quản Trị)
  - 👔 **Cấp trung:** Trưởng phòng (`roleLevel === 3`, tài khoản: `202608001` - Phạm Nguyễn Anh Huy [IT], `LG-001` - Trần Văn Thắng [Logistics])
  - 👷 **Cấp thấp:** Nhân viên / CBCNV (`roleLevel >= 4`, tài khoản: `BT-001` - Bùi Thị Thúy [Bảo trì], `202206011` - Lê Thị Thu [Lễ tân])

---

## 📊 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

| Tổng số kịch bản | Đạt (PASS) | Thất bại (FAIL) | Tỷ lệ thành công | Tình trạng vá lỗi |
| :---: | :---: | :---: | :---: | :---: |
| **15** | **15** | **0** | **100%** | **ĐÃ VÁ HOÀN TẤT & XÁC THỰC** |

---

## 🧪 2. BẢNG CHI TIẾT KẾT QUẢ KIỂM THỬ THEO VAI TRÒ & MODULE

| Mã kịch bản | Vai trò tài khoản | Module chức năng | Tên kịch bản kiểm thử | Hành vi & Kết quả mong đợi | Trạng thái | Đánh giá & Phân tích an toàn |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TASK-01** | Nhân viên (`BT-001`, Level 4) | Công việc cá nhân | Cách ly dữ liệu cá nhân nghiêm ngặt | Chỉ trả về task do mình làm hoặc mình tạo | **✅ PASS** | Nhân viên bị khóa cứng chỉ xem được công việc của chính mình, không thấy công việc người khác. |
| **TASK-02** | Nhân viên (`BT-001`, Level 4) | Công việc cá nhân | Chống BOLA / IDOR qua Query Params | Trả về danh sách rỗng `[]` khi query trộm | **✅ PASS** | Chặn đứng việc nhân viên cố tình đổi URL thành `?assignee_emp_code=200405004` để xem task Ban Giám Đốc. |
| **TASK-03** | Nhân viên (`BT-001`, Level 4) | Công việc cá nhân | Chặn chỉnh sửa task đồng nghiệp (BOLA) | `403 FORBIDDEN` khi gửi PATCH task người khác | **✅ PASS** | Nhân viên cố ý PATCH task không thuộc quyền sở hữu bị hệ thống từ chối lập tức với mã 403. |
| **TASK-04** | Nhân viên (`BT-001`, Level 4) | Công việc cá nhân | Chặn xóa công việc của đồng nghiệp | `403 FORBIDDEN` khi gọi DELETE task người khác | **✅ PASS** | Nhân viên chỉ có quyền xóa công việc do chính mình tạo ra, không được xóa công việc của người khác. |
| **TASK-05** | Nhân viên (`BT-001`, Level 4) | Công việc cá nhân | Ràng buộc mô tả nghiệm thu (DONE) | `400 BAD REQUEST` nếu thiếu mô tả kết quả | **✅ PASS** | Chặn tự ý bấm DONE nếu thiếu `result_description` và chặn nhân viên tự duyệt nếu không có quyền nghiệm thu. |
| **BOARD-01** | Nhân viên (`BT-001`, Level 4) | Bảng công việc PB | Chặn nhân viên tạo bảng phòng ban | `403 FORBIDDEN` khi POST `type=department` | **✅ PASS** | Nhân viên bị cấm tạo bảng phòng ban. Chỉ có quyền tạo bảng cá nhân (`type=personal`). |
| **BOARD-02** | Nhân viên (`BT-001`, Level 4) | Bảng công việc PB | Cách ly bảng cá nhân (IDOR Protection) | Bảng cá nhân cô lập theo `owner_id` | **✅ PASS** | Bảng cá nhân được lọc chặt theo `WHERE type = 'personal' AND owner_id = ?`, không bị lộ cho người khác. |
| **BOARD-03** | Nhân viên (`BT-001`, Level 4) | Bảng công việc PB | Phân quyền xóa bảng công việc (DELETE) | `403 FORBIDDEN` nếu xóa bảng phòng ban | **✅ PASS** | Nhân viên chỉ được xóa bảng cá nhân của mình, bị chặn 403 nếu cố tình xóa bảng phòng ban. |
| **BOARD-04** | Nhân viên (`BT-001`, Level 4) | Bảng công việc PB | Kiểm soát truy cập thẻ công việc (Cards) | `403 FORBIDDEN` nếu truy cập thẻ bảng khác | **✅ PASS** | Thẻ công việc được kiểm soát chặt theo `board_id`, chống người ngoài phòng ban đọc/sửa thẻ. |
| **PRJ-01** | Nhân viên (`BT-001`, Level 4) | Dự án Liên phòng ban | Chặn nhân viên tạo dự án liên phòng ban | `403 FORBIDDEN` khi gọi `POST /api/projects` | **✅ PASS** | Nhân viên cấp thấp (Level 4) bị từ chối 403 Forbidden khi cố gắng tự tạo Dự Án Liên Phòng Ban. |
| **PRJ-02** | Nhân viên (`BT-001`, Level 4) | Dự án Liên phòng ban | Chặn nhân viên xóa dự án liên phòng ban | `403 FORBIDDEN` khi gọi `DELETE /api/projects` | **✅ PASS** | Nhân viên bị cấm tuyệt đối quyền xóa dự án. Trưởng phòng chỉ xóa dự án mình làm Chủ nhiệm (PM). |
| **PRJ-03** | Trưởng phòng (`202608001`, Level 3) | Dự án Liên phòng ban | Phạm vi xem dự án của Trưởng phòng | Xem dự án chủ trì, phối hợp hoặc làm PM | **✅ PASS** | Trưởng phòng xem toàn diện các dự án liên quan đến phòng ban của mình và các dự án do mình quản lý. |
| **PRJ-04** | Tổng Giám Đốc (`TGĐ-001`, Level 1) | Dự án Liên phòng ban | Tầm nhìn giám sát toàn diện của TGĐ | Toàn quyền xem tất cả dự án & Bottlenecks | **✅ PASS** | Tổng Giám Đốc và Ban Giám Đốc toàn quyền xem và quản lý tất cả các dự án liên phòng ban toàn tập đoàn. |
| **UI-01** | Nhân viên (`BT-001`, Level 4) | Dự án Liên phòng ban | Kiểm soát giao diện (UI Action Guard) | Vô hiệu hóa nút tạo dự án trên giao diện | **✅ PASS** | Nút `+ Khởi Tạo Dự Án Mới` tự động khóa với nhân viên và hiển thị huy hiệu `Chỉ Cấp Quản Lý tạo dự án`. |
| **SYNC-01** | Toàn hệ thống | Cloudflare Worker | Đồng bộ API Edge & Next.js Routes | Đạt 100% tính tương thích và bảo mật | **✅ PASS** | Cloudflare Pages Functions (`_worker.js`) đạt 100% đồng bộ tính năng & bảo mật với Next.js API Routes. |

---

## 🛠️ 3. CÁC LỖ HỔNG NGUY HIỂM ĐÃ ĐƯỢC PHÁT HIỆN & VÁ TOÀN DIỆN

### 1. Module "Công việc cá nhân" (Personal Tasks / My Tasks)
1. **Lỗ hổng BOLA / IDOR trong `GET /api/tasks`:**
   - *Hiện trạng trước khi vá:* Khi nhân viên gửi request với tham số `?scope=ALL` hoặc `?scope=DEPT_ONLY`, nhánh `if (filterScope === 'MY_ONLY')` bị bỏ qua. Hệ thống lọt vào bộ lọc query chung và trả về toàn bộ công việc của Ban Giám Đốc hoặc toàn bộ công ty.
   - *Giải pháp đã vá:* Cấu hình nhánh cưỡng chế (`roleLevel >= 4`): Bất kể tham số query là gì, nhân viên chỉ xem được công việc của chính mình (`assignee_emp_code = empCode OR reporter_emp_code = empCode`). Nếu query `requestedAssignee !== session.empCode`, trả về danh sách rỗng `[]`.
2. **Lỗ hổng BOLA trong `PATCH /api/tasks`:**
   - *Hiện trạng trước khi vá:* Bất kỳ nhân viên nào có mã `taskId` đều có thể gửi request đổi trạng thái, tiến độ của đồng nghiệp hoặc lãnh đạo.
   - *Giải pháp đã vá:* Thêm RBAC check: Nhân viên (`roleLevel >= 4`) chỉ được phép sửa công việc nếu mình là Assignee, Reporter hoặc Reviewer. Trưởng phòng (`roleLevel === 3`) chỉ được sửa công việc thuộc phòng ban của mình.
3. **Lỗ hổng thiếu phân quyền trong `DELETE /api/tasks`:**
   - *Hiện trạng trước khi vá:* Bất kỳ ai gửi request xóa task đều được thực thi không cần kiểm tra quyền sở hữu.
   - *Giải pháp đã vá:* Thêm RBAC check: Nhân viên chỉ có thể xóa công việc do chính mình tạo ra (`reporter_emp_code === session.empCode`). Trưởng phòng chỉ xóa công việc thuộc phòng ban mình.

### 2. Module "Bảng công việc phòng ban" (Department Task Board & Kanban)
1. **Lỗ hổng rò rỉ bảng cá nhân giữa các nhân viên:**
   - *Hiện trạng trước khi vá:* Câu truy vấn cũ dùng `WHERE owner_id = ? OR type = 'personal'`, làm cho tất cả bảng có `type = 'personal'` của mọi người trong công ty bị phơi bày cho bất kỳ ai truy cập.
   - *Giải pháp đã vá:* Sửa câu truy vấn thành: `WHERE (type = 'personal' AND owner_id = ?) OR (type = 'department' AND department_id = ?)`. Cách ly hoàn toàn bảng cá nhân.
2. **Lỗ hổng tạo bảng phòng ban trái thẩm quyền:**
   - *Hiện trạng trước khi vá:* Nhân viên có thể gửi POST với `type: 'department'` để tạo bảng phòng ban.
   - *Giải pháp đã vá:* Thêm kiểm tra: nếu `userRoleLevel >= 4 && type === 'department'`, từ chối ngay với `403 FORBIDDEN`.
3. **Thiếu endpoint xóa bảng và kiểm soát thẻ công việc:**
   - *Giải pháp đã vá:* Thêm `DELETE /api/task-boards` và `DELETE /api/task-cards` có phân quyền chặt chẽ; thêm bước xác thực quyền sở hữu `board_id` trước khi trả về thẻ hoặc cho phép thêm/sửa/xóa thẻ.

### 3. Module "Dự án Liên phòng ban" (Cross-Department Projects Workspace)
1. **Lỗ hổng nhân viên tự tạo và xóa dự án:**
   - *Hiện trạng trước khi vá:* API `POST /api/projects` không kiểm tra `roleLevel`, cho phép bất kỳ nhân viên nào cũng tạo được dự án cấp công ty.
   - *Giải pháp đã vá:* Bổ sung RBAC check chặn nhân viên (`roleLevel >= 4`) nhận `403 FORBIDDEN` khi gọi POST hoặc DELETE dự án.
2. **Bảo vệ trên giao diện người dùng (UI Action Guard):**
   - *Giải pháp đã vá:* Trong `ProjectWorkspaceView.tsx`, kiểm tra quyền người dùng (`canCreateProject`). Đối với tài khoản nhân viên, nút `+ Khởi Tạo Dự Án Mới` tự động chuyển thành nhãn vô hiệu hóa có biểu tượng ổ khóa: `Chỉ Cấp Quản Lý tạo dự án`.
3. **Đồng bộ hóa 100% giữa Cloudflare Worker & Next.js:**
   - Đã bổ sung đầy đủ các method `GET`, `POST`, `PATCH`, `DELETE` cho `/api/projects`, `/api/task-boards`, và `/api/task-cards` trong `web/public/_worker.js`.

---

## 🚀 4. HƯỚNG DẪN CHẠY BỘ TEST TRÊN MỌI MÔI TRƯỜNG

1. **Chạy kiểm thử trực tiếp lên môi trường Cloudflare Worker (Production):**
   ```powershell
   powershell -ExecutionPolicy Bypass -File tests/multi_role_tasks_projects_tester.ps1 -TargetUrl "https://vpchuoiskechers.tbsgroup2026.workers.dev"
   ```

2. **Chạy kiểm thử trên môi trường Dev cục bộ:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File tests/multi_role_tasks_projects_tester.ps1 -TargetUrl "http://localhost:3000"
   ```

3. **Chạy kiểm thử tĩnh (Offline Code Audit & Contract Suite):**
   ```powershell
   powershell -ExecutionPolicy Bypass -File tests/multi_role_tasks_projects_tester.ps1 -OfflineValidation
   ```
