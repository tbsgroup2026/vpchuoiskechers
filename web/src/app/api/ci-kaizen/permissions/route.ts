import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

// Check admin or CI Lead permission
function isAuthorizedAdmin(session: any): boolean {
  if (!session) return false;
  const roleCode = String((session as any).roleCode || (session as any).role || '').toUpperCase();
  const empCode = String((session as any).empCode || '').trim().toUpperCase();
  const userName = String((session as any).name || '').toLowerCase();
  const roles = Array.isArray((session as any).roles) ? (session as any).roles : [];

  const coreEmpCodes = ['202608001', '202608010', '222102020', '202608002', '2026080001', '210602002', 'LEKHAI', 'DUTHITHANHTINH'];
  if (coreEmpCodes.includes(empCode)) return true;

  if (userName.includes('anh huy') || userName.includes('lê khải') || userName.includes('le khai') || userName.includes('thanh tình') || userName.includes('ngoan')) {
    return true;
  }

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CI_LEAD', 'TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'GIAM_DOC'];
  if (allowedRoles.includes(roleCode)) return true;

  if (roles.includes('admin') || roles.includes('ci_lead') || roles.includes('super_admin')) return true;

  return false;
}

export async function GET(request: Request) {
  try {
    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database binding unavailable' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const { searchParams } = new URL(request.url);
    const roleType = searchParams.get('role_type') || '';
    const factoryScope = searchParams.get('factory_scope') || '';
    const isActive = searchParams.get('is_active');
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
    const empCode = (searchParams.get('emp_code') || '').trim().toUpperCase();

    let query = `SELECT * FROM ci_kaizen_permissions WHERE 1=1`;
    const params: any[] = [];

    if (empCode) {
      query += ` AND UPPER(emp_code) = ?`;
      params.push(empCode);
    }

    if (roleType && roleType !== 'ALL') {
      query += ` AND role_type = ?`;
      params.push(roleType);
    }

    if (factoryScope && factoryScope !== 'ALL') {
      query += ` AND (factory_scope = ? OR factory_scope = 'ALL')`;
      params.push(factoryScope);
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query += ` AND is_active = ?`;
      params.push(Number(isActive));
    }

    query += ` ORDER BY updated_at DESC, created_at DESC`;

    const { results } = await db.prepare(query).bind(...params).all();
    let records = (results || []) as any[];

    if (search) {
      records = records.filter((r) =>
        (r.emp_code && r.emp_code.toLowerCase().includes(search)) ||
        (r.emp_name && r.emp_name.toLowerCase().includes(search)) ||
        (r.department && r.department.toLowerCase().includes(search)) ||
        (r.position && r.position.toLowerCase().includes(search)) ||
        (r.note && r.note.toLowerCase().includes(search))
      );
    }

    // Calculate role breakdown stats
    const allQuery = `SELECT role_type, is_active FROM ci_kaizen_permissions`;
    const { results: allRows } = await db.prepare(allQuery).all().catch(() => ({ results: [] }));
    const allList = allRows || [];

    const stats = {
      total: allList.length,
      active: allList.filter((r: any) => r.is_active === 1).length,
      ie: allList.filter((r: any) => r.role_type === 'IE' && r.is_active === 1).length,
      ci_lead: allList.filter((r: any) => r.role_type === 'CI_LEAD' && r.is_active === 1).length,
      judge: allList.filter((r: any) => r.role_type === 'JUDGE' && r.is_active === 1).length,
      approver: allList.filter((r: any) => r.role_type === 'APPROVER' && r.is_active === 1).length,
    };

    return NextResponse.json({
      success: true,
      data: records,
      total: records.length,
      stats,
    });
  } catch (error: any) {
    console.error('[GET /api/ci-kaizen/permissions] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi lấy danh sách phân quyền' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    // Verify admin permission
    if (session && !isAuthorizedAdmin(session)) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Bạn không có quyền quản lý phân quyền CI/IE' },
        { status: 403 }
      );
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database binding unavailable' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const body = await request.json();
    const {
      emp_code,
      emp_name,
      role_type,
      roles, // Optional array of roles for multi-role assignment at once
      factory_scope = 'ALL',
      department = '',
      position = '',
      note = '',
      is_active = 1,
    } = body;

    if (!emp_code) {
      return NextResponse.json({ success: false, error: 'Thiếu mã số nhân viên (MSNV)' }, { status: 400 });
    }

    const cleanEmp = String(emp_code).trim().toUpperCase();
    const cleanName = String(emp_name || cleanEmp).trim();
    const createdBy = (session as any)?.empCode || (session as any)?.name || 'Admin';

    // Support single role or multiple roles at once
    const rolesToAssign: string[] = Array.isArray(roles) && roles.length > 0 
      ? roles 
      : role_type 
        ? [role_type] 
        : ['IE'];

    const upsertSql = `
      INSERT INTO ci_kaizen_permissions (
        id, emp_code, emp_name, role_type, factory_scope, department, position, note, is_active, created_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(emp_code, role_type) DO UPDATE SET
        emp_name = excluded.emp_name,
        factory_scope = excluded.factory_scope,
        department = excluded.department,
        position = excluded.position,
        note = excluded.note,
        is_active = excluded.is_active,
        updated_at = CURRENT_TIMESTAMP
    `;

    const insertedIds: string[] = [];
    for (const r of rolesToAssign) {
      const validRole = String(r).toUpperCase();
      const id = `perm_${validRole.toLowerCase()}_${cleanEmp}_${Date.now()}`;
      await db.prepare(upsertSql).bind(
        id,
        cleanEmp,
        cleanName,
        validRole,
        factory_scope || 'ALL',
        department || '',
        position || '',
        note || '',
        is_active ? 1 : 0,
        createdBy
      ).run();
      insertedIds.push(id);
    }

    return NextResponse.json({
      success: true,
      message: `Đã phân quyền thành công cho CBNV ${cleanName} (${cleanEmp})`,
      roles: rolesToAssign,
      emp_code: cleanEmp,
    });
  } catch (error: any) {
    console.error('[POST /api/ci-kaizen/permissions] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi thêm phân quyền' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (session && !isAuthorizedAdmin(session)) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Bạn không có quyền quản lý phân quyền CI/IE' },
        { status: 403 }
      );
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database binding unavailable' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const body = await request.json();
    const { id, is_active, factory_scope, note, department, position } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID phân quyền' }, { status: 400 });
    }

    let updateFields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [];

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (factory_scope !== undefined) {
      updateFields.push('factory_scope = ?');
      params.push(factory_scope);
    }

    if (note !== undefined) {
      updateFields.push('note = ?');
      params.push(note);
    }

    if (department !== undefined) {
      updateFields.push('department = ?');
      params.push(department);
    }

    if (position !== undefined) {
      updateFields.push('position = ?');
      params.push(position);
    }

    params.push(id);
    const updateSql = `UPDATE ci_kaizen_permissions SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.prepare(updateSql).bind(...params).run();

    return NextResponse.json({
      success: true,
      message: 'Cập nhật phân quyền thành công',
    });
  } catch (error: any) {
    console.error('[PATCH /api/ci-kaizen/permissions] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi cập nhật phân quyền' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (session && !isAuthorizedAdmin(session)) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Bạn không có quyền xóa phân quyền CI/IE' },
        { status: 403 }
      );
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database binding unavailable' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID phân quyền cần xóa' }, { status: 400 });
    }

    await db.prepare('DELETE FROM ci_kaizen_permissions WHERE id = ?').bind(id).run();

    return NextResponse.json({
      success: true,
      message: 'Đã xóa phân quyền thành công',
    });
  } catch (error: any) {
    console.error('[DELETE /api/ci-kaizen/permissions] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi xóa phân quyền' }, { status: 500 });
  }
}
