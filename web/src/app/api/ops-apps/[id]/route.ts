import { NextResponse } from "next/server";
import { dbRun } from "@/lib/db";
import { getCurrentUser, isAdminUser } from "@/lib/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Chỉ Admin được sửa ứng dụng" }, { status: 403 });
  }

  const { id } = await params;
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

  dbRun(
    `UPDATE ops_apps SET department_id = ?, name = ?, description = ?, icon = ?, href = ?, is_featured = ?, sort_order = ? WHERE id = ?`,
    [departmentId, name, description || null, icon || "app", href || null, isFeatured ? 1 : 0, sortOrder ?? 0, id]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Chỉ Admin được xoá ứng dụng" }, { status: 403 });
  }

  const { id } = await params;
  dbRun(`DELETE FROM ops_apps WHERE id = ?`, [id]);
  return NextResponse.json({ success: true });
}
