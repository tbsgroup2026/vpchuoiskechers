// Cloudflare Worker Handler for D1 Database vpchuoiskechers & Static Asset Proxy

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Redirect legacy /bi route to /work
    if (url.pathname === "/bi" || url.pathname === "/bi/") {
      return Response.redirect(new URL("/work", request.url), 301);
    }

    const ROLE_ACCOUNTS = {
      TONG_GIAM_DOC: {
        empCode: "TGĐ-001",
        name: "Tổng Giám Đốc",
        title: "Tổng Giám Đốc Tập Đoàn TBS Group",
        department: "Ban Giám Đốc Tập Đoàn",
        avatar: "/images/tbs-logo.png",
        email: "tgd@tbsgroup.vn",
        phone: "0988 000 001",
        roleCode: "TONG_GIAM_DOC",
        redirectUrl: "/work",
      },
      PHO_TONG_GIAM_DOC: {
        empCode: "PTGĐ-002",
        name: "Phó Tổng Giám Đốc",
        title: "Phó Tổng Giám Đốc Vận Hành & Chuỗi Cung Ứng",
        department: "Ban Giám Đốc Vận Hành",
        avatar: "/images/tbs-logo.png",
        email: "ptgd@tbsgroup.vn",
        phone: "0988 000 002",
        roleCode: "PHO_TONG_GIAM_DOC",
        redirectUrl: "/work",
      },
      GIAM_DOC: {
        empCode: "GĐ-003",
        name: "Giám Đốc",
        title: "Giám Đốc Khối Sản Xuất & Tổ Hợp Nhà Máy",
        department: "Khối Sản Xuất & Nhà Máy",
        avatar: "/images/tbs-logo.png",
        email: "gd@tbsgroup.vn",
        phone: "0988 000 003",
        roleCode: "GIAM_DOC",
        redirectUrl: "/work",
      },
      PHO_GIAM_DOC: {
        empCode: "PGĐ-004",
        name: "Phó Giám Đốc",
        title: "Phó Giám Đốc Quản Lý Chất Lượng (QC) & Gemba",
        department: "Khối Quản Lý Chất Lượng (QC)",
        avatar: "/images/tbs-logo.png",
        email: "pgd@tbsgroup.vn",
        phone: "0988 000 004",
        roleCode: "PHO_GIAM_DOC",
        redirectUrl: "/work",
      },
      CBCNV: {
        empCode: "202608001",
        name: "Cán Bộ Công Nhân Viên",
        title: "Cán Bộ Công Nhân Viên",
        department: "Văn Phòng Chuỗi SKECHERS",
        avatar: "/images/tbs-logo.png",
        email: "cbcnv@tbsgroup.vn",
        phone: "0988 000 005",
        roleCode: "CBCNV",
        redirectUrl: "/work",
      },
      SYSTEM_ADMIN: {
        empCode: "ADMIN-2026",
        name: "Quản Trị Viên Hệ Thống",
        title: "Quản Trị Viên Hệ Thống TBS Group",
        department: "Khối Quản Trị Hệ Thống & Digital",
        avatar: "/images/tbs-logo.png",
        email: "admin@tbsgroup.vn",
        phone: "0988 000 000",
        roleCode: "SYSTEM_ADMIN",
        redirectUrl: "/admin",
      },
      "tbsgroup2026@gmail.com": {
        empCode: "ADMIN-2026",
        name: "Quản Trị Viên Hệ Thống",
        title: "Quản Trị Viên Hệ Thống TBS Group",
        department: "Khối Quản Trị Hệ Thống & Digital",
        avatar: "/images/tbs-logo.png",
        email: "admin@tbsgroup.vn",
        phone: "0988 000 000",
        roleCode: "SYSTEM_ADMIN",
        redirectUrl: "/admin",
      },
      "202608001": {
        empCode: "202608001",
        name: "Phạm Nguyễn Anh Huy",
        title: "IT - Team chuyển đổi số",
        department: "IT - Team chuyển đổi số",
        avatar: "/images/tbs-logo.png",
        email: "anhy.work.2004@gmail.com",
        phone: "0522511245",
        roleCode: "CBCNV",
        redirectUrl: "/work",
      },
      "202608002": {
        empCode: "202608002",
        name: "Trần Ngọc Huy",
        title: "IT - Team chuyển đổi số",
        department: "IT - Team chuyển đổi số",
        avatar: "/images/tbs-logo.png",
        email: "tranhuy110421@gmail.com",
        phone: "0988 000 002",
        roleCode: "CBCNV",
        redirectUrl: "/work",
      },
      "EMP-001": {
        empCode: "EMP-001",
        name: "Cán Bộ Công Nhân Viên",
        title: "Cán Bộ Công Nhân Viên",
        department: "Văn Phòng Chuỗi SKECHERS",
        avatar: "/images/tbs-logo.png",
        email: "cbcnv@tbsgroup.vn",
        phone: "0988 000 005",
        roleCode: "CBCNV",
        redirectUrl: "/work",
      },
      "EMP-002": {
        empCode: "EMP-002",
        name: "Cán Bộ Công Nhân Viên",
        title: "Cán Bộ Công Nhân Viên",
        department: "Văn Phòng Chuỗi SKECHERS",
        avatar: "/images/tbs-logo.png",
        email: "cbcnv@tbsgroup.vn",
        phone: "0988 000 006",
        roleCode: "CBCNV",
        redirectUrl: "/work",
      },
      "EMP-003": {
        empCode: "EMP-003",
        name: "Cán Bộ Công Nhân Viên",
        title: "Cán Bộ Công Nhân Viên",
        department: "Văn Phòng Chuỗi SKECHERS",
        avatar: "/images/tbs-logo.png",
        email: "cbcnv@tbsgroup.vn",
        phone: "0988 000 007",
        roleCode: "CBCNV",
        redirectUrl: "/work",
      },
    };

    // API Route: Cloudinary Avatar Upload Handler (/api/upload-avatar)
    if (url.pathname === "/api/upload-avatar" && request.method === "POST") {
      try {
        const body = await request.json();
        const { image, empCode } = body;

        if (!image) {
          return new Response(JSON.stringify({ success: false, error: "Thiếu dữ liệu ảnh" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        let cloudinaryUrl = null;
        const presets = ["vpchuoisk", "ml_default", "unsigned"];

        for (const preset of presets) {
          try {
            const formData = new FormData();
            formData.append("file", image);
            formData.append("upload_preset", preset);

            const cRes = await fetch("https://api.cloudinary.com/v1_1/dwl2xtbqa/image/upload", {
              method: "POST",
              body: formData,
            });

            if (cRes.ok) {
              const cData = await cRes.json();
              if (cData.secure_url) {
                cloudinaryUrl = cData.secure_url;
                break;
              }
            }
          } catch (cErr) {
            console.warn("Cloudinary upload preset attempt error:", cErr);
          }
        }

        const finalUrl = cloudinaryUrl || image;

        if (env.DB) {
          const targetEmp = empCode || "202608001";
          try {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO user_profile (id, emp_code, avatar, updated_at)
               VALUES ('current_user', ?, ?, CURRENT_TIMESTAMP)`
            ).bind(targetEmp, finalUrl).run();

            await env.DB.prepare(
              `UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE emp_code = ?`
            ).bind(finalUrl, targetEmp).run();
          } catch (d1Err) {
            console.warn("D1 save avatar error:", d1Err);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          url: finalUrl,
          isCloudinary: !!cloudinaryUrl,
          message: cloudinaryUrl ? "Tải ảnh lên Cloudinary thành công!" : "Lưu ảnh vào hệ thống thành công!"
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 0. API Route: User Login & Session Persistence (/api/auth/login)
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const { empCode, role, password } = body;

        let userAccount = null;

        if (env.DB) {
          try {
            const queryTarget = empCode || role;
            const { results } = await env.DB.prepare(
              `SELECT * FROM users WHERE emp_code = ? OR email = ? OR role_code = ?`
            ).bind(queryTarget, queryTarget, queryTarget).all();

            if (results && results.length > 0) {
              const dbUser = results[0];
              userAccount = {
                empCode: dbUser.emp_code || empCode || "202608001",
                name: dbUser.name || "Cán Bộ Công Nhân Viên",
                title: dbUser.title || "Cán Bộ Công Nhân Viên",
                department: dbUser.department || "Văn Phòng Chuỗi SKECHERS",
                avatar: dbUser.avatar_url || "/images/tbs-logo.png",
                email: dbUser.email || "cbcnv@tbsgroup.vn",
                phone: dbUser.phone || "0988 000 005",
                roleCode: dbUser.role_code || "CBCNV",
                redirectUrl: "/work",
              };
            }
          } catch (e) {
            console.warn("D1 users lookup error:", e);
          }
        }

        if (!userAccount) {
          userAccount = ROLE_ACCOUNTS[role] || ROLE_ACCOUNTS[empCode] || ROLE_ACCOUNTS["CBCNV"];
        }

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

            // Preserve existing custom avatar if user previously uploaded one
            const { results: existingProfiles } = await env.DB.prepare(
              `SELECT avatar FROM user_profile WHERE id = 'current_user'`
            ).all();

            const savedAvatar = existingProfiles && existingProfiles[0] && existingProfiles[0].avatar ? existingProfiles[0].avatar : null;
            const finalAvatar = (savedAvatar && savedAvatar !== "/images/tbs-logo.png") ? savedAvatar : (userAccount.avatar || "/images/tbs-logo.png");
            userAccount.avatar = finalAvatar;

            await env.DB.prepare(
              `INSERT OR REPLACE INTO user_profile (id, emp_code, name, email, phone, avatar, title, department, role_code, redirect_url, updated_at)
               VALUES ('current_user', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
              userAccount.empCode,
              userAccount.name,
              userAccount.email,
              userAccount.phone,
              finalAvatar,
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
            message: `Đăng nhập thành công với tên ${userAccount.name}`
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

    // 0.1 API Route: Users Management (/api/users)
    if (url.pathname === "/api/users") {
      if (request.method === "GET") {
        try {
          if (env.DB) {
            const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY id DESC").all();
            return new Response(
              JSON.stringify({ success: true, data: results }),
              { headers: { "Content-Type": "application/json" } }
            );
          }
          return new Response(
            JSON.stringify({ success: true, data: [] }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const { empCode, name, email, phone, title, department, roleCode, password, status } = body;

          if (env.DB) {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO users (emp_code, name, email, phone, title, department, role_code, password_hash, status, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
              empCode,
              name,
              email || `${empCode}@tbsgroup.vn`,
              phone || "0988 000 000",
              title || "Cán Bộ Công Nhân Viên",
              department || "Văn Phòng Chuỗi SKECHERS",
              roleCode || "CBCNV",
              password || "123456",
              status || "ACTIVE"
            ).run();
          }

          return new Response(
            JSON.stringify({ success: true, message: "Đã lưu thông tin nhân sự vào D1 Database!" }),
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

    // 1. API Route: User Profile Persistence (/api/profile & /api/user-profile)
    if (url.pathname === "/api/profile" || url.pathname === "/api/user-profile") {
      // GET: Retrieve User Profile from D1 Database
      if (request.method === "GET") {
        try {
          if (env.DB) {
            const { results } = await env.DB.prepare(
              "SELECT * FROM user_profile WHERE id = 'current_user'"
            ).all();
            if (results && results.length > 0) {
              const userProf = { ...results[0] };
              if (!userProf.avatar || typeof userProf.avatar !== "string" || userProf.avatar.trim() === "") {
                userProf.avatar = "/images/tbs-logo.png";
              }
              return new Response(
                JSON.stringify({ success: true, data: userProf, source: "Cloudflare D1 Database vpchuoiskechers" }),
                { headers: { "Content-Type": "application/json" } }
              );
            }
          }
          return new Response(
            JSON.stringify({ success: true, data: ROLE_ACCOUNTS["TONG_GIAM_DOC"] }),
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
          const body = await request.json();
          const { empCode, emp_code, name, email, phone, avatar, title, department, roleCode, role_code } = body;
          const targetEmpCode = empCode || emp_code || "202608001";
          const targetRoleCode = roleCode || role_code || "CBCNV";

          let finalAvatar = avatar;
          if (env.DB) {
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

            if (!finalAvatar || typeof finalAvatar !== "string" || finalAvatar.trim() === "") {
              const { results: existing } = await env.DB.prepare("SELECT avatar FROM user_profile WHERE id = 'current_user'").all();
              finalAvatar = (existing && existing[0] && existing[0].avatar && existing[0].avatar.trim() !== "")
                ? existing[0].avatar
                : "/images/tbs-logo.png";
            }

            await env.DB.prepare(
              `INSERT OR REPLACE INTO user_profile (id, emp_code, name, email, phone, avatar, title, department, role_code, updated_at)
               VALUES ('current_user', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            )
              .bind(
                targetEmpCode,
                name || "Phạm Nguyễn Anh Huy",
                email || "anhy.work.2004@gmail.com",
                phone || "0522511245",
                finalAvatar,
                title || "IT - Team chuyển đổi số",
                department || "IT - Team chuyển đổi số",
                targetRoleCode
              )
              .run();

            try {
              await env.DB.prepare(
                `UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url), title = COALESCE(?, title), department = COALESCE(?, department), updated_at = CURRENT_TIMESTAMP WHERE emp_code = ?`
              ).bind(
                name,
                email,
                phone,
                finalAvatar,
                title,
                department,
                targetEmpCode
              ).run();
            } catch (uErr) {
              console.warn("Update users table error:", uErr);
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: "Đã cập nhật thông tin cá nhân thành công vào D1 Database vpchuoiskechers!",
              data: { empCode: targetEmpCode, name, email, phone, avatar: finalAvatar, title, department, roleCode: targetRoleCode }
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
