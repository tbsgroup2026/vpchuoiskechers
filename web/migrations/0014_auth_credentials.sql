-- Migration 0014: mật khẩu đăng nhập (bản vá bảo mật 15/10/2026)
-- Bảng mới, rỗng; không sửa dữ liệu cũ. Worker cũng tự tạo bảng này khi cần (CREATE TABLE IF NOT EXISTS).
-- Mật khẩu băm PBKDF2-SHA256 (100.000 vòng, muối 16 byte); không lưu mật khẩu dạng thô.
CREATE TABLE IF NOT EXISTS auth_credentials (
  emp_code TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  must_change INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);
