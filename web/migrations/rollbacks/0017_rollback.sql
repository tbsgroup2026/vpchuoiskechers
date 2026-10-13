-- Rollback Migration 0017

UPDATE notifications 
SET delivery_status = 'PENDING'
WHERE delivery_status = 'SKIPPED';
