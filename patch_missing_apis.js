const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/worker/index.js');
let code = fs.readFileSync(filePath, 'utf8');

// Fix /api/public/rooms SQL
if (code.includes("AND isLocked != 1")) {
  code = code.replace(/AND isLocked != 1/g, "");
}

// Fix /api/profile token check
const profileAuthOriginal = `            const authHeader = request.headers.get("authorization");
            const token = authHeader ? authHeader.replace("Bearer ", "") : null;`;
const profileAuthFixed = `            const authHeader = request.headers.get("authorization");
            let token = authHeader ? authHeader.replace("Bearer ", "") : null;
            if (!token) {
               const cookieHeader = request.headers.get('cookie') || '';
               const match = cookieHeader.match(/tbs_token=([^;]+)/);
               if (match && match[1]) token = match[1];
            }`;

if (code.includes(profileAuthOriginal)) {
  code = code.replace(profileAuthOriginal, profileAuthFixed);
  console.log("Patched /api/profile token check");
}

// Add missing APIs if not already added
const missingApisBlock = `
    // ============================================================
    // MISSING APIS ADDED BY PATCH
    // ============================================================
    if (url.pathname === "/api/me/tasks" || url.pathname.startsWith("/api/me/tasks/")) {
       const db = env && env.DB;
       if (db && request.method === "GET") {
          try {
             const authHeader = request.headers.get("authorization");
             let token = authHeader ? authHeader.replace("Bearer ", "") : null;
             if (!token) {
                const cookieHeader = request.headers.get('cookie') || '';
                const match = cookieHeader.match(/tbs_token=([^;]+)/);
                if (match && match[1]) token = match[1];
             }
             const session = await parseSessionWorker(token, env);
             if (!session || !session.empCode) {
               return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED' }), { status: 401, headers: { "Content-Type": "application/json" } });
             }

             const empCode = session.empCode;
             const limit = parseInt(url.searchParams.get('limit') || '50', 10);
             const page = parseInt(url.searchParams.get('page') || '1', 10);
             const offset = (page - 1) * limit;

             const query = \`
               SELECT * FROM (
                 SELECT id, title, description, deadline as due_date, status, 'KANBAN' as source, board_id as project_id
                 FROM task_cards
                 WHERE assignee_id = ? OR created_by = ?
                 UNION ALL
                 SELECT id, title, description, due_date, status, 'PROJECT' as source, project_id
                 FROM tasks
                 WHERE assignee_emp_code = ? OR reporter_emp_code = ?
               )
               ORDER BY due_date ASC
               LIMIT ? OFFSET ?
             \`;
             
             let mergedTasks = [];
             try {
                const res = await db.prepare(query).bind(empCode, empCode, empCode, empCode, limit, offset).all();
                mergedTasks = (res.results || []).map(t => {
                   let mappedStatus = String(t.status).toUpperCase();
                   if (t.source === 'KANBAN') {
                     if (mappedStatus === 'DONE') mappedStatus = 'DONE';
                     else if (mappedStatus === 'IN_PROGRESS' || mappedStatus === 'PENDING_REVIEW') mappedStatus = 'DOING';
                     else mappedStatus = 'TO_DO';
                   }
                   return {
                     id: t.id, title: t.title, description: t.description, due_date: t.due_date,
                     source: t.source, project_id: t.project_id, status: mappedStatus, priority: 'MEDIUM'
                   };
                });
             } catch(e) {}

             let total = 0;
             try {
                const countQuery = \`SELECT COUNT(*) as total FROM (
                  SELECT id FROM task_cards WHERE assignee_id = ? OR created_by = ?
                  UNION ALL
                  SELECT id FROM tasks WHERE assignee_emp_code = ? OR reporter_emp_code = ?
                )\`;
                const cRes = await db.prepare(countQuery).bind(empCode, empCode, empCode, empCode).first();
                total = cRes ? cRes.total : 0;
             } catch(e) {}

             const totalPages = Math.ceil(total / limit);
             return new Response(JSON.stringify({
                success: true, tasks: mergedTasks, pagination: { total, page, limit, totalPages }
             }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

          } catch(e) {
             return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
          }
       }
    }

    if (url.pathname === "/api/links" || url.pathname.startsWith("/api/links/")) {
       if (request.method === "GET") {
          try {
             const authHeader = request.headers.get("authorization");
             let token = authHeader ? authHeader.replace("Bearer ", "") : null;
             if (!token) {
                const cookieHeader = request.headers.get('cookie') || '';
                const match = cookieHeader.match(/tbs_token=([^;]+)/);
                if (match && match[1]) token = match[1];
             }
             const session = await parseSessionWorker(token, env);
             if (!session || !session.empCode) {
               return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED' }), { status: 401, headers: { "Content-Type": "application/json" } });
             }

             const dept = url.searchParams.get('dept') || 'finance';
             const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbysvkyvGieeOtHLgLQCEXBvnG8tS9URcb5k_TkR1Hf-g7IOxgsXZNn7L8RkDaSISWBl0g/exec';
             const appsScriptKey = 'TBS@2026!LinkSecure';
             const fetchUrl = \`\${appsScriptUrl}?action=get_links&k=\${encodeURIComponent(appsScriptKey)}&dept=\${encodeURIComponent(dept)}\`;
             
             const linkRes = await fetch(fetchUrl);
             if (!linkRes.ok) throw new Error("Failed to fetch links");
             const data = await linkRes.json();
             
             return new Response(JSON.stringify({ success: true, data }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
          } catch(e) {
             return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
          }
       }
    }
`;

if (!code.includes('MISSING APIS ADDED BY PATCH')) {
  code = code.replace(/    \/\/ ============================================================\n    \/\/ D1 API ROUTE: \/api\/public\/kaizen\/:code \(Public Kaizen Detail\)/, missingApisBlock + "\n    // ============================================================\n    // D1 API ROUTE: /api/public/kaizen/:code (Public Kaizen Detail)");
  console.log("Patched missing APIs /api/me/tasks and /api/links");
} else {
  console.log("Missing APIs already added");
}

fs.writeFileSync(filePath, code);
