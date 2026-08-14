import { NextResponse } from "next/server";
import { dbRun } from "@/lib/db";
import { getCurrentUser, isAdminUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Chỉ Admin được thêm ứng dụng" }, { status: 403 });
  }

  const body = await request.json();
  const { departmentId, name, description, icon, href, isFeatured, sortOrder } = body as {
    departmentId?: number;
    name?: string;
    description?: string;
    icon?: string;
    href?: string;
    isFeatured?: boolean;
    sortOrder?: number;
  };

  if (!departmentId || !name) {
    return NextResponse.json({ error: "Thiếu phòng ban hoặc tên ứng dụng" }, { status: 400 });
  }

  try {
    const result = dbRun(
      `INSERT INTO ops_apps (department_id, name, description, icon, href, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [departmentId, name, description || null, icon || "app", href || null, isFeatured ? 1 : 0, sortOrder || 0]
    );
    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể thêm ứng dụng";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
