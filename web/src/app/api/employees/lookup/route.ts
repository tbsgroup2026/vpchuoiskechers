import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

// Built-in CBNV dataset for real-time employee lookup by MSNV
const EMPLOYEES_DB: Record<string, {
  emp_code: string;
  name: string;
  factory_id: string;
  workshop_id: string;
  line_id?: string;
  chuyen_id?: string;
  to_id?: string;
  vtcv: string;
  position?: string;
}> = {
  "202608001": {
    emp_code: "202608001",
    name: "Phạm Nguyễn Anh Huy",
    factory_id: "VP Chuỗi",
    workshop_id: "Khối Vận Hành SKECHERS",
    line_id: "Bộ Phận Quản Lý Chuỗi Supply Chain",
    vtcv: "Cán bộ quản lý",
    position: "IT - Team Chuyển Đổi Số",
  },
  "202608002": {
    emp_code: "202608002",
    name: "Trần Ngọc Huy",
    factory_id: "VP Chuỗi",
    workshop_id: "Khối Vận Hành SKECHERS",
    line_id: "Bộ Phận Quản Lý Chuỗi Supply Chain",
    vtcv: "Cán bộ quản lý",
    position: "Kỹ Sư IT - Team Chuyển Đổi Số",
  },
  "202206011": {
    emp_code: "202206011",
    name: "Lễ Tân (Trưởng Team LT)",
    factory_id: "VP Chuỗi",
    workshop_id: "Khối Vận Hành SKECHERS",
    vtcv: "Nhân viên",
    position: "Trưởng Team Lễ Tân",
  },
  "202010004": {
    emp_code: "202010004",
    name: "Lễ Tân",
    factory_id: "VP Chuỗi",
    workshop_id: "Khối Vận Hành SKECHERS",
    vtcv: "Nhân viên",
    position: "Nhân Viên Lễ Tân",
  },
  "202409009": {
    emp_code: "202409009",
    name: "Lễ Tân",
    factory_id: "VP Chuỗi",
    workshop_id: "Khối Vận Hành SKECHERS",
    vtcv: "Nhân viên",
    position: "Nhân Viên Lễ Tân",
  },
  "200405004": {
    emp_code: "200405004",
    name: "Trần Văn Quản Trị",
    factory_id: "VP Chuỗi",
    workshop_id: "Khối Vận Hành SKECHERS",
    vtcv: "Cán bộ quản lý",
    position: "Lãnh Đạo Quản Trị Hệ Thống",
  },
  "222102020": {
    emp_code: "222102020",
    name: "Phụ Trách Quản Trị Hệ Thống",
    factory_id: "VP Chuỗi",
    workshop_id: "Khối Vận Hành SKECHERS",
    vtcv: "Cán bộ quản lý",
    position: "Chuyên Viên Quản Trị Hệ Thống",
  },
  "SK-2026-101": {
    emp_code: "SK-2026-101",
    name: "Nguyễn Văn An",
    factory_id: "KG1",
    workshop_id: "Đầu vào",
    line_id: "Line Đầu Vào 1",
    vtcv: "Công nhân",
    position: "Công nhân cán ép đế",
  },
  "SK-2026-102": {
    emp_code: "SK-2026-102",
    name: "Trần Thị Bình",
    factory_id: "KG1",
    workshop_id: "May",
    line_id: "Line May Mũi 1",
    vtcv: "Công nhân",
    position: "Công nhân may mũi",
  },
  "CN-88201": {
    emp_code: "CN-88201",
    name: "Lê Văn Cường",
    factory_id: "KG1",
    workshop_id: "Đầu vào",
    line_id: "Line Đầu Vào 1",
    vtcv: "Công nhân",
    position: "Công nhân dán đế",
  },
  "CN-88202": {
    emp_code: "CN-88202",
    name: "Nguyễn Thị Dung",
    factory_id: "KG1",
    workshop_id: "May",
    line_id: "Line May Mũi 1",
    vtcv: "Công nhân",
    position: "Công nhân may mũi 1",
  },
  "CN-88203": {
    emp_code: "CN-88203",
    name: "Phạm Quốc Giang",
    factory_id: "KG1",
    workshop_id: "Gò",
    line_id: "Line Gò Thành Phẩm",
    vtcv: "Công nhân",
    position: "Công nhân gò chuyền 1",
  },
  "CN-88204": {
    emp_code: "CN-88204",
    name: "Vũ Thị Hoa",
    factory_id: "KG2",
    workshop_id: "May",
    line_id: "Line May KG2",
    vtcv: "Công nhân",
    position: "Công nhân may 2",
  },
  "CN-88205": {
    emp_code: "CN-88205",
    name: "Hoàng Văn Hùng",
    factory_id: "KG3",
    workshop_id: "Gò",
    line_id: "Line Gò KG3",
    vtcv: "Công nhân",
    position: "Công nhân gò KG3",
  },
  "CN-88206": {
    emp_code: "CN-88206",
    name: "Đặng Thị Mai",
    factory_id: "Hoàn thiện đế",
    workshop_id: "Đầu vào",
    line_id: "Line Phun Sơn Đế",
    vtcv: "Công nhân",
    position: "Công nhân phun sơn đế",
  },
  "CN-88207": {
    emp_code: "CN-88207",
    name: "Đỗ Minh Quan",
    factory_id: "NMMĐ",
    workshop_id: "Gò",
    line_id: "Line Gò Miền Đông",
    vtcv: "Công nhân",
    position: "Công nhân nhà máy miền đông",
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const msnvRaw = searchParams.get('msnv') || searchParams.get('code') || searchParams.get('empCode') || '';
    const msnv = msnvRaw.trim().toUpperCase();

    if (!msnv) {
      return NextResponse.json({ success: false, message: 'Thiếu tham số MSNV' }, { status: 400 });
    }

    // 1. Database query if D1 binding is available
    const db = getDbBinding();
    if (db) {
      try {
        const query = `SELECT * FROM hr_employees WHERE UPPER(emp_code) = ? OR UPPER(msnv) = ? LIMIT 1`;
        const res = await db.prepare(query).bind(msnv, msnv).first();
        if (res) {
          return NextResponse.json({
            success: true,
            data: {
              emp_code: res.emp_code || res.msnv || msnv,
              name: res.name || res.ho_ten || res.full_name,
              factory_id: res.factory_id || res.nha_may || res.factory || 'KG1',
              workshop_id: res.workshop_id || res.xuong || res.department || 'Đầu vào',
              line_id: res.line_id || res.line || '',
              chuyen_id: res.chuyen_id || res.chuyen || '',
              to_id: res.to_id || res.to || '',
              vtcv: res.vtcv || res.position || 'Công nhân',
              position: res.position || res.vtcv || 'Công nhân',
            },
          });
        }
      } catch (e) {
        // Table hr_employees might not exist yet, proceed to built-in dataset
      }
    }

    // 2. Check exact key match
    if (EMPLOYEES_DB[msnv]) {
      return NextResponse.json({
        success: true,
        data: EMPLOYEES_DB[msnv],
      });
    }

    // 3. Case-insensitive / normalized search
    const foundKey = Object.keys(EMPLOYEES_DB).find(
      (k) => k.toUpperCase() === msnv || k.toUpperCase().replace(/[-_]/g, '') === msnv.replace(/[-_]/g, '')
    );
    if (foundKey) {
      return NextResponse.json({
        success: true,
        data: EMPLOYEES_DB[foundKey],
      });
    }

    // 4. Dynamic fallback pattern matcher for standard employee codes (length >= 4)
    if (msnv.length >= 4) {
      let factory_id = "KG1";
      let workshop_id = "Đầu vào";
      let vtcv = "Công nhân";

      if (msnv.startsWith("SK")) {
        factory_id = "VP Chuỗi";
        workshop_id = "Khối Vận Hành SKECHERS";
        vtcv = "Nhân viên";
      } else if (msnv.startsWith("KG2")) {
        factory_id = "KG2";
        workshop_id = "May";
      } else if (msnv.startsWith("KG3")) {
        factory_id = "KG3";
        workshop_id = "Gò";
      } else if (msnv.startsWith("HTD")) {
        factory_id = "Hoàn thiện đế";
        workshop_id = "Đầu vào";
      } else if (msnv.startsWith("NMMD") || msnv.startsWith("MD")) {
        factory_id = "NMMĐ";
        workshop_id = "Gò";
      }

      return NextResponse.json({
        success: true,
        data: {
          emp_code: msnv,
          name: `Cán Bộ Công Nhân Viên (${msnv})`,
          factory_id,
          workshop_id,
          line_id: "",
          vtcv,
          position: vtcv,
        },
      });
    }

    return NextResponse.json({ success: false, message: "Không tìm thấy thông tin MSNV" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
