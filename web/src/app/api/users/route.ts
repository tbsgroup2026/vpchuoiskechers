import { NextResponse } from 'next/server';
import { getAuthUser, isAdminUser, isExecutiveOrAdmin, isDepartmentHead } from '@/lib/auth';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    const db = getDbBinding();

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu D1' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const department = (searchParams.get('department') || searchParams.get('dept') || '').trim();
    const role = (searchParams.get('role') || '').trim();
    const allAllowed = searchParams.get('all') === 'true';

    // Role-based department restriction for Department Heads (Trưởng phòng)
    let restrictedDept: string | null = null;
    if (session && !allAllowed) {
      const roleLevel = session.roleLevel || 4;
      const isAdmin = roleLevel === 1;
      const isExec = isAdmin || roleLevel <= 2;
      const isTP = !isExec && roleLevel === 3;

      if (isTP && session.department) {
        restrictedDept = String(session.department);
      }
    }

    let sql = `SELECT * FROM sys_users WHERE status = 'ACTIVE'`;
    const params: any[] = [];

    const effectiveDept = department || restrictedDept;
    if (effectiveDept) {
      sql += ` AND UPPER(department) LIKE UPPER(?)`;
      params.push(`%${effectiveDept}%`);
    }

    if (search) {
      sql += ` AND (UPPER(name) LIKE UPPER(?) OR UPPER(emp_code) LIKE UPPER(?) OR UPPER(title) LIKE UPPER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      sql += ` AND UPPER(role_code) = UPPER(?)`;
      params.push(role);
    }

    sql += ` ORDER BY department ASC, name ASC`;

    const { results } = await db.prepare(sql).bind(...params).all();
    const users = (results || []).map((u: any) => ({
      id: u.id,
      empCode: u.emp_code,
      emp_code: u.emp_code,
      name: u.name,
      email: u.email,
      phone: u.phone,
      title: u.title,
      department: u.department,
      roleCode: u.role_code,
      role_code: u.role_code,
      roleLevel: u.role_level || (u.role_code === 'TRUONG_PHONG' ? 3 : u.role_code === 'SUPER_ADMIN' ? 1 : 4),
      role_level: u.role_level || (u.role_code === 'TRUONG_PHONG' ? 3 : u.role_code === 'SUPER_ADMIN' ? 1 : 4),
      status: u.status,
      mustChangePwd: Boolean(u.must_change_pwd),
      must_change_pwd: u.must_change_pwd,
      isTestAccount: Boolean(u.is_test_account),
      avatar: u.avatar || '',
    }));

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Lỗi truy vấn nhân sự D1: ${error?.message || error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !isAdminUser(session)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền tạo nhân sự mới' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const db = getDbBinding();

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu D1' },
        { status: 500 }
      );
    }

    const empCode = (body.empCode || body.emp_code || '').trim();
    const name = (body.name || '').trim();
    if (!empCode || !name) {
      return NextResponse.json(
        { success: false, error: 'Mã số nhân viên (empCode) và Họ tên (name) là bắt buộc' },
        { status: 400 }
      );
    }

    const id = body.id || `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const email = body.email || `${empCode.toLowerCase()}@tbsgroup.vn`;
    const phone = body.phone || '';
    const title = body.title || 'Cán Bộ Công Nhân Viên';
    const department = body.department || 'TBS Group';
    const roleCode = body.roleCode || body.role_code || 'CBCNV';
    const roleLevel = body.roleLevel || (roleCode === 'TRUONG_PHONG' ? 3 : 4);
    const passwordHash = body.password_hash || body.passwordHash || 'sha256:298caf1cd8f71e1fc908e8c94a2b79afbccee0cabb9cc659357dbb4247841d02';

    await db.prepare(`
      INSERT INTO sys_users (
        id, emp_code, name, email, phone, title, department, role_code, role_level,
        password_hash, must_change_pwd, status, is_test_account
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ACTIVE', 0)
      ON CONFLICT(emp_code) DO UPDATE SET
        name = excluded.name, email = excluded.email, phone = excluded.phone,
        title = excluded.title, department = excluded.department, role_code = excluded.role_code,
        role_level = excluded.role_level
    `).bind(
      id, empCode, name, email, phone, title, department, roleCode, roleLevel, passwordHash
    ).run();

    return NextResponse.json({
      success: true,
      message: 'Đã lưu nhân sự thành công vào D1',
      user: { id, empCode, name, email, phone, title, department, roleCode, roleLevel },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Lỗi khi lưu nhân sự: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
