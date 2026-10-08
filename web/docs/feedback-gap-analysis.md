# Báo cáo Phân tích GAP (Feedback Gap Analysis)

| # | Phản hồi | Module | Hiện trạng trong code (file/hàm cụ thể) | Mức độ | Công sức | Hướng xử lý |
|---|---|---|---|---|---|---|
| **BGĐ-1** | Dashboard thấy ngay tiến độ, biểu đồ nút thắt, drill-down | Dashboard | `src/modules/dashboard/DepartmentDashboardView.tsx`, `src/app/api/dashboard/route.ts` | High | M | Bổ sung biểu đồ bottleneck, thêm link drill-down vào user/phòng. |
| **BGĐ-2** | 1-5-2: Dữ liệu realtime, tooltip giải thích, validate logic | 1-5-2 | `src/app/1-5-2/page.tsx`, `src/app/api/1-5-2/route.ts` | High | L | Lắng nghe event khi task hoàn thành để update record 1-5-2. Thêm tooltip component và zod validate. |
| **BGĐ-3** | Phê duyệt hàng loạt, gộp thông báo | HR / CI / Lớp chung | `src/modules/ci/KaizenDetailModal.tsx`, `src/lib/browserNotifications.ts` | High | M | Bọc requests thành Bulk API. Áp dụng debounce/digest cho thông báo. |
| **TP-1** | Tạo việc nhanh: template, tạo 1 dòng | Task Management | `src/modules/tasks/TaskBoardView.tsx` | Medium | M | Thêm input "Quick Add" đầu Kanban (Enter tạo ngay). |
| **TP-2** | Cảnh báo trễ deadline dự án chéo | Projects | `src/app/api/projects/route.ts` | High | M | Cần kiểm tra hạ tầng Cronjob để gửi cảnh báo khi (Deadline - Now) < 1 ngày. |
| **TP-3** | Ủy quyền công việc, duyệt thay, tự hoàn tác | HR (Trips) / Tasks | `src/app/api/business-trips/route.ts`, `src/app/api/business-trips/delegations/route.ts` | High | M | Cấu hình ủy quyền theo phòng ban, thêm `delegatedTo` (không xóa assignee gốc), có feature flag. |
| **TP-4** | Quên mật khẩu, SSO, audit log | Auth | `src/app/api/auth/route.ts`, `src/lib/kaizenDbMigration.ts` (sys_audit_logs) | High | L | Tích hợp OAuth/SSO provider, API reset mật khẩu, ghi log chi tiết login/logout. |
| **NV-1** | UX tạo việc <= 1 phút, Kanban kéo thả, sub-task, checklist | Task Management | `src/modules/tasks/TaskBoardView.tsx`, `src/app/api/task-cards/route.ts` | Medium | M | Thu gọn form, sử dụng @hello-pangea/dnd cho kéo thả, thêm checklist schema. |
| **NV-2** | Nhắc việc đa kênh, kiểm soát spam thông báo | Notification | `src/lib/bookingMapper.ts`, `src/lib/browserNotifications.ts` | Medium | M | Mở rộng service push Zalo/Teams, thêm tuỳ chọn mute/throttle thông báo. |
| **NV-3** | CN-CI: Ghi âm, chụp ảnh nhanh, timeline tiến độ, bảng xếp hạng | CN-CI (Kaizen) | `src/modules/ci/KaizenDetailModal.tsx`, `src/app/api/ci-kaizen/route.ts` | Medium | M | Tích hợp Web Audio API, UI timeline dọc cho log trạng thái, truy vấn bảng xếp hạng điểm CI. |
| **NV-4** | Đặt phòng: cảnh báo trùng lịch, gia hạn, tự nhả phòng | HR (Rooms) | `src/app/api/rooms/booking/route.ts`, `src/modules/rooms/RoomBookingView.tsx` | High | L | Query kiểm tra giao cắt thời gian (overlap), worker nhả phòng nếu 15p ko check-in. |
| **Bảo mật** | Phân quyền tài liệu dự án liên phòng | Projects / API | `src/app/api/projects/route.ts`, `src/app/api/files/[id]/route.ts` | **Blocker** | M | Kiểm tra quyền truy cập ở tầng service. Dùng signed URL, chặn nội dung notification leak data. |
| **Kỹ thuật** | Hiệu năng bảng tasks (phân trang, loại N+1, virtual scroll) | Task Management | `src/app/api/tasks/route.ts`, `src/modules/tasks/TaskBoardView.tsx` | High | L | Sửa query N+1, thêm limit/offset, tạo index DB, dùng thư viện `react-window` ở UI. |
| **Kỹ thuật** | Workflow tự chuyển trạng thái | Task Management | `src/app/api/tasks/[id]/route.ts` | High | L | Rule-based engine đổi trạng thái task (vd: To Do -> In Progress khi kéo thả). |
| **Kỹ thuật** | Xử lý mạng yếu, lưu nháp (Offline) | Lớp chung | `public/sw.js`, `src/app/layout.tsx` | High | M | PWA Service Worker background sync, dùng IndexedDB lưu nháp form (react-hook-form persist). |
