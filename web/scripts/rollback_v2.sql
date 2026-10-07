-- ROLLBACK SCRIPT
-- Mục đích: Xóa hoàn toàn các bảng mới để quay về trạng thái chỉ có bảng legacy.
-- Bảng legacy (sys_my_tasks, task_boards, task_lists, task_cards) KHÔNG bị xóa.
-- Chạy trên STAGING. Chỉ dùng trên production nếu được duyệt riêng.

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS project_members;
