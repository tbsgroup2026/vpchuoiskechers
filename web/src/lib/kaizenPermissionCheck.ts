import { ensureKaizenSchema } from './kaizenDbMigration';

export type KaizenRoleType = 'IE' | 'CI_LEAD' | 'JUDGE' | 'APPROVER' | 'ADMIN';

export interface KaizenPermissionRecord {
  id: string;
  emp_code: string;
  emp_name: string;
  role_type: KaizenRoleType;
  factory_scope: string;
  department?: string;
  position?: string;
  note?: string;
  is_active: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Checks if a given employee code has an active permission for one of the specified roles.
 * Also checks fallback static/session roles.
 */
export async function checkUserKaizenPermission(
  db: any,
  empCode: string | null | undefined,
  requiredRoles: KaizenRoleType[]
): Promise<boolean> {
  if (!empCode) return false;
  const cleanEmp = empCode.trim().toUpperCase();

  // Super Admin / Core Admins always pass
  const superAdmins = ['202608001', '202608010', '222102020', '2026080001'];
  if (superAdmins.includes(cleanEmp)) return true;

  if (!db) return false;

  try {
    await ensureKaizenSchema(db);
    const placeholders = requiredRoles.map(() => '?').join(',');
    const sql = `
      SELECT id, role_type, factory_scope FROM ci_kaizen_permissions
      WHERE UPPER(emp_code) = ? AND role_type IN (${placeholders}) AND is_active = 1
      LIMIT 1
    `;
    const row = await db.prepare(sql).bind(cleanEmp, ...requiredRoles).first();
    return Boolean(row);
  } catch (err) {
    console.error('[checkUserKaizenPermission] DB error:', err);
    return false;
  }
}

/**
 * Get all active permissions for an employee code.
 */
export async function getUserKaizenPermissions(
  db: any,
  empCode: string | null | undefined
): Promise<KaizenPermissionRecord[]> {
  if (!empCode || !db) return [];
  const cleanEmp = empCode.trim().toUpperCase();

  try {
    await ensureKaizenSchema(db);
    const sql = `
      SELECT * FROM ci_kaizen_permissions
      WHERE UPPER(emp_code) = ? AND is_active = 1
      ORDER BY role_type ASC
    `;
    const { results } = await db.prepare(sql).bind(cleanEmp).all();
    return (results || []) as KaizenPermissionRecord[];
  } catch (err) {
    console.error('[getUserKaizenPermissions] DB error:', err);
    return [];
  }
}
