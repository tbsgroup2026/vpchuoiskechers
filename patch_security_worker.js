const fs = require('fs');
let code = fs.readFileSync('web/worker/index.js', 'utf8');

// 1. Fix VULN-04: IDOR DELETE /api/ci-kaizen
const deleteKaizenRegex = /if \(url\.pathname === "\/api\/ci-kaizen" && request\.method === "DELETE"\) \{\s*try \{\s*const id = url\.searchParams\.get\("id"\);\s*if \(db && id\) \{\s*await db\.prepare\("DELETE FROM ci_kaizen_proposals WHERE id = \? OR code = \?"\)\.bind\(id, id\)\.run\(\);\s*\}\s*return new Response\(JSON\.stringify\(\{ success: true, message: "Đã xóa đề xuất thành công!" \}\), \{ headers: CORS_HEADERS \}\);\s*\} catch \(err\) \{\s*return new Response\(JSON\.stringify\(\{ success: false, error: err\.message \}\), \{ status: 500, headers: CORS_HEADERS \}\);\s*\}\s*\}/g;

const secureDeleteKaizen = `if (url.pathname === "/api/ci-kaizen" && request.method === "DELETE") {
        try {
          const id = url.searchParams.get("id");
          const session = getAuthSessionWorker(request);
          if (!session) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS_HEADERS });
          
          if (db && id) {
            const record = await db.prepare("SELECT created_by FROM ci_kaizen_proposals WHERE id = ? OR code = ?").bind(id, id).first();
            if (!record) return new Response(JSON.stringify({ success: false, error: "Không tìm thấy" }), { status: 404, headers: CORS_HEADERS });
            if (record.created_by !== session.empCode && session.roleLevel > 2) {
              return new Response(JSON.stringify({ success: false, error: "Bạn không có quyền xóa đề xuất này" }), { status: 403, headers: CORS_HEADERS });
            }
            await db.prepare("DELETE FROM ci_kaizen_proposals WHERE id = ? OR code = ?").bind(id, id).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã xóa đề xuất thành công!" }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }`;

code = code.replace(deleteKaizenRegex, secureDeleteKaizen);

// 2. Fix VULN-11: Hardcoded sync secret
code = code.replace(/const secret = env\.INTERNAL_SYNC_SECRET \|\| "tbs_ii_secure_jwt_secret_key_2026";/g, 'const secret = env.INTERNAL_SYNC_SECRET || "";');
code = code.replace(/const secret = env\.INTERNAL_SYNC_SECRET \|\| "tbs_ii_secure_jwt_secret_key_2026"/g, 'const secret = env.INTERNAL_SYNC_SECRET || ""');

// 3. Fix IDOR on /api/task-cards DELETE
const deleteTaskCardRegex = /if \(url\.pathname === "\/api\/task-cards" && request\.method === "DELETE"\) \{\s*try \{\s*const id = url\.searchParams\.get\("id"\);\s*if \(db && id\) \{\s*await db\.prepare\("DELETE FROM task_cards WHERE id = \?"\)\.bind\(id\)\.run\(\);\s*\}\s*return new Response\(JSON\.stringify\(\{ success: true, message: "Đã xóa thẻ việc thành công!" \}\), \{ headers: CORS_HEADERS \}\);\s*\} catch \(err\) \{/g;
const secureDeleteTaskCard = `if (url.pathname === "/api/task-cards" && request.method === "DELETE") {
        try {
          const id = url.searchParams.get("id");
          const session = getAuthSessionWorker(request);
          if (!session) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS_HEADERS });
          if (db && id) {
            const record = await db.prepare("SELECT created_by FROM task_cards WHERE id = ?").bind(id).first();
            if (record && record.created_by !== session.empCode && session.roleLevel > 2) {
              return new Response(JSON.stringify({ success: false, error: "Bạn không có quyền xóa" }), { status: 403, headers: CORS_HEADERS });
            }
            await db.prepare("DELETE FROM task_cards WHERE id = ?").bind(id).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã xóa thẻ việc thành công!" }), { headers: CORS_HEADERS });
        } catch (err) {`;
code = code.replace(deleteTaskCardRegex, secureDeleteTaskCard);

// Write changes
fs.writeFileSync('web/worker/index.js', code);
console.log("web/worker/index.js security patched");
