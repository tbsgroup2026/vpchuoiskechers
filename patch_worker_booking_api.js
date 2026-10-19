const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/worker/index.js');
let code = fs.readFileSync(filePath, 'utf8');

const additionalApis = `
    // ============================================================
    // EXTRA APIS FOR BOOKING AND VERSION
    // ============================================================
    if (url.pathname === "/api/version") {
      return new Response(JSON.stringify({ success: true, version: "1.0.0" }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/public/rooms") {
       const db = env && env.DB;
       if (db && request.method === "GET") {
          try {
             let rooms = await db.prepare("SELECT * FROM meeting_rooms WHERE status = 'AVAILABLE' AND isLocked != 1").all().then(r => r.results || []);
             rooms.sort((a,b) => {
                if (a.sort_order !== b.sort_order) return (a.sort_order || 99) - (b.sort_order || 99);
                return (a.name || "").localeCompare(b.name || "");
             });
             const targetDate = new URL(request.url).searchParams.get("date") || new Date().toISOString().split("T")[0];
             const busySlots = await db.prepare("SELECT room_id as roomId, booking_date as date, time_slot as timeSlot FROM room_bookings WHERE booking_date = ? AND status IN ('PENDING', 'APPROVED')").bind(targetDate).all().then(r => r.results || []);
             return new Response(JSON.stringify({ success: true, data: { rooms, busySlots } }), { headers: { "Content-Type": "application/json" } });
          } catch(e) {
             return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
          }
       }
    }

    if (url.pathname === "/api/public/rooms/booking") {
       const db = env && env.DB;
       if (db && request.method === "POST") {
          try {
             const body = await request.json();
             const ip = request.headers.get('cf-connecting-ip') || 'unknown';
             const limitCheck = await db.prepare("SELECT COUNT(*) as cnt FROM room_bookings WHERE (zalo_phone = ? OR user_id = ?) AND created_at >= datetime('now', '-1 day') AND source = 'PUBLIC_QR'").bind(body.zaloPhone || '', ip).first();
             if (limitCheck && limitCheck.cnt >= 5) {
                return new Response(JSON.stringify({ success: false, error: "Đạt giới hạn đặt phòng" }), { status: 429, headers: { "Content-Type": "application/json" } });
             }
             const id = 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
             await db.prepare("INSERT INTO room_bookings (id, room_id, room_name, user_id, emp_code, user_name, department, booking_date, time_slot, purpose, notes, participants_count, status, created_at, meeting_type, source, zalo_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, 'OFFLINE', 'PUBLIC_QR', ?)").bind(
                id, body.roomId, body.roomName || 'Phòng', ip, body.empCode || 'GUEST', body.userName, body.department || 'Khách', body.date, body.timeSlot, body.title, body.notes || '', body.participantsCount || 5, body.zaloPhone
             ).run();
             return new Response(JSON.stringify({ success: true, bookingId: id }), { headers: { "Content-Type": "application/json" } });
          } catch(e) {
             return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
          }
       }
    }

    if (url.pathname === "/api/public/departments") {
       const db = env && env.DB;
       if (db && request.method === "GET") {
          try {
             const res = await db.prepare("SELECT id, code, name FROM departments ORDER BY name ASC").all();
             return new Response(JSON.stringify({ success: true, data: res.results || [] }), { headers: { "Content-Type": "application/json" } });
          } catch(e) {
             return new Response(JSON.stringify({ success: false }), { status: 500, headers: { "Content-Type": "application/json" } });
          }
       }
    }

    if (url.pathname === "/api/public/employees/lookup") {
       const db = env && env.DB;
       if (db && request.method === "GET") {
          try {
             const msnv = new URL(request.url).searchParams.get("msnv");
             if (!msnv) return new Response(JSON.stringify({ success: false }), { status: 400, headers: { "Content-Type": "application/json" } });
             const employee = await db.prepare("SELECT emp_code, name, department, phone FROM sys_users WHERE UPPER(emp_code) = ? AND status = 'ACTIVE'").bind(msnv.toUpperCase()).first();
             if (!employee) return new Response(JSON.stringify({ success: true, found: false }), { headers: { "Content-Type": "application/json" } });
             let phone = employee.phone || "";
             if (phone.length >= 9) phone = phone.substring(0,4) + '***' + phone.substring(phone.length - 3);
             return new Response(JSON.stringify({ success: true, found: true, data: { empCode: employee.emp_code, fullName: employee.name, department: employee.department, phone } }), { headers: { "Content-Type": "application/json" } });
          } catch(e) {
             return new Response(JSON.stringify({ success: false }), { status: 500, headers: { "Content-Type": "application/json" } });
          }
       }
    }

    // ============================================================
    // D1 API ROUTE: /api/public/kaizen/:code (Public Kaizen Detail)
`;

if (!code.includes('EXTRA APIS FOR BOOKING AND VERSION')) {
  code = code.replace(/    \/\/ ============================================================\n    \/\/ D1 API ROUTE: \/api\/public\/kaizen\/:code \(Public Kaizen Detail\)/, additionalApis);
  fs.writeFileSync(filePath, code);
  console.log('Worker API patched successfully for booking and version.');
} else {
  console.log('Worker API already patched.');
}
