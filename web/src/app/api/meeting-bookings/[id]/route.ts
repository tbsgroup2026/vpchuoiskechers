import { NextResponse } from "next/server";
import { dbRun } from "@/lib/db";
import { getCurrentUser, isAdminUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Chỉ Admin được duyệt đơn" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action as "APPROVE" | "REJECT";
  const rejectReason = body.rejectReason as string | undefined;

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  }

  dbRun(
    `UPDATE meeting_bookings SET status = ?, approved_by = ?, approved_at = datetime('now'), reject_reason = ? WHERE id = ?`,
    [action === "APPROVE" ? "APPROVED" : "REJECTED", user!.name, action === "REJECT" ? rejectReason || null : null, id]
  );

  return NextResponse.json({ success: true });
}
