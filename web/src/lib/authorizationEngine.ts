import { UserProfile } from './userProfiles';

export type PermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'APPROVE'
  | 'ASSIGN'
  | 'REVIEW'
  | 'MANAGE'
  | 'EXPORT'
  | 'ADMIN'
  | 'BOOK';

export type DataScope =
  | 'SELF'
  | 'TEAM'
  | 'DEPARTMENT'
  | 'PROJECT'
  | 'FACTORY'
  | 'ALL';

export interface PermissionRule {
  resource: string;
  action: PermissionAction;
  scope: DataScope;
  source: string; // e.g., "Department = IT_CDS", "Role = ADMIN", "Project Role = PROJECT_MANAGER"
}

// Module Resource Definitions
export const MODULE_RESOURCES = {
  WORK: 'work',
  MY_TASKS: 'my_tasks',
  DEPT_MANAGEMENT: 'dept_management',
  PROJECTS: 'projects',
  ROOMS: 'rooms',
  BUSINESS_TRIP: 'business_trip',
  PERSONAL: 'personal',
  HR: 'hr',
  ACCOUNTING: 'accounting',
  CI_KAIZEN: 'ci_kaizen',
  QC: 'qc',
  RD: 'rd',
  LOGISTICS: 'logistics',
  MAINTENANCE: 'maintenance',
  MANAGEMENT_152: 'management_152',
  ADMIN: 'admin',
} as const;

/**
 * Derives effective permissions for a user profile based on Department, Position, Roles, Project Roles, and Overrides
 */
export function getEffectivePermissions(user: UserProfile): PermissionRule[] {
  const rules: PermissionRule[] = [];

  // 1. Shared Utilities (Available to ALL employees with SELF scope)
  rules.push(
    { resource: MODULE_RESOURCES.ROOMS, action: 'VIEW', scope: 'ALL', source: 'Shared Utility' },
    { resource: MODULE_RESOURCES.ROOMS, action: 'BOOK', scope: 'SELF', source: 'Shared Utility' },
    { resource: MODULE_RESOURCES.BUSINESS_TRIP, action: 'CREATE', scope: 'SELF', source: 'Shared Utility' },
    { resource: MODULE_RESOURCES.BUSINESS_TRIP, action: 'VIEW', scope: 'SELF', source: 'Shared Utility' },
    { resource: MODULE_RESOURCES.MY_TASKS, action: 'VIEW', scope: 'SELF', source: 'Personal Area' },
    { resource: MODULE_RESOURCES.MY_TASKS, action: 'EDIT', scope: 'SELF', source: 'Personal Area' },
    { resource: MODULE_RESOURCES.PERSONAL, action: 'VIEW', scope: 'SELF', source: 'Personal Area' }
  );

  // 2. Super Admin Role
  if (user.roles?.includes('admin') || user.roleCode === 'SUPER_ADMIN') {
    Object.values(MODULE_RESOURCES).forEach((resource) => {
      rules.push({ resource, action: 'MANAGE', scope: 'ALL', source: 'Role = SUPER_ADMIN' });
      rules.push({ resource, action: 'ADMIN', scope: 'ALL', source: 'Role = SUPER_ADMIN' });
      rules.push({ resource, action: 'VIEW', scope: 'ALL', source: 'Role = SUPER_ADMIN' });
    });
    return rules;
  }

  // 3. Management Level & Executive Board (1-5-2 Access)
  const isExecutive = user.managementLevel && user.managementLevel <= 2;
  const isDeputyCEOOrAbove = user.managementLevel && user.managementLevel <= 2;
  if (isDeputyCEOOrAbove || user.roles?.includes('ceo') || user.roles?.includes('deputy_ceo')) {
    rules.push({
      resource: MODULE_RESOURCES.MANAGEMENT_152,
      action: 'VIEW',
      scope: 'ALL',
      source: 'Management Level <= DEPUTY_CEO',
    });
    rules.push({
      resource: MODULE_RESOURCES.WORK,
      action: 'VIEW',
      scope: 'ALL',
      source: 'Executive Board',
    });
  }

  // 4. Department Head Permissions (Quản lý Phòng Ban)
  if (user.roles?.includes('department_head') || user.roleCode === 'TRUONG_PHONG') {
    rules.push(
      {
        resource: MODULE_RESOURCES.DEPT_MANAGEMENT,
        action: 'MANAGE',
        scope: 'DEPARTMENT',
        source: `Department Head = ${user.departmentCode || user.department}`,
      },
      {
        resource: MODULE_RESOURCES.MY_TASKS,
        action: 'ASSIGN',
        scope: 'DEPARTMENT',
        source: `Department Head = ${user.departmentCode || user.department}`,
      },
      {
        resource: MODULE_RESOURCES.MY_TASKS,
        action: 'REVIEW',
        scope: 'DEPARTMENT',
        source: `Department Head = ${user.departmentCode || user.department}`,
      },
      {
        resource: MODULE_RESOURCES.BUSINESS_TRIP,
        action: 'APPROVE',
        scope: 'DEPARTMENT',
        source: `Department Head Approval Level 1`,
      }
    );
  }

  // 5. Department-Specific Module Permissions
  const deptCode = (user.departmentCode || '').toUpperCase();
  const deptName = (user.department || '').toUpperCase();

  if (deptCode.includes('IT_CDS') || deptCode.includes('CI') || deptName.includes('CẢI TIẾN') || user.roles?.includes('ci')) {
    rules.push({ resource: MODULE_RESOURCES.CI_KAIZEN, action: 'MANAGE', scope: 'DEPARTMENT', source: 'Department = CN-CI' });
  }

  if (deptCode.includes('NHAN_SU') || deptName.includes('NHÂN SỰ') || user.roles?.includes('hr')) {
    rules.push(
      { resource: MODULE_RESOURCES.HR, action: 'MANAGE', scope: 'DEPARTMENT', source: 'Department = HR' },
      { resource: MODULE_RESOURCES.ROOMS, action: 'APPROVE', scope: 'ALL', source: 'Department = HR (Reception)' }
    );
  }

  if (user.roles?.includes('receptionist') || user.roleCode === 'LE_TAN') {
    rules.push(
      { resource: MODULE_RESOURCES.ROOMS, action: 'APPROVE', scope: 'ALL', source: 'Role = Receptionist' },
      { resource: MODULE_RESOURCES.ROOMS, action: 'MANAGE', scope: 'ALL', source: 'Role = Receptionist' }
    );
  }

  if (deptCode.includes('KE_TOAN') || deptName.includes('KẾ TOÁN') || user.roles?.includes('accountant')) {
    rules.push({ resource: MODULE_RESOURCES.ACCOUNTING, action: 'MANAGE', scope: 'DEPARTMENT', source: 'Department = Accounting' });
  }

  if (deptCode.includes('CHAT_LUONG') || deptCode.includes('QC') || user.roles?.includes('qc')) {
    rules.push({ resource: MODULE_RESOURCES.QC, action: 'MANAGE', scope: 'DEPARTMENT', source: 'Department = QC' });
  }

  if (deptCode.includes('RD') || deptName.includes('R&D') || user.roles?.includes('rd')) {
    rules.push({ resource: MODULE_RESOURCES.RD, action: 'MANAGE', scope: 'DEPARTMENT', source: 'Department = R&D' });
  }

  if (deptCode.includes('SAN_XUAT') || user.roles?.includes('maintenance')) {
    rules.push({ resource: MODULE_RESOURCES.MAINTENANCE, action: 'MANAGE', scope: 'DEPARTMENT', source: 'Department = Maintenance' });
  }

  // 6. Project Permissions
  if (user.projectIds && user.projectIds.length > 0) {
    rules.push({ resource: MODULE_RESOURCES.PROJECTS, action: 'VIEW', scope: 'PROJECT', source: 'Project Member' });
  }

  return rules;
}

