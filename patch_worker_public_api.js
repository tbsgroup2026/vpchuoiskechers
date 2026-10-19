const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/worker/index.js');
let code = fs.readFileSync(filePath, 'utf8');

const publicApiBlock = `    // ============================================================
    // D1 API ROUTE: /api/public/kaizen/:code (Public Kaizen Detail)
    // ============================================================
    if (url.pathname.startsWith("/api/public/kaizen/")) {
      const CORS_HEADERS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
      
      const kCode = url.pathname.split("/").pop();
      const db = env && env.DB;
      if (db && request.method === "GET") {
        try {
          const row = await db.prepare("SELECT id, code, title, category, site_name, department, proposer_name, created_at, before_description, after_solution, before_image_url, after_image_url, attachments, views, likes FROM ci_kaizen_proposals WHERE code = ?").bind(kCode).first();
          if (row) {
             return new Response(JSON.stringify({ success: true, data: row }), { headers: CORS_HEADERS });
          } else {
             return new Response(JSON.stringify({ success: false, error: "Not found" }), { status: 404, headers: CORS_HEADERS });
          }
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/ci-kaizen (Kaizen Proposal Management & Sync)`;

code = code.replace(/    \/\/ ============================================================\n    \/\/ D1 API ROUTE: \/api\/ci-kaizen \(Kaizen Proposal Management & Sync\)/, publicApiBlock);

fs.writeFileSync(filePath, code);
console.log('Worker API patched successfully.');
