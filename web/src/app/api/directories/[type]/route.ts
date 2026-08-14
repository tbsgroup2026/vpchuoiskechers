import { NextResponse } from "next/server";
import { dbAll, dbRun } from "@/lib/db";
import { DIRECTORIES, isDirectoryType } from "@/lib/directories";
import { getCurrentUser, isAdminUser } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!isDirectoryType(type)) {
    return NextResponse.json({ error: "Danh mục không tồn tại" }, { status: 404 });
  }
  const def = DIRECTORIES[type];
  const rows = dbAll(`SELECT * FROM ${def.table} ORDER BY name ASC`);
  return NextResponse.json({ items: rows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!isDirectoryType(type)) {
    return NextResponse.json({ error: "Danh mục không tồn tại" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Chỉ Admin được thêm danh mục" }, { status: 403 });
  }

  const def = DIRECTORIES[type];
  const body = await request.json();

  const columns: string[] = [];
  const placeholders: string[] = [];
  const values: unknown[] = [];

  for (const field of def.fields) {
    if (!(field.key in body)) continue;
    columns.push(field.key);
    placeholders.push("?");
    values.push(field.type === "checkbox" ? (body[field.key] ? 1 : 0) : body[field.key]);
  }

  if (columns.length === 0) {
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });
  }

  try {
    const result = dbRun(
      `INSERT INTO ${def.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
      values
    );
    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể thêm mục";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
