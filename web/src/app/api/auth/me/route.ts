import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  return NextResponse.json({ user, isAdmin: isAdminUser(user) });
}
