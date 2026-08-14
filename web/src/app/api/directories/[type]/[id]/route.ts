import { NextResponse } from "next/server";
import { dbRun } from "@/lib/db";
import { DIRECTORIES, isDirectoryType } from "@/lib/directories";
import { getCurrentUser, isAdminUser } from "@/lib/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  if (!isDirectoryType(type)) {
    return NextResponse.json({ error: "Danh mục không tồn tại" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Chỉ Admin được sửa danh mục" }, { status: 403 });
  }

  const def = DIRECTORIES[type];
  const body = await request.json();

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const field of def.fields) {
    if (!(field.key in body)) continue;
    sets.push(`${field.key} = ?`);
    values.push(field.type === "checkbox" ? (body[field.key] ? 1 : 0) : body[field.key]);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });
  }

  values.push(id);

  try {
    dbRun(`UPDATE ${def.table} SET ${sets.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể cập nhật";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  if (!isDirectoryType(type)) {
    return NextResponse.json({ error: "Danh mục không tồn tại" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Chỉ Admin được xoá danh mục" }, { status: 403 });
  }

  const def = DIRECTORIES[type];

  try {
    dbRun(`DELETE FROM ${def.table} WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể xoá (có thể đang được sử dụng ở nơi khác)";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
