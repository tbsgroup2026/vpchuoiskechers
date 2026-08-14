import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db";

// GET /api/meeting-bookings/availability?roomId=1&date=2026-08-14
// Trả về danh sách khung giờ đã bị đặt (APPROVED hoặc PENDING) trong ngày, để vẽ lưới chọn giờ.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const date = searchParams.get("date");

  if (!roomId || !date) {
    return NextResponse.json({ error: "Thiếu roomId hoặc date" }, { status: 400 });
  }

  const bookings = dbAll(
    `SELECT id, gio_bat_dau, gio_ket_thuc, status FROM meeting_bookings
     WHERE room_id = ? AND ngay_hop = ? AND status != 'REJECTED'
     ORDER BY gio_bat_dau ASC`,
    [roomId, date]
  );

  return NextResponse.json({ bookedSlots: bookings });
}
