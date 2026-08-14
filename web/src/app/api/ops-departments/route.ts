import { NextResponse } from "next/server";
import { dbAll, dbRun } from "@/lib/db";
import { getCurrentUser, isAdminUser } from "@/lib/session";

// Public — trang chủ cần đọc để render sidebar phòng ban + app
export async function GET() {
  const departments = dbAll(`SELECT * FROM ops_departments ORDER BY sort_order ASC, name ASC`);
  const apps = dbAll(`SELECT * FROM ops_apps ORDER BY sort_order ASC, name ASC`);

  const deptNameById = new Map<number, string>();
  for (const d of departments) {
    deptNameById.set((d as { id: number }).id, (d as { name: string }).name);
  }

  const appsByDept = new Map<number, unknown[]>();
  const featuredApps: unknown[] = [];
  for (const a of apps) {
    const app = a as { id: number; department_id: number; is_featured: number };
    if (!appsByDept.has(app.department_id)) appsByDept.set(app.department_id, []);
    appsByDept.get(app.department_id)!.push(a);
    if (app.is_featured) {
      featuredApps.push({ ...(a as Record<string, unknown>), department_name: deptNameById.get(app.department_id) });
    }
  }

  const items = departments.map((d) => ({
    ...(d as Record<string, unknown>),
    apps: appsByDept.get((d as { id: number }).id) || [],
  }));

  return NextResponse.json({ items, featuredApps });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Chỉ Admin được thêm phòng ban" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, imageUrl, sortOrder } = body as {
    name?: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
  };
  if (!name) return NextResponse.json({ error: "Thiếu tên phòng ban" }, { status: 400 });

  try {
    const result = dbRun(
      `INSERT INTO ops_departments (name, description, image_url, sort_order) VALUES (?, ?, ?, ?)`,
      [name, description || null, imageUrl || null, sortOrder || 0]
    );
    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể thêm phòng ban";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
