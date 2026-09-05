-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_ip TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    window_end DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint_window 
    ON rate_limit_log(client_ip, endpoint, window_start);
