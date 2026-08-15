// Cloudflare Worker Handler for D1 Database vpchuoiskechers & Static Asset Proxy

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const ROLE_ACCOUNTS = {
      TONG_GIAM_DOC: {
        empCode: "TGĐ-001",
        name: "Phạm Nguyễn Anh Huy",
        title: "Tổng Giám Đốc Tập Đoàn TBS Group",
        department: "Ban Giám Đốc Tập Đoàn",
        avatar: "/images/crawled/Da-giay1.jpg",
        email: "anhhuy.pham@tbsgroup.vn",
        phone: "0988 111 222",
        roleCode: "TONG_GIAM_DOC",
        redirectUrl: "/bi",
      },
      PHO_TONG_GIAM_DOC: {
        empCode: "PTGĐ-002",
        name: "Trần Ngọc Huy",
        title: "Phó Tổng Giám Đốc Vận Hành & Chuỗi Cung Ứng",
        department: "Ban Giám Đốc Vận Hành",
        avatar: "/images/crawled/Da-giay2.jpg",
        email: "ngochuy.tran@tbsgroup.vn",
        phone: "0988 222 333",
        roleCode: "PHO_TONG_GIAM_DOC",
        redirectUrl: "/work",
      },
      GIAM_DOC: {
        empCode: "GĐ-003",
        name: "Lê Văn Nam",
        title: "Giám Đốc Khối Sản Xuất & Tổ Hợp Nhà Máy",
        department: "Khối Sản Xuất & Nhà Máy",
        avatar: "/images/crawled/Da-giay3.jpg",
        email: "vannam.le@tbsgroup.vn",
        phone: "0988 333 444",
        roleCode: "GIAM_DOC",
        redirectUrl: "/work?dept=production",
      },
      PHO_GIAM_DOC: {
        empCode: "PGĐ-004",
        name: "Nguyễn Thị Hồng",
        title: "Phó Giám Đốc Quản Lý Chất Lượng (QC) & Gemba",
        department: "Khối Quản Lý Chất Lượng (QC)",
        avatar: "/images/crawled/Da-giay4.jpg",
        email: "thihong.nguyen@tbsgroup.vn",
        phone: "0988 444 555",
        roleCode: "PHO_GIAM_DOC",
        redirectUrl: "/work?dept=qc",
      },
      CBCNV: {
        empCode: "202608001",
        name: "Bùi Văn Tuấn",
        title: "Chuyên Viên Quản Lý Hành Chính & Đón Khách",
        department: "Nhân sự - Hành chánh",
        avatar: "/images/crawled/Da-giay1.jpg",
        email: "vantuan.bui@tbsgroup.vn",
        phone: "0988 555 666",
        roleCode: "CBCNV",
        redirectUrl: "/rooms",
      },
      SYSTEM_ADMIN: {
        empCode: "ADMIN-2026",
        name: "Super Administrator System",
        title: "Quản Trị Viên Hệ Thống TBS Group",
        department: "Khối Quản Trị Hệ Thống & Digital",
        avatar: "/images/tbs-logo.png",
        email: "tbsgroup2026@gmail.com",
        phone: "0988 999 888",
        roleCode: "SYSTEM_ADMIN",
        redirectUrl: "/admin",
      },
      "tbsgroup2026@gmail.com": {
        empCode: "ADMIN-2026",
        name: "Super Administrator System",
        title: "Quản Trị Viên Hệ Thống TBS Group",
        department: "Khối Quản Trị Hệ Thống & Digital",
        avatar: "/images/tbs-logo.png",
        email: "tbsgroup2026@gmail.com",
        phone: "0988 999 888",
        roleCode: "SYSTEM_ADMIN",
        redirectUrl: "/admin",
      },
      "202608001": {
        empCode: "202608001",
        name: "Bùi Văn Tuấn",
        title: "Chuyên Viên Quản Lý Hành Chính & Đón Khách",
        department: "Nhân sự - Hành chánh",
        avatar: "/images/crawled/Da-giay1.jpg",
        email: "vantuan.bui@tbsgroup.vn",
        phone: "0988 555 666",
        roleCode: "CBCNV",
        redirectUrl: "/rooms",
      },
      "202608002": {
        empCode: "202608002",
        name: "Trần Thị Mai",
        title: "Chuyên Viên Logistics & Đăng Ký Công Tác",
        department: "Logistics TTPP",
        avatar: "/images/crawled/Da-giay2.jpg",
        email: "thimai.tran@tbsgroup.vn",
        phone: "0988 666 777",
        roleCode: "CBCNV",
        redirectUrl: "/business-trip",
      },
      "EMP-001": {
        empCode: "EMP-001",
        name: "Bùi Văn Tuấn",
        title: "Chuyên Viên Quản Lý Hành Chính & Đón Khách",
        department: "Nhân sự - Hành chánh",
        avatar: "/images/crawled/Da-giay1.jpg",
        email: "vantuan.bui@tbsgroup.vn",
        phone: "0988 555 666",
        roleCode: "CBCNV",
        redirectUrl: "/rooms",
      },
      "EMP-002": {
        empCode: "EMP-002",
        name: "Trần Thị Mai",
        title: "Chuyên Viên Logistics & Đăng Ký Công Tác",
        department: "Logistics TTPP",
        avatar: "/images/crawled/Da-giay2.jpg",
        email: "thimai.tran@tbsgroup.vn",
        phone: "0988 666 777",
        roleCode: "CBCNV",
        redirectUrl: "/business-trip",
      },
      "EMP-003": {
        empCode: "EMP-003",
        name: "Nguyễn Hoàng Quân",
        title: "Kỹ Sư R&D Phát Triển Mẫu SKECHERS",
        department: "R&D Kỹ thuật",
        avatar: "/images/crawled/Da-giay3.jpg",
        email: "hoangquan.nguyen@tbsgroup.vn",
        phone: "0988 777 888",
        roleCode: "CBCNV",
        redirectUrl: "/work?dept=rd",
      },
    };

    // 0. API Route: User Login & Session Persistence (/api/auth/login)
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const { empCode, role } = body;

        let userAccount = ROLE_ACCOUNTS[role] || ROLE_ACCOUNTS[empCode] || ROLE_ACCOUNTS["TONG_GIAM_DOC"];

        if (env.DB) {
          try {
            await env.DB.prepare(
              `CREATE TABLE IF NOT EXISTS user_profile (
                id TEXT PRIMARY KEY,
                emp_code TEXT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                avatar TEXT,
                title TEXT,
                department TEXT,
                role_code TEXT,
                redirect_url TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );`
            ).run();

            await env.DB.prepare(
              `INSERT OR REPLACE INTO user_profile (id, emp_code, name, email, phone, avatar, title, department, role_code, redirect_url, updated_at)
               VALUES ('current_user', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
              userAccount.empCode,
              userAccount.name,
              userAccount.email,
              userAccount.phone,
              userAccount.avatar,
              userAccount.title,
              userAccount.department,
              userAccount.roleCode,
              userAccount.redirectUrl
            ).run();
          } catch (e) {
            // ignore D1 table sync error
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            token: `token_${userAccount.empCode.toLowerCase()}_${userAccount.roleCode.toLowerCase()}`,
            user: userAccount,
            redirectUrl: userAccount.redirectUrl,
            message: `Đăng nhập thành công với chức vụ ${userAccount.title}`
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

          const user = results && results.length > 0 ? results[0] : ROLE_ACCOUNTS["TONG_GIAM_DOC"];

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

    // 4. API Route: Meeting Rooms & Visitor Management (/api/rooms)
    if (url.pathname.startsWith("/api/rooms")) {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS meeting_rooms (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                capacity INTEGER DEFAULT 10,
                location TEXT NOT NULL,
                equipment TEXT,
                status TEXT DEFAULT 'AVAILABLE',
                is_locked INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS room_bookings (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                room_name TEXT NOT NULL,
                title TEXT NOT NULL,
                booker_name TEXT NOT NULL,
                department TEXT NOT NULL,
                booking_date TEXT NOT NULL,
                time_slot TEXT NOT NULL,
                attendees_count INTEGER DEFAULT 5,
                notes TEXT,
                status TEXT DEFAULT 'CONFIRMED',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS visitors (
                id TEXT PRIMARY KEY,
                badge_code TEXT NOT NULL UNIQUE,
                visitor_name TEXT NOT NULL,
                company TEXT NOT NULL,
                id_card TEXT,
                host_name TEXT NOT NULL,
                department TEXT NOT NULL,
                room_location TEXT NOT NULL,
                visit_date TEXT NOT NULL,
                expected_time TEXT NOT NULL,
                status TEXT DEFAULT 'EXPECTED',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch (e) {
          // ignore table creation check error
        }
      }

      // GET: Get all rooms, bookings, and visitors
      if (request.method === "GET") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const { results: rooms } = await env.DB.prepare("SELECT * FROM meeting_rooms").all();
          const { results: bookings } = await env.DB.prepare("SELECT * FROM room_bookings ORDER BY created_at DESC").all();
          const { results: visitors } = await env.DB.prepare("SELECT * FROM visitors ORDER BY created_at DESC").all();

          return new Response(
            JSON.stringify({
              success: true,
              data: { rooms, bookings, visitors },
              source: "Cloudflare D1 Database vpchuoiskechers"
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

      // POST /api/rooms/booking: Save a new booking
      if (url.pathname === "/api/rooms/booking" && request.method === "POST") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = await request.json();
          const { id, roomId, roomName, title, bookerName, department, bookingDate, timeSlot, attendeesCount, notes } = body;

          await env.DB.prepare(`
            INSERT INTO room_bookings (id, room_id, room_name, title, booker_name, department, booking_date, time_slot, attendees_count, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)
          `).bind(
            id || `b_${Date.now()}`,
            roomId || "room_1",
            roomName || "Phòng Họp Executive VIP 1",
            title || "Cuộc họp",
            bookerName || "Anh Huy",
            department || "Hành chính",
            bookingDate || "15/08/2026",
            timeSlot || "09:00 - 10:00",
            attendeesCount || 5,
            notes || ""
          ).run();

          return new Response(
            JSON.stringify({ success: true, message: "Đã lưu lịch đặt phòng họp vào Cloudflare D1 thành công!", data: body }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // POST /api/rooms/visitor: Save a new visitor
      if (url.pathname === "/api/rooms/visitor" && request.method === "POST") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = await request.json();
          const { id, badgeCode, visitorName, company, idCard, hostName, department, roomLocation, visitDate, expectedTime, notes } = body;

          await env.DB.prepare(`
            INSERT INTO visitors (id, badge_code, visitor_name, company, id_card, host_name, department, room_location, visit_date, expected_time, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EXPECTED', ?, CURRENT_TIMESTAMP)
          `).bind(
            id || `v_${Date.now()}`,
            badgeCode || `VIS-2026-${Math.floor(100 + Math.random() * 900)}`,
            visitorName || "Khách mời",
            company || "Đối tác",
            idCard || "",
            hostName || "Anh Huy",
            department || "Hành chính",
            roomLocation || "Phòng Họp VIP 1",
            visitDate || "15/08/2026",
            expectedTime || "14:00",
            notes || ""
          ).run();

          return new Response(
            JSON.stringify({ success: true, message: "Đã đăng ký thông tin đón khách vào D1 Database!", data: body }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // PUT /api/rooms/lock: Toggle room lock/unlock
      if (url.pathname === "/api/rooms/lock" && request.method === "PUT") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = await request.json();
          const { id, isLocked, status } = body;

          await env.DB.prepare(
            "UPDATE meeting_rooms SET is_locked = ?, status = ? WHERE id = ?"
          ).bind(isLocked ? 1 : 0, status || (isLocked ? 'MAINTENANCE' : 'AVAILABLE'), id).run();

          return new Response(
            JSON.stringify({ success: true, message: "Đã cập nhật trạng thái phòng họp vào D1!", id, isLocked }),
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
