import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ensureKaizenSchema } from "@/lib/kaizenDbMigration";

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

// Fallback memory list if D1 is not available in local dev
const SAMPLE_EMPLOYEES = [
  { emp_code: "202608001", full_name: "Nguyễn Văn Anh", department: "Văn Phòng Chuỗi SKECHERS", position: "Trưởng Phòng CI", phone: "0901234567", email: "anhnv@tbsgroup.vn", pickup_location: "VP Chuỗi SKECHERS - Cổng chính" },
  { emp_code: "202608002", full_name: "Trần Thị Mai", department: "Nhà Máy Miền Đông", position: "Phó Phòng Sản Xuất", phone: "0902345678", email: "maitt@tbsgroup.vn", pickup_location: "Nhà máy Miền Đông - Cổng A" },
  { emp_code: "202608010", full_name: "Lê Văn Hùng", department: "Kiên Giang 1", position: "Chuyên Viên IE", phone: "0903456789", email: "hunglv@tbsgroup.vn", pickup_location: "Kiên Giang 1 - Phụ Lô" },
  { emp_code: "210602002", full_name: "Phạm Quốc Tuấn", department: "Kiên Giang 2", position: "Trưởng Xưởng May", phone: "0904567890", email: "tuanpq@tbsgroup.vn", pickup_location: "Kiên Giang 2 - Cụm B" },
  { emp_code: "222102020", full_name: "Đỗ Minh Đức", department: "Hoàn Thiện Đế", position: "Kỹ Sư R&D", phone: "0905678901", email: "ducdm@tbsgroup.vn", pickup_location: "Tổ hợp Đế Giày TTPP" },
  { emp_code: "201711002", full_name: "Lê Khải", department: "Văn Phòng Chuỗi SKECHERS", position: "Giám Đốc Chuỗi Cung Ứng", phone: "0906789012", email: "khaile@tbsgroup.vn", pickup_location: "VP Chuỗi - Trụ sở chính" },
];

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ success: true, data: [] });
    }

    const db = getDbBinding();
    let results: any[] = [];

    if (db) {
      await ensureKaizenSchema(db);
      const queryStr = `%${q.toLowerCase()}%`;
      const dbRes = await db.prepare(`
        SELECT emp_code, full_name, department, position, phone, email, pickup_location
        FROM employees
        WHERE LOWER(emp_code) LIKE ? OR LOWER(full_name) LIKE ? OR LOWER(department) LIKE ?
        LIMIT 10
      `).bind(queryStr, queryStr, queryStr).all().catch(() => null);

      if (dbRes && Array.isArray(dbRes.results) && dbRes.results.length > 0) {
        results = dbRes.results;
      }
    }

    // Fallback in-memory search if DB returned no results
    if (results.length === 0) {
      const normQ = removeVietnameseTones(q);
      results = SAMPLE_EMPLOYEES.filter((emp) => {
        const normName = removeVietnameseTones(emp.full_name);
        const normCode = emp.emp_code.toLowerCase();
        const normDept = removeVietnameseTones(emp.department);
        return normName.includes(normQ) || normCode.includes(normQ) || normDept.includes(normQ);
      }).slice(0, 10);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
