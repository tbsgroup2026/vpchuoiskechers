-- Migration 0013: Rename Module "Kho & Logistics" to "Kế hoạch chuẩn bị và trung tâm phân phối"
-- Scope: Updates display labels and descriptions only. Preserves IDs, keys, and routes intact.

-- 1. Update departments table display name and subtitle
UPDATE departments
SET name = 'Kế hoạch chuẩn bị và trung tâm phân phối',
    sub = 'Từ kế hoạch đến thành phẩm'
WHERE id = 'logistics';

-- 2. Update role_workspace_config if any entries exist with old label
UPDATE role_workspace_config
SET label = 'Kế hoạch chuẩn bị và trung tâm phân phối'
WHERE route LIKE '%logistics%' OR label LIKE '%Logistics%' OR label LIKE '%Kho%';
