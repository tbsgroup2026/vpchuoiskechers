-- Migration 0017: Backfill Notifications & Fix Data Anomalies

-- Set old notifications to SKIPPED so they don't get resent by the new Dispatcher logic
UPDATE notifications 
SET delivery_status = 'SKIPPED'
WHERE delivery_status = 'PENDING' 
AND created_at < '2026-10-08 00:00:00';
