import os

api_path = r"d:\Work\TBS II\web\src\app\api\rooms\route.ts"
with open(api_path, "r", encoding="utf-8") as f:
    content = f.read()

old_delete = """    await db.prepare('DELETE FROM meeting_rooms WHERE id = ?').bind(id).run();"""

new_delete = """    // Also delete orphaned bookings
    await db.prepare('DELETE FROM room_bookings WHERE room_id = ?').bind(id).run();
    await db.prepare('DELETE FROM meeting_rooms WHERE id = ?').bind(id).run();"""

content = content.replace(old_delete, new_delete)

with open(api_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added booking cleanup on delete")
