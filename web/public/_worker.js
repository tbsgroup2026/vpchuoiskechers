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

    // Default Fallback: Serve Next.js Static Export Assets
    return env.ASSETS.fetch(request);
  },
};
