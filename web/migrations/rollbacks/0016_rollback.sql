-- Rollback migration 0016

DROP INDEX IF EXISTS idx_notifications_dispatcher;
DROP INDEX IF EXISTS idx_notifications_dedupe;

ALTER TABLE notifications DROP COLUMN claim_id;
ALTER TABLE notifications DROP COLUMN locked_until;
ALTER TABLE notifications DROP COLUMN attempts;
ALTER TABLE notifications DROP COLUMN max_attempts;
ALTER TABLE notifications DROP COLUMN dedupe_key;
ALTER TABLE notifications DROP COLUMN priority;
ALTER TABLE notifications DROP COLUMN delivery_status;
ALTER TABLE notifications DROP COLUMN delivery_mode;
ALTER TABLE notifications DROP COLUMN deliver_after;
ALTER TABLE notifications DROP COLUMN error_log;
