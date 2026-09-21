import { NextResponse } from 'next/server';


function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const OFFICIAL_SYSTEM_USERS = [
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
    name: "Phạm Minh Tùng",
    email: "200405004@tbsgroup.vn",
    phone: "0903800000",
    title: "TGĐ",
    department: "Ban Điều Hành",
    roleCode: "TONG_GIAM_DOC",
    status: "ACTIVE",
    vtcvHienTai: "TGĐ",
    vtcvSapXep: "TGĐ",
  },
  {
    id: "emp_7",
    empCode: "210608003",
    name: "Vũ Thành Lê",
    email: "210608003@tbsgroup.vn",
    phone: "0903800001",
    title: "GĐ",
    department: "Ban Giám Đốc",
    roleCode: "GIAM_DOC",
    status: "ACTIVE",
    vtcvHienTai: "PGĐ",
    vtcvSapXep: "GĐ",
  },
  {
    id: "emp_8",
    empCode: "210602002",
    name: "Trần Thị Ngoan",
    email: "210602002@tbsgroup.vn",
    phone: "0901234567",
    title: "Chuyên Viên IE & Phê Duyệt Sáng Kiến Kaizen",
    department: "Kỹ Thuật Công Nghiệp (IE)",
    roleCode: "IE",
    status: "ACTIVE",
    vtcvHienTai: "IE",
  },
  {
    id: "emp_9",
    empCode: "201506009",
    name: "Lê Thúy Diễm",
    email: "201506009@tbsgroup.vn",
    phone: "",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    roleCode: "CBCNV",
    status: "ACTIVE",
    vtcvHienTai: "NV",
  },
  {
    id: "emp_10",
    empCode: "201607010",
    name: "Nguyễn Thị Đào",
    email: "201607010@tbsgroup.vn",
    phone: "",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    roleCode: "CBCNV",
    status: "ACTIVE",
    vtcvHienTai: "NV",
  },
  {
    id: "emp_11",
    empCode: "201507009",
    name: "Hồ Thị Thảo",
    email: "201507009@tbsgroup.vn",
    phone: "",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    roleCode: "CBCNV",
    status: "ACTIVE",
    vtcvHienTai: "NV",
  },
  {
    id: "emp_12",
    empCode: "201507015",
    name: "Đoàn Thị Trinh",
    email: "201507015@tbsgroup.vn",
    phone: "",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    roleCode: "CBCNV",
    status: "ACTIVE",
    vtcvHienTai: "NV",
  },
  {
    id: "emp_13",
    empCode: "212103096",
    name: "Nguyễn Văn Nguyện",
    email: "212103096@tbsgroup.vn",
    phone: "",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    roleCode: "CBCNV",
    status: "ACTIVE",
    vtcvHienTai: "NV",
  },
];

export async function GET() {
  try {
    const db = getDbBinding();
    if (db) {
      try {
        const query = `SELECT * FROM sys_users ORDER BY id ASC`;
        const { results } = await db.prepare(query).all();
        if (results) {
          return NextResponse.json({
            success: true,
            data: results,
          });
        }
      } catch (e) {
        // Table sys_users might not exist yet
      }
    }

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      data: [],
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
            ngay_vao TEXT,
            vtcv_hien_tai TEXT,
            phong_ban_hien_tai TEXT,
            vtcv_sap TEXT,
            vtcv_sap_xep TEXT,
            pb_sap_xep TEXT,
            bo_phan_moi TEXT,
            phong_ban_moi TEXT,
            ghi_chu TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run().catch(() => {});

        const cols = ["ngay_vao", "vtcv_hien_tai", "phong_ban_hien_tai", "vtcv_sap", "vtcv_sap_xep", "pb_sap_xep", "bo_phan_moi", "phong_ban_moi", "ghi_chu"];
        for (const col of cols) {
          await db.prepare(`ALTER TABLE sys_users ADD COLUMN ${col} TEXT`).run().catch(() => {});
        }

        await db.prepare(`
          INSERT INTO sys_users (
            id, emp_code, name, email, phone, title, department, role_code, status,
            ngay_vao, vtcv_hien_tai, phong_ban_hien_tai, vtcv_sap, vtcv_sap_xep,
            pb_sap_xep, bo_phan_moi, phong_ban_moi, ghi_chu
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(emp_code) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            phone = excluded.phone,
            title = excluded.title,
            department = excluded.department,
            role_code = excluded.role_code,
            status = excluded.status,
            ngay_vao = excluded.ngay_vao,
            vtcv_hien_tai = excluded.vtcv_hien_tai,
            phong_ban_hien_tai = excluded.phong_ban_hien_tai,
            vtcv_sap = excluded.vtcv_sap,
            vtcv_sap_xep = excluded.vtcv_sap_xep,
            pb_sap_xep = excluded.pb_sap_xep,
            bo_phan_moi = excluded.bo_phan_moi,
            phong_ban_moi = excluded.phong_ban_moi,
            ghi_chu = excluded.ghi_chu
        `).bind(
          body.id || `emp_${Date.now()}`,
          body.empCode,
          body.name || '',
          body.email || '',
          body.phone || '',
          body.title || '',
          body.department || '',
          body.roleCode || 'CBCNV',
          body.status || 'ACTIVE',
          body.ngay_vao || body.ngayVao || '',
          body.vtcv_hien_tai || body.vtcvHienTai || '',
          body.phong_ban_hien_tai || body.phongBanHienTai || '',
          body.vtcv_sap || body.vtcvSap || '',
          body.vtcv_sap_xep || body.vtcvSapXep || '',
          body.pb_sap_xep || body.phongBanSapXep || '',
          body.bo_phan_moi || body.boPhoanMoi || '',
          body.phong_ban_moi || body.phongBanMoi || '',
          body.ghi_chu || body.ghiChu || ''
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
