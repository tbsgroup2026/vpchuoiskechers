-- Rollback 0015: xóa các bảng module SCM Bước 1 (mất toàn bộ đơn hàng, tiến độ và cấu hình SCM)
DROP TABLE IF EXISTS scm_user_prefs;
DROP TABLE IF EXISTS scm_dept_members;
DROP TABLE IF EXISTS scm_dept_rules;
DROP TABLE IF EXISTS scm_screen_permissions;
DROP TABLE IF EXISTS scm_settings;
DROP TABLE IF EXISTS scm_handover_items;
DROP TABLE IF EXISTS scm_order_steps;
DROP INDEX IF EXISTS idx_scm_orders_site_ship;
DROP TABLE IF EXISTS scm_orders;
DROP TABLE IF EXISTS scm_suppliers;
