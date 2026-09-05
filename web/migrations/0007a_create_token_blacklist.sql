-- Create token blacklist table for logout functionality
CREATE TABLE IF NOT EXISTS token_blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    emp_code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT DEFAULT 'LOGOUT'
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