/**
 * Returns allowed top-level module keys for dynamic navigation sidebar rendering
 */
export function getAllowedModulesForUser(user: UserProfile): string[] {
  const permissions = getEffectivePermissions(user);
  const allowedSet = new Set<string>();

  // Always allowed for everyone
  allowedSet.add(MODULE_RESOURCES.WORK);
  allowedSet.add(MODULE_RESOURCES.MY_TASKS);
  allowedSet.add(MODULE_RESOURCES.ROOMS);
  allowedSet.add(MODULE_RESOURCES.BUSINESS_TRIP);
  allowedSet.add(MODULE_RESOURCES.PERSONAL);

  permissions.forEach((rule) => {
    allowedSet.add(rule.resource);
  });

  return Array.from(allowedSet);
}

/**
 * IDOR Protection Check — Validates if current user can access a specific resource by ID and Context
 */
export function canCurrentUserAccessResource(
  user: UserProfile,
  resourceType: string,
  resourceOwnerEmpCode?: string,
  resourceDepartmentCode?: string,
  projectId?: string
): boolean {
  if (user.roles?.includes('admin') || user.roleCode === 'SUPER_ADMIN') return true;

  // Personal data (Salary, Leave, Profile): ONLY SELF
  if (resourceType === 'salary' || resourceType === 'leave_self' || resourceType === 'personal_profile') {
    return user.empCode === resourceOwnerEmpCode;
  }

  // Shared Utilities (Rooms, Trips): Self or Approver
  if (resourceType === 'room_booking' || resourceType === 'business_trip') {
    if (user.empCode === resourceOwnerEmpCode) return true;
    if (user.roles?.includes('receptionist') || user.roles?.includes('department_head')) return true;
  }

  // Department Tasks
  if (resourceType === 'task') {
    if (user.empCode === resourceOwnerEmpCode) return true; // Assignee / Reporter
    if (user.roles?.includes('department_head') && user.departmentCode === resourceDepartmentCode) return true;
  }

  // Projects
  if (resourceType === 'project' && projectId) {
    return user.projectIds?.includes(projectId) || false;
  }

  return false;
}
