export type HrRole = 'SUPER_ADMIN' | 'HR_MANAGER' | 'HR_STAFF' | 'PAYROLL' | 'MANAGER' | 'EMPLOYEE';
export const HR_ROLES: HrRole[] = ['SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'PAYROLL', 'MANAGER', 'EMPLOYEE'];

export type Scope = 'none' | 'self' | 'team' | 'all';

/** Ma trận quyền: tài nguyên:hành động → phạm vi theo vai trò. Guest (không token) luôn bị 401. */
export const PERMISSIONS: Record<string, Record<HrRole, Scope>> = {
  'profile:read': { SUPER_ADMIN: 'all', HR_MANAGER: 'all', HR_STAFF: 'all', PAYROLL: 'self', MANAGER: 'team', EMPLOYEE: 'self' },
  'employees:list': { SUPER_ADMIN: 'all', HR_MANAGER: 'all', HR_STAFF: 'all', PAYROLL: 'none', MANAGER: 'team', EMPLOYEE: 'none' },
  'leave:create': { SUPER_ADMIN: 'self', HR_MANAGER: 'self', HR_STAFF: 'self', PAYROLL: 'self', MANAGER: 'self', EMPLOYEE: 'self' },
  'leave:read': { SUPER_ADMIN: 'all', HR_MANAGER: 'all', HR_STAFF: 'all', PAYROLL: 'self', MANAGER: 'team', EMPLOYEE: 'self' },
  'leave:approve': { SUPER_ADMIN: 'all', HR_MANAGER: 'all', HR_STAFF: 'none', PAYROLL: 'none', MANAGER: 'team', EMPLOYEE: 'none' },
  'timesheet:create': { SUPER_ADMIN: 'self', HR_MANAGER: 'self', HR_STAFF: 'self', PAYROLL: 'self', MANAGER: 'self', EMPLOYEE: 'self' },
  'timesheet:read': { SUPER_ADMIN: 'all', HR_MANAGER: 'all', HR_STAFF: 'all', PAYROLL: 'all', MANAGER: 'team', EMPLOYEE: 'self' },
  'payslip:read': { SUPER_ADMIN: 'all', HR_MANAGER: 'all', HR_STAFF: 'self', PAYROLL: 'all', MANAGER: 'self', EMPLOYEE: 'self' },
  'file:upload': { SUPER_ADMIN: 'self', HR_MANAGER: 'self', HR_STAFF: 'self', PAYROLL: 'self', MANAGER: 'self', EMPLOYEE: 'self' },
  'file:download': { SUPER_ADMIN: 'all', HR_MANAGER: 'all', HR_STAFF: 'all', PAYROLL: 'self', MANAGER: 'self', EMPLOYEE: 'self' },
  'report:export': { SUPER_ADMIN: 'all', HR_MANAGER: 'all', HR_STAFF: 'none', PAYROLL: 'all', MANAGER: 'none', EMPLOYEE: 'none' },
};

export function scopeOf(role: HrRole, perm: string): Scope {
  return PERMISSIONS[perm]?.[role] ?? 'none';
}

/** target thuộc phạm vi scope của actor không? */
export function inScope(
  scope: Scope,
  actor: { empCode: string; teamId: string | null },
  target: { empCode: string; teamId: string | null }
): boolean {
  if (scope === 'all') return true;
  if (scope === 'self') return actor.empCode === target.empCode;
  if (scope === 'team') return !!actor.teamId && actor.teamId === target.teamId;
  return false;
}
