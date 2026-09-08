-- Migration 0008: Gemba.Pro Module Database Tables & Master Data (Updated for Strict State Machine)
-- Version: 2026-09-07

-- 1. MASTER FACTORIES TABLE
CREATE TABLE IF NOT EXISTS gemba_factories (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. MASTER WORKSHOPS TABLE (Phân xưởng - PX)
CREATE TABLE IF NOT EXISTS gemba_workshops (
    id TEXT PRIMARY KEY,
    factory_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES gemba_factories(id) ON DELETE CASCADE
);

-- 3. MASTER LINES TABLE (Line / Dây chuyền)
CREATE TABLE IF NOT EXISTS gemba_lines (
    id TEXT PRIMARY KEY,
    workshop_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workshop_id) REFERENCES gemba_workshops(id) ON DELETE CASCADE
);

-- 4. MASTER TEAMS TABLE (Tổ công đoạn)
CREATE TABLE IF NOT EXISTS gemba_teams (
    id TEXT PRIMARY KEY,
    line_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (line_id) REFERENCES gemba_lines(id) ON DELETE CASCADE
);

-- 5. MASTER CATEGORIES TABLE (Danh mục vấn đề Gemba)
CREATE TABLE IF NOT EXISTS gemba_categories (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. SEQUENCE TABLE FOR ATOMIC CODE GENERATION (GB-2026-XXXX)
CREATE TABLE IF NOT EXISTS gemba_sequences (
    year INTEGER PRIMARY KEY,
    last_number INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. CORE GEMBA RECORDS TABLE
CREATE TABLE IF NOT EXISTS gemba_records (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL,
    priority TEXT DEFAULT 'TRUNG_BINH', -- CAO, TRUNG_BINH, THAP
    status TEXT DEFAULT 'NEW', -- NEW, PROCESSING, WAITING_CONFIRMATION, COMPLETED (Note: Overdue is computed dynamically)
    factory_id TEXT NOT NULL,
    workshop_id TEXT NOT NULL,
    line_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    created_by_emp_code TEXT NOT NULL,
    created_by_name TEXT,
    assigned_to_emp_code TEXT,
    assigned_to_name TEXT,
    assigned_group TEXT,
    due_at DATETIME,
    closed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES gemba_categories(id),
    FOREIGN KEY (factory_id) REFERENCES gemba_factories(id),
    FOREIGN KEY (workshop_id) REFERENCES gemba_workshops(id),
    FOREIGN KEY (line_id) REFERENCES gemba_lines(id),
    FOREIGN KEY (team_id) REFERENCES gemba_teams(id)
);

-- 8. USER GEMBA SCOPE MAPPING (Links to existing users table via emp_code)
CREATE TABLE IF NOT EXISTS gemba_user_scopes (
    id TEXT PRIMARY KEY,
    emp_code TEXT NOT NULL,
    factory_id TEXT,
    workshop_id TEXT,
    line_id TEXT,
    team_id TEXT,
    gemba_role TEXT NOT NULL DEFAULT 'OPERATOR', -- ADMIN, GĐ_NHÀ_MÁY, CN_CI_KHU_VỰC, QLCL_KHU_VỰC, MMTB_KHU_VỰC, ĐỐC_CÔNG, QLCL_PX, TRƯỞNG_LINE, TỔ_TRƯỞNG, OPERATOR
    mmtb_token TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emp_code) REFERENCES users(emp_code) ON DELETE CASCADE
);

-- 9. BUSINESS HISTORY TABLE
CREATE TABLE IF NOT EXISTS gemba_history (
    id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- CREATE, ASSIGN, ACCEPT, SUBMIT_CONFIRMATION, APPROVE, REJECT
    old_status TEXT,
    new_status TEXT,
    note TEXT,
    performed_by TEXT NOT NULL,
    performed_by_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES gemba_records(id) ON DELETE CASCADE
);

-- 10. ATTACHMENTS / PHOTOS TABLE (Cloudflare R2 Objects)
CREATE TABLE IF NOT EXISTS gemba_attachments (
    id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL,
    r2_object_key TEXT NOT NULL,
    url TEXT NOT NULL,
    file_type TEXT DEFAULT 'image/jpeg',
    file_size INTEGER DEFAULT 0,
    uploaded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES gemba_records(id) ON DELETE CASCADE
);

-- 11. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_gemba_records_factory_ws ON gemba_records(factory_id, workshop_id, line_id, team_id);
CREATE INDEX IF NOT EXISTS idx_gemba_records_status_due ON gemba_records(status, due_at);
CREATE INDEX IF NOT EXISTS idx_gemba_records_created ON gemba_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gemba_records_code ON gemba_records(code);
CREATE INDEX IF NOT EXISTS idx_gemba_user_scopes_emp ON gemba_user_scopes(emp_code);
CREATE INDEX IF NOT EXISTS idx_gemba_history_record ON gemba_history(record_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_gemba_attachments_record ON gemba_attachments(record_id);

-- 12. SEED INITIAL MASTER DATA
INSERT OR IGNORE INTO gemba_factories (id, code, name, sort_order) VALUES
('fac_nmmd', 'NM_SK_MD', 'NM SK MIỀN ĐỒNG', 1),
('fac_kg1', 'KG_1', 'Kiên Giang 1', 2),
('fac_kg2', 'KG_2', 'Kiên Giang 3', 3),
('fac_htd', 'HT_DE', 'Hoàn Thiện Đế', 4),
('fac_vpc', 'VP_CHUOI', 'Văn Phòng Chuỗi', 5);

INSERT OR IGNORE INTO gemba_workshops (id, factory_id, code, name, sort_order) VALUES
('ws_go', 'fac_nmmd', 'PX_GO', 'PX Gò', 1),
('ws_may', 'fac_nmmd', 'PX_MAY', 'PX May', 2),
('ws_dau_vao', 'fac_nmmd', 'PX_DAU_VAO', 'PX Đầu vào', 3);

INSERT OR IGNORE INTO gemba_lines (id, workshop_id, code, name, sort_order) VALUES
('line_htg1', 'ws_go', 'LINE_HTG_1', 'LINE_HTG 1', 1),
('line_htg2', 'ws_go', 'LINE_HTG_2', 'LINE_HTG 2', 2),
('line_htg3', 'ws_go', 'LINE_HTG_3', 'LINE_HTG 3', 3),
('line_htm1', 'ws_may', 'LINE_HTM_1', 'LINE_HTM 1', 1),
('line_htm2', 'ws_may', 'LINE_HTM_2', 'LINE_HTM 2', 2),
('line_chat1', 'ws_dau_vao', 'LINE_CHAT_1', 'LINE CHẶT 1', 1),
('line_inep1', 'ws_dau_vao', 'LINE_IN_EP_1', 'LINE IN ÉP 1', 2);

INSERT OR IGNORE INTO gemba_teams (id, line_id, code, name, sort_order) VALUES
('team_htg1_1', 'line_htg1', 'TEAM_HTG1_1', 'Tổ công đoạn 1', 1),
('team_htg1_3', 'line_htg1', 'TEAM_HTG1_3', 'Tổ công đoạn 3', 2),
('team_htg2_1', 'line_htg2', 'TEAM_HTG2_1', 'Tổ công đoạn 1', 1),
('team_htg3_2', 'line_htg3', 'TEAM_HTG3_2', 'Tổ công đoạn 2', 1),
('team_htm1_1', 'line_htm1', 'TEAM_HTM1_1', 'Tổ may 1', 1),
('team_htm1_2', 'line_htm1', 'TEAM_HTM1_2', 'Tổ may 2', 2),
('team_htm1_3', 'line_htm1', 'TEAM_HTM1_3', 'Tổ may 3', 3),
('team_htm1_4', 'line_htm1', 'TEAM_HTM1_4', 'Tổ may 4', 4),
('team_htm1_5', 'line_htm1', 'TEAM_HTM1_5', 'Tổ may 5', 5),
('team_htm2_6', 'line_htm2', 'TEAM_HTM2_6', 'Tổ may 6', 1),
('team_htm2_7', 'line_htm2', 'TEAM_HTM2_7', 'Tổ may 7', 2),
('team_chat1_cat', 'line_chat1', 'TEAM_CHAT1_CAT', 'Cắt', 1),
('team_chat1_lang', 'line_chat1', 'TEAM_CHAT1_LANG', 'Lạng-cán dán-đồng bộ', 2),
('team_inep1_da', 'line_inep1', 'TEAM_INEP1_DA', 'Da lót tẩy', 1),
('team_inep1_inep', 'line_inep1', 'TEAM_INEP1_INEP', 'In-ép', 2);

INSERT OR IGNORE INTO gemba_categories (id, code, name, sort_order) VALUES
('cat_7s', '7S', '7S', 1),
('cat_tuan_thu', 'TUAN_THU', 'Tuân thủ', 2),
('cat_chat_luong', 'CHAT_LUONG', 'Chất lượng', 3),
('cat_mmtb', 'MMTB', 'MMTB', 4),
('cat_lang_phi', 'LANG_PHI', 'Lãng phí', 5),
('cat_khac', 'KHAC', 'Khác', 6);

INSERT OR IGNORE INTO gemba_sequences (year, last_number) VALUES (2026, 24);
