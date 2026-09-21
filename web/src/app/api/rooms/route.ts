import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const DEFAULT_ROOMS = [
  {
    id: "room_1",
    name: "Phòng Họp Executive (P.101)",
    location: "Tầng 1 - Khối Văn Phòng Chuỗi Skechers",
    capacity: 20,
    facilities: ["Màn hình 85 inch", "Camera AI Polycom", "Bảng kính interactive", "Micro hội nghị wireless"],
    status: "AVAILABLE",
    image: "/images/rooms/room_1/1.jpg",
  },
  {
    id: "room_2",
    name: "Phòng Họp Kaizen & Gemba (P.202)",
    location: "Tầng 2 - Khu Vực Cải Tiến & Kỹ Thuật",
    capacity: 12,
    facilities: ["Máy chiếu 4K", "Bảng gá 1-5-2 demo", "Hệ thống loa trợ giảng"],
    status: "AVAILABLE",
    image: "/images/rooms/room_2/1.jpg",
  },
  {
    id: "room_3",
    name: "Phòng Họp Sáng Tạo & R&D (P.305)",
    location: "Tầng 3 - Trung Tâm Nghiên Cứu Mẫu",
    capacity: 10,
    facilities: ["Bàn làm việc mô-đun", "Màn hình cảm ứng 65 inch"],
    status: "AVAILABLE",
    image: "/images/rooms/room_3/1.jpg",
  },
];

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để xem danh sách phòng họp (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const db = getDbBinding();
    let bookings: any[] = [];

    if (db) {
      await ensureKaizenSchema(db);
      const { results } = await db.prepare(`
        SELECT * FROM room_bookings
        WHERE status != 'CANCELLED'
        ORDER BY booking_date ASC, time_slot ASC
      `).all().catch(() => ({ results: [] }));

      if (results && results.length > 0) {
        bookings = results.map((r: any) => ({
          id: r.id,
          roomId: r.room_id,
          roomName: r.room_name,
          empCode: r.emp_code,
          userName: r.user_name,
          department: r.department,
          bookingDate: r.booking_date,
          date: r.booking_date,
          timeSlot: r.time_slot,
          purpose: r.purpose,
          participantsCount: r.participants_count,
          status: r.status,
          createdAt: r.created_at,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        rooms: DEFAULT_ROOMS,
        bookings: bookings,
      },
      rooms: DEFAULT_ROOMS,
      bookings: bookings,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
