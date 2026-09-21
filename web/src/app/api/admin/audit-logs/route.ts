import { NextResponse } from 'next/server';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { inMemoryAuditLogs } from '@/lib/auditLogger';
import { buildEmpCodeNameMap, resolveEmployeeName } from '@/lib/userProfiles';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để truy cập Audit Logs (401 Unauthorized)' },
        { status: 401 }
      );
    }

    if (!isAdminUser(session)) {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Chỉ Admin/Super Admin mới có quyền xem nhật ký thao tác hệ thống.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const moduleParam = searchParams.get('module') || '';
    const actionParam = searchParams.get('action') || '';
    const empCodeParam = searchParams.get('empCode') || '';
    const searchParam = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getDbBinding();
    let logs: any[] = [];
    let total = 0;

    if (db) {
      await ensureKaizenSchema(db);

      let whereConditions = [];
      let queryParams: any[] = [];

      if (moduleParam) {
        whereConditions.push('module = ?');
        queryParams.push(moduleParam);
      }
      if (actionParam) {
        whereConditions.push('action LIKE ?');
        queryParams.push(`%${actionParam}%`);
      }
      if (empCodeParam) {
        whereConditions.push('emp_code = ?');
        queryParams.push(empCodeParam);
      }
      if (searchParam) {
        whereConditions.push('(emp_code LIKE ? OR emp_name LIKE ? OR action LIKE ? OR module LIKE ? OR target_id LIKE ?)');
        const searchPattern = `%${searchParam}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count query
      const countRes: any = await db
        .prepare(`SELECT COUNT(*) as total FROM sys_audit_logs ${whereClause}`)
        .bind(...queryParams)
        .first()
        .catch(() => ({ total: 0 }));

      total = Number(countRes?.total || 0);

      // Data query
      const { results }: any = await db
        .prepare(`SELECT * FROM sys_audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(...queryParams, limit, offset)
        .all()
        .catch(() => ({ results: [] }));

      if (results && results.length > 0) {
        logs = results.map((r: any) => ({
          id: r.id,
          emp_code: r.emp_code,
          emp_name: r.emp_name,
          role_code: r.role_code,
          module: r.module,
          action: r.action,
          record_id: r.target_id,
          target_type: r.target_type,
          target_id: r.target_id,
          changes_json: r.changes_json ? JSON.parse(r.changes_json) : null,
          ip_address: r.ip_address,
          user_agent: r.user_agent,
          status: r.status,
          created_at: r.created_at,
        }));
      }
    }

    // Fallback to in-memory audit logs if D1 has no logs yet
    if (logs.length === 0 && inMemoryAuditLogs.length > 0) {
      let filtered = inMemoryAuditLogs;

      if (moduleParam) filtered = filtered.filter((l) => l.module === moduleParam);
      if (actionParam) filtered = filtered.filter((l) => l.action.toLowerCase().includes(actionParam.toLowerCase()));
      if (empCodeParam) filtered = filtered.filter((l) => l.emp_code === empCodeParam);
      if (searchParam) {
        const s = searchParam.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            (l.emp_code || '').toLowerCase().includes(s) ||
            (l.emp_name || '').toLowerCase().includes(s) ||
            (l.action || '').toLowerCase().includes(s) ||
            (l.module || '').toLowerCase().includes(s)
        );
      }

      total = filtered.length;
      logs = filtered.slice(offset, offset + limit);
    }

    // Batch lookup tất cả emp_code duy nhất để chuẩn hóa Tên CBNV (thay thế chuỗi cũ "Cán Bộ Công Nhân Viên")
    if (logs.length > 0) {
      const empCodes = logs.map((l) => l.emp_code || l.user_id);
      const nameMap = buildEmpCodeNameMap(empCodes);

      logs = logs.map((l) => {
        const code = l.emp_code || l.user_id || 'SYSTEM';
        const resolvedName = nameMap[code] || resolveEmployeeName(code, l.emp_name);
        return {
          ...l,
          emp_name: resolvedName,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: logs,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
