import { getAuthUser, JWTPayload } from '@/lib/auth';
import { SYSTEM_USERS, normalizeEmpCode, resolveEmployeeName } from '@/lib/userProfiles';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { syncBackupToDrive, sanitizeBackupPayload, BackupCategory } from '@/lib/driveBackup';

export interface AuditOptions {
  empCode?: string;
  empName?: string;
  roleCode?: string;
  module:
    | 'AUTH'
    | 'TASKS'
    | 'ROOMS'
    | 'BUSINESS_TRIP'
    | 'NOTIFICATIONS'
    | 'PROFILE'
    | 'HR'
    | 'GEMBA'
    | 'KAIZEN'
    | 'MAINTENANCE'
    | 'SECURITY'
    | 'SYSTEM_ADMIN'
    | string;
  action: string;
  targetType?: string;
  targetId?: string;
  changesJson?: any;
  status?: 'SUCCESS' | 'FAILED' | 'DENIED' | string;
}

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

// Global in-memory log buffer for fallback inspection
export const inMemoryAuditLogs: any[] = [];

export async function logAudit(request: Request, options: AuditOptions) {
  try {
    // Extract IP Address & User Agent from Request Headers
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const userAgent = request.headers.get('user-agent') || 'Browser/Client';

    // Auto-detect session user if empCode not explicitly provided
    let empCode = options.empCode || '';
    let empName = options.empName || '';
    let roleCode = options.roleCode || '';

    if (!empCode) {
      const session: JWTPayload | null = await getAuthUser(request).catch(() => null);
      if (session) {
        empCode = session.empCode || '';
        roleCode = session.roleCode || '';
        empName = session.name || '';
      }
    }

    // Tra cứu tên thật chính xác của nhân viên, loại bỏ chuỗi "Cán Bộ Công Nhân Viên"
    empName = resolveEmployeeName(empCode, empName);

    if (empCode && !roleCode) {
      const normalized = normalizeEmpCode(empCode);
      const sysUser = SYSTEM_USERS[normalized];
      if (sysUser && sysUser.roleCode) {
        roleCode = sysUser.roleCode;
      }
    }

    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const status = options.status || 'SUCCESS';
    const createdAt = new Date().toISOString();

    // Sanitized Diff Payload (guaranteed no password/secrets)
    const sanitizedChanges = options.changesJson
      ? sanitizeBackupPayload(options.changesJson)
      : null;
    const changesStr = sanitizedChanges ? JSON.stringify(sanitizedChanges) : null;

    const auditRecord = {
      id,
      emp_code: empCode || 'SYSTEM',
      emp_name: empName,
      role_code: roleCode || 'SYSTEM',
      module: options.module,
      action: options.action,
      target_type: options.targetType || null,
      target_id: options.targetId || null,
      changes_json: sanitizedChanges,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
      created_at: createdAt,
    };

    // Store in-memory
    inMemoryAuditLogs.unshift(auditRecord);
    if (inMemoryAuditLogs.length > 500) {
      inMemoryAuditLogs.pop();
    }

    // Save into D1 Database
    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db).catch(() => {});
      await db
        .prepare(
          `INSERT INTO sys_audit_logs (
          id, emp_code, emp_name, role_code, module, action,
          target_type, target_id, changes_json, ip_address, user_agent, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          empCode || 'SYSTEM',
          empName,
          roleCode || 'SYSTEM',
          options.module,
          options.action,
          options.targetType || null,
          options.targetId || null,
          changesStr,
          ipAddress,
          userAgent,
          status,
          createdAt
        )
        .run()
        .catch((err: any) => {
          console.warn('[AuditLogger] DB Write Warning:', err);
        });
    }

    // Determine backup category to trigger real-time Drive sync
    let driveCategory: BackupCategory = 'AUDIT_LOGS';
    if (options.module === 'ROOMS') driveCategory = 'ROOMS';
    else if (options.module === 'KAIZEN') driveCategory = 'KAIZEN';
    else if (options.module === 'GEMBA') driveCategory = 'GEMBA';
    else if (options.module === 'PROFILE' || options.module === 'HR' || options.module === 'SECURITY')
      driveCategory = 'USERS';

    // Trigger non-blocking real-time webhook sync to Google Drive
    syncBackupToDrive(driveCategory, auditRecord, options.action);

    return auditRecord;
  } catch (error) {
    console.warn('[AuditLogger] Exception in logAudit:', error);
    return null;
  }
}

// Backward-compatibility export wrapper handling both (request, options) and legacy positional parameters
export async function recordAuditLog(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
  arg5?: any,
  arg6?: any,
  arg7?: any
) {
  if (arg1 instanceof Request && typeof arg2 === 'object' && arg2 !== null) {
    return logAudit(arg1, arg2);
  }

  const session = arg1;
  const moduleName = arg2;
  const action = arg3;
  const targetType = arg4;
  const targetId = arg5;
  const changesJson = arg6;
  const req = arg7;

  const request = req instanceof Request ? req : arg1 instanceof Request ? arg1 : new Request('http://localhost');
  const empCode = session?.empCode || (typeof session === 'string' ? session : '');
  const empName = session?.name || '';
  const roleCode = session?.roleCode || '';

  return logAudit(request, {
    empCode,
    empName,
    roleCode,
    module: moduleName || 'SYSTEM',
    action: action || 'EVENT',
    targetType: targetType || undefined,
    targetId: targetId || undefined,
    changesJson,
  });
}

export const recordAuditEvent = async (_db: any, opts: any) => {
  return logAudit(new Request('http://localhost'), {
    empCode: opts.empCode || String(opts.userId || ''),
    roleCode: opts.roleCode,
    module: opts.module || 'SYSTEM',
    action: opts.action || 'EVENT',
    targetId: opts.targetId,
    changesJson: opts.changesJson,
    status: opts.status || 'SUCCESS',
  });
};
export function sanitizeDeep(data: any): any {
  return sanitizeBackupPayload(data);
}

