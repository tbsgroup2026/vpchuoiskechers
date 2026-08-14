import { NextResponse } from "next/server";
import { dbAll, dbRun } from "@/lib/db";
import { getCurrentUser, isAdminUser } from "@/lib/session";

interface TripMemberInput {
  hoTen: string;
  chucVu: string;
  msnv: string;
  boPhan: string;
  dienThoai: string;
  diaDiemDon: string;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const admin = isAdminUser(user);
  const trips = admin
    ? dbAll(`SELECT * FROM business_trips ORDER BY created_at DESC`)
    : dbAll(`SELECT * FROM business_trips WHERE created_by_emp_code = ? ORDER BY created_at DESC`, [user.empCode]);

  const tripIds = trips.map((t) => (t as { id: number }).id);
  let members: Record<string, unknown>[] = [];
  if (tripIds.length > 0) {
    const placeholders = tripIds.map(() => "?").join(", ");
    members = dbAll(`SELECT * FROM business_trip_members WHERE trip_id IN (${placeholders})`, tripIds);
  }

  const membersByTrip = new Map<number, unknown[]>();
  for (const m of members) {
    const tripId = (m as { trip_id: number }).trip_id;
    if (!membersByTrip.has(tripId)) membersByTrip.set(tripId, []);
    membersByTrip.get(tripId)!.push(m);
  }

  const items = trips.map((t) => ({
    ...(t as Record<string, unknown>),
    members: membersByTrip.get((t as { id: number }).id) || [],
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await request.json();
  const {
    donViXuat,
    khuVucId,
    nhaMayId,
    nguoiTao,
    boPhanId,
    congTacTaiId,
    hinhThucId,
    ngayBatDau,
    soNgay,
    ngayKetThuc,
    mucDich,
    diaChiCongTacId,
    ghiChu,
    members,
  } = body as {
    donViXuat?: string;
    khuVucId?: number;
    nhaMayId?: number;
    nguoiTao?: string;
    boPhanId?: number;
    congTacTaiId?: number;
    hinhThucId?: number;
    ngayBatDau?: string;
    soNgay?: number;
    ngayKetThuc?: string;
    mucDich?: string;
    diaChiCongTacId?: number;
    ghiChu?: string;
    members?: TripMemberInput[];
  };

  if (!donViXuat || !khuVucId || !nhaMayId || !nguoiTao || !boPhanId || !congTacTaiId || !hinhThucId || !ngayBatDau || !mucDich) {
    return NextResponse.json({ error: "Vui lòng điền đầy đủ các trường bắt buộc" }, { status: 400 });
  }

  try {
    const result = dbRun(
      `INSERT INTO business_trips
        (don_vi_xuat, khu_vuc_id, nha_may_id, nguoi_tao, bo_phan_id, cong_tac_tai_id, hinh_thuc_id,
         ngay_bat_dau, so_ngay, ngay_ket_thuc, muc_dich, dia_chi_cong_tac_id, ghi_chu,
         status, created_by_emp_code, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
      [
        donViXuat,
        khuVucId,
        nhaMayId,
        nguoiTao,
        boPhanId,
        congTacTaiId,
        hinhThucId,
        ngayBatDau,
        soNgay || 1,
        ngayKetThuc || null,
        mucDich,
        diaChiCongTacId || null,
        ghiChu || null,
        user.empCode,
        user.name,
      ]
    );

    const tripId = Number(result.lastInsertRowid);

    if (Array.isArray(members)) {
      for (const m of members) {
        if (!m.hoTen || !m.msnv) continue;
        dbRun(
          `INSERT INTO business_trip_members (trip_id, ho_ten, chuc_vu, msnv, bo_phan, dien_thoai, dia_diem_don)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [tripId, m.hoTen, m.chucVu || "", m.msnv, m.boPhan || "", m.dienThoai || "", m.diaDiemDon || ""]
        );
      }
    }

    return NextResponse.json({ success: true, id: tripId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể gửi đề xuất";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
