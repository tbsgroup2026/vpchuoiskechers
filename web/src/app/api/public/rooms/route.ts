import { NextResponse } from 'next/server';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

export const revalidate = 0;

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

function sortRoomsDefault(roomsList: any[]) {
  return roomsList.sort((a, b) => {
    const hasSortA = a.sortOrder !== undefined && a.sortOrder !== null && a.sortOrder !== "";
    const hasSortB = b.sortOrder !== undefined && b.sortOrder !== null && b.sortOrder !== "";
    if (hasSortA && hasSortB) {
      if (Number(a.sortOrder) !== Number(b.sortOrder)) return Number(a.sortOrder) - Number(b.sortOrder);
    } else if (hasSortA) {
      return -1;
    } else if (hasSortB) {
      return 1;
    }

    const hasFloorA = a.floor !== undefined && a.floor !== null && a.floor !== "";
    const hasFloorB = b.floor !== undefined && b.floor !== null && b.floor !== "";
    if (hasFloorA && hasFloorB) {
      if (Number(a.floor) !== Number(b.floor)) return Number(a.floor) - Number(b.floor);
    } else if (hasFloorA) {
      return -1;
    } else if (hasFloorB) {
      return 1;
    }

    const nameComp = collator.compare(a.name || "", b.name || "");
    if (nameComp !== 0) return nameComp;

    return collator.compare(a.id || "", b.id || "");
  });
}

export async function GET(request: Request) {
  try {
    const db = getDbBinding();
    let rooms: any[] = [];
    let busySlots: any[] = []; // Only return busy slots (not who booked it)

    if (db) {
      await ensureKaizenSchema(db);
      
      const roomsRes = await db.prepare(`SELECT * FROM meeting_rooms WHERE status = 'AVAILABLE' AND isLocked != 1`).all().catch(() => ({ results: [] }));
      if (roomsRes && roomsRes.results && roomsRes.results.length > 0) {
        rooms = roomsRes.results.map((r: any) => ({
          id: r.id,
          name: r.name,
          capacity: r.capacity,
          location: r.location,
          equipment: r.equipment ? r.equipment.split(',').map((e: string) => e.trim()).filter(Boolean) : [],
          images: r.images ? (typeof r.images === 'string' ? JSON.parse(r.images) : r.images) : [],
          floor: r.floor !== undefined && r.floor !== null ? Number(r.floor) : null,
          sortOrder: r.sort_order !== undefined && r.sort_order !== null ? Number(r.sort_order) : (r.sortOrder !== undefined && r.sortOrder !== null ? Number(r.sortOrder) : null),
        }));
        rooms = sortRoomsDefault(rooms);
      }

      // Only get bookings that occupy the slot (PENDING or CONFIRMED)
      const { results } = await db.prepare(`
        SELECT room_id, booking_date, time_slot FROM room_bookings
        WHERE status IN ('PENDING', 'CONFIRMED')
        ORDER BY booking_date ASC, time_slot ASC
      `).all().catch(() => ({ results: [] }));

      if (results && results.length > 0) {
        busySlots = results.map((r: any) => ({
          roomId: r.room_id,
          date: r.booking_date,
          timeSlot: r.time_slot
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        rooms,
        busySlots
      }
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
