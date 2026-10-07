-- 1. Add missing columns to room_bookings
ALTER TABLE room_bookings ADD COLUMN user_id TEXT;
ALTER TABLE room_bookings ADD COLUMN emp_code TEXT;
ALTER TABLE room_bookings ADD COLUMN user_name TEXT;
ALTER TABLE room_bookings ADD COLUMN purpose TEXT;
ALTER TABLE room_bookings ADD COLUMN participants_count INTEGER DEFAULT 1;
ALTER TABLE room_bookings ADD COLUMN rejection_reason TEXT;
ALTER TABLE room_bookings ADD COLUMN meeting_type TEXT DEFAULT 'OFFLINE';
ALTER TABLE room_bookings ADD COLUMN platform TEXT;
ALTER TABLE room_bookings ADD COLUMN meeting_link TEXT;
ALTER TABLE room_bookings ADD COLUMN meeting_credentials TEXT;

-- 2. sys_notifications table & columns
CREATE TABLE IF NOT EXISTS sys_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  emp_code TEXT,
  target_role TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  is_read INTEGER DEFAULT 0,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Zalo Integration tables
CREATE TABLE IF NOT EXISTS zalo_user_links (
  emp_code TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  zalo_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_linking_codes (
  code TEXT PRIMARY KEY,
  emp_code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_notification_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  recipient_emp_code TEXT,
  chat_id TEXT,
  message_text TEXT,
  status TEXT DEFAULT 'SUCCESS',
  error_detail TEXT,
  idempotency_key TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  quiet_hours_start TEXT DEFAULT '17:00',
  quiet_hours_end TEXT DEFAULT '06:30',
  meeting_reminder_mins INTEGER DEFAULT 30,
  visitor_reminder_days INTEGER DEFAULT 2,
  reception_group_chat_id TEXT,
  event_toggles_json TEXT,
  priority_config_json TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_captured_groups (
  group_chat_id TEXT PRIMARY KEY,
  group_name TEXT,
  last_message TEXT,
  sender_name TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default zalo_config row if empty
INSERT OR IGNORE INTO zalo_config (id, quiet_hours_start, quiet_hours_end) VALUES ('main', '17:00', '06:30');
