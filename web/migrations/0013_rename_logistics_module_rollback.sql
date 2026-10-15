-- Rollback Migration 0013: Revert Module Display Name for Logistics
-- Scope: Rollback display name changes in D1 database

UPDATE departments
SET name = 'Kế hoạch chuẩn bị – TTPP',
    sub = 'Logistics, vật tư & chuỗi cung ứng'
WHERE id = 'logistics';

UPDATE role_workspace_config
SET label = 'Kho & Logistics'
WHERE route LIKE '%logistics%';
