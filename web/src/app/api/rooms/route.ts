import { NextResponse } from 'next/server';
import { getAuthUser, isReceptionistOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

// export const dynamic = 'force-dynamic';
export const revalidate = 0;


function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

function sortRoomsDefault(roomsList: any[]) {
  return roomsList.sort((a, b) => {
    // 1. sortOrder (if set)
    const hasSortA = a.sortOrder !== undefined && a.sortOrder !== null && a.sortOrder !== "";
    const hasSortB = b.sortOrder !== undefined && b.sortOrder !== null && b.sortOrder !== "";
    if (hasSortA && hasSortB) {
      if (Number(a.sortOrder) !== Number(b.sortOrder)) return Number(a.sortOrder) - Number(b.sortOrder);
    } else if (hasSortA) {
      return -1;
    } else if (hasSortB) {
      return 1;
    }

    // 2. floor (if set)
    const hasFloorA = a.floor !== undefined && a.floor !== null && a.floor !== "";
    const hasFloorB = b.floor !== undefined && b.floor !== null && b.floor !== "";
    if (hasFloorA && hasFloorB) {
      if (Number(a.floor) !== Number(b.floor)) return Number(a.floor) - Number(b.floor);
    } else if (hasFloorA) {
      return -1;
    } else if (hasFloorB) {
      return 1;
    }

    // 3. Natural name comparison
    const nameComp = collator.compare(a.name || "", b.name || "");
    if (nameComp !== 0) return nameComp;

    // 4. Stable fallback: id
    return collator.compare(a.id || "", b.id || "");
  });
}

export async function GET(request: Request) {
  try {
    const db = getDbBinding();
    let rooms: any[] = [];
    let bookings: any[] = [];

    if (db) {
      await ensureKaizenSchema(db);
      
      const roomsRes = await db.prepare(`SELECT * FROM meeting_rooms`).all().catch(() => ({ results: [] }));
      if (roomsRes && roomsRes.results && roomsRes.results.length > 0) {
        rooms = roomsRes.results.map((r: any) => ({
          id: r.id,
          name: r.name,
          roomCode: r.roomCode,
          capacity: r.capacity,
          location: r.location,
          managingUnit: r.managingUnit,
          equipment: r.equipment ? r.equipment.split(',').map((e: string) => e.trim()).filter(Boolean) : [],
          status: r.status,
          isLocked: Boolean(r.isLocked),
          colorClass: r.colorClass,
          badgeBg: r.badgeBg,
          images: r.images ? (typeof r.images === 'string' ? JSON.parse(r.images) : r.images) : [],
          floor: r.floor !== undefined && r.floor !== null ? Number(r.floor) : null,
          sortOrder: r.sort_order !== undefined && r.sort_order !== null ? Number(r.sort_order) : (r.sortOrder !== undefined && r.sortOrder !== null ? Number(r.sortOrder) : null),
        }));
        rooms = sortRoomsDefault(rooms);
      }

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
          title: r.purpose,
          purpose: r.purpose,
          notes: r.notes,
          meetingType: r.meeting_type || 'OFFLINE',
          platform: r.platform,
          meetingLink: r.meeting_link,
          meetingCredentials: r.meeting_credentials,
          participantsCount: r.participants_count,
          status: r.status,
          source: r.source,
          zaloPhone: r.zalo_phone,
          createdAt: r.created_at,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        rooms: rooms,
        bookings: bookings,
      },
      rooms: rooms,
      bookings: bookings,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isReceptionistOrAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Bạn không có quyền thao tác' }, { status: 403 });
    }

    const body = await request.json();
    const db = getDbBinding();
    if (!db) throw new Error('Database not connected');
    
    await ensureKaizenSchema(db);

    const id = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const equipmentStr = Array.isArray(body.equipment) ? body.equipment.join(", ") : (body.equipment || "");
    const imagesStr = Array.isArray(body.images) ? JSON.stringify(body.images) : "[]";
    const capacity = Number(body.capacity) || 10;
    const floor = body.floor !== undefined && body.floor !== null && body.floor !== "" ? Number(body.floor) : null;
    const sortOrder = (body.sortOrder !== undefined && body.sortOrder !== null && body.sortOrder !== "") 
      ? Number(body.sortOrder) 
      : ((body.sort_order !== undefined && body.sort_order !== null && body.sort_order !== "") ? Number(body.sort_order) : null);
    
    await db.prepare(`
      INSERT INTO meeting_rooms (id, name, roomCode, capacity, location, managingUnit, equipment, status, isLocked, images, floor, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.name, body.roomCode, capacity, body.location || "", body.managingUnit || "",
      equipmentStr, body.status || "AVAILABLE", body.isLocked ? 1 : 0, imagesStr, floor, sortOrder
    ).run();

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isReceptionistOrAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Bạn không có quyền thao tác' }, { status: 403 });
    }

    const body = await request.json();
    const db = getDbBinding();
    if (!db) throw new Error('Database not connected');
    
    await ensureKaizenSchema(db);

    const equipmentStr = Array.isArray(body.equipment) ? body.equipment.join(", ") : (body.equipment || "");
    const imagesStr = Array.isArray(body.images) ? JSON.stringify(body.images) : "[]";
    const capacity = Number(body.capacity) || 10;
    const floor = body.floor !== undefined && body.floor !== null && body.floor !== "" ? Number(body.floor) : null;
    const sortOrder = (body.sortOrder !== undefined && body.sortOrder !== null && body.sortOrder !== "") 
      ? Number(body.sortOrder) 
      : ((body.sort_order !== undefined && body.sort_order !== null && body.sort_order !== "") ? Number(body.sort_order) : null);

    const info = await db.prepare(`
      UPDATE meeting_rooms
      SET name = ?, roomCode = ?, capacity = ?, location = ?, managingUnit = ?, equipment = ?, status = ?, isLocked = ?, images = ?, floor = ?, sort_order = ?
      WHERE id = ?
    `).bind(
      body.name, body.roomCode, capacity, body.location || "", body.managingUnit || "",
      equipmentStr, body.status || "AVAILABLE", body.isLocked ? 1 : 0, imagesStr, floor, sortOrder, body.id
    ).run();

    console.log("[PUT /api/rooms] ID received:", body.id, "Rows affected:", info.meta?.changes);
    
    if (info.meta?.changes === 0) {
      return NextResponse.json({ success: false, error: `Bản ghi phòng họp (ID: ${body.id}) không tồn tại trong CSDL!` }, { status: 404 });
    }

    const updatedRoom = await db.prepare('SELECT * FROM meeting_rooms WHERE id = ?').bind(body.id).first();
    return NextResponse.json({ success: true, data: updatedRoom });
  } catch (error: any) {
    console.error("[PUT /api/rooms] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isReceptionistOrAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Bạn không có quyền thao tác' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('Missing room id');

    const db = getDbBinding();
    if (!db) throw new Error('Database not connected');
    
    await ensureKaizenSchema(db);

    // Also delete orphaned bookings
    await db.prepare('DELETE FROM room_bookings WHERE room_id = ?').bind(id).run();
    await db.prepare('DELETE FROM meeting_rooms WHERE id = ?').bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
