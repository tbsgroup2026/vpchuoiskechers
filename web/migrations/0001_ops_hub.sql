-- ============================================================
-- TBS OPS HUB — Schema cho "Phòng ban & công cụ điều hành",
-- form Đăng ký đi công tác, Quản lý phòng họp và các danh mục
-- combobox liên quan. Chạy được cả trên D1 (production) lẫn
-- SQLite cục bộ (local dev) vì D1 dùng chung dialect SQLite.
-- ============================================================

-- ── 1. TRANG CHỦ: PHÒNG BAN & ỨNG DỤNG ──────────────────────
CREATE TABLE IF NOT EXISTS ops_departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ops_apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER NOT NULL REFERENCES ops_departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'app',
  href TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 2. DANH MỤC COMBOBOX (mỗi loại 1 bảng riêng) ────────────
CREATE TABLE IF NOT EXISTS zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS factories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bo_phan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS work_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS travel_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS work_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meeting_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  requires_reception INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 3. ĐĂNG KÝ ĐI CÔNG TÁC ───────────────────────────────────
CREATE TABLE IF NOT EXISTS business_trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  don_vi_xuat TEXT NOT NULL,
  khu_vuc_id INTEGER REFERENCES zones(id),
  nha_may_id INTEGER REFERENCES factories(id),
  nguoi_tao TEXT NOT NULL,
  bo_phan_id INTEGER REFERENCES bo_phan(id),
  cong_tac_tai_id INTEGER REFERENCES work_locations(id),
  hinh_thuc_id INTEGER REFERENCES travel_methods(id),
  ngay_bat_dau TEXT NOT NULL,
  so_ngay INTEGER NOT NULL DEFAULT 1,
  ngay_ket_thuc TEXT,
  muc_dich TEXT NOT NULL,
  dia_chi_cong_tac_id INTEGER REFERENCES work_addresses(id),
  ghi_chu TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
  created_by_emp_code TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  reject_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS business_trip_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL REFERENCES business_trips(id) ON DELETE CASCADE,
  ho_ten TEXT NOT NULL,
  chuc_vu TEXT NOT NULL,
  msnv TEXT NOT NULL,
  bo_phan TEXT NOT NULL,
  dien_thoai TEXT NOT NULL,
  dia_diem_don TEXT NOT NULL
);

-- ── 4. QUẢN LÝ PHÒNG HỌP ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ho_ten TEXT NOT NULL,
  bo_phan TEXT NOT NULL,
  room_id INTEGER NOT NULL REFERENCES meeting_rooms(id),
  ngay_hop TEXT NOT NULL,
  gio_bat_dau TEXT NOT NULL,
  gio_ket_thuc TEXT NOT NULL,
  hinh_thuc_hop TEXT,
  email_moi_hop TEXT,
  noi_dung TEXT,
  link_tai_lieu TEXT, -- JSON array dạng text
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
  created_by_emp_code TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  reject_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_bookings_room_date ON meeting_bookings(room_id, ngay_hop);
CREATE INDEX IF NOT EXISTS idx_business_trips_creator ON business_trips(created_by_emp_code);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_creator ON meeting_bookings(created_by_emp_code);

-- ── 5. SEED DỮ LIỆU BAN ĐẦU ──────────────────────────────────
INSERT OR IGNORE INTO ops_departments (id, name, description, image_url, sort_order) VALUES
  (1, 'R & D', 'Nghiên cứu & phát triển sản phẩm.', '/images/KGLV/PHÒNG R&D.png', 1),
  (2, 'Nhân sự & hành chánh', 'Kết nối con người, hành chính, đi công tác và đặt phòng họp.', '/images/KGLV/SẢNH GÓC TỪ TRONG NHÌN RA.png', 2),
  (3, 'CN & CI', 'Công nghệ và cải tiến liên tục.', '/images/KGLV/CĐTT 2 GÓC QUI TRÌNH GIÀY.png', 3),
  (4, 'Quản Lý Chất Lượng', 'Kiểm soát và đảm bảo chất lượng sản phẩm.', '/images/KGLV/CĐTT 1 GÓC 4 ĐÔI GIÀY.png', 4),
  (5, 'KHCB & TTPP', 'Kế hoạch cung ứng và tổng thầu phân phối.', '/images/KGLV/PHÒNG THƯ VIỆN VẬT TƯ.png', 5);

INSERT OR IGNORE INTO ops_apps (id, department_id, name, description, icon, href, is_featured, sort_order) VALUES
  (1, 2, 'Đăng ký đi công tác', 'Lập đề xuất đi công tác và danh sách người tham gia.', 'plane', '/business-trip', 1, 1),
  (2, 2, 'Quản lý phòng họp', 'Đặt lịch phòng họp theo khung giờ, tránh trùng lịch.', 'calendar', '/meeting-room', 1, 2);

INSERT OR IGNORE INTO zones (id, name) VALUES (1, 'VP Chuỗi');

INSERT OR IGNORE INTO factories (id, name, zone_id) VALUES
  (1, 'Nhà máy KG 1', 1),
  (2, 'Nhà máy KG 2', 1),
  (3, 'VP Chuỗi', 1);

INSERT OR IGNORE INTO bo_phan (id, name) VALUES
  (1, 'Nhân sự & hành chánh'),
  (2, 'R & D'),
  (3, 'CN & CI'),
  (4, 'Quản Lý Chất Lượng'),
  (5, 'KHCB & TTPP');

INSERT OR IGNORE INTO work_locations (id, name) VALUES
  (1, 'Trong nước'),
  (2, 'Nước ngoài'),
  (3, 'Nội bộ Khu vực Bình Dương');

INSERT OR IGNORE INTO travel_methods (id, name) VALUES
  (1, 'Xe công ty'),
  (2, 'Máy bay'),
  (3, 'Xe cá nhân'),
  (4, 'Khác');

INSERT OR IGNORE INTO work_addresses (id, name) VALUES
  (1, 'Văn phòng Skechers Bình Dương'),
  (2, 'Trụ sở TBS Group'),
  (3, 'Khác (ghi chú thêm)');

INSERT OR IGNORE INTO meeting_rooms (id, name, requires_reception) VALUES
  (1, 'Phòng họp A101', 0),
  (2, 'Phòng họp Ngành', 1),
  (3, 'Phòng họp VIP', 1);
