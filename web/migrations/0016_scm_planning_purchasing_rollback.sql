-- Rollback 0016: xóa bảng Bước 2 (cột thêm vào scm_orders giữ lại; SQLite cũ không DROP COLUMN an toàn)
DROP TABLE IF EXISTS scm_uploaded_forms;
DROP TABLE IF EXISTS scm_incidents;
DROP TABLE IF EXISTS scm_inbound_plan;
DROP TABLE IF EXISTS scm_purchase_orders;
DROP TABLE IF EXISTS scm_plan_changes;
DROP TABLE IF EXISTS scm_plant_capacity;
DROP TABLE IF EXISTS scm_allocation_lines;
DROP TABLE IF EXISTS scm_allocation_plans;
