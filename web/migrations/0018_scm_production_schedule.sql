-- Bước 3 SCM: Kế hoạch sản xuất theo ngày (ngày lên chuyền may / gò)
CREATE TABLE IF NOT EXISTS scm_production_schedule (order_id TEXT PRIMARY KEY, sew_start TEXT, last_start TEXT, note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT);
