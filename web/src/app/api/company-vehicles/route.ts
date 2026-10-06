import { NextResponse } from 'next/server';
import { getAuthUser, isReceptionistOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { sendZaloNotification } from '@/lib/zaloNotificationService';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isReceptionistOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, data: [] });

    await ensureKaizenSchema(db);

    const { results } = await db.prepare('SELECT * FROM company_vehicles ORDER BY created_at DESC').all();
    
    const formatted = (results || []).map((row: any) => ({
      id: row.id,
      plateNumber: row.plate_number,
      driverName: row.driver_name,
      driverPhone: row.driver_phone,
      seatCount: row.seat_count,
      status: row.status,
      currentTripId: row.current_trip_id,
      notes: row.notes,
      createdAt: row.created_at
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isReceptionistOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'DB not found' }, { status: 500 });
    
    await ensureKaizenSchema(db);
    const body = await request.json();
    const action = body.action || 'UPSERT'; // UPSERT, DELETE, ARRIVED

    if (action === 'DELETE') {
      await db.prepare('UPDATE company_vehicles SET status = "INACTIVE" WHERE id = ?').bind(body.id).run();
      return NextResponse.json({ success: true, message: 'Đã chuyển trạng thái xe thành Tạm ngưng' });
    }

    if (action === 'ARRIVED') {
      // Báo xe tới -> clear current_trip_id and send Zalo
      await db.prepare('UPDATE company_vehicles SET current_trip_id = NULL WHERE id = ?').bind(body.id).run();
      
      const msg = `🚗 BÁO CÁO XE TỚI\nXe: ${body.plateNumber} (Tài xế: ${body.driverName})\nTrạng thái: Đã có mặt tại sảnh lễ tân và sẵn sàng nhận chuyến mới.\nNgười báo: ${user.name}`;
      
      await sendZaloNotification({
         priority: 'NORMAL',
         eventType: 'SYSTEM',
         targetGroupType: 'CONFIRMATION',
         messageText: msg
      });

      return NextResponse.json({ success: true, message: 'Đã báo xe tới và gửi Zalo' });
    }

    // UPSERT
    const id = body.id || `VEH-${Date.now()}`;
    const sql = `
      INSERT INTO company_vehicles (id, plate_number, driver_name, driver_phone, seat_count, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        plate_number=excluded.plate_number,
        driver_name=excluded.driver_name,
        driver_phone=excluded.driver_phone,
        seat_count=excluded.seat_count,
        status=excluded.status,
        notes=excluded.notes
    `;
    
    await db.prepare(sql).bind(
      id,
      body.plateNumber,
      body.driverName,
      body.driverPhone || '',
      body.seatCount || 4,
      body.status || 'ACTIVE',
      body.notes || ''
    ).run();

    return NextResponse.json({ success: true, id });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
