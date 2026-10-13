-- Migration number: 0016
-- Add Dispatcher columns to notifications for Claim/Lease Pattern

ALTER TABLE notifications ADD COLUMN claim_id TEXT;
ALTER TABLE notifications ADD COLUMN locked_until DATETIME;
ALTER TABLE notifications ADD COLUMN attempts INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN max_attempts INTEGER DEFAULT 3;
ALTER TABLE notifications ADD COLUMN dedupe_key TEXT;
ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'NORMAL'; 
ALTER TABLE notifications ADD COLUMN delivery_status TEXT DEFAULT 'PENDING'; -- PENDING, PROCESSING, SENT, FAILED, SKIPPED
ALTER TABLE notifications ADD COLUMN delivery_mode TEXT DEFAULT 'IMMEDIATE'; -- IMMEDIATE, DIGEST
ALTER TABLE notifications ADD COLUMN deliver_after DATETIME;
ALTER TABLE notifications ADD COLUMN error_log TEXT;

-- Create an index to quickly find pending notifications that are ready to deliver
CREATE INDEX IF NOT EXISTS idx_notifications_dispatcher ON notifications(delivery_status, deliver_after, locked_until);

-- Create a unique index for deduplication (only for non-null dedupe_keys)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe ON notifications(dedupe_key) WHERE dedupe_key IS NOT NULL;

