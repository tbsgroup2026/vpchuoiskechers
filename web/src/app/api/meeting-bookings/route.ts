import { NextResponse } from "next/server";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { getCurrentUser, isAdminUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const admin = isAdminUser(user);
  const items = admin
    ? dbAll(`SELECT * FROM meeting_bookings ORDER BY created_at DESC`)
    : dbAll(`SELECT * FROM meeting_bookings WHERE created_by_emp_code = ? ORDER BY created_at DESC`, [user.empCode]);

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await request.json();
  const {
    hoTen,
    boPhan,
    roomId,
    ngayHop,
    gioBatDau,
    gioKetThuc,
    hinhThucHop,
    emailMoiHop,
    noiDung,
    linkTaiLieu,
  } = body as {
    hoTen?: string;
    boPhan?: string;
    roomId?: number;
    ngayHop?: string;
    gioBatDau?: string;
    gioKetThuc?: string;
    hinhThucHop?: string;
    emailMoiHop?: string;
    noiDung?: string;
    linkTaiLieu?: string[];
  };

  if (!hoTen || !boPhan || !roomId || !ngayHop || !gioBatDau || !gioKetThuc) {
    return NextResponse.json({ error: "Vui lòng điền đầy đủ các trường bắt buộc" }, { status: 400 });
  }

  // Kiểm tra trùng khung giờ trong cùng phòng, cùng ngày
  const conflict = dbGet(
    `SELECT id FROM meeting_bookings
     WHERE room_id = ? AND ngay_hop = ? AND status != 'REJECTED'
       AND NOT (gio_ket_thuc <= ? OR gio_bat_dau >= ?)`,
    [roomId, ngayHop, gioBatDau, gioKetThuc]
  );

  if (conflict) {
    return NextResponse.json({ error: "Khung giờ này đã có người đặt, vui lòng chọn khung giờ khác" }, { status: 409 });
  }

  try {
    const result = dbRun(
      `INSERT INTO meeting_bookings
        (ho_ten, bo_phan, room_id, ngay_hop, gio_bat_dau, gio_ket_thuc, hinh_thuc_hop,
         email_moi_hop, noi_dung, link_tai_lieu, status, created_by_emp_code, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
      [
        hoTen,
        boPhan,
        roomId,
        ngayHop,
        gioBatDau,
        gioKetThuc,
        hinhThucHop || null,
        emailMoiHop || null,
        noiDung || null,
        linkTaiLieu ? JSON.stringify(linkTaiLieu) : null,
        user.empCode,
        user.name,
      ]
    );

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid), createdAt: new Date().toISOString() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể đặt phòng họp";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
