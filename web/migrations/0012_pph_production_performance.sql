-- ============================================================
-- MIGRATION 0012: PPH — HIỆU SUẤT NHÀ MÁY (PRODUCTION PERFORMANCE)
-- ============================================================
-- Toàn bộ bảng dùng bởi handlePph() trong public/_worker.js (được port từ
-- thkiengiangshoes, xem ProductionPerformanceModule.tsx + PphSettingsView.tsx).
-- Worker cũng tự chạy các CREATE TABLE IF NOT EXISTS / ALTER TABLE này ở lần
-- gọi API đầu tiên (idempotent, an toàn chạy lại) — file này chỉ để soát trước
-- khi áp lên D1 production (vpchuoiskechers-db) và giữ lịch sử migration.
-- Tất cả bảng bắt đầu RỖNG — Admin tự tạo cây Nhà máy/Xưởng/Line/Tổ qua "Cài Đặt".

-- 1. SẢN LƯỢNG THEO GIỜ (mỗi khung giờ 1 dòng, upsert theo team_id+entry_date+slot)
CREATE TABLE IF NOT EXISTS pph_entries (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  slot TEXT NOT NULL,
  worker_count INTEGER,
  model TEXT,
  planned_qty INTEGER,
  actual_qty INTEGER,
  submitted_by TEXT,
  submitted_at TEXT NOT NULL,
  UNIQUE(team_id, entry_date, slot)
);
ALTER TABLE pph_entries ADD COLUMN target_rft REAL;
ALTER TABLE pph_entries ADD COLUMN shortfall_reason TEXT;
ALTER TABLE pph_entries ADD COLUMN shortfall_solution TEXT;
ALTER TABLE pph_entries ADD COLUMN production_hours REAL;
ALTER TABLE pph_entries ADD COLUMN shortfall_cause_group TEXT;
ALTER TABLE pph_entries ADD COLUMN shortfall_cause_sub TEXT;
ALTER TABLE pph_entries ADD COLUMN error_count INTEGER;

-- 2. RÀNG BUỘC THỜI GIAN — giờ mở/đóng của từng khung (9 khung PPH_SLOTS)
CREATE TABLE IF NOT EXISTS pph_slot_windows (
  slot TEXT PRIMARY KEY,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

-- 3. CÂY TỔ CHỨC Nhà máy > Xưởng > Chuyền > Tổ — Admin tự tạo qua Cài Đặt, RỖNG lúc đầu
CREATE TABLE IF NOT EXISTS pph_org (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT,
  order_num INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
ALTER TABLE pph_org ADD COLUMN image_url TEXT;
ALTER TABLE pph_org ADD COLUMN paused INTEGER NOT NULL DEFAULT 0;

-- 4. NHÓM NGUYÊN NHÂN HỤT CHỈ TIÊU (5M1E) — worker tự seed danh mục mặc định lần đầu
CREATE TABLE IF NOT EXISTS pph_shortfall_causes (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 5. CẤU HÌNH DASHBOARD — Line hiển thị (gộp điểm quét), thành viên Line, cấu hình Nhà máy
CREATE TABLE IF NOT EXISTS pph_dashboard_lines (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS pph_line_members (
  leaf_id TEXT PRIMARY KEY,
  line_id TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pph_factory_config (
  factory_id TEXT PRIMARY KEY,
  target_pph_pct REAL,
  title TEXT,
  gddh TEXT,
  qlcl TEXT,
  th TEXT,
  updated_at TEXT
);

-- 6. LINK TV RÚT GỌN — /tv/<mã> redirect sang /pph-view* (get-or-create theo targetId+targetType)
CREATE TABLE IF NOT EXISTS pph_tv_short_links (
  code TEXT PRIMARY KEY,
  line_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pph_tv_short_links_line_id ON pph_tv_short_links(line_id);
ALTER TABLE pph_tv_short_links ADD COLUMN target_type TEXT NOT NULL DEFAULT 'line';

-- 7. CHIẾU ẢNH/VIDEO XEN KẼ TRÊN TV THEO KHUNG GIỜ
CREATE TABLE IF NOT EXISTS pph_tv_media_slots (
  id TEXT PRIMARY KEY,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  target_line_ids TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 8. ẢNH THEO MÃ MODEL (mã giày) — đọc công khai (dashboard + /pph-scan), ghi ở Cài Đặt
CREATE TABLE IF NOT EXISTS pph_shoe_models (
  code TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 9. PPH CHUẨN theo mã giày (IE cung cấp) — chỉ hiện ô "PPH" mục tiêu trên thẻ Tổ
CREATE TABLE IF NOT EXISTS pph_shoe_pph_targets (
  code TEXT PRIMARY KEY,
  pph_dau_vao_kg12 REAL,
  pph_dau_vao_kg3 REAL,
  pph_may_kg12 REAL,
  pph_may_kg3 REAL,
  pph_go REAL,
  updated_at TEXT NOT NULL
);

-- 10. CACHE ĐỌC cho GET /api/pph/dashboard (stale-while-revalidate, TTL ngắn) — bảng dùng chung,
--     KHÔNG cần seed, worker tự dọn theo cache_key.
CREATE TABLE IF NOT EXISTS pph_cache (
  cache_key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
