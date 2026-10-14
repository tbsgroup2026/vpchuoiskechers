-- Rollback script for migration_pilot_v1_schema.sql
-- Drop newly created tables
DROP TABLE IF EXISTS user_telegram_links;
DROP TABLE IF EXISTS user_notification_settings;
DROP TABLE IF EXISTS project_dependencies;
DROP TABLE IF EXISTS project_departments;

-- SQLite does not support ALTER TABLE DROP COLUMN in earlier versions without table recreation,
-- but the new columns added to sys_users and sys_my_tasks are nullable/have defaults and do not break older queries.
