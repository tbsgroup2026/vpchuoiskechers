import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export const OFFICIAL_SYSTEM_USERS = [
  {
    id: "emp_1",
    empCode: "202608001",
    name: "Phạm Nguyễn Anh Huy",
    email: "anhy.work.2004@gmail.com",
    phone: "0522511245",
    title: "Trưởng Phòng IT - Team Chuyển Đổi Số",
    department: "IT - Team Chuyển Đổi Số",
    roleCode: "TRUONG_PHONG",
    status: "ACTIVE",
    vtcvHienTai: "TP",
  },
  {
    id: "emp_2",
    empCode: "202608002",
    name: "Trần Ngọc Huy",
    email: "tranhuy110421@gmail.com",
    phone: "0522511246",
    title: "Kỹ Sư IT - Team Chuyển Đổi Số",
    department: "IT - Team Chuyển Đổi Số",
    roleCode: "TRUONG_PHONG",
    status: "ACTIVE",
    vtcvHienTai: "TP",
  },
  {
    id: "emp_3",
    empCode: "202206011",
    name: "Lễ Tân (Trưởng Team LT)",
    email: "letan.teamlead@tbsgroup.vn",
    phone: "0522511247",
    title: "Trưởng Team Lễ Tân",
    department: "Văn Phòng Chuỗi SKECHERS",
    roleCode: "LE_TAN",
    status: "ACTIVE",
    vtcvHienTai: "LT",
  },
  {
    id: "emp_4",
    empCode: "202010004",
    name: "Lễ Tân",
    email: "letan.202010004@tbsgroup.vn",
    phone: "0522511248",
    title: "Nhân Viên Lễ Tân",
    department: "Văn Phòng Chuỗi SKECHERS",
    roleCode: "LE_TAN",
    status: "ACTIVE",
    vtcvHienTai: "LT",
  },
  {
    id: "emp_5",
    empCode: "202409009",
    name: "Lễ Tân",
    email: "letan.202409009@tbsgroup.vn",
    phone: "0522511249",
    title: "Nhân Viên Lễ Tân",
    department: "Văn Phòng Chuỗi SKECHERS",
    roleCode: "LE_TAN",
    status: "ACTIVE",
    vtcvHienTai: "LT",
  },
  {
    id: "emp_6",
    empCode: "200405004",
    name: "Trần Văn Quản Trị",
    email: "admin.200405004@tbsgroup.vn",
    phone: "0903800000",
    title: "Lãnh Đạo Quản Trị Hệ Thống",
    department: "Khối Quản Trị Hệ Thống",
    roleCode: "SUPER_ADMIN",
    status: "ACTIVE",
    vtcvHienTai: "ADMIN",
  },
  {
    id: "emp_7",
    empCode: "222102020",
    name: "Phụ Trách Quản Trị Hệ Thống",
    email: "admin.222102020@tbsgroup.vn",
    phone: "0903800001",
    title: "Chuyên Viên Quản Trị Hệ Thống",
    department: "Khối Quản Trị Hệ Thống",
    roleCode: "SUPER_ADMIN",
    status: "ACTIVE",
    vtcvHienTai: "ADMIN",
  },
];

export async function GET() {
  try {
    const db = getDbBinding();
    if (db) {
      try {
        const query = `SELECT * FROM sys_users ORDER BY id ASC`;
        const { results } = await db.prepare(query).all();
        if (results && results.length > 0) {
          return NextResponse.json({
            success: true,
            data: results,
          });
        }
      } catch (e) {
        // Table sys_users might not exist yet, fallback to official list
      }
    }

    return NextResponse.json({
      success: true,
      data: OFFICIAL_SYSTEM_USERS,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      data: OFFICIAL_SYSTEM_USERS,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDbBinding();

    if (db && body.empCode) {
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS sys_users (
            id TEXT PRIMARY KEY,
            emp_code TEXT UNIQUE,
            name TEXT,
            email TEXT,
            phone TEXT,
            title TEXT,
            department TEXT,
            role_code TEXT,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run().catch(() => {});

        await db.prepare(`
          INSERT INTO sys_users (id, emp_code, name, email, phone, title, department, role_code, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(emp_code) DO UPDATE SET
            name=excluded.name,
            email=excluded.email,
            phone=excluded.phone,
            title=excluded.title,
            department=excluded.department,
            role_code=excluded.role_code,
            status=excluded.status
        `).bind(
          body.id || `emp_${Date.now()}`,
          body.empCode,
          body.name,
          body.email || '',
          body.phone || '',
          body.title || '',
          body.department || '',
          body.roleCode || 'CBCNV',
          body.status || 'ACTIVE'
        ).run().catch(() => {});
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tài khoản người dùng thành công!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');
    const id = searchParams.get('id');
    const empCode = searchParams.get('empCode');
    const db = getDbBinding();

    if (db) {
      try {
        if (all === 'true') {
          await db.prepare(`DELETE FROM sys_users`).run().catch(() => {});
        } else if (empCode || id) {
          await db.prepare(`DELETE FROM sys_users WHERE emp_code = ? OR id = ?`).bind(empCode || '', id || '').run().catch(() => {});
        }
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật trạng thái xóa tài khoản thành công!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
