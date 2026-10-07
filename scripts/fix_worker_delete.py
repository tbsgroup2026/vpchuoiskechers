import os

worker_path = r"d:\Work\TBS II\web\public\_worker.js"
with open(worker_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will find the block:
#            // POST & PUT /api/rooms: Add or Edit a meeting room
#      if (url.pathname === "/api/rooms" && (request.method === "POST" || request.method === "PUT")) {
# ...
# And inject DELETE right after it.

old_post_put = """            // POST & PUT /api/rooms: Add or Edit a meeting room
      if (url.pathname === "/api/rooms" && (request.method === "POST" || request.method === "PUT")) {"""

new_delete_logic = """        // DELETE /api/rooms: Delete a meeting room
      if (url.pathname === "/api/rooms" && request.method === "DELETE") {
          try {
            let user = null;
            try { user = await verifyServerAuth(request); } catch (e) {}
            if (!env.DB) return new Response(JSON.stringify({ success: false, error: "D1 Database missing" }), { status: 500 });
            
            const id = url.searchParams.get("id");
            if (!id) return new Response(JSON.stringify({ success: false, error: "Missing room id" }), { status: 400 });

            // Also delete bookings for this room
            await env.DB.prepare('DELETE FROM room_bookings WHERE room_id = ?').bind(id).run();
            await env.DB.prepare('DELETE FROM meeting_rooms WHERE id = ?').bind(id).run();
            
            return new Response(JSON.stringify({ success: true, message: "Deleted successfully" }), { headers: { "Content-Type": "application/json" } });
          } catch(err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
          }
      }

            // POST & PUT /api/rooms: Add or Edit a meeting room
      if (url.pathname === "/api/rooms" && (request.method === "POST" || request.method === "PUT")) {"""

content = content.replace(old_post_put, new_delete_logic)

with open(worker_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Injected DELETE /api/rooms into _worker.js")
