-- Rollback cho 0014_notification_preferences
DROP INDEX IF EXISTS idx_notification_prefs_emp;
DROP TABLE IF EXISTS notification_preferences;
