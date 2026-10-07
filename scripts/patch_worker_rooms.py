import re
import sys

file_path = 'web/public/_worker.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the old GET handler block 0.3
old_block_pattern = r'// 0\.3 API Route: Meeting Rooms & Bookings \(/api/rooms\)\s*if \(url\.pathname === "/api/rooms" \|\| url\.pathname\.startsWith\("/api/rooms"\)\) \{[\s\S]*?(?=\s*// 1\. API Route: User Profile Persistence)'
match = re.search(old_block_pattern, content)
if match:
    content = content[:match.start()] + content[match.end():]
else:
    print("Warning: Could not find old API block 0.3")

# 2. Add images to CREATE TABLE meeting_rooms
content = content.replace(
    'location TEXT NOT NULL,\n                equipment TEXT,',
    'location TEXT NOT NULL,\n                equipment TEXT,\n                images TEXT,'
)

# 3. Modify the rooms map to parse images and equipment correctly
old_rooms_map = """          const rooms = (rawRooms || []).map((r) => ({
            id: r.id,
            name: r.name,
            capacity: Number(r.capacity || 10),
            location: r.location || "Văn phòng",
            equipment: typeof r.equipment === "string" ? r.equipment.split(",") : (r.equipment || []),
            status: r.status || "AVAILABLE",
            isLocked: Boolean(r.is_locked || r.isLocked),
            colorClass: r.color_class || r.colorClass || "bg-slate-700 hover:bg-slate-800 text-white",
            badgeBg: r.badge_bg || r.badgeBg || "bg-slate-100 text-slate-800",
          }));"""

new_rooms_map = """          const rooms = (rawRooms || []).map((r) => {
            let parsedImages = [];
            if (r.images) {
              try { parsedImages = JSON.parse(r.images); } catch(e) {}
            }
            let parsedEq = [];
            if (typeof r.equipment === "string") {
              try { parsedEq = JSON.parse(r.equipment); } 
              catch(e) { parsedEq = r.equipment.split(",").map(s => s.trim()).filter(Boolean); }
            } else if (Array.isArray(r.equipment)) {
              parsedEq = r.equipment;
            }
            return {
              id: r.id,
              name: r.name,
              capacity: Number(r.capacity || 10),
              location: r.location || "Văn phòng",
              equipment: parsedEq,
              images: parsedImages,
              status: r.status || "AVAILABLE",
              isLocked: Boolean(r.is_locked || r.isLocked),
              colorClass: r.color_class || r.colorClass || "bg-slate-700 hover:bg-slate-800 text-white",
              badgeBg: r.badge_bg || r.badgeBg || "bg-slate-100 text-slate-800",
            };
          });"""

content = content.replace(old_rooms_map, new_rooms_map)

# 4. Add POST/PUT /api/rooms to handle creating/editing rooms
# We can inject this right before POST /api/rooms/booking
post_booking_pattern = r'// POST /api/rooms/booking: Save a new booking'
new_rooms_post = """      // POST & PUT /api/rooms: Add or Edit a meeting room
      if (url.pathname === "/api/rooms" && (request.method === "POST" || request.method === "PUT")) {
        try {
          let user = null;
          try { user = await verifyServerAuth(request); } catch (e) {}

          if (!env.DB) {
            return new Response(JSON.stringify({ success: false, error: "D1 Database missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
          }

          const body = await request.json();
          const isNew = request.method === "POST";
          const id = isNew ? "room_" + Date.now() : (body.id || body.roomId);
          const name = body.name || "Phòng Mới";
          const capacity = body.capacity || 10;
          const location = body.location || "Văn phòng";
          const equipmentStr = Array.isArray(body.equipment) ? JSON.stringify(body.equipment) : (body.equipment || "[]");
          const imagesStr = Array.isArray(body.images) ? JSON.stringify(body.images) : "[]";
          const status = body.status || "AVAILABLE";
          const isLocked = body.isLocked ? 1 : 0;

          if (isNew) {
            await env.DB.prepare(`
              INSERT INTO meeting_rooms (id, name, capacity, location, equipment, images, status, is_locked)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(id, name, capacity, location, equipmentStr, imagesStr, status, isLocked).run();
          } else {
            await env.DB.prepare(`
              UPDATE meeting_rooms
              SET name = ?, capacity = ?, location = ?, equipment = ?, images = ?, status = ?, is_locked = ?
              WHERE id = ?
            `).bind(name, capacity, location, equipmentStr, imagesStr, status, isLocked, id).run();
          }

          return new Response(JSON.stringify({ success: true, id, message: "Lưu phòng thành công!" }), { headers: { "Content-Type": "application/json" } });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }

      """

content = content.replace(post_booking_pattern, new_rooms_post + post_booking_pattern)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend API patched successfully.")
