// Cloudflare Worker Handler for D1 Database vpchuoiskechers & Static Asset Proxy

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. API Route: User Profile Persistence (/api/profile)
    if (url.pathname === "/api/profile") {
      // GET: Retrieve User Profile from D1 Database
      if (request.method === "GET") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const { results } = await env.DB.prepare(
            "SELECT * FROM user_profile WHERE id = 'current_user'"
          ).all();

          const user = results && results.length > 0 ? results[0] : {
            name: "Anh Huy",
            email: "huy.nguyen@tbsgroup.vn",
            phone: "0988 123 456",
            avatar: "/images/crawled/Da-giay1.jpg",
            title: "Quản trị viên cao cấp - SKECHERS",
          };

          return new Response(
            JSON.stringify({ success: true, data: user, source: "Cloudflare D1 Database vpchuoiskechers" }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // POST / PUT: Update / Save User Profile to D1 Database
      if (request.method === "POST" || request.method === "PUT") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = await request.json();
          const { name, email, phone, avatar, title } = body;

          await env.DB.prepare(
            `INSERT OR REPLACE INTO user_profile (id, name, email, phone, avatar, title, updated_at)
             VALUES ('current_user', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
          )
            .bind(
              name || "Anh Huy",
              email || "huy.nguyen@tbsgroup.vn",
              phone || "0988 123 456",
              avatar || "/images/crawled/Da-giay1.jpg",
              title || "Quản trị viên cao cấp - SKECHERS"
            )
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              message: "Đã lưu & cập nhật thông tin thành công vào D1 Database vpchuoiskechers!",
              data: { name, email, phone, avatar, title }
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 2. API Route: Departments List (/api/departments)
    if (url.pathname === "/api/departments") {
      try {
        if (env.DB) {
          const { results } = await env.DB.prepare("SELECT * FROM departments ORDER BY num ASC").all();
          return new Response(
            JSON.stringify({ success: true, data: results }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        // Fallback if table doesn't exist
      }
    }

    // 3. API Route: Business Trips Persistence (/api/business-trips)
    if (url.pathname === "/api/business-trips") {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS business_trips (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL,
                title TEXT NOT NULL,
                region TEXT DEFAULT 'VP Chuỗi',
                factory TEXT,
                creator TEXT NOT NULL,
                department TEXT NOT NULL,
                location TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                days_count INTEGER DEFAULT 1,
                transport TEXT DEFAULT 'Xe công ty',
                participants_count INTEGER DEFAULT 1,
                purpose TEXT,
                address TEXT,
                proposal_text TEXT,
                participants_json TEXT,
                status TEXT DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch (e) {
          // table check ignore
        }
      }

      // GET: Query all business trip proposals
      if (request.method === "GET") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const { results } = await env.DB.prepare(
            "SELECT * FROM business_trips ORDER BY created_at DESC"
          ).all();

          return new Response(
            JSON.stringify({ success: true, data: results, source: "Cloudflare D1 Database vpchuoiskechers" }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // POST: Create a new proposal
      if (request.method === "POST") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = await request.json();
          const {
            id, code, title, region, factory, creator, department,
            location, startDate, endDate, daysCount, transport,
            participantsCount, purpose, address, proposalText, participants
          } = body;

          await env.DB.prepare(`
            INSERT OR REPLACE INTO business_trips (
              id, code, title, region, factory, creator, department,
              location, start_date, end_date, days_count, transport,
              participants_count, purpose, address, proposal_text, participants_json, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
          `).bind(
            id || `rec_${Date.now()}`,
            code || `CT-2026-${Math.floor(100 + Math.random() * 900)}`,
            title || "Đề xuất công tác",
            region || "VP Chuỗi",
            factory || "",
            creator || "Anh Huy",
            department || "Hành chính",
            location || "Bình Dương",
            startDate || "15/08/2026",
            endDate || "15/08/2026",
            daysCount || 1,
            transport || "Xe công ty",
            participantsCount || 1,
            purpose || "",
            address || "",
            proposalText || "",
            JSON.stringify(participants || [])
          ).run();

          return new Response(
            JSON.stringify({
              success: true,
              message: "Đã lưu đăng ký đi công tác vào Cloudflare D1 Database thành công!",
              data: body
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // PUT: Update Status (APPROVED / REJECTED)
      if (request.method === "PUT") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = await request.json();
          const { id, status } = body;

          await env.DB.prepare(
            "UPDATE business_trips SET status = ? WHERE id = ?"
          ).bind(status, id).run();

          return new Response(
            JSON.stringify({
              success: true,
              message: `Đã cập nhật trạng thái thành ${status} trong D1 Database!`,
              id, status
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Default Fallback: Serve Next.js Static Export Assets
    return env.ASSETS.fetch(request);
  },
};
