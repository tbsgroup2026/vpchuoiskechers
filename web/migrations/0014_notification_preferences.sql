-- Thêm bảng notification_preferences cho người dùng
CREATE TABLE IF NOT EXISTS notification_preferences (
  emp_code TEXT PRIMARY KEY,
  channels_json TEXT DEFAULT '["ZALO", "WEB"]', -- ["ZALO", "WEB_PUSH", "EMAIL"]
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '07:00',
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  digest_enabled BOOLEAN DEFAULT FALSE,
  digest_interval_minutes INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_emp ON notification_preferences(emp_code);
