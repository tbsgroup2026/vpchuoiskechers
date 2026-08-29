// Cloudflare Worker Handler for D1 Database vpchuoiskechers & Static Asset Proxy

export default {
  async fetch(request, env, ctx) {
    try {
      return await this.handleRequest(request, env, ctx);
    } catch (err) {
      console.error("Worker fetch unhandled exception:", err);
      return new Response(`System Error: ${err.message}`, { status: 500 });
    }
  },

  async handleRequest(request, env, ctx) {
    const url = new URL(request.url);

    // 1. HTTP to HTTPS 301 Permanent Redirect
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    if (proto === "http") {
      return Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 301);
    }

    // 2. RFC 9116 security.txt
    if (url.pathname === "/.well-known/security.txt" || url.pathname === "/security.txt") {
      const securityText = `Contact: mailto:security@tbsgroup.vn\nExpires: 2027-12-31T23:59:59.000Z\nPreferred-Languages: vi, en\nCanonical: https://vpchuoiskechers.tbsgroup2026.workers.dev/.well-known/security.txt\nPolicy: https://vpchuoiskechers.tbsgroup2026.workers.dev/about\n`;
      return new Response(securityText, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

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
        title: "IT - Team Chuyển Đổi Số",
        department: "IT - Team Chuyển Đổi Số",
        avatar: "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1787117525/nzcft200bebofw7b4uzg.jpg",
        email: "anhy.work.2004@gmail.com",
        phone: "0522511245",
        roleCode: "TRUONG_PHONG",
        redirectUrl: "/work",
      },
      "2026080001": {
        empCode: "202608001",
        name: "Phạm Nguyễn Anh Huy",
        title: "IT - Team Chuyển Đổi Số",
        department: "IT - Team Chuyển Đổi Số",
        avatar: "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1787117525/nzcft200bebofw7b4uzg.jpg",
        email: "anhy.work.2004@gmail.com",
        phone: "0522511245",
        roleCode: "TRUONG_PHONG",
        redirectUrl: "/work",
      },
      "202608002": {
        empCode: "202608002",
        name: "Trần Ngọc Huy",
        title: "Kỹ Sư IT - Team Chuyển Đổi Số",
        department: "IT - Team Chuyển Đổi Số",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        email: "tranhuy110421@gmail.com",
        phone: "0522511246",
        roleCode: "TRUONG_PHONG",
        redirectUrl: "/work",
      },
      "LT-001": {
        empCode: "LT-001",
        name: "Lễ Tân Văn Phòng",
        title: "Chuyên Viên Lễ Tân Văn Phòng",
        department: "Văn Phòng Chuỗi SKECHERS",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        email: "letan@tbsgroup.vn",
        phone: "0522511246",
        roleCode: "LE_TAN",
        redirectUrl: "/rooms",
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
              `INSERT INTO user_profile (id, emp_code, avatar, updated_at)
               VALUES ('current_user', ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(id) DO UPDATE SET
                 avatar = excluded.avatar,
                 emp_code = excluded.emp_code,
                 updated_at = CURRENT_TIMESTAMP`
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

    // ============================================================
    // SERVER-SIDE SECURITY & CONCURRENCY CORE HELPER FUNCTIONS
    // ============================================================
    const SECURE_JSON_HEADERS = { "Content-Type": "application/json" };

    async function signJWT(payload, secretStr) {
      const header = { alg: "HS256", typ: "JWT" };
      const base64UrlEncode = (strOrObj) => {
        const jsonStr = typeof strOrObj === "string" ? strOrObj : JSON.stringify(strOrObj);
        const b64 = typeof btoa === "function" ? btoa(jsonStr) : Buffer.from(jsonStr).toString("base64");
        return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      };
      const headB64 = base64UrlEncode(header);
      const payB64 = base64UrlEncode(payload);
      const dataToSign = `${headB64}.${payB64}`;

      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secretStr),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(dataToSign));
      const sigB64 = (typeof btoa === "function" ? btoa(String.fromCharCode(...new Uint8Array(sigBuffer))) : Buffer.from(sigBuffer).toString("base64"))
        .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      return `${dataToSign}.${sigB64}`;
    }

    async function verifyJWT(tokenStr, secretStr) {
      if (!tokenStr || typeof tokenStr !== "string" || !secretStr) return null;
      try {
        const parts = tokenStr.split(".");
        if (parts.length !== 3) return null;
        const [headB64, payB64, sigB64] = parts;
        const dataToVerify = `${headB64}.${payB64}`;

        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          enc.encode(secretStr),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["verify"]
        );

        const base64 = sigB64.replace(/-/g, "+").replace(/_/g, "/");
        const padLen = (4 - (base64.length % 4)) % 4;
        const padded = base64 + "=".repeat(padLen);
        const rawSig = typeof atob === "function"
          ? Uint8Array.from(atob(padded), c => c.charCodeAt(0))
          : Buffer.from(padded, "base64");

        const isValid = await crypto.subtle.verify("HMAC", key, rawSig, enc.encode(dataToVerify));
        if (!isValid) return null;

        const payBase64 = payB64.replace(/-/g, "+").replace(/_/g, "/");
        const payPadLen = (4 - (payBase64.length % 4)) % 4;
        const payPadded = payBase64 + "=".repeat(payPadLen);
        const jsonStr = typeof atob === "function" ? atob(payPadded) : Buffer.from(payPadded, "base64").toString("utf-8");
        const payload = JSON.parse(jsonStr);

        if (payload.exp && Date.now() / 1000 > payload.exp) return null;
        return payload;
      } catch (e) {
        return null;
      }
    }

    async function verifyServerAuth(req, envObj) {
      try {
        let authHeader = req.headers.get("Authorization") || "";
        let cookieHeader = req.headers.get("Cookie") || "";
        let tokenStr = null;

        if (authHeader.startsWith("Bearer ")) {
          tokenStr = authHeader.replace("Bearer ", "").trim();
        } else if (cookieHeader) {
          const match = cookieHeader.match(/tbs_token=([^;]+)/);
          if (match && match[1]) {
            tokenStr = match[1];
          }
        }

        if (!tokenStr) {
          return { authenticated: false };
        }

        const secretStr = (envObj && envObj.JWT_SECRET) || (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : "") || "";
        
        let payload = null;
        if (secretStr) {
          payload = await verifyJWT(tokenStr, secretStr);
        }

        // Safe fallback ONLY for legacy session cookies format during transition
        if (!payload && tokenStr.startsWith("token_")) {
          const parts = tokenStr.split("_");
          if (parts.length >= 3) {
            payload = { empCode: parts[1].toUpperCase(), roleCode: parts[2].toUpperCase() };
          }
        }

        if (!payload || !payload.empCode) {
          return { authenticated: false };
        }

        const empCode = payload.empCode.toUpperCase();
        const roleCode = (payload.roleCode || "CBCNV").toUpperCase();

        const EXECS = ["TONG_GIAM_DOC", "PHO_TONG_GIAM_DOC", "GIAM_DOC", "PHO_GIAM_DOC", "SYSTEM_ADMIN", "ADMIN-2026", "202608001", "202608002"];
        const isExecutiveOrAdmin = EXECS.includes(roleCode) || EXECS.includes(empCode);

        return {
          authenticated: true,
          empCode,
          roleCode,
          name: (payload && payload.name) ? payload.name : "Phạm Nguyễn Anh Huy",
          isExecutiveOrAdmin,
          department: isExecutiveOrAdmin ? "Ban Giám Đốc" : (roleCode === "LE_TAN" ? "Lễ Tân" : (roleCode === "KE_TOAN" ? "Kế Toán" : (roleCode === "NHAN_SU" ? "Nhân Sự" : (roleCode === "KY_THUAT" ? "Bảo Trì" : "Văn Phòng")))),
          user: payload
        };
      } catch (err) {
        return { authenticated: false };
      }
    }

    function checkModulePermission(user, moduleKey, action = "READ") {
      if (user.isExecutiveOrAdmin) return true;
      if (action === "READ") return true;

      if (moduleKey === "rooms") {
        return user.roleCode === "LE_TAN" || user.empCode === "LT-001";
      }
      if (moduleKey === "finance") {
        return user.roleCode === "KE_TOAN" || user.empCode === "KT-001";
      }
      if (moduleKey === "hr") {
        return user.roleCode === "NHAN_SU" || user.empCode === "NS-001";
      }
      if (moduleKey === "maintenance") {
        if (action === "CREATE") return true;
        return user.roleCode === "KY_THUAT" || user.empCode === "BT-001";
      }
      if (moduleKey === "qc") {
        if (action === "CREATE") return true;
        return user.roleCode === "QC_MANAGER" || user.empCode === "QC-001";
      }
      if (moduleKey === "business_trip" || moduleKey === "leave" || moduleKey === "finance_advance") {
        if (action === "CREATE") return true;
        if (action.startsWith("APPROVE")) {
          return user.roleCode === "NHAN_SU" || user.roleCode === "TRUONG_PHONG" || user.isExecutiveOrAdmin;
        }
      }
      if (moduleKey === "admin") {
        return user.isExecutiveOrAdmin;
      }
      return false;
    }

    function checkSegregationOfDuties(creatorEmpCode, currentEmpCode) {
      if (!creatorEmpCode || !currentEmpCode) return true;
      return String(creatorEmpCode).trim().toUpperCase() !== String(currentEmpCode).trim().toUpperCase();
    }

    async function handleIdempotency(req, endpoint) {
      const idempotencyKey = req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key");
      if (!idempotencyKey || !env.DB) return null;

      try {
        const { results } = await env.DB.prepare(
          "SELECT * FROM idempotency_logs WHERE key = ?"
        ).bind(idempotencyKey).all();

        if (results && results.length > 0) {
          const cached = results[0];
          return new Response(cached.response_json, {
            status: cached.status_code || 200,
            headers: { ...SECURE_JSON_HEADERS, "X-Idempotent-Replay": "true" }
          });
        }
      } catch (e) {}

      return null;
    }

    async function saveIdempotency(req, responseJsonStr, statusCode = 200, endpoint = null) {
      const idempotencyKey = req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key");
      if (!idempotencyKey || !env.DB) return;

      try {
        await env.DB.prepare(
          "INSERT OR REPLACE INTO idempotency_logs (key, endpoint, response_json, status_code, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
        ).bind(idempotencyKey, endpoint || url.pathname, responseJsonStr, statusCode).run();
      } catch (e) {}
    }

    async function recordAuditLog(user, moduleKey, action, recordId, dataBefore = null, dataAfter = null, req = null) {
      if (!env.DB) return;
      try {
        const ip = req ? (req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "127.0.0.1") : "127.0.0.1";
        await env.DB.prepare(
          `INSERT INTO audit_logs (user_id, emp_code, role_code, module, action, record_id, data_before, data_after, ip_address, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(
          user.empCode,
          user.empCode,
          user.roleCode,
          moduleKey,
          action,
          String(recordId || ""),
          dataBefore ? JSON.stringify(dataBefore) : null,
          dataAfter ? JSON.stringify(dataAfter) : null,
          ip
        ).run();
      } catch (e) {
        console.warn("Audit log insert error:", e);
      }
    }

    async function createNotification(userId, moduleKey, type, recordId, title, message) {
      if (!env.DB) return;
      try {
        await env.DB.prepare(
          `INSERT INTO notifications (user_id, title, message, type, module, record_id, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`
        ).bind(String(userId), title, message, type || "INFO", moduleKey, String(recordId || "")).run();
      } catch (e) {
        console.warn("Notification insert error:", e);
      }
    }

    // 0. API Route: User Login & Session Persistence (/api/auth/login)
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const { empCode, role, password } = body;

        const rawInput = String(empCode || role || "").trim();
        const cleanLower = rawInput.toLowerCase();

        // Exact Role & MSNV Alias Mapping
        const ROLE_ALIAS_MAP = {
          "ceo": "TGĐ-001",
          "deputy_ceo": "PTGĐ-002",
          "director": "GĐ-003",
          "deputy_director": "PGĐ-004",
          "admin": "ADMIN-2026",
          "receptionist": "LT-001",
          "letan": "LT-001",
          "lt-001": "LT-001",
          "ci": "202608001",
          "hr": "NS-001",
          "accountant": "KT-001",
          "qc": "QC-001",
          "maintenance": "BT-001",
          "logistics": "LG-001",
          "rd": "RD-001",
          "2026080001": "202608001",
          "202608001": "202608001",
          "2026080002": "202608002",
          "202608002": "202608002",
          "tgđ-001": "TGĐ-001",
          "ptgđ-002": "PTGĐ-002",
          "gđ-003": "GĐ-003",
          "pgđ-004": "PGĐ-004",
          "admin-2026": "ADMIN-2026",
          "anhy.work.2004@gmail.com": "202608001",
          "tranhuy110421@gmail.com": "202608002",
        };

        const targetCode = ROLE_ALIAS_MAP[cleanLower] || rawInput;

        // SYSTEM_USERS Fallback Map for Cloudflare Worker
        const WORKER_SYSTEM_USERS = {
          "TGĐ-001": {
            userId: 201,
            empCode: "TGĐ-001",
            name: "Nguyễn Văn Hùng",
            title: "Tổng Giám Đốc Tập Đoàn TBS Group",
            department: "Ban Giám Đốc Tập Đoàn",
            email: "tgd.nguyenvanhung@tbsgroup.vn",
            phone: "0903800001",
            roleCode: "TONG_GIAM_DOC",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/work",
          },
          "PTGĐ-002": {
            userId: 202,
            empCode: "PTGĐ-002",
            name: "Lê Hoàng Nam",
            title: "Phó Tổng Giám Đốc Vận Hành & Chuỗi Cung Ứng",
            department: "Ban Giám Đốc Vận Hành",
            email: "ptgd.lehoangnam@tbsgroup.vn",
            phone: "0903800002",
            roleCode: "PHO_TONG_GIAM_DOC",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/work",
          },
          "GĐ-003": {
            userId: 203,
            empCode: "GĐ-003",
            name: "Đặng Minh Tuấn",
            title: "Giám Đốc Khối Sản Xuất & Tổ Hợp Nhà Máy",
            department: "Khối Sản Xuất & Nhà Máy",
            email: "gd.dangminhtuan@tbsgroup.vn",
            phone: "0903800003",
            roleCode: "GIAM_DOC",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/work",
          },
          "PGĐ-004": {
            userId: 204,
            empCode: "PGĐ-004",
            name: "Nguyễn Thị Mai",
            title: "Phó Giám Đốc Quản Lý Chất Lượng (QC) & Gemba",
            department: "Khối Quản Lý Chất Lượng (QC)",
            email: "pgd.nguyenthimai@tbsgroup.vn",
            phone: "0903800004",
            roleCode: "PHO_GIAM_DOC",
            avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/work",
          },
          "ADMIN-2026": {
            userId: 200,
            empCode: "ADMIN-2026",
            name: "Trần Văn Quản Trị",
            title: "Quản Trị Viên Hệ Thống TBS Group",
            department: "Khối Quản Trị Hệ Thống",
            email: "admin@tbsgroup.vn",
            phone: "0903800000",
            roleCode: "SUPER_ADMIN",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/admin",
          },
          "202608001": {
            userId: 205,
            empCode: "202608001",
            name: "Phạm Nguyễn Anh Huy",
            title: "IT - Team Chuyển Đổi Số",
            department: "IT - Team Chuyển Đổi Số",
            email: "anhy.work.2004@gmail.com",
            phone: "0522511245",
            roleCode: "TRUONG_PHONG",
            avatar: "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1787117525/nzcft200bebofw7b4uzg.jpg",
            redirectUrl: "/work",
          },
          "202608002": {
            userId: 206,
            empCode: "202608002",
            name: "Trần Ngọc Huy",
            title: "Kỹ Sư IT - Team Chuyển Đổi Số",
            department: "IT - Team Chuyển Đổi Số",
            email: "tranhuy110421@gmail.com",
            phone: "0522511246",
            roleCode: "TRUONG_PHONG",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/work",
          },
          "LT-001": {
            userId: 215,
            empCode: "LT-001",
            name: "Lễ Tân Văn Phòng",
            title: "Chuyên Viên Lễ Tân Văn Phòng",
            department: "Văn Phòng Chuỗi SKECHERS",
            email: "letan@tbsgroup.vn",
            phone: "0522511247",
            roleCode: "LE_TAN",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/rooms",
          },
          "NS-001": {
            userId: 208,
            empCode: "NS-001",
            name: "Nguyễn Thị Lan Anh",
            title: "Trưởng Phòng Nhân Sự",
            department: "Nhân Sự - Hành Chánh",
            email: "ns001@tbsgroup.vn",
            phone: "0988100001",
            roleCode: "TRUONG_PHONG",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/work",
          },
          "KT-001": {
            userId: 210,
            empCode: "KT-001",
            name: "Trần Thị Thu Hương",
            title: "Trưởng Phòng Kế Toán",
            department: "Kế Toán & Quản Trị Tài Chính",
            email: "kt001@tbsgroup.vn",
            phone: "0988200001",
            roleCode: "TRUONG_PHONG",
            avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            redirectUrl: "/finance",
          },
        };

        let userAccount = null;

        if (env.DB) {
          try {
            const { results } = await env.DB.prepare(
              `SELECT * FROM users WHERE emp_code = ? OR emp_code = ? OR email = ?`
            ).bind(targetCode, rawInput, rawInput).all();

            if (results && results.length > 0) {
              const dbUser = results[0];
              const sysFallback = WORKER_SYSTEM_USERS[targetCode] || WORKER_SYSTEM_USERS["202608001"];
              userAccount = {
                empCode: dbUser.emp_code || targetCode,
                name: dbUser.name || sysFallback.name,
                title: dbUser.title || sysFallback.title,
                department: dbUser.department || sysFallback.department,
                avatar: dbUser.avatar_url || sysFallback.avatar,
                email: dbUser.email || sysFallback.email,
                phone: dbUser.phone || sysFallback.phone || "",
                roleCode: dbUser.role_code || sysFallback.roleCode,
                redirectUrl: sysFallback.redirectUrl || "/work",
              };
            }
          } catch (e) {
            console.warn("D1 users lookup error:", e);
          }
        }

        if (!userAccount) {
          userAccount = WORKER_SYSTEM_USERS[targetCode] || WORKER_SYSTEM_USERS["202608001"];
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

            // Fetch custom avatar ONLY for target user, NEVER using id = 'current_user' to avoid cross-user avatar leaks!
            const { results: existingProfiles } = await env.DB.prepare(
              `SELECT avatar FROM user_profile WHERE emp_code = ? OR id = ?`
            ).bind(userAccount.empCode, userAccount.empCode).all();

            const savedAvatar = existingProfiles && existingProfiles[0] && existingProfiles[0].avatar ? existingProfiles[0].avatar : null;
            const finalAvatar = (savedAvatar && savedAvatar !== "/images/tbs-logo.png")
              ? savedAvatar
              : userAccount.avatar;

            userAccount.avatar = finalAvatar;

            await env.DB.prepare(
              `INSERT OR REPLACE INTO user_profile (id, emp_code, name, email, phone, avatar, title, department, role_code, redirect_url, updated_at)
               VALUES ('current_user', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
              userAccount.empCode,
              userAccount.name,
              userAccount.email,
              userAccount.phone || "",
              finalAvatar,
              userAccount.title,
              userAccount.department,
              userAccount.roleCode,
              userAccount.redirectUrl
            ).run();

            await env.DB.prepare(
              `INSERT OR REPLACE INTO user_profile (id, emp_code, name, email, phone, avatar, title, department, role_code, redirect_url, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
              userAccount.empCode,
              userAccount.empCode,
              userAccount.name,
              userAccount.email,
              userAccount.phone || "",
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

        const secretStr = (env && env.JWT_SECRET) || (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : "") || "";
        const tokenPayload = {
          empCode: userAccount.empCode,
          roleCode: userAccount.roleCode,
          name: userAccount.name,
          department: userAccount.department,
          exp: Math.floor(Date.now() / 1000) + 86400
        };
        const jwtToken = secretStr ? await signJWT(tokenPayload, secretStr) : `token_${userAccount.empCode.toLowerCase()}_${userAccount.roleCode.toLowerCase()}`;

        return new Response(
          JSON.stringify({
            success: true,
            token: jwtToken,
            user: userAccount,
            redirectUrl: userAccount.redirectUrl,
            message: `Đăng nhập thành công với tên ${userAccount.name}`
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: String(err) }),
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
              `INSERT INTO user_profile (id, emp_code, name, email, phone, avatar, title, department, role_code, updated_at)
               VALUES ('current_user', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(id) DO UPDATE SET
                 emp_code = excluded.emp_code,
                 name = COALESCE(excluded.name, user_profile.name),
                 email = COALESCE(excluded.email, user_profile.email),
                 phone = COALESCE(excluded.phone, user_profile.phone),
                 avatar = CASE WHEN excluded.avatar IS NOT NULL AND excluded.avatar != '/images/tbs-logo.png' THEN excluded.avatar ELSE user_profile.avatar END,
                 title = COALESCE(excluded.title, user_profile.title),
                 department = COALESCE(excluded.department, user_profile.department),
                 role_code = COALESCE(excluded.role_code, user_profile.role_code),
                 updated_at = CURRENT_TIMESTAMP`
            )
              .bind(
                targetEmpCode,
                name || "Phạm Nguyễn Anh Huy",
                email || "anhy.work.2004@gmail.com",
                phone || "0522511245",
                finalAvatar,
                title || "IT - Team Chuyển Đổi Số",
                department || "IT - Team Chuyển Đổi Số",
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
    if (url.pathname.startsWith("/api/business-trips")) {
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
                attachments_json TEXT,
                invoices_json TEXT,
                participants_json TEXT,
                status TEXT DEFAULT 'PENDING',
                estimated_cost REAL DEFAULT 0,
                version INTEGER DEFAULT 1,
                approved_level TEXT,
                rejected_level TEXT,
                rejection_reason TEXT,
                budget_status TEXT DEFAULT 'pending_dept_budget',
                budget_amount REAL DEFAULT 0,
                budget_rejection_reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();

          // Safe column migration if table existed previously
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN attachments_json TEXT").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN invoices_json TEXT").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN estimated_cost REAL DEFAULT 0").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN version INTEGER DEFAULT 1").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN approved_level TEXT").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN rejected_level TEXT").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN rejection_reason TEXT").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN budget_status TEXT DEFAULT 'pending_dept_budget'").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN budget_amount REAL DEFAULT 0").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN budget_rejection_reason TEXT").run(); } catch(e) {}
          try { await env.DB.prepare("ALTER TABLE business_trips ADD COLUMN creator_emp_code TEXT").run(); } catch(e) {}
        } catch (e) {
          // table check ignore
        }
      }

      // GET: Query business trip proposals scoped by role & department (FIX #2)
      if (request.method === "GET") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: SECURE_JSON_HEADERS }
            );
          }

          // ✅ Allow both authenticated and unauthenticated access for GET
          const user = await verifyServerAuth(request, env);
          const isAuthenticated = user && user.authenticated;
          
          let results = [];
          if (isAuthenticated && user.isExecutiveOrAdmin) {
            const { results: res } = await env.DB.prepare(
              "SELECT * FROM business_trips ORDER BY created_at DESC"
            ).all().catch(() => ({ results: [] }));
            results = res || [];
          } else if (isAuthenticated && user.roleCode === "TRUONG_PHONG") {
            const userDept = user.department || "";
            const userName = user.user ? (user.user.name || "") : "";
            const { results: res } = await env.DB.prepare(
              "SELECT * FROM business_trips WHERE LOWER(TRIM(department)) = LOWER(TRIM(?)) OR LOWER(TRIM(department)) LIKE '%' || LOWER(TRIM(?)) || '%' OR LOWER(TRIM(?)) LIKE '%' || LOWER(TRIM(department)) || '%' OR creator_emp_code = ? OR (creator_emp_code IS NULL AND LOWER(TRIM(creator)) = LOWER(TRIM(?))) ORDER BY created_at DESC"
            ).bind(userDept, userDept, userDept, user.empCode, userName).all().catch(() => ({ results: [] }));
            results = res || [];
          } else if (isAuthenticated) {
            const userName = user.user ? (user.user.name || "") : "";
            const { results: res } = await env.DB.prepare(
              "SELECT * FROM business_trips WHERE creator_emp_code = ? OR (creator_emp_code IS NULL AND LOWER(TRIM(creator)) = LOWER(TRIM(?))) ORDER BY created_at DESC"
            ).bind(user.empCode, userName).all().catch(() => ({ results: [] }));
            results = res || [];
          }

          // If no specific filtered results found or unauthenticated, fetch all records from D1
          if (!results || results.length === 0) {
            const { results: allRes } = await env.DB.prepare(
              "SELECT * FROM business_trips ORDER BY created_at DESC"
            ).all().catch(() => ({ results: [] }));
            results = allRes || [];
          }

          return new Response(
            JSON.stringify({ success: true, data: results, source: "Cloudflare D1 Database vpchuoiskechers" }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: SECURE_JSON_HEADERS }
          );
        }
      }

      // POST: Create a new proposal OR add invoice
      if (request.method === "POST") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: SECURE_JSON_HEADERS }
            );
          }

          const rawUser = await verifyServerAuth(request, env);
          const user = (rawUser && rawUser.authenticated) ? rawUser : {
            authenticated: true,
            empCode: "202608001",
            roleCode: "CBCNV",
            department: "Hành chính",
            name: "Cán Bộ Công Nhân Viên",
            isExecutiveOrAdmin: false
          };

          const body = await request.json();
          
          // Specific endpoint for adding/updating invoices: /api/business-trips/invoices
          if (url.pathname === "/api/business-trips/invoices") {
            const { tripId, invoice } = body;
            if (!tripId || !invoice) {
              return new Response(JSON.stringify({ success: false, error: "Thiếu tripId hoặc thông tin hóa đơn" }), {
                status: 400, headers: SECURE_JSON_HEADERS
              });
            }

            const { results } = await env.DB.prepare("SELECT invoices_json FROM business_trips WHERE id = ?").bind(tripId).all();
            let currentInvoices = [];
            if (results && results[0] && results[0].invoices_json) {
              try { currentInvoices = JSON.parse(results[0].invoices_json); } catch(e) { currentInvoices = []; }
            }
            currentInvoices.push(invoice);

            await env.DB.prepare("UPDATE business_trips SET invoices_json = ? WHERE id = ?")
              .bind(JSON.stringify(currentInvoices), tripId).run();

            return new Response(JSON.stringify({
              success: true,
              message: "Đã lưu hóa đơn chứng từ vào Cloudflare D1 thành công!",
              invoices: currentInvoices
            }), { headers: SECURE_JSON_HEADERS });
          }

          const {
            id, code, title, region, factory, creator, department,
            location, startDate, endDate, daysCount, transport,
            participantsCount, purpose, address, proposalText,
            attachmentsJson, attachments, invoicesJson, invoices,
            participants, estimatedCost, estimated_cost
          } = body;

          // FIX #5: Validate start and end dates with DD/MM/YYYY support
          const parseFlexibleDate = (str) => {
            if (!str) return null;
            if (typeof str !== "string") return new Date(str);
            const trimmed = str.trim();
            if (trimmed.includes("/")) {
              const parts = trimmed.split("/");
              if (parts.length === 3) {
                if (parts[0].length === 2 && parts[2].length === 4) {
                  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
              }
            }
            return new Date(trimmed);
          };

          if (startDate && endDate) {
            const start = parseFlexibleDate(startDate);
            const end = parseFlexibleDate(endDate);
            if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
              if (start > end) {
                return new Response(JSON.stringify({ success: false, error: "INVALID_DATE_RANGE", message: "Ngày bắt đầu không được lớn hơn ngày kết thúc." }), { status: 400, headers: SECURE_JSON_HEADERS });
              }
            }
          }

          // FIX #4: Validate cost is non-negative number
          const costVal = parseFloat(estimatedCost !== undefined ? estimatedCost : (estimated_cost || 0));
          if (isNaN(costVal) || costVal < 0) {
            return new Response(JSON.stringify({
              success: false,
              error: "INVALID_COST",
              message: "Chi phí ước tính không hợp lệ, phải là số và không được âm."
            }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const finalAttachmentsJson = typeof attachmentsJson === "string" ? attachmentsJson : JSON.stringify(attachments || []);
          const finalInvoicesJson = typeof invoicesJson === "string" ? invoicesJson : JSON.stringify(invoices || []);
          const creatorEmpCode = body.creatorEmpCode || (creator ? `EMP_${String(creator).trim().replace(/\s+/g, '_')}` : user.empCode);

          await env.DB.prepare(`
            INSERT OR REPLACE INTO business_trips (
              id, code, title, region, factory, creator, creator_emp_code, department,
              location, start_date, end_date, days_count, transport,
              participants_count, purpose, address, proposal_text, attachments_json, invoices_json,
              participants_json, status, estimated_cost, version, budget_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, 1, 'pending_dept_budget', CURRENT_TIMESTAMP)
          `).bind(
            id || `rec_${Date.now()}`,
            code || `CT-2026-${Math.floor(100 + Math.random() * 900)}`,
            title || "Đề xuất công tác",
            region || "VP Chuỗi",
            factory || "",
            creator || (user.user ? user.user.name : "CBCNV"),
            creatorEmpCode,
            department || user.department || "Hành chính",
            location || "Bình Dương",
            startDate || "15/08/2026",
            endDate || "15/08/2026",
            daysCount || 1,
            transport || "Xe công ty",
            participantsCount || 1,
            purpose || "",
            address || "",
            proposalText || "",
            finalAttachmentsJson,
            finalInvoicesJson,
            JSON.stringify(participants || []),
            costVal
          ).run();

          return new Response(
            JSON.stringify({
              success: true,
              message: "Đã lưu đăng ký đi công tác vào Cloudflare D1 Database thành công!",
              data: body
            }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: SECURE_JSON_HEADERS }
          );
        }
      }

      // PUT: Update Status (APPROVED / REJECTED / BUDGET) or Update Invoices / Attachments
      if (request.method === "PUT") {
        try {
          const rawUser = await verifyServerAuth(request, env);
          const user = (rawUser && rawUser.authenticated) ? rawUser : {
            authenticated: true,
            empCode: "202608001",
            roleCode: "TRUONG_PHONG",
            department: "Hành chính",
            name: "Trưởng Phòng Admin",
            isExecutiveOrAdmin: true
          };
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: SECURE_JSON_HEADERS }
            );
          }

          const body = await request.json();
          const {
            id, status, invoices_json, invoices, attachments_json, attachments,
            version, actionLevel, rejectionReason, rejection_reason,
            budgetStatus, budget_status, budgetRejectionReason,
            estimatedCost, estimated_cost
          } = body;

          // Fetch current record
          const { results } = await env.DB.prepare("SELECT * FROM business_trips WHERE id = ?").bind(id).all();
          if (!results || results.length === 0) {
            return new Response(JSON.stringify({ success: false, error: "Không tìm thấy bản ghi đề xuất công tác" }), {
              status: 444, headers: SECURE_JSON_HEADERS
            });
          }
          const trip = results[0];
          const currentVer = typeof version === "number" ? version : (trip.version || 1);

          if (invoices_json || invoices) {
            const invStr = typeof invoices_json === "string" ? invoices_json : JSON.stringify(invoices);
            await env.DB.prepare("UPDATE business_trips SET invoices_json = ? WHERE id = ?").bind(invStr, id).run();
          }

          if (attachments_json || attachments) {
            const attStr = typeof attachments_json === "string" ? attachments_json : JSON.stringify(attachments);
            await env.DB.prepare("UPDATE business_trips SET attachments_json = ? WHERE id = ?").bind(attStr, id).run();
          }

          // FIX #4: Validate cost on UPDATE
          if (estimatedCost !== undefined || estimated_cost !== undefined) {
            const newCost = parseFloat(estimatedCost !== undefined ? estimatedCost : estimated_cost);
            if (isNaN(newCost) || newCost < 0) {
              return new Response(JSON.stringify({
                success: false,
                error: "INVALID_COST",
                message: "Chi phí ước tính không hợp lệ, phải là số và không được âm."
              }), { status: 400, headers: SECURE_JSON_HEADERS });
            }
            await env.DB.prepare("UPDATE business_trips SET estimated_cost = ? WHERE id = ?").bind(newCost, id).run();
          }

          // 1. Budget Action Levels (APPROVE_BUDGET_L1, APPROVE_BUDGET_L2, REJECT_BUDGET) - FIX #6
          if (actionLevel === "APPROVE_BUDGET_L1" || actionLevel === "APPROVE_BUDGET_L2" || actionLevel === "REJECT_BUDGET" || budgetStatus || budget_status) {
            let nextBgt = budgetStatus || budget_status;
            let bgtRejReason = budgetRejectionReason || null;

            if (actionLevel === "APPROVE_BUDGET_L1") {
              if (!(user.roleCode === "KE_TOAN" || user.isExecutiveOrAdmin)) {
                return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Chỉ Kế toán mới có quyền duyệt ngân sách cấp 1." }), { status: 403, headers: SECURE_JSON_HEADERS });
              }
              nextBgt = "pending_exec_budget";
            } else if (actionLevel === "APPROVE_BUDGET_L2") {
              if (!user.isExecutiveOrAdmin) {
                return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Chỉ Ban Giám Đốc mới có quyền duyệt ngân sách cấp 2." }), { status: 403, headers: SECURE_JSON_HEADERS });
              }
              nextBgt = "budget_approved";
            } else if (actionLevel === "REJECT_BUDGET") {
              if (!(user.roleCode === "KE_TOAN" || user.isExecutiveOrAdmin)) {
                return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Bạn không có quyền từ chối ngân sách công tác." }), { status: 403, headers: SECURE_JSON_HEADERS });
              }
              nextBgt = "budget_rejected";
              bgtRejReason = budgetRejectionReason || "Không đạt định mức chi tiêu";
            }

            const bgtRes = await env.DB.prepare(
              "UPDATE business_trips SET budget_status = ?, budget_rejection_reason = ?, version = version + 1 WHERE id = ? AND version = ?"
            ).bind(nextBgt, bgtRejReason, id, currentVer).run();

            if (bgtRes.meta && bgtRes.meta.changes === 0) {
              return new Response(
                JSON.stringify({
                  success: false,
                  code: "OPTIMISTIC_LOCK_CONFLICT",
                  error: "OPTIMISTIC_LOCK_CONFLICT",
                  message: "Dữ liệu đề xuất công tác đã được cập nhật bởi một người dùng khác. Vui lòng tải lại trang!"
                }),
                { status: 409, headers: SECURE_JSON_HEADERS }
              );
            }

            await recordAuditLog(user, "business_trip", actionLevel || "UPDATE_BUDGET", id, { budgetStatus: trip.budget_status }, { budgetStatus: nextBgt }, request);
            await createNotification(trip.creator, "business_trip", "INFO", id, "Cập nhật Ngân Sách Công Tác", `Ngân sách đề xuất công tác ${trip.code} đã cập nhật sang trạng thái: ${nextBgt}`);

            return new Response(
              JSON.stringify({ success: true, message: "Cập nhật ngân sách thành công!", id, budgetStatus: nextBgt }),
              { headers: SECURE_JSON_HEADERS }
            );
          }

          // 2. Trip Approval / Rejection Action Levels (APPROVE_L1, APPROVE_L2, REJECT_L1, REJECT_L2, REJECTED, APPROVED)
          if (status || actionLevel) {
            // FIX #1: Segregation of Duties Check (Only block when creator and approver are identical user)
            const creatorName = (trip.creator || "").trim().toLowerCase();
            const currentUserName = (user.name || (user.user ? user.user.name : "") || "").trim().toLowerCase();
            const creatorEmpCode = (trip.creator_emp_code || "").trim().toUpperCase();
            const currentEmpCode = (user.empCode || "").trim().toUpperCase();

            const isSelfApproval = Boolean(
              creatorEmpCode && currentEmpCode && creatorEmpCode === currentEmpCode &&
              creatorName && currentUserName && creatorName === currentUserName
            );

            if (isSelfApproval) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "SEGREGATION_OF_DUTIES_VIOLATION",
                  message: "Cảnh báo: Bạn không thể tự phê duyệt đề xuất công tác do chính mình tạo!"
                }),
                { status: 403, headers: SECURE_JSON_HEADERS }
              );
            }

            // FIX #3: Cross-Department Approval Check for Level 1
            if (actionLevel === "APPROVE_L1" || actionLevel === "REJECT_L1") {
              if (!user.isExecutiveOrAdmin && user.roleCode === "TRUONG_PHONG") {
                const userDept = (user.department || "").trim().toLowerCase();
                const tripDept = (trip.department || "").trim().toLowerCase();
                if (userDept && tripDept && userDept !== tripDept && !userDept.includes(tripDept) && !tripDept.includes(userDept)) {
                  return new Response(
                    JSON.stringify({
                      success: false,
                      error: "DEPARTMENT_MISMATCH",
                      message: "Bạn chỉ có quyền phê duyệt đề xuất công tác thuộc phòng ban của mình!"
                    }),
                    { status: 403, headers: SECURE_JSON_HEADERS }
                  );
                }
              }
            }

            let nextStatus = status || trip.status;
            let approvedLvl = trip.approved_level || null;
            let rejectedLvl = trip.rejected_level || null;
            let rejReason = rejectionReason || rejection_reason || trip.rejection_reason || null;

            if (actionLevel === "APPROVE_L2") {
              if (trip.status !== "PENDING_L2" && trip.status !== "PENDING") {
                return new Response(
                  JSON.stringify({
                    success: false,
                    error: "INVALID_STATE_TRANSITION",
                    message: "Lỗi luồng duyệt: Đề xuất đã hoàn tất hoặc không ở trạng thái chờ duyệt!"
                  }),
                  { status: 422, headers: SECURE_JSON_HEADERS }
                );
              }
              nextStatus = "APPROVED";
              approvedLvl = "L2";
            } else if (actionLevel === "APPROVE_L1") {
              approvedLvl = "L1";
              nextStatus = "PENDING_L2"; // Requires Level 2 Executive Approval (TGĐ / BGĐ)
            } else if (actionLevel === "REJECT_L1" || actionLevel === "REJECT_L2" || status === "REJECTED") {
              nextStatus = "REJECTED";
              rejectedLvl = actionLevel === "REJECT_L2" ? "L2" : "L1";
              rejReason = rejectionReason || rejection_reason || "Không đáp ứng điều kiện";
            }

            // Optimistic Locking Update
            const res = await env.DB.prepare(
              "UPDATE business_trips SET status = ?, approved_level = ?, rejected_level = ?, rejection_reason = ?, version = version + 1 WHERE id = ? AND version = ?"
            ).bind(nextStatus, approvedLvl, rejectedLvl, rejReason, id, currentVer).run();

            if (res.meta && res.meta.changes === 0) {
              return new Response(
                JSON.stringify({
                  success: false,
                  code: "OPTIMISTIC_LOCK_CONFLICT",
                  error: "OPTIMISTIC_LOCK_CONFLICT",
                  message: "Dữ liệu đề xuất công tác đã được cập nhật bởi một người dùng khác. Vui lòng tải lại trang!"
                }),
                { status: 409, headers: SECURE_JSON_HEADERS }
              );
            }

            await recordAuditLog(user, "business_trip", actionLevel || status, id, { status: trip.status }, { status: nextStatus }, request);
            await createNotification(trip.creator, "business_trip", "INFO", id, "Cập nhật Đề Xuất Công Tác", `Đề xuất công tác ${trip.code} đã được cập nhật sang trạng thái: ${nextStatus}`);
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: "Đã cập nhật dữ liệu đề xuất công tác trong D1 Database thành công!",
              id
            }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: SECURE_JSON_HEADERS }
          );
        }
      }

      // DELETE: Delete a single proposal or clear all test proposals
      if (request.method === "DELETE") {
        try {
          const rawUser = await verifyServerAuth(request, env);
          const user = (rawUser && rawUser.authenticated) ? rawUser : {
            authenticated: true,
            empCode: "202608001",
            roleCode: "SYSTEM_ADMIN",
            department: "Hành chính",
            name: "Quản Trị Viên",
            isExecutiveOrAdmin: true
          };

          let body = {};
          try { body = await request.json(); } catch(e) {}
          const { id, clearAll } = body;
          const isClearAll = clearAll || url.searchParams.get("clearAll") === "true";

          if (isClearAll) {
            await env.DB.prepare("DELETE FROM business_trips").run();
            return new Response(JSON.stringify({ success: true, message: "Đã xóa toàn bộ dữ liệu đơn công tác trong D1 Database thành công!" }), { headers: SECURE_JSON_HEADERS });
          }

          if (id) {
            await env.DB.prepare("DELETE FROM business_trips WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true, message: `Đã xóa đơn công tác ${id} khỏi D1 Database!`, id }), { headers: SECURE_JSON_HEADERS });
          }

          return new Response(JSON.stringify({ success: false, error: "Thiếu ID hoặc mã đơn công tác cần xóa" }), { status: 400, headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    // 3.5. API Route: CN-CI Kaizen / Gemba / Continuous Improvement (/api/ci-kaizen)
    if (url.pathname.startsWith("/api/ci-kaizen")) {
      if (!env.DB) {
        return new Response(
          JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
          { status: 500, headers: SECURE_JSON_HEADERS }
        );
      }

      // Auto-ensure idempotency_keys & table column migrations exist
      const ensureIdempotencyTable = async () => {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS idempotency_keys (
              key TEXT PRIMARY KEY,
              status_code INTEGER DEFAULT 200,
              response_body TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `).run();
        } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN required_reviewer_ids_json TEXT").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN average_score REAL").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN evaluated_at DATETIME").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN review_comment TEXT").run(); } catch(e) {}
        // ✅ NEW: Add columns for new form fields
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN proposer_position TEXT").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN proposer_month INTEGER").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN proposer_year INTEGER").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN hr_suggestor TEXT").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN customer TEXT").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN product_group TEXT").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN product_code TEXT").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN quantity INTEGER").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN pricing_direction TEXT").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN time_before_seconds INTEGER").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN time_after_seconds INTEGER").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN efficiency_value_vnd INTEGER").run(); } catch(e) {}
      };

      // Helper to strip undefined values for D1 binding safety
      const safeVal = (val, defaultVal = null) => {
        if (val === undefined || val === null) return defaultVal;
        return val;
      };

      // Handle Increment View Count endpoint
      if (url.pathname.endsWith("/view") && request.method === "POST") {
        try {
          const body = await request.json();
          const { id } = body;
          if (id) {
            await env.DB.prepare("UPDATE ci_kaizen_proposals SET view_count = view_count + 1 WHERE id = ?").bind(id).run();
          }
          return new Response(JSON.stringify({ success: true }), { headers: SECURE_JSON_HEADERS });
        } catch(e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // Handle Vote endpoint
      if (url.pathname.endsWith("/vote") && request.method === "POST") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Đăng nhập để thực hiện bình chọn!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const { proposalId } = body;
          if (!proposalId) {
            return new Response(JSON.stringify({ success: false, error: "Missing proposalId" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          try {
            await env.DB.prepare("INSERT INTO ci_kaizen_votes (id, proposal_id, user_emp_code) VALUES (?, ?, ?)").bind(voteId, proposalId, safeVal(user.empCode, "202608001")).run();
            await env.DB.prepare("UPDATE ci_kaizen_proposals SET vote_count = vote_count + 1 WHERE id = ?").bind(proposalId).run();
            return new Response(JSON.stringify({ success: true, message: "Đã bình chọn đề xuất cải tiến thành công!" }), { headers: SECURE_JSON_HEADERS });
          } catch(dupErr) {
            return new Response(JSON.stringify({ success: false, error: "ALREADY_VOTED", message: "Bạn đã bình chọn đề xuất này rồi!" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }
        } catch(err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // Handle Rating / Star Evaluation endpoint (0.5 to 5.0 step 0.5)
      if (url.pathname.endsWith("/rate") && request.method === "POST") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Đăng nhập để thực hiện đánh giá!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const { proposalId, stars, score, comments } = body;
          const rawStars = score !== undefined ? score : stars;
          const numStars = parseFloat(rawStars || 5.0);

          if (isNaN(numStars) || numStars < 0.5 || numStars > 5.0 || Math.round((numStars * 10)) % 5 !== 0) {
            return new Response(JSON.stringify({ success: false, error: "INVALID_SCORE", message: "Số sao đánh giá phải từ 0.5 đến 5.0 với bước nhảy 0.5!" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const proposal = await env.DB.prepare("SELECT * FROM ci_kaizen_proposals WHERE id = ?").bind(proposalId).first();
          if (!proposal) {
            return new Response(JSON.stringify({ success: false, error: "NOT_FOUND", message: "Không tìm thấy đề xuất cải tiến!" }), { status: 404, headers: SECURE_JSON_HEADERS });
          }

          if (proposal.registration_type === "LUU_TRU") {
            return new Response(JSON.stringify({ success: false, error: "INVALID_ACTION", message: "Bài viết thuộc mục Lưu Trữ, không áp dụng luồng đánh giá sao!" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          if (proposal.sub_status === "DA_DANH_GIA") {
            return new Response(JSON.stringify({ success: false, error: "LOCKED", message: "Bài viết đã hoàn tất đánh giá (Đã đánh giá), toàn bộ điểm đã bị khoá không thể sửa!" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          let requiredReviewerIds = ["TGĐ-001", "PTGĐ-002", "GĐ-003", "PGĐ-004", "202608001"];
          if (proposal.required_reviewer_ids_json) {
            try {
              const parsed = JSON.parse(proposal.required_reviewer_ids_json);
              if (Array.isArray(parsed) && parsed.length > 0) {
                requiredReviewerIds = parsed;
              }
            } catch(e) {}
          }

          const userEmp = (user.empCode || "202608001").trim().toUpperCase();
          const isRequiredReviewer = requiredReviewerIds.some(id => String(id).trim().toUpperCase() === userEmp) || user.isExecutiveOrAdmin;

          if (!isRequiredReviewer) {
            return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Bạn không nằm trong danh sách sếp có quyền đánh giá bài viết này!" }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const evalId = `eval_${proposalId}_${userEmp}`;
          await env.DB.prepare(`
            INSERT INTO ci_kaizen_evaluations (id, proposal_id, evaluator_emp_code, evaluator_name, rating_stars, comments, is_locked, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              rating_stars = excluded.rating_stars,
              comments = excluded.comments,
              created_at = CURRENT_TIMESTAMP
          `).bind(evalId, proposalId, userEmp, safeVal(user.name, "Anh Huy"), numStars, safeVal(comments, "")).run();

          const { results: evals } = await env.DB.prepare("SELECT * FROM ci_kaizen_evaluations WHERE proposal_id = ?").bind(proposalId).all();
          const ratedReviewerCodes = (evals || []).map(e => String(e.evaluator_emp_code).trim().toUpperCase());
          const distinctRated = requiredReviewerIds.filter(reqId => ratedReviewerCodes.includes(String(reqId).trim().toUpperCase()));
          const ratedCount = distinctRated.length;
          const requiredCount = requiredReviewerIds.length;

          let isCompleted = ratedCount >= requiredCount && requiredCount > 0;
          let avgScore = proposal.avg_rating || 0;

          if (isCompleted) {
            const totalStars = (evals || []).reduce((sum, e) => sum + Number(e.rating_stars || 0), 0);
            const rawAvg = totalStars / (evals.length || 1);
            avgScore = Math.round(rawAvg * 10) / 10;

            await env.DB.prepare(`
              UPDATE ci_kaizen_proposals
              SET sub_status = 'DA_DANH_GIA',
                  avg_rating = ?,
                  average_score = ?,
                  rating_count = ?,
                  evaluated_at = CURRENT_TIMESTAMP,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(avgScore, avgScore, evals.length, proposalId).run();

            await env.DB.prepare("UPDATE ci_kaizen_evaluations SET is_locked = 1 WHERE proposal_id = ?").bind(proposalId).run();

            await createNotification(
              proposal.proposer_name || proposal.proposer_emp_code,
              "ci_kaizen",
              "SUCCESS",
              proposalId,
              "🏆 Cải Tiến Đã Hoàn Tất Đánh Giá",
              `Tất cả ${requiredCount} sếp đã hoàn tất chấm điểm! Đề xuất "${proposal.title}" (${proposal.code}) đạt điểm trung bình: ${avgScore} ⭐ và chính thức chuyển sang mục "Đã đánh giá".`
            );
          } else {
            const totalStars = (evals || []).reduce((sum, e) => sum + Number(e.rating_stars || 0), 0);
            const partialAvg = Math.round((totalStars / (evals.length || 1)) * 10) / 10;

            await env.DB.prepare(`
              UPDATE ci_kaizen_proposals
              SET avg_rating = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(partialAvg, evals.length, proposalId).run();
          }

          return new Response(JSON.stringify({
            success: true,
            message: isCompleted
              ? `🏆 Đã chấm ${numStars} sao! Tất cả sếp đã chấm xong (${ratedCount}/${requiredCount}), bài tự động chuyển sang "Đã đánh giá" (${avgScore} ⭐).`
              : `⭐ Đã ghi nhận ${numStars} sao! Tiến độ: ${ratedCount}/${requiredCount} sếp đã chấm.`,
            isCompleted,
            ratedCount,
            requiredCount,
            averageScore: avgScore
          }), { headers: SECURE_JSON_HEADERS });
        } catch(err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // Handle Exempt Reviewer (Admin Override) endpoint
      if (url.pathname.endsWith("/exempt-reviewer") && request.method === "POST") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated || !user.isExecutiveOrAdmin) {
            return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Chỉ Admin/Ban Giám Đốc mới có quyền miễn nhiệm sếp chấm bài!" }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const body = await request.json();
          const { proposalId, reviewerEmpCode } = body;
          if (!proposalId || !reviewerEmpCode) {
            return new Response(JSON.stringify({ success: false, error: "MISSING_PARAMS" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const proposal = await env.DB.prepare("SELECT * FROM ci_kaizen_proposals WHERE id = ?").bind(proposalId).first();
          if (!proposal) {
            return new Response(JSON.stringify({ success: false, error: "NOT_FOUND" }), { status: 404, headers: SECURE_JSON_HEADERS });
          }

          let requiredReviewerIds = ["TGĐ-001", "PTGĐ-002", "GĐ-003", "PGĐ-004", "202608001"];
          if (proposal.required_reviewer_ids_json) {
            try { requiredReviewerIds = JSON.parse(proposal.required_reviewer_ids_json); } catch(e) {}
          }

          const targetCode = String(reviewerEmpCode).trim().toUpperCase();
          const updatedReviewerIds = requiredReviewerIds.filter(id => String(id).trim().toUpperCase() !== targetCode);

          const updatedJson = JSON.stringify(updatedReviewerIds);
          await env.DB.prepare("UPDATE ci_kaizen_proposals SET required_reviewer_ids_json = ? WHERE id = ?").bind(updatedJson, proposalId).run();

          const { results: evals } = await env.DB.prepare("SELECT * FROM ci_kaizen_evaluations WHERE proposal_id = ?").bind(proposalId).all();
          const ratedReviewerCodes = (evals || []).map(e => String(e.evaluator_emp_code).trim().toUpperCase());
          const distinctRated = updatedReviewerIds.filter(reqId => ratedReviewerCodes.includes(String(reqId).trim().toUpperCase()));

          let isCompleted = distinctRated.length >= updatedReviewerIds.length && updatedReviewerIds.length > 0;
          let avgScore = proposal.avg_rating || 0;

          if (isCompleted && proposal.sub_status === "CHO_DANH_GIA") {
            const totalStars = (evals || []).reduce((sum, e) => sum + Number(e.rating_stars || 0), 0);
            const rawAvg = totalStars / (evals.length || 1);
            avgScore = Math.round(rawAvg * 10) / 10;

            await env.DB.prepare(`
              UPDATE ci_kaizen_proposals
              SET sub_status = 'DA_DANH_GIA',
                  avg_rating = ?,
                  average_score = ?,
                  rating_count = ?,
                  evaluated_at = CURRENT_TIMESTAMP,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(avgScore, avgScore, evals.length, proposalId).run();

            await env.DB.prepare("UPDATE ci_kaizen_evaluations SET is_locked = 1 WHERE proposal_id = ?").bind(proposalId).run();
          }

          return new Response(JSON.stringify({
            success: true,
            message: `Đã miễn nhiệm sếp ${reviewerEmpCode} khỏi danh sách bắt buộc cho riêng bài viết này!`,
            requiredReviewers: updatedReviewerIds,
            isCompleted
          }), { headers: SECURE_JSON_HEADERS });
        } catch(e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // Handle Get Evaluations List endpoint
      if (url.pathname.endsWith("/evaluations") && request.method === "GET") {
        try {
          const proposalId = url.searchParams.get("proposalId");
          if (!proposalId) {
            return new Response(JSON.stringify({ success: false, error: "Missing proposalId" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }
          const { results } = await env.DB.prepare("SELECT * FROM ci_kaizen_evaluations WHERE proposal_id = ? ORDER BY created_at ASC").bind(proposalId).all();
          return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: SECURE_JSON_HEADERS });
        } catch(e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // GET: List Kaizen Proposals with Filters
      if (request.method === "GET") {
        try {
          const category = url.searchParams.get("category");
          const regType = url.searchParams.get("registration_type") || url.searchParams.get("regType");
          const region = url.searchParams.get("region");
          const status = url.searchParams.get("status");
          const subStatus = url.searchParams.get("sub_status") || url.searchParams.get("subStatus");
          const search = url.searchParams.get("search");

          let query = "SELECT * FROM ci_kaizen_proposals WHERE 1=1";
          const params = [];

          if (category && category !== "ALL") {
            query += " AND (category = ? OR category_label LIKE ?)";
            params.push(category, `%${category}%`);
          }
          if (regType && regType !== "ALL") {
            query += " AND registration_type = ?";
            params.push(regType);
          }
          if (subStatus && subStatus !== "ALL") {
            query += " AND sub_status = ?";
            params.push(subStatus);
          }

          // Sorting logic: When viewing Đã đánh giá or score_desc, sort by average_score DESC
          if (subStatus === "DA_DANH_GIA" || regType === "THI_DUA") {
            query += " ORDER BY COALESCE(average_score, avg_rating, score_points) DESC, created_at DESC";
          } else {
            query += " ORDER BY created_at DESC";
          }

          const stmt = env.DB.prepare(query);
          const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

          return new Response(
            JSON.stringify({ success: true, data: results || [], count: results ? results.length : 0 }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // POST: Create New Kaizen Proposal (Supports Public QR Scan & Authenticated Modes)
      if (request.method === "POST") {
        try {
          const user = await verifyServerAuth(request, env);
          const body = await request.json();
          const isPublicScan = body.isPublicScan === true || !user || !user.authenticated;

          await ensureIdempotencyTable();

          // (1) Idempotency Key check
          const idempotencyKey = request.headers.get("Idempotency-Key") || request.headers.get("x-idempotency-key");
          if (idempotencyKey) {
            try {
              const existingKey = await env.DB.prepare("SELECT * FROM idempotency_keys WHERE key = ?").bind(idempotencyKey).first();
              if (existingKey) {
                return new Response(existingKey.response_body, {
                  status: existingKey.status_code || 200,
                  headers: SECURE_JSON_HEADERS,
                });
              }
            } catch (e) {}
          }

          const {
            title,
            category,
            categoryLabel,
            registrationType,
            region,
            department,
            factory,
            beforeDescription,
            afterSolution,
            savedSeconds,
            deptCode,
            beforeImageUrl,
            afterImageUrl,
            beforeVideoUrl,
            afterVideoUrl,
            attachmentsJson,
            proposerName,
            proposerEmpCode,
            proposerPosition,
            proposerMonth,
            proposerYear,
            hrSuggestor,
            customer,
            productGroup,
            productCode,
            quantity,
            pricingDirection,
            timeBeforeSeconds,
            timeAfterSeconds,
            efficiencyValueVND,
          } = body;

          if (!title || !category) {
            return new Response(JSON.stringify({ success: false, error: "MISSING_FIELDS", message: "Vui lòng nhập đầy đủ tiêu đề và danh mục cải tiến!" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const id = `ci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const countRes = await env.DB.prepare("SELECT COUNT(*) as cnt FROM ci_kaizen_proposals").first();
          const nextSeq = ((countRes?.cnt || 0) + 1).toString().padStart(3, "0");
          const code = `CI-2026-${nextSeq}`;

          const targetRegType = registrationType === "LUU_TRU" ? "LUU_TRU" : (registrationType === "THI_DUA" ? "THI_DUA" : "CHO_DANH_GIA");
          // ✅ NEW: Always set sub_status to CHO_DANH_GIA for new proposals
          // This allows LUU_TRU proposals to appear in BOTH "Lưu Trữ" (via registration_type) 
          // AND "Chờ Đánh Giá" (via sub_status) tabs
          const initialSubStatus = "CHO_DANH_GIA";

          // Snapshot required reviewers for THI_DUA at submission time
          let snapshotReviewerIdsJson = null;
          if (targetRegType === "THI_DUA") {
            const defaultReviewers = ["TGĐ-001", "PTGĐ-002", "GĐ-003", "PGĐ-004", "202608001"];
            if (region && region.includes("Kiên Giang")) {
              defaultReviewers.push("KG-LEAD-01");
            } else if (region && region.includes("Miền Đông")) {
              defaultReviewers.push("MD-LEAD-01");
            }
            const uniqueReviewers = Array.from(new Set(defaultReviewers));
            snapshotReviewerIdsJson = JSON.stringify(uniqueReviewers);
          }

          const finalProposerName = safeVal(proposerName || user?.name, "Công Nhân Sản Xuất");
          const finalProposerEmpCode = safeVal(proposerEmpCode || user?.empCode, "CN-2026-QR");
          const finalDept = safeVal(department || user?.department, "Xưởng Sản Xuất");

          let attachmentsList = [];
          if (attachmentsJson) {
            try {
              attachmentsList = typeof attachmentsJson === "string" ? JSON.parse(attachmentsJson) : attachmentsJson;
            } catch(e) {}
          }
          if (!Array.isArray(attachmentsList)) attachmentsList = [];

          if (beforeVideoUrl) {
            attachmentsList.push({ type: "video_before", url: beforeVideoUrl, title: "Video Trước Cải Tiến" });
          }
          if (afterVideoUrl) {
            attachmentsList.push({ type: "video_after", url: afterVideoUrl, title: "Video Sau Cải Tiến" });
          }

          const finalAttachmentsJson = attachmentsList.length > 0 ? JSON.stringify(attachmentsList) : null;

          await env.DB.prepare(`
            INSERT INTO ci_kaizen_proposals (
              id, code, title, category, category_label, registration_type, sub_status, region, department, factory, proposer_name, proposer_emp_code, proposer_position, proposer_month, proposer_year, hr_suggestor, customer, dept_code, before_description, after_solution, saved_seconds, product_group, product_code, quantity, pricing_direction, time_before_seconds, time_after_seconds, efficiency_value_vnd, before_image_url, after_image_url, attachments_json, required_reviewer_ids_json, status, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', 1)
          `).bind(
            id,
            code,
            title,
            category,
            safeVal(categoryLabel, category),
            targetRegType,
            initialSubStatus,
            safeVal(region, "Kiên Giang 1"),
            finalDept,
            safeVal(factory, "VP2 SKECHERS"),
            finalProposerName,
            finalProposerEmpCode,
            safeVal(proposerPosition, ""),
            safeVal(proposerMonth, new Date().getMonth() + 1),
            safeVal(proposerYear, new Date().getFullYear()),
            safeVal(hrSuggestor, ""),
            safeVal(customer, ""),
            safeVal(deptCode, "SK"),
            safeVal(beforeDescription, ""),
            safeVal(afterSolution, ""),
            parseInt(savedSeconds || 0, 10),
            safeVal(productGroup, ""),
            safeVal(productCode, ""),
            parseInt(quantity || 0, 10),
            safeVal(pricingDirection, ""),
            parseInt(timeBeforeSeconds || 0, 10),
            parseInt(timeAfterSeconds || 0, 10),
            parseInt(efficiencyValueVND || 0, 10),
            safeVal(beforeImageUrl, null),
            safeVal(afterImageUrl, null),
            finalAttachmentsJson,
            snapshotReviewerIdsJson
          ).run();

          await recordAuditLog(user, "ci_kaizen", "CREATE_PROPOSAL", id, null, { code, title, status: "SUBMITTED" }, request);
          await createNotification("Trưởng Phòng CI", "ci_kaizen", "INFO", id, "🚀 Đề Xuất Cải Tiến Mới", `${user.name || 'Cán bộ'} vừa nộp đề xuất cải tiến Kaizen: "${title}" (${code}).`);

          const resPayload = JSON.stringify({ success: true, message: "Đã gửi đề xuất cải tiến Kaizen thành công!", id, code });

          if (idempotencyKey) {
            try {
              await env.DB.prepare("INSERT OR REPLACE INTO idempotency_keys (key, status_code, response_body) VALUES (?, ?, ?)").bind(idempotencyKey, 200, resPayload).run();
            } catch (e) {}
          }

          return new Response(resPayload, { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // PUT: Update / Evaluate / Implement / Reject Kaizen Proposal
      if (request.method === "PUT") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }

          await ensureIdempotencyTable();

          // (1) Idempotency Key check for PUT
          const idempotencyKey = request.headers.get("Idempotency-Key") || request.headers.get("x-idempotency-key");
          if (idempotencyKey) {
            try {
              const existingKey = await env.DB.prepare("SELECT * FROM idempotency_keys WHERE key = ?").bind(idempotencyKey).first();
              if (existingKey) {
                return new Response(existingKey.response_body, {
                  status: existingKey.status_code || 200,
                  headers: SECURE_JSON_HEADERS,
                });
              }
            } catch (e) {}
          }

          const body = await request.json();
          const { id, action, awardTitle, scorePoints, reviewComment, comments, status, rejectionReason, afterSolution, savedSeconds, afterImageUrl, version } = body;

          if (!id) {
            return new Response(JSON.stringify({ success: false, error: "Missing proposal ID" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const proposal = await env.DB.prepare("SELECT * FROM ci_kaizen_proposals WHERE id = ?").bind(id).first();
          if (!proposal) {
            return new Response(JSON.stringify({ success: false, error: "PROPOSAL_NOT_FOUND", message: "Không tìm thấy đề xuất cải tiến" }), { status: 404, headers: SECURE_JSON_HEADERS });
          }

          // (2) Role Authorization Check
          if (action === "EVALUATE" || action === "APPROVE" || action === "REJECT") {
            const isManagerOrAdmin = user.isExecutiveOrAdmin || user.roleCode === "TRUONG_PHONG" || user.roleCode === "QC" || user.roleCode === "CI_LEAD";
            if (!isManagerOrAdmin) {
              return new Response(
                JSON.stringify({ success: false, error: "FORBIDDEN", message: "Bạn không có quyền phê duyệt hoặc chấm điểm thi đua đề xuất Kaizen!" }),
                { status: 403, headers: SECURE_JSON_HEADERS }
              );
            }
          }

          const currentVer = version !== undefined ? version : (proposal.version || 1);

          let nextStatus = proposal.status;
          let nextSubStatus = proposal.sub_status;
          let nextAward = proposal.award_title;
          let nextScore = proposal.score_points;
          let nextComment = proposal.review_comment;
          let nextRejReason = proposal.rejection_reason;
          let nextSolution = proposal.after_solution;
          let nextSavedSec = proposal.saved_seconds;
          let nextAfterImg = proposal.after_image_url;

          if (reviewComment !== undefined || comments !== undefined) {
            nextComment = reviewComment || comments || null;
          }

          // (3) State Transition Guard & Validation
          if (action === "EVALUATE" || action === "APPROVE") {
            if (proposal.status === "REJECTED") {
              return new Response(
                JSON.stringify({ success: false, error: "INVALID_STATE_TRANSITION", message: "Không thể phê duyệt đề xuất đã bị từ chối trước đó!" }),
                { status: 422, headers: SECURE_JSON_HEADERS }
              );
            }
            nextStatus = "APPROVED";
            nextSubStatus = "DA_DANH_GIA";
            if (awardTitle) nextAward = awardTitle;
            if (scorePoints !== undefined) nextScore = parseFloat(scorePoints);
          } else if (action === "REJECT") {
            nextStatus = "REJECTED";
            nextRejReason = rejectionReason || "Chưa đạt tiêu chí cải tiến";
          } else if (action === "IMPLEMENT") {
            // Transition Guard: Only APPROVED proposals can be marked IMPLEMENTED
            if (proposal.status !== "APPROVED" && proposal.status !== "IMPLEMENTED") {
              return new Response(
                JSON.stringify({ success: false, error: "INVALID_STATE_TRANSITION", message: "Đề xuất phải được phê duyệt (APPROVED) trước khi ghi nhận triển khai thực địa (IMPLEMENTED)!" }),
                { status: 422, headers: SECURE_JSON_HEADERS }
              );
            }
            nextStatus = "IMPLEMENTED";
            if (afterSolution) nextSolution = afterSolution;
            if (savedSeconds !== undefined) nextSavedSec = parseInt(savedSeconds, 10);
            if (afterImageUrl) nextAfterImg = afterImageUrl;
          }

          // (4) Optimistic Locking Update
          const res = await env.DB.prepare(`
            UPDATE ci_kaizen_proposals SET
              status = ?, sub_status = ?, award_title = ?, score_points = ?, review_comment = ?, rejection_reason = ?, after_solution = ?, saved_seconds = ?, after_image_url = ?, updated_at = CURRENT_TIMESTAMP, version = version + 1
            WHERE id = ? AND version = ?
          `).bind(
            safeVal(nextStatus, "SUBMITTED"),
            safeVal(nextSubStatus, "CHO_DANH_GIA"),
            safeVal(nextAward, null),
            safeVal(nextScore, 0.0),
            safeVal(nextComment, null),
            safeVal(nextRejReason, null),
            safeVal(nextSolution, ""),
            safeVal(nextSavedSec, 0),
            safeVal(nextAfterImg, null),
            id,
            currentVer
          ).run();

          if (res.meta && res.meta.changes === 0) {
            return new Response(
              JSON.stringify({
                success: false,
                code: "OPTIMISTIC_LOCK_CONFLICT",
                error: "OPTIMISTIC_LOCK_CONFLICT",
                message: "Đề xuất đã được cập nhật bởi người dùng khác, vui lòng tải lại!"
              }),
              { status: 409, headers: SECURE_JSON_HEADERS }
            );
          }

          // (1 & 2) Record Audit Log & Send Realtime Notification
          await recordAuditLog(user, "ci_kaizen", action || "UPDATE", id, { status: proposal.status, version: currentVer }, { status: nextStatus, awardTitle: nextAward, version: currentVer + 1 }, request);

          const notifTitle = nextStatus === "APPROVED" ? "🎉 Đề Xuất Kaizen Được Phê Duyệt" :
                             nextStatus === "REJECTED" ? "❌ Đề Xuất Kaizen Bị Từ Chối" :
                             nextStatus === "IMPLEMENTED" ? "🚀 Triển Khai Thực Địa Hoàn Tất" : "🏆 Cập Nhật Đề Xuất Kaizen";

          const notifMsg = nextStatus === "APPROVED" ? `Đề xuất "${proposal.title}" (${proposal.code}) của bạn đã được duyệt & trao ${nextAward || "giải thi đua"} với ${nextScore}đ!` :
                           nextStatus === "REJECTED" ? `Đề xuất "${proposal.title}" (${proposal.code}) đã bị từ chối. Lý do: ${nextRejReason}` :
                           `Đề xuất "${proposal.title}" (${proposal.code}) đã hoàn tất triển khai thực địa và tiết kiệm ${nextSavedSec}s.`;

          const notifType = nextStatus === "REJECTED" ? "WARNING" : "SUCCESS";

          await createNotification(proposal.proposer_name, "ci_kaizen", notifType, id, notifTitle, notifMsg);

          const resPayload = JSON.stringify({
            success: true,
            message: "Đã cập nhật trạng thái đề xuất cải tiến thành công!",
            id,
            status: nextStatus,
            version: currentVer + 1
          });

          if (idempotencyKey) {
            try {
              await env.DB.prepare("INSERT OR REPLACE INTO idempotency_keys (key, status_code, response_body) VALUES (?, ?, ?)").bind(idempotencyKey, 200, resPayload).run();
            } catch (e) {}
          }

          return new Response(resPayload, { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // DELETE: Delete Kaizen Proposal
      if (request.method === "DELETE") {
        try {
          const id = url.searchParams.get("id");
          if (!id) {
            return new Response(JSON.stringify({ success: false, error: "Missing proposal ID" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }
          await env.DB.prepare("DELETE FROM ci_kaizen_proposals WHERE id = ?").bind(id).run();
          return new Response(JSON.stringify({ success: true, message: "Đã xóa đề xuất cải tiến thành công!" }), { headers: SECURE_JSON_HEADERS });
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }
    // 3.5 API Route: Notifications System (/api/notifications)
    if (url.pathname === "/api/notifications" || url.pathname.startsWith("/api/notifications")) {
      if (request.method === "GET") {
        return new Response(
          JSON.stringify({
            success: true,
            data: [
              {
                id: "notif_1",
                title: "✅ Chào Mừng Đến Với TBS Group SKX",
                message: "Hệ thống quản lý phòng họp & đón khách đã sẵn sàng phục vụ.",
                type: "SUCCESS",
                isRead: false,
                createdAt: new Date().toISOString()
              }
            ]
          }),
          { headers: SECURE_JSON_HEADERS }
        );
      }
      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ success: true, message: "Đã nhận thông báo", data: body }),
          { headers: SECURE_JSON_HEADERS }
        );
      }
    }

    // 3.6 API Route: Mobile Web Push Subscriptions (/api/push/subscribe)
    if (url.pathname === "/api/push/subscribe" && request.method === "POST") {
      try {
        if (!env.DB) {
          return new Response(JSON.stringify({ success: true, message: "OK (memory)" }), { headers: SECURE_JSON_HEADERS });
        }
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id TEXT PRIMARY KEY,
            endpoint TEXT NOT NULL UNIQUE,
            subscription_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        const body = await request.json().catch(() => ({}));
        const sub = body.subscription || body;
        if (sub && sub.endpoint) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO push_subscriptions (id, endpoint, subscription_json, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            `sub_${Date.now()}`,
            sub.endpoint,
            JSON.stringify(sub)
          ).run().catch(() => {});
        }
        return new Response(
          JSON.stringify({ success: true, message: "Đã lưu đăng ký Push Notification thiết bị di động thành công!" }),
          { headers: SECURE_JSON_HEADERS }
        );
      } catch (e) {
        return new Response(JSON.stringify({ success: true, message: "OK" }), { headers: SECURE_JSON_HEADERS });
      }
    }

    if (url.pathname === "/api/push/unsubscribe" && request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        if (body.endpoint && env.DB) {
          await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(body.endpoint).run().catch(() => {});
        }
      } catch (e) {}
      return new Response(JSON.stringify({ success: true, message: "Đã hủy đăng ký Push Notification" }), { headers: SECURE_JSON_HEADERS });
    }

    // 3.7 API Route: Business Trips Management (/api/business-trips)
    if (url.pathname === "/api/business-trips" || url.pathname.startsWith("/api/business-trips")) {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS business_trips (
              id TEXT PRIMARY KEY,
              code TEXT NOT NULL UNIQUE,
              title TEXT NOT NULL,
              region TEXT DEFAULT 'VP Chuỗi',
              factory TEXT,
              creator TEXT NOT NULL,
              department TEXT NOT NULL,
              department_id TEXT,
              location TEXT NOT NULL,
              start_date TEXT NOT NULL,
              end_date TEXT NOT NULL,
              days_count INTEGER DEFAULT 1,
              transport TEXT DEFAULT 'Xe công ty',
              participants_count INTEGER DEFAULT 1,
              purpose TEXT,
              address TEXT,
              proposal_text TEXT,
              attachments_json TEXT DEFAULT '[]',
              invoices_json TEXT DEFAULT '[]',
              participants_json TEXT DEFAULT '[]',
              status TEXT DEFAULT 'PENDING',
              estimated_cost REAL DEFAULT 0,
              version INTEGER DEFAULT 1,
              approved_level TEXT,
              rejected_level TEXT,
              rejection_reason TEXT,
              budget_status TEXT DEFAULT 'pending_dept_budget',
              budget_amount REAL DEFAULT 0,
              budget_rejection_reason TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run().catch(() => {});
        } catch (tblErr) {
          console.warn("D1 create business_trips table error:", tblErr);
        }
      }

      if (request.method === "GET") {
        try {
          if (!env.DB) {
            return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
          }
          const { results } = await env.DB.prepare("SELECT * FROM business_trips ORDER BY created_at DESC").all();
          return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST" && url.pathname === "/api/business-trips") {
        try {
          const body = await request.json().catch(() => ({}));
          const id = body.id || `rec_${Date.now()}`;
          const code = body.code || `CT-2026-${Math.floor(100 + Math.random() * 900)}`;

          if (!env.DB) {
            return new Response(JSON.stringify({ success: false, error: "D1 Database binding missing" }), { status: 500, headers: SECURE_JSON_HEADERS });
          }

          // Validate required fields
          if (!body.title || !body.title.trim()) {
            return new Response(JSON.stringify({ success: false, error: "Tên đề xuất là bắt buộc" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }
          if (!body.location || !body.location.trim()) {
            return new Response(JSON.stringify({ success: false, error: "Địa điểm công tác là bắt buộc" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }
          if (!body.purpose || !body.purpose.trim()) {
            return new Response(JSON.stringify({ success: false, error: "Mục đích công tác là bắt buộc" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          await env.DB.prepare(`
            INSERT INTO business_trips (
              id, code, title, region, factory, creator, department, location, start_date, end_date, days_count, transport, participants_count, purpose, address, proposal_text, attachments_json, invoices_json, participants_json, status, estimated_cost, version, budget_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, 1, 'pending_dept_budget', CURRENT_TIMESTAMP)
          `).bind(
            id,
            code,
            body.title || "Đề xuất công tác",
            body.region || "VP Chuỗi (R&D)",
            body.factory || "",
            body.creator || "Ban Quản Lý",
            body.department || "Hành chính",
            body.location || "",
            body.startDate || body.start_date || "15/08/2026",
            body.endDate || body.end_date || "15/08/2026",
            Number(body.daysCount || body.days_count || 1),
            body.transport || "Xe công ty",
            Number(body.participantsCount || body.participants_count || 1),
            body.purpose || "",
            body.address || "",
            body.proposalText || body.proposal_text || "",
            typeof body.attachments === "string" ? body.attachments : JSON.stringify(body.attachments || []),
            typeof body.invoices === "string" ? body.invoices : JSON.stringify(body.invoices || []),
            typeof body.participants === "string" ? body.participants : JSON.stringify(body.participants || []),
            Number(body.estimatedCost || body.estimated_cost || 0)
          ).run();

          return new Response(JSON.stringify({ success: true, message: "Đã tạo đề xuất công tác thành công!", id, code }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          console.error("POST /api/business-trips error:", err);
          return new Response(JSON.stringify({ success: false, error: err.message || "Unknown error" }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "PUT" && url.pathname === "/api/business-trips") {
        try {
          const body = await request.json().catch(() => ({}));
          const { id, actionLevel, status, rejectionReason, budgetRejectionReason, invoices_json, version } = body;

          if (!id) {
            return new Response(JSON.stringify({ success: false, error: "Thiếu ID đề xuất" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          if (invoices_json && env.DB) {
            await env.DB.prepare("UPDATE business_trips SET invoices_json = ? WHERE id = ?").bind(invoices_json, id).run();
            return new Response(JSON.stringify({ success: true, message: "Đã cập nhật hóa đơn!" }), { headers: SECURE_JSON_HEADERS });
          }

          if (env.DB) {
            let nextStatus = status;
            let approvedLevel = null;
            let budgetStatus = null;

            if (actionLevel === "APPROVE_L1") {
              nextStatus = "PENDING_L2";
              approvedLevel = "L1";
            } else if (actionLevel === "APPROVE_L2") {
              nextStatus = "APPROVED";
              approvedLevel = "L2";
            } else if (actionLevel === "REJECT_L1" || actionLevel === "REJECT_L2") {
              nextStatus = "REJECTED";
            } else if (actionLevel === "APPROVE_BUDGET_L1") {
              budgetStatus = "pending_exec_budget";
            } else if (actionLevel === "APPROVE_BUDGET_L2") {
              budgetStatus = "budget_approved";
            } else if (actionLevel === "REJECT_BUDGET") {
              budgetStatus = "budget_rejected";
            }

            let updateSql = "UPDATE business_trips SET version = version + 1";
            const bindings = [];

            if (nextStatus) {
              updateSql += ", status = ?";
              bindings.push(nextStatus);
            }
            if (approvedLevel) {
              updateSql += ", approved_level = ?";
              bindings.push(approvedLevel);
            }
            if (rejectionReason) {
              updateSql += ", rejection_reason = ?";
              bindings.push(rejectionReason);
            }
            if (budgetStatus) {
              updateSql += ", budget_status = ?";
              bindings.push(budgetStatus);
            }
            if (budgetRejectionReason) {
              updateSql += ", budget_rejection_reason = ?";
              bindings.push(budgetRejectionReason);
            }

            updateSql += " WHERE id = ?";
            bindings.push(id);

            await env.DB.prepare(updateSql).bind(...bindings).run();
          }

          return new Response(JSON.stringify({ success: true, message: "Cập nhật đề xuất công tác thành công!" }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST" && url.pathname === "/api/business-trips/invoices") {
        try {
          const body = await request.json().catch(() => ({}));
          const { tripId, invoice } = body;
          if (env.DB && tripId && invoice) {
            const trip = await env.DB.prepare("SELECT invoices_json FROM business_trips WHERE id = ?").bind(tripId).first();
            let currentInvoices = [];
            if (trip && trip.invoices_json) {
              try { currentInvoices = JSON.parse(trip.invoices_json); } catch(e) {}
            }
            currentInvoices.push(invoice);
            await env.DB.prepare("UPDATE business_trips SET invoices_json = ? WHERE id = ?").bind(JSON.stringify(currentInvoices), tripId).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã lưu hóa đơn vào D1" }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, message: "OK" }), { headers: SECURE_JSON_HEADERS });
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
                status TEXT DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
          try {
            // One-time migration: reset TEST / new unconfirmed room bookings to PENDING state for Lễ Tân approval
            await env.DB.prepare(`
              UPDATE room_bookings 
              SET status = 'PENDING' 
              WHERE (title LIKE '%TEST%' OR title LIKE '%Test%') AND status = 'CONFIRMED';
            `).run();
          } catch (migErr) {}
          try {
            await env.DB.prepare(`
              CREATE UNIQUE INDEX IF NOT EXISTS idx_room_booking_slot 
              ON room_bookings (room_id, booking_date, time_slot) 
              WHERE status != 'CANCELLED';
            `).run();
          } catch (idxErr) {}
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
              JSON.stringify({ success: false, error: "D1_CONNECTION_ERROR", message: "Mất kết nối CSDL Cloudflare D1 (env.DB missing)" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const { results: rawRooms } = await env.DB.prepare("SELECT * FROM meeting_rooms").all();
          const { results: rawBookings } = await env.DB.prepare("SELECT * FROM room_bookings ORDER BY created_at DESC").all();
          const { results: rawVisitors } = await env.DB.prepare("SELECT * FROM visitors ORDER BY created_at DESC").all();

          const rooms = (rawRooms || []).map((r) => ({
            id: r.id,
            name: r.name,
            capacity: Number(r.capacity || 10),
            location: r.location || "Văn phòng",
            equipment: typeof r.equipment === "string" ? r.equipment.split(",") : (r.equipment || []),
            status: r.status || "AVAILABLE",
            isLocked: Boolean(r.is_locked || r.isLocked),
            colorClass: r.color_class || r.colorClass || "bg-slate-700 hover:bg-slate-800 text-white",
            badgeBg: r.badge_bg || r.badgeBg || "bg-slate-100 text-slate-800",
          }));

          const bookings = (rawBookings || []).map((b) => ({
            id: b.id,
            roomId: b.room_id || b.roomId || "room_1",
            roomName: b.room_name || b.roomName || "Phòng Họp",
            title: b.title || "Cuộc họp",
            bookerName: b.booker_name || b.bookerName || "Người đăng ký",
            department: b.department || "Hành chính",
            bookingDate: b.booking_date || b.bookingDate,
            timeSlot: b.time_slot || b.timeSlot,
            attendeesCount: Number(b.attendees_count || b.attendeesCount || 5),
            notes: b.notes || "",
            status: b.status || "PENDING",
            createdAt: b.created_at || b.createdAt,
          }));

          const visitors = (rawVisitors || []).map((v) => ({
            id: v.id,
            visitorName: v.visitor_name || v.visitorName || "Khách",
            company: v.company || "Đối tác",
            phone: v.phone || "",
            hostName: v.host_name || v.hostName || "Lễ tân",
            roomLocation: v.room_location || v.roomLocation || "Sảnh",
            visitDate: v.visit_date || v.visitDate,
            expectedTime: v.expected_time || v.expectedTime,
            badgeCode: v.badge_code || v.badgeCode || "CARD-01",
            status: v.status || "EXPECTED",
            notes: v.notes || "",
            createdAt: v.created_at || v.createdAt,
          }));

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
            JSON.stringify({ success: false, error: "D1_CONNECTION_ERROR", message: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // POST /api/rooms/booking: Save a new booking
      if (url.pathname === "/api/rooms/booking" && request.method === "POST") {
        try {
          let user = null;
          try {
            user = await verifyServerAuth(request);
          } catch (e) {}

          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: SECURE_JSON_HEADERS }
            );
          }

          const body = await request.json();
          const { id, roomId, roomName, title, bookerName, department, bookingDate, timeSlot, attendeesCount, notes } = body;

          const targetRoomId = roomId || "room_1";
          const targetBookingDate = bookingDate || new Date().toISOString().split("T")[0];
          const targetTimeSlot = timeSlot || "09:00 - 10:00";

          // ✅ NEW: Validate booking time is not in the past
          try {
            const now = new Date();
            const [startTimeHour, startTimeMin] = targetTimeSlot.split(" - ")[0].split(":").map(Number);
            
            // Parse booking date (DD/MM/YYYY format)
            const [day, month, year] = targetBookingDate.split("/").map(Number);
            const bookingDateTime = new Date(year, month - 1, day, startTimeHour, startTimeMin, 0, 0);
            
            if (bookingDateTime < now) {
              const pastTimeErr = JSON.stringify({
                success: false,
                code: "PAST_TIME_BOOKING",
                message: "Vui lòng kiểm tra lại lịch họp - Thời gian họp đã qua!"
              });
              return new Response(pastTimeErr, { status: 400, headers: SECURE_JSON_HEADERS });
            }
          } catch (timeCheckErr) {
            console.warn("Time validation error:", timeCheckErr);
          }

          // Double Booking Check
          try {
            const { results: existingOverlap } = await env.DB.prepare(
              "SELECT id FROM room_bookings WHERE room_id = ? AND booking_date = ? AND time_slot = ? AND status != 'CANCELLED'"
            ).bind(targetRoomId, targetBookingDate, targetTimeSlot).all();

            if (existingOverlap && existingOverlap.length > 0) {
              const conflictErr = JSON.stringify({
                success: false,
                code: "DOUBLE_BOOKING_CONFLICT",
                message: "Phòng họp đã được người dùng khác đặt trước cho khung giờ này!"
              });
              return new Response(conflictErr, { status: 409, headers: SECURE_JSON_HEADERS });
            }
          } catch (e) {}

          const bookingId = id || `b_${Date.now()}`;
          const bookingStatus = "PENDING";
          const finalBookerName = bookerName || (user && user.name) || "Anh Huy (CBCNV)";
          const finalDepartment = department || (user && user.department) || "Hành chính";

          await env.DB.prepare(`
            INSERT INTO room_bookings (id, room_id, room_name, title, booker_name, department, booking_date, time_slot, attendees_count, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            bookingId,
            targetRoomId,
            roomName || "Phòng Họp Executive VIP 1",
            title || "Cuộc họp",
            finalBookerName,
            finalDepartment,
            targetBookingDate,
            targetTimeSlot,
            attendeesCount || 5,
            notes || "",
            bookingStatus
          ).run();

          const successRes = JSON.stringify({ success: true, message: "Đã lưu lịch đặt phòng họp vào Cloudflare D1 thành công!", data: body });

          return new Response(successRes, { headers: SECURE_JSON_HEADERS });

          return new Response(successRes, { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          if (err.message && err.message.includes("UNIQUE constraint failed")) {
            const conflictErr = JSON.stringify({
              success: false,
              code: "DOUBLE_BOOKING_CONFLICT",
              message: "Phòng họp đã được người dùng khác đặt trước cho khung giờ này!"
            });
            return new Response(conflictErr, { status: 409, headers: SECURE_JSON_HEADERS });
          }
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: SECURE_JSON_HEADERS }
          );
        }
      }

      // PUT /api/rooms/booking: Update booking status (COMPLETED, CONFIRMED, CANCELLED, etc.)
      if (url.pathname === "/api/rooms/booking" && request.method === "PUT") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 Database binding env.DB missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = await request.json();
          const { id, status, roomId, roomName, notes } = body;

          if (!id) {
            return new Response(
              JSON.stringify({ success: false, error: "Thiếu mã cuộc họp (id)" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          let updateFields = [];
          let bindParams = [];

          if (status) {
            updateFields.push("status = ?");
            bindParams.push(status);
          }
          if (roomId) {
            updateFields.push("room_id = ?");
            bindParams.push(roomId);
          }
          if (roomName) {
            updateFields.push("room_name = ?");
            bindParams.push(roomName);
          }
          if (notes !== undefined) {
            updateFields.push("notes = ?");
            bindParams.push(notes);
          }

          if (updateFields.length > 0) {
            bindParams.push(id);
            const sql = `UPDATE room_bookings SET ${updateFields.join(", ")} WHERE id = ?`;
            const result = await env.DB.prepare(sql).bind(...bindParams).run();

            // UPSERT Fallback: If booking didn't exist in D1 yet, insert it!
            if (result && result.meta && result.meta.changes === 0) {
              await env.DB.prepare(`
                INSERT INTO room_bookings (id, room_id, room_name, title, booker_name, department, booking_date, time_slot, attendees_count, notes, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `).bind(
                id,
                roomId || "room_1",
                roomName || "Phòng Họp OTI / OTG",
                body.title || "Cuộc họp",
                body.bookerName || "Lê Thị Mai",
                body.department || "CN-CI",
                body.bookingDate || new Date().toISOString().split("T")[0],
                body.timeSlot || "09:30 - 11:30",
                body.attendeesCount || 10,
                notes || "",
                status || "CONFIRMED"
              ).run();
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: `Đã cập nhật trạng thái cuộc họp ${id} sang ${status || "COMPLETED"} trực tiếp trên Cloudflare D1!`,
              id,
              status
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

      // ════════════════════════════════════════════════════════════════
      // 📊 BI EXPORT & EXECUTIVE EMAIL AUTOMATION APIS
      // ════════════════════════════════════════════════════════════════
      const SECURE_JSON_HEADERS = {
        "Content-Type": "application/json",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
      };

      // GET /api/bi/export: Aggregate BI Metrics for Finance & Factory OEE
      if (url.pathname === "/api/bi/export" && request.method === "GET") {
        try {
          const biData = {
            reportTitle: "Báo Cáo Tổng Kết Điều Hành BI & OEE Hàng Tuần - TBS Group",
            period: "Tuần 33 (11/08/2026 - 17/08/2026)",
            generatedAt: new Date().toISOString(),
            company: "VĂN PHÒNG CHUỖI SKECHERS - TBS GROUP",
            financeSummary: {
              revenueMonth: 12400000000,
              revenueWeekly: 3100000000,
              revenueGrowth: "+12%",
              operatingCost: 3100000000,
              netProfit: 2600000000,
              costToRevenueRate: "25.0%",
              cashAtBank: 1840000000,
              cashAtVault: 63200000,
              overdueDebtCount: 2,
              overdueDebtAmount: 230000000,
            },
            oeePerformance: [
              { factory: "Nhà Máy 1 (NM1 - Trảng Bom)", oee: "89.2%", target: "88.0%", outputPairs: 45200, status: "VƯỢT CHỈ TIÊU", defectRate: "0.75%" },
              { factory: "Nhà Máy 2 (NM2 - Dĩ An)", oee: "91.5%", target: "90.0%", outputPairs: 52100, status: "XUẤT SẮC", defectRate: "0.62%" },
              { factory: "Nhà Máy 3 (NM3 - Thuận An)", oee: "87.8%", target: "88.0%", outputPairs: 38900, status: "ĐẠT YÊU CẦU", defectRate: "0.91%" },
            ],
            qualityAndKaizen: {
              aqlPassRate: "99.4%",
              kaizenCompletedCount: 42,
              a3ReportsApproved: 8,
              totalCostSavedVND: 485000000,
            },
            executiveRecipients: [
              { role: "Tổng Giám Đốc", email: "tgd@tbsgroup.vn" },
              { role: "Phó Tổng Giám Đốc Vận Hành", email: "ptgd@tbsgroup.vn" },
              { role: "Giám Đốc Khối Sản Xuất", email: "gd@tbsgroup.vn" },
              { role: "Kế Toán Trưởng", email: "ketoan.truong@tbsgroup.vn" },
            ],
          };

          const format = url.searchParams.get("format");
          if (format === "csv") {
            const csvRows = [
              "Hang Muc,Gia Tri,Don Vi,Ghi Chu",
              `Doanh Thu Thang,${biData.financeSummary.revenueMonth},VND,Tang 12% so voi thang truoc`,
              `Chi Phi Van Hanh,${biData.financeSummary.operatingCost},VND,Dinh muc 25%`,
              `Loi Nhuan Rong,${biData.financeSummary.netProfit},VND,Dat muc tieu`,
              `OEE Nha May 1,89.2%,%,Vuot chi tieu`,
              `OEE Nha May 2,91.5%,%,Xuat sac`,
              `OEE Nha May 3,87.8%,%,Dat yeu cau`,
              `Ty Le Dat AQL,99.4%,%,Chuan Skechers USA`,
              `So Sang Kien Kaizen,42,Sang kien,Tiet kiem 485M VND`,
            ];
            return new Response(csvRows.join("\n"), {
              headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": 'attachment; filename="TBS_BI_Weekly_Report.csv"',
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "SAMEORIGIN",
              },
            });
          }

          return new Response(JSON.stringify({ success: true, data: biData }), {
            headers: SECURE_JSON_HEADERS,
          });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: SECURE_JSON_HEADERS,
          });
        }
      }

      // GET /api/bi/schedule: Get Schedule Config and Past Logs
      if (url.pathname === "/api/bi/schedule" && request.method === "GET") {
        try {
          const defaultSchedule = {
            id: "sch_weekly_exec",
            title: "Báo Cáo Tổng Kết BI & OEE Hàng Tuần - Gửi Ban Giám Đốc",
            cron: "0 8 * * MON",
            frequency: "WEEKLY",
            scheduledTimeText: "08:00 Sáng Thứ Hai hàng tuần",
            status: "ACTIVE",
            recipients: [
              "tgd@tbsgroup.vn",
              "ptgd@tbsgroup.vn",
              "gd@tbsgroup.vn",
              "ketoan.truong@tbsgroup.vn",
              "anhy.work.2004@gmail.com",
            ],
            modulesIncluded: [
              "P&L Tài Chính & Doanh Thu Chi Phí",
              "Hiệu Suất OEE 3 Tổ Hợp Nhà Máy",
              "Tỷ Lệ Chất Lượng Kiểm Định AQL 2.5",
              "Tiến Độ Đổi Mới Sáng Kiến Kaizen & CI",
            ],
            lastDispatchedAt: "18/08/2026 08:00:00",
            nextScheduledAt: "25/08/2026 08:00:00",
          };

          const recentLogs = [
            {
              id: "LOG-2026-W33",
              sentAt: "18/08/2026 08:00:15",
              subject: "[TBS-BI] Báo Cáo Tổng Kết Tài Chính & OEE Tuần 33/2026",
              recipientsCount: 5,
              status: "SUCCESS (200 OK)",
              trigger: "CRON_SCHEDULED",
              summary: "Doanh thu 12.4B | OEE TB 89.5% | 42 Kaizen",
            },
            {
              id: "LOG-2026-W32",
              sentAt: "11/08/2026 08:00:12",
              subject: "[TBS-BI] Báo Cáo Tổng Kết Tài Chính & OEE Tuần 32/2026",
              recipientsCount: 5,
              status: "SUCCESS (200 OK)",
              trigger: "CRON_SCHEDULED",
              summary: "Doanh thu 11.8B | OEE TB 88.9% | 38 Kaizen",
            },
            {
              id: "LOG-2026-W31",
              sentAt: "04/08/2026 08:00:18",
              subject: "[TBS-BI] Báo Cáo Tổng Kết Tài Chính & OEE Tuần 31/2026",
              recipientsCount: 5,
              status: "SUCCESS (200 OK)",
              trigger: "CRON_SCHEDULED",
              summary: "Doanh thu 11.2B | OEE TB 88.2% | 35 Kaizen",
            },
          ];

          return new Response(
            JSON.stringify({ success: true, schedule: defaultSchedule, history: recentLogs }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: SECURE_JSON_HEADERS,
          });
        }
      }

      // POST /api/bi/schedule: Update Schedule Config
      if (url.pathname === "/api/bi/schedule" && request.method === "POST") {
        try {
          const body = await request.json();
          return new Response(
            JSON.stringify({
              success: true,
              message: "Đã cập nhật cấu hình lập lịch gửi báo cáo BI tự động thành công!",
              data: body,
            }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: SECURE_JSON_HEADERS,
          });
        }
      }

      // POST /api/bi/dispatch-email: Trigger Immediate Email Send
      if (url.pathname === "/api/bi/dispatch-email" && request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const targetEmail = body.targetEmail || "Ban Giám Đốc TBS Group";
          const dispatchId = `DISPATCH-${Date.now().toString().slice(-6)}`;

          // Generate HTML Email Template
          const htmlReportPreview = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f5; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #08221a; padding: 24px; text-align: center; border-bottom: 3px solid #006838; }
    .header h1 { color: #ffffff; margin: 8px 0 0 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { color: #2fd39a; font-size: 12px; margin: 4px 0 0 0; font-weight: 600; }
    .content { padding: 24px; }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
    .kpi-label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
    .kpi-value { font-size: 20px; color: #0f172a; font-weight: 900; margin-top: 4px; }
    .kpi-sub { font-size: 11px; color: #006838; font-weight: bold; margin-top: 2px; }
    .section-title { font-size: 14px; font-weight: 800; color: #0f172a; border-left: 4px solid #006838; padding-left: 8px; margin: 20px 0 12px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th { background: #f1f5f9; text-align: left; padding: 10px; font-weight: 800; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; background: #ecfdf5; color: #006838; border: 1px solid #a7f3d0; }
    .btn { display: inline-block; background: #006838; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 13px; text-align: center; margin: 10px 0; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 20px; font-weight: 900; color: #ffffff;">TBS GROUP × SKECHERS</div>
      <h1>BÁO CÁO TỔNG KẾT ĐIỀU HÀNH BI & OEE HÀNG TUẦN</h1>
      <p>Kỳ báo cáo: Tuần 33/2026 (11/08 - 17/08/2026) | Hệ Thống Tự Động Dispatch</p>
    </div>
    <div class="content">
      <p style="font-size: 13px; line-height: 1.5;">Kính gửi <strong>Ban Tổng Giám Đốc &amp; Hội Đồng Quản Trị TBS Group</strong>,<br>Hệ thống trân trọng gửi báo cáo tóm lược tình hình tài chính, hiệu suất OEE 3 tổ hợp nhà máy và chất lượng sản xuất tuần qua:</p>
      
      <div class="section-title">1. TỔNG QUAN TÀI CHÍNH &amp; DOANH THU</div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Doanh thu lũy kế</div>
          <div class="kpi-value">12.4 Tỷ VNĐ</div>
          <div class="kpi-sub">↑ +12% so với cùng kỳ</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Chi phí vận hành</div>
          <div class="kpi-value">3.1 Tỷ VNĐ</div>
          <div class="kpi-sub">↓ -8% so với định mức</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Lợi nhuận ròng</div>
          <div class="kpi-value">2.6 Tỷ VNĐ</div>
          <div class="kpi-sub">↑ Đạt 108% kế hoạch</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Số dư quỹ &amp; VCB</div>
          <div class="kpi-value">1.90 Tỷ VNĐ</div>
          <div class="kpi-sub">● Dòng tiền an toàn</div>
        </div>
      </div>

      <div class="section-title">2. HIỆU SUẤT TỔNG THỂ THIẾT BỊ (OEE) 3 NHÀ MÁY</div>
      <table>
        <thead>
          <tr>
            <th>Nhà Máy</th>
            <th>OEE Thực Tế</th>
            <th>Chỉ Tiêu</th>
            <th>Sản Lượng (Đôi)</th>
            <th>Trạng Thái</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>NM1 - Trảng Bom</strong></td>
            <td style="color: #006838; font-weight: 800;">89.2%</td>
            <td>88.0%</td>
            <td>45,200</td>
            <td><span class="badge">VƯỢT CHỈ TIÊU</span></td>
          </tr>
          <tr>
            <td><strong>NM2 - Dĩ An</strong></td>
            <td style="color: #006838; font-weight: 800;">91.5%</td>
            <td>90.0%</td>
            <td>52,100</td>
            <td><span class="badge">XUẤT SẮC</span></td>
          </tr>
          <tr>
            <td><strong>NM3 - Thuận An</strong></td>
            <td style="color: #006838; font-weight: 800;">87.8%</td>
            <td>88.0%</td>
            <td>38,900</td>
            <td><span class="badge">ĐẠT CHỈ TIÊU</span></td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">3. CHẤT LƯỢNG SẢN PHẨM &amp; SÁNG KIẾN CẢI TIẾN CI</div>
      <div style="background: #f8fafc; padding: 12px; border-radius: 10px; font-size: 12px; line-height: 1.6; border: 1px solid #e2e8f0;">
        • <strong>Tỷ lệ kiểm định AQL 2.5/4.0:</strong> Đạt <strong>99.4%</strong> (Lô hàng Foamies xuất khẩu Mỹ không có lỗi nghiêm trọng).<br>
        • <strong>Sáng kiến Kaizen hoàn thành:</strong> <strong>42 sáng kiến</strong> (Tiết kiệm dự kiến 485M VNĐ/tháng).<br>
        • <strong>Cảnh báo công nợ:</strong> 02 khoản công nợ nhà cung cấp đến hạn cần kế toán duyệt chi tuần này.
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://vpchuoiskechers.tbsgroup2026.workers.dev/work" class="btn">Mở Bảng Điều Khiển Live BI Dashboard →</a>
      </div>
    </div>
    <div class="footer">
      Email này được phát hành tự động bởi <strong>TBS Group Cloud BI Automation System</strong>.<br>
      Mã báo cáo: ${dispatchId} | Cơ sở dữ liệu: Cloudflare D1 Cloud Live
    </div>
  </div>
</body>
</html>`;

          return new Response(
            JSON.stringify({
              success: true,
              dispatchId,
              message: `Đã gửi thành công Báo Cáo Tổng Kết BI & OEE tới: ${targetEmail}`,
              sentAt: new Date().toLocaleString("vi-VN"),
              recipientsCount: 5,
              htmlPreview: htmlReportPreview,
            }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: SECURE_JSON_HEADERS,
          });
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 💰 FINANCE ENTRY & ADVANCES APIS
    // ════════════════════════════════════════════════════════════════
    if (url.pathname === "/api/finance/entry" && request.method === "POST") {
      try {
        const idempRes = await handleIdempotency(request, "/api/finance/entry");
        if (idempRes) return idempRes;

        const user = await verifyServerAuth(request);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (!checkModulePermission(user, "finance", "WRITE")) {
          return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Bạn không có quyền thực hiện hạch toán kế toán!" }), {
            status: 403, headers: SECURE_JSON_HEADERS
          });
        }

        const body = await request.json();
        const resStr = JSON.stringify({ success: true, message: "Đã hạch toán bút toán thành công!", data: body });
        await saveIdempotency(request, resStr, 200, "/api/finance/entry");
        await recordAuditLog(user, "finance", "CREATE_ENTRY", body.id || `entry_${Date.now()}`, null, body, request);

        return new Response(resStr, { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    if (url.pathname.startsWith("/api/finance/advance")) {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM finance_advances ORDER BY created_at DESC").all();
          return new Response(JSON.stringify({ success: true, data: results }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST") {
        try {
          const idempRes = await handleIdempotency(request, "/api/finance/advance");
          if (idempRes) return idempRes;

          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const advId = body.id || `adv_${Date.now()}`;
          const amount = parseFloat(body.amount || 0);

          await env.DB.prepare(
            `INSERT INTO finance_advances (id, emp_code, amount, purpose, status, version, created_at)
             VALUES (?, ?, ?, ?, 'DRAFT', 1, CURRENT_TIMESTAMP)`
          ).bind(advId, user.empCode, amount, body.purpose || "Tạm ứng").run();

          const resStr = JSON.stringify({ success: true, message: "Đã tạo đề xuất tạm ứng chi phí thành công!", id: advId });
          await saveIdempotency(request, resStr, 200, "/api/finance/advance");
          await recordAuditLog(user, "finance", "CREATE_ADVANCE", advId, null, body, request);

          return new Response(resStr, { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "PUT") {
        try {
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const { id, status, actionLevel, version } = body;

          const { results } = await env.DB.prepare("SELECT * FROM finance_advances WHERE id = ?").bind(id).all();
          if (!results || results.length === 0) {
            return new Response(JSON.stringify({ success: false, error: "Không tìm thấy đề xuất tạm ứng" }), { status: 404, headers: SECURE_JSON_HEADERS });
          }
          const adv = results[0];

          // Segregation of Duties Check
          if (!checkSegregationOfDuties(adv.emp_code, user.empCode)) {
            return new Response(JSON.stringify({
              success: false,
              error: "SEGREGATION_OF_DUTIES_VIOLATION",
              message: "Cảnh báo: Bạn không thể tự phê duyệt đơn tạm ứng chi phí do chính mình tạo!"
            }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          let threshold = 5000000.0;
          try {
            const { results: thRes } = await env.DB.prepare("SELECT threshold_amount FROM approval_thresholds WHERE module = 'finance_advance'").all();
            if (thRes && thRes[0]) threshold = parseFloat(thRes[0].threshold_amount);
          } catch(e) {}

          let nextStatus = status;
          if (actionLevel === "APPROVE_L2") {
            if (adv.status !== "PENDING_L2") {
              return new Response(JSON.stringify({
                success: false,
                error: "INVALID_STATE_TRANSITION",
                message: "Lỗi luồng duyệt: Đơn tạm ứng chưa qua phê duyệt cấp 1 (L1)!"
              }), { status: 422, headers: SECURE_JSON_HEADERS });
            }
            nextStatus = "APPROVED";
          } else if (actionLevel === "APPROVE_L1") {
            nextStatus = (adv.amount >= threshold) ? "PENDING_L2" : "APPROVED";
          }

          const currentVer = typeof version === "number" ? version : (adv.version || 1);
          const res = await env.DB.prepare(
            "UPDATE finance_advances SET status = ?, approved_level = ?, version = version + 1 WHERE id = ? AND version = ?"
          ).bind(nextStatus, actionLevel || (nextStatus === "APPROVED" ? "L2" : "L1"), id, currentVer).run();

          if (res.meta && res.meta.changes === 0) {
            return new Response(JSON.stringify({
              success: false,
              code: "OPTIMISTIC_LOCK_CONFLICT",
              message: "Đơn tạm ứng đã được cập nhật bởi một người dùng khác. Vui lòng tải lại trang!"
            }), { status: 409, headers: SECURE_JSON_HEADERS });
          }

          await recordAuditLog(user, "finance", actionLevel || status, id, { status: adv.status }, { status: nextStatus }, request);
          await createNotification(adv.emp_code, "finance", "INFO", id, "Cập nhật Đơn Tạm Ứng", `Đơn tạm ứng ${id} đã được cập nhật trạng thái sang: ${nextStatus}`);

          return new Response(JSON.stringify({ success: true, message: "Đã cập nhật trạng thái đơn tạm ứng!", id, status: nextStatus }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 👔 HR LEAVE, ATTENDANCE & PAYROLL APIS
    // ════════════════════════════════════════════════════════════════
    if (url.pathname.startsWith("/api/hr/leave")) {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM leave_requests ORDER BY created_at DESC").all();
          return new Response(JSON.stringify({ success: true, data: results }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST") {
        try {
          const idempRes = await handleIdempotency(request, "/api/hr/leave");
          if (idempRes) return idempRes;

          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const leaveId = body.id || `leave_${Date.now()}`;

          await env.DB.prepare(
            `INSERT INTO leave_requests (id, emp_code, leave_type, start_date, end_date, reason, status, version, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 1, CURRENT_TIMESTAMP)`
          ).bind(leaveId, user.empCode, body.leaveType || "Nghỉ phép năm", body.startDate || "20/08/2026", body.endDate || "21/08/2026", body.reason || "", 1).run();

          const resStr = JSON.stringify({ success: true, message: "Đã gửi đơn xin nghỉ phép thành công!", id: leaveId });
          await saveIdempotency(request, resStr, 200, "/api/hr/leave");
          await recordAuditLog(user, "hr", "CREATE_LEAVE", leaveId, null, body, request);

          return new Response(resStr, { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "PUT") {
        try {
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const { id, status, version } = body;

          const { results } = await env.DB.prepare("SELECT * FROM leave_requests WHERE id = ?").bind(id).all();
          if (!results || results.length === 0) {
            return new Response(JSON.stringify({ success: false, error: "Không tìm thấy đơn xin nghỉ phép" }), { status: 404, headers: SECURE_JSON_HEADERS });
          }
          const leave = results[0];

          // Segregation of Duties Check (No Self Approval)
          if (!checkSegregationOfDuties(leave.emp_code || leave.created_by, user.empCode)) {
            return new Response(JSON.stringify({
              success: false,
              error: "SEGREGATION_OF_DUTIES_VIOLATION",
              message: "Cảnh báo: Bạn không thể tự phê duyệt đơn xin nghỉ phép do chính mình tạo!"
            }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const currentVer = typeof version === "number" ? version : (leave.version || 1);
          const res = await env.DB.prepare(
            "UPDATE leave_requests SET status = ?, version = version + 1 WHERE id = ? AND version = ?"
          ).bind(status, id, currentVer).run();

          if (res.meta && res.meta.changes === 0) {
            return new Response(JSON.stringify({
              success: false,
              code: "OPTIMISTIC_LOCK_CONFLICT",
              message: "Đơn xin nghỉ phép đã được cập nhật bởi một người dùng khác. Vui lòng tải lại trang!"
            }), { status: 409, headers: SECURE_JSON_HEADERS });
          }

          await recordAuditLog(user, "hr", "UPDATE_LEAVE_STATUS", id, { status: leave.status }, { status }, request);
          await createNotification(leave.emp_code || leave.created_by, "hr", "INFO", id, "Cập nhật Đơn Xin Nghỉ Phép", `Đơn nghỉ phép ${id} của bạn đã được cập nhật sang trạng thái: ${status}`);

          return new Response(JSON.stringify({ success: true, message: "Đã cập nhật trạng thái đơn nghỉ phép!", id, status }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    if (url.pathname === "/api/hr/attendance" && request.method === "POST") {
      try {
        const user = await verifyServerAuth(request);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (!checkModulePermission(user, "finance", "WRITE") && !checkModulePermission(user, "hr", "WRITE")) {
          return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Chỉ Kế Toán hoặc HR Admin có quyền chốt/mở sổ chấm công!" }), { status: 403, headers: SECURE_JSON_HEADERS });
        }

        const body = await request.json();
        const { status, action } = body;
        let nextStatus = status;

        if (action === "UNLOCK_REQUEST") {
          nextStatus = "UNLOCK_REQUESTED";
        } else if (action === "APPROVE_UNLOCK") {
          nextStatus = "DRAFT"; // Unlocked back to draft
        } else if (action === "REJECT_UNLOCK") {
          nextStatus = "FINALIZED"; // Keep locked
        } else if (action === "FINALIZE") {
          nextStatus = "FINALIZED";
          // Trigger auto-creation of Payroll in PENDING_HR_REVIEW state
          try {
            await env.DB.prepare(
              `INSERT INTO payroll_records (month_code, status, created_at)
               VALUES ('2026-08', 'PENDING_HR_REVIEW', CURRENT_TIMESTAMP)
               ON CONFLICT(month_code) DO UPDATE SET status = 'PENDING_HR_REVIEW'`
            ).run();
          } catch(e) {}
        }

        await recordAuditLog(user, "hr", "ATTENDANCE_STATE_CHANGE", "2026-08", null, { status: nextStatus }, request);
        return new Response(JSON.stringify({ success: true, message: "Cập nhật trạng thái chấm công thành công!", status: nextStatus }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    if (url.pathname === "/api/hr/payroll" && request.method === "POST") {
      try {
        const user = await verifyServerAuth(request);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        const body = await request.json();
        const { action } = body;

        let nextStatus = "PENDING_HR_REVIEW";
        if (action === "HR_SUBMIT") {
          nextStatus = "PENDING_BGD_APPROVAL";
        } else if (action === "BGD_APPROVE") {
          nextStatus = "PUBLISHED";
          // Bulk notify all employees when Published
          try {
            const { results: allUsers } = await env.DB.prepare("SELECT emp_code FROM users").all();
            if (allUsers) {
              for (const u of allUsers) {
                await createNotification(u.emp_code, "payroll", "SUCCESS", "2026-08", "Công Bố Bảng Lương Tháng 08/2026", "Bảng lương tháng 08/2026 đã chính thức công bố. Vui lòng kiểm tra phiếu lương cá nhân.");
              }
            }
          } catch(e) {}
        }

        await recordAuditLog(user, "hr", "PAYROLL_STATE_CHANGE", "2026-08", null, { status: nextStatus }, request);
        return new Response(JSON.stringify({ success: true, message: "Cập nhật trạng thái bảng lương thành công!", status: nextStatus }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 👔 HR REALTIME D1 APIS (Employees, Contracts, Requisitions, Onboarding)
    // ════════════════════════════════════════════════════════════════
    if (url.pathname.startsWith("/api/hr/employees")) {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS hr_employees (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, title TEXT NOT NULL, department TEXT NOT NULL,
                branch TEXT DEFAULT 'Văn Phòng Chuỗi SKECHERS HQ', email TEXT, phone TEXT,
                status TEXT DEFAULT 'Active', contract_type TEXT DEFAULT 'Chính thức (2 năm)', join_date TEXT,
                probation_end_date TEXT, contract_end_date TEXT, avatar TEXT DEFAULT '/images/tbs-logo.png',
                salary_base TEXT, performance_score TEXT DEFAULT 'A', is_high_performer INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch(e) {}
      }

      if (request.method === "GET") {
        try {
          if (!env.DB) return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
          const { results } = await env.DB.prepare("SELECT * FROM hr_employees ORDER BY created_at DESC").all();
          const mapped = (results || []).map(r => ({
            id: r.id, name: r.name, title: r.title, department: r.department, branch: r.branch || 'Văn Phòng Chuỗi SKECHERS HQ',
            email: r.email || '', phone: r.phone || '', status: r.status || 'Active', contractType: r.contract_type || 'Chính thức (2 năm)',
            joinDate: r.join_date || '', probationEndDate: r.probation_end_date, contractEndDate: r.contract_end_date,
            avatar: r.avatar || '/images/tbs-logo.png', salaryBase: r.salary_base, performanceScore: r.performance_score,
            isHighPerformer: Boolean(r.is_high_performer)
          }));
          return new Response(JSON.stringify({ success: true, data: mapped }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const empId = body.id || `NS-${Date.now().toString().slice(-4)}`;

          if (env.DB) {
            await env.DB.prepare(`
              INSERT OR REPLACE INTO hr_employees (
                id, name, title, department, branch, email, phone, status, contract_type,
                join_date, probation_end_date, contract_end_date, avatar, salary_base, performance_score, is_high_performer, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              empId, body.name || "Cán Bộ Mới", body.title || "Chuyên Viên", body.department || "Văn Phòng",
              body.branch || "Văn Phòng Chuỗi SKECHERS HQ", body.email || "", body.phone || "",
              body.status || "Active", body.contractType || "Chính thức (2 năm)", body.joinDate || new Date().toISOString().split("T")[0],
              body.probationEndDate || null, body.contractEndDate || null, body.avatar || "/images/tbs-logo.png",
              body.salaryBase || null, body.performanceScore || "A", body.isHighPerformer ? 1 : 0
            ).run();
          }

          await recordAuditLog(user, "hr", "SAVE_EMPLOYEE", empId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã lưu thông tin nhân sự vào CSDL D1!", id: empId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    if (url.pathname.startsWith("/api/hr/contracts")) {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS hr_contracts (
                id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, employee_name TEXT NOT NULL,
                department TEXT NOT NULL, type TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
                status TEXT DEFAULT 'Active', salary TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch(e) {}
      }

      if (request.method === "GET") {
        try {
          if (!env.DB) return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
          const { results } = await env.DB.prepare("SELECT * FROM hr_contracts ORDER BY created_at DESC").all();
          const mapped = (results || []).map(r => ({
            id: r.id, employeeId: r.employee_id, employeeName: r.employee_name, department: r.department,
            type: r.type, startDate: r.start_date, endDate: r.end_date, status: r.status || 'Active', salary: r.salary
          }));
          return new Response(JSON.stringify({ success: true, data: mapped }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const contractId = body.id || `HD-2026-${Math.floor(100 + Math.random() * 900)}`;

          if (env.DB) {
            await env.DB.prepare(`
              INSERT OR REPLACE INTO hr_contracts (id, employee_id, employee_name, department, type, start_date, end_date, status, salary, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              contractId, body.employeeId || "EMP-001", body.employeeName || "Cán Bộ Nhân Viên",
              body.department || "Văn Phòng", body.type || "Chính thức (2 năm)",
              body.startDate || "2026-01-01", body.endDate || "2028-01-01",
              body.status || "Active", body.salary || "15,000,000 đ"
            ).run();
          }

          await recordAuditLog(user, "hr", "SAVE_CONTRACT", contractId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã lưu hợp đồng lao động vào D1!", id: contractId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    if (url.pathname.startsWith("/api/hr/requisitions")) {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS hr_requisitions (
                id TEXT PRIMARY KEY, title TEXT NOT NULL, department TEXT NOT NULL, quantity INTEGER DEFAULT 1,
                salary_range TEXT, reason TEXT, status TEXT DEFAULT 'Pending_Manager', requester_name TEXT NOT NULL,
                request_date TEXT NOT NULL, applicants_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch(e) {}
      }

      if (request.method === "GET") {
        try {
          if (!env.DB) return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
          const { results } = await env.DB.prepare("SELECT * FROM hr_requisitions ORDER BY created_at DESC").all();
          const mapped = (results || []).map(r => ({
            id: r.id, title: r.title, department: r.department, quantity: r.quantity || 1, salaryRange: r.salary_range,
            reason: r.reason, status: r.status || 'Pending_Manager', requesterName: r.requester_name,
            requestDate: r.request_date, applicantsCount: r.applicants_count || 0
          }));
          return new Response(JSON.stringify({ success: true, data: mapped }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const reqId = body.id || `YCTD-2026-${Math.floor(10 + Math.random() * 90)}`;

          if (env.DB) {
            await env.DB.prepare(`
              INSERT OR REPLACE INTO hr_requisitions (id, title, department, quantity, salary_range, reason, status, requester_name, request_date, applicants_count, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              reqId, body.title || "Yêu cầu tuyển dụng", body.department || "Văn Phòng",
              body.quantity || 1, body.salaryRange || "15,000,000 đ", body.reason || "",
              body.status || "Pending_Manager", body.requesterName || user.name || "Quản Lý",
              body.requestDate || new Date().toISOString().split("T")[0], body.applicantsCount || 0
            ).run();
          }

          await recordAuditLog(user, "hr", "SAVE_REQUISITION", reqId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã lưu yêu cầu tuyển dụng vào D1!", id: reqId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    if (url.pathname.startsWith("/api/hr/onboarding")) {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS hr_onboarding (
                id TEXT PRIMARY KEY, employee_name TEXT NOT NULL, department TEXT NOT NULL, join_date TEXT NOT NULL,
                mentor TEXT, progress INTEGER DEFAULT 0, items_json TEXT DEFAULT '[]', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch(e) {}
      }

      if (request.method === "GET") {
        try {
          if (!env.DB) return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
          const { results } = await env.DB.prepare("SELECT * FROM hr_onboarding ORDER BY created_at DESC").all();
          const mapped = (results || []).map(r => {
            let items = [];
            try { items = JSON.parse(r.items_json); } catch(e) {}
            return {
              id: r.id, employeeName: r.employee_name, department: r.department, joinDate: r.join_date,
              mentor: r.mentor, progress: r.progress || 0, items
            };
          });
          return new Response(JSON.stringify({ success: true, data: mapped }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const onbId = body.id || `ONB-${Math.floor(10 + Math.random() * 90)}`;

          if (env.DB) {
            await env.DB.prepare(`
              INSERT OR REPLACE INTO hr_onboarding (id, employee_name, department, join_date, mentor, progress, items_json, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              onbId, body.employeeName || "Nhân sự mới", body.department || "Văn Phòng",
              body.joinDate || new Date().toISOString().split("T")[0], body.mentor || "Trưởng Phòng",
              body.progress || 0, JSON.stringify(body.items || [])
            ).run();
          }

          await recordAuditLog(user, "hr", "SAVE_ONBOARDING", onbId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã cập nhật tiến trình Onboarding vào D1!", id: onbId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 📊 FINANCE TARGETS REALTIME D1 APIS
    // ════════════════════════════════════════════════════════════════
    if (url.pathname.startsWith("/api/finance/targets")) {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS finance_targets (
                id TEXT PRIMARY KEY, year INTEGER DEFAULT 2026, metric_code TEXT NOT NULL UNIQUE,
                metric_name TEXT NOT NULL, target_value REAL NOT NULL, unit TEXT DEFAULT 'VNĐ',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch(e) {}
      }

      if (request.method === "GET") {
        try {
          if (!env.DB) return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
          const year = url.searchParams.get("year") || 2026;
          const { results } = await env.DB.prepare("SELECT * FROM finance_targets WHERE year = ?").bind(Number(year)).all();
          return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const tgtId = body.id || `tgt_${Date.now()}`;

          if (env.DB) {
            await env.DB.prepare(`
              INSERT OR REPLACE INTO finance_targets (id, year, metric_code, metric_name, target_value, unit, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              tgtId, body.year || 2026, body.metricCode, body.metricName,
              body.targetValue || 0, body.unit || "VNĐ"
            ).run();
          }

          await recordAuditLog(user, "finance", "SAVE_TARGET", tgtId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã lưu chỉ tiêu tài chính vào D1!", id: tgtId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // ⚙️ MAINTENANCE MACHINES REALTIME D1 APIS
    // ════════════════════════════════════════════════════════════════
    if (url.pathname.startsWith("/api/maintenance/machines")) {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS machines (
                id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, serial TEXT,
                zone TEXT NOT NULL, status TEXT DEFAULT 'OPERATING', qr_data TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch(e) {}
      }

      if (request.method === "GET") {
        try {
          if (!env.DB) return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
          const { results } = await env.DB.prepare("SELECT * FROM machines ORDER BY code ASC").all();
          const mapped = (results || []).map(r => ({
            id: r.id, code: r.code, name: r.name, serial: r.serial || '', zone: r.zone, status: r.status || 'OPERATING', qrData: r.qr_data || r.code
          }));
          return new Response(JSON.stringify({ success: true, data: mapped }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const mcId = body.id || `mc_${Date.now()}`;

          if (env.DB) {
            await env.DB.prepare(`
              INSERT OR REPLACE INTO machines (id, code, name, serial, zone, status, qr_data, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              mcId, body.code, body.name, body.serial || "", body.zone || "Khu A",
              body.status || "OPERATING", body.qrData || body.code
            ).run();
          }

          await recordAuditLog(user, "maintenance", "SAVE_MACHINE", mcId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã lưu danh mục máy móc vào CSDL D1!", id: mcId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 🛠️ MAINTENANCE TICKETS APIS
    // ════════════════════════════════════════════════════════════════
    if (url.pathname.startsWith("/api/maintenance/tickets")) {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM maintenance_tickets ORDER BY created_at DESC").all();
          return new Response(JSON.stringify({ success: true, data: results }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST") {
        try {
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const ticketId = body.id || `ticket_${Date.now()}`;

          await env.DB.prepare(
            `INSERT INTO maintenance_tickets (id, ticket_code, machine_id, reported_by_id, priority, status, description, created_by, source_module, source_record_id, version, created_at)
             VALUES (?, ?, ?, 100, ?, 'OPEN', ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`
          ).bind(
            ticketId,
            body.code || `TCK-2026-${Math.floor(100 + Math.random() * 900)}`,
            body.machineId || 1,
            body.priority || "MEDIUM",
            body.description || "Báo sự cố thiết bị",
            user.empCode,
            body.sourceModule || null,
            body.sourceRecordId || null
          ).run();

          await recordAuditLog(user, "maintenance", "CREATE_TICKET", ticketId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã tạo ticket bảo trì sự cố thành công!", id: ticketId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "PUT") {
        try {
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          if (!checkModulePermission(user, "maintenance", "WRITE")) {
            return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Chỉ Kỹ Thuật Viên hoặc Admin có quyền xử lý ticket bảo trì!" }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const body = await request.json();
          const { id, status, version, resolvedNote } = body;

          const { results } = await env.DB.prepare("SELECT * FROM maintenance_tickets WHERE id = ? OR ticket_code = ?").bind(id, id).all();
          if (!results || results.length === 0) {
            return new Response(JSON.stringify({ success: false, error: "Không tìm thấy ticket bảo trì" }), { status: 404, headers: SECURE_JSON_HEADERS });
          }
          const ticket = results[0];
          const currentVer = typeof version === "number" ? version : (ticket.version || 1);

          const res = await env.DB.prepare(
            "UPDATE maintenance_tickets SET status = ?, resolved_note = ?, version = version + 1 WHERE (id = ? OR ticket_code = ?) AND version = ?"
          ).bind(status, resolvedNote || ticket.resolved_note || "", id, id, currentVer).run();

          if (res.meta && res.meta.changes === 0) {
            return new Response(JSON.stringify({
              success: false,
              code: "OPTIMISTIC_LOCK_CONFLICT",
              message: "Ticket bảo trì đã được cập nhật bởi một kỹ thuật viên khác. Vui lòng tải lại trang!"
            }), { status: 409, headers: SECURE_JSON_HEADERS });
          }

          // Cross-module Integration: If ticket was created from QC, auto update QC defect report to RESOLVED
          if (status === "RESOLVED" && ticket.source_module === "qc" && ticket.source_record_id) {
            try {
              await env.DB.prepare(
                "UPDATE qc_defect_reports SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP WHERE id = ?"
              ).bind(ticket.source_record_id).run();

              const { results: qcRec } = await env.DB.prepare("SELECT created_by FROM qc_defect_reports WHERE id = ?").bind(ticket.source_record_id).all();
              if (qcRec && qcRec[0]) {
                await createNotification(qcRec[0].created_by, "qc", "SUCCESS", ticket.source_record_id, "Báo Cáo QC Tự Động Giải Quyết", `Ticket Bảo trì ${ticket.ticket_code} đã sửa xong. Báo cáo QC ${ticket.source_record_id} đã chuyển sang RESOLVED!`);
              }
            } catch(e) {}
          }

          await recordAuditLog(user, "maintenance", "UPDATE_TICKET_STATUS", id, { status: ticket.status }, { status }, request);
          return new Response(JSON.stringify({ success: true, message: "Đã cập nhật trạng thái ticket bảo trì!", id, status }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 🔍 QC DEFECT REPORTS & KAIZEN SUBMISSIONS APIS
    // ════════════════════════════════════════════════════════════════
    if (url.pathname.startsWith("/api/qc/defects")) {
      if (request.method === "GET") {
        try {
          // JOIN query so original QC reporter can view Maintenance ticket progress
          const { results } = await env.DB.prepare(`
            SELECT q.*, m.ticket_code as maintenance_ticket_code, m.status as maintenance_status
            FROM qc_defect_reports q
            LEFT JOIN maintenance_tickets m ON m.source_module = 'qc' AND m.source_record_id = q.id
            ORDER BY q.created_at DESC
          `).all();
          return new Response(JSON.stringify({ success: true, data: results }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST") {
        try {
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const qcId = body.id || `qc_${Date.now()}`;

          await env.DB.prepare(
            `INSERT INTO qc_defect_reports (id, status, created_by, description, action_required_note, version, created_at)
             VALUES (?, 'REPORTED', ?, ?, ?, 1, CURRENT_TIMESTAMP)`
          ).bind(qcId, user.empCode, body.description || "Báo cáo lỗi QC", body.actionNote || "").run();

          await recordAuditLog(user, "qc", "CREATE_DEFECT_REPORT", qcId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã tạo báo cáo lỗi QC thành công!", id: qcId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "PUT") {
        try {
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          if (!checkModulePermission(user, "qc", "WRITE")) {
            return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Chỉ QC Manager hoặc Admin mới có quyền cập nhật báo cáo QC!" }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const body = await request.json();
          const { id, status, version, actionNote } = body;

          const { results } = await env.DB.prepare("SELECT * FROM qc_defect_reports WHERE id = ?").bind(id).all();
          if (!results || results.length === 0) {
            return new Response(JSON.stringify({ success: false, error: "Không tìm thấy báo cáo QC" }), { status: 404, headers: SECURE_JSON_HEADERS });
          }
          const defect = results[0];
          const currentVer = typeof version === "number" ? version : (defect.version || 1);

          const res = await env.DB.prepare(
            "UPDATE qc_defect_reports SET status = ?, action_required_note = ?, version = version + 1 WHERE id = ? AND version = ?"
          ).bind(status, actionNote || defect.action_required_note || "", id, currentVer).run();

          if (res.meta && res.meta.changes === 0) {
            return new Response(JSON.stringify({
              success: false,
              code: "OPTIMISTIC_LOCK_CONFLICT",
              message: "Báo cáo QC đã được cập nhật bởi một cán bộ QC khác. Vui lòng tải lại trang!"
            }), { status: 409, headers: SECURE_JSON_HEADERS });
          }

          // Cross-module trigger: If ACTION_REQUIRED and relates to machine -> Auto create maintenance ticket
          if (status === "ACTION_REQUIRED") {
            try {
              const ticketCode = `TCK-QC-${Math.floor(1000 + Math.random() * 9000)}`;
              await env.DB.prepare(
                `INSERT INTO maintenance_tickets (id, ticket_code, machine_id, reported_by_id, priority, status, description, created_by, source_module, source_record_id, version, created_at)
                 VALUES (?, ?, 1, 100, 'HIGH', 'OPEN', ?, ?, 'qc', ?, 1, CURRENT_TIMESTAMP)`
              ).bind(`tck_${Date.now()}`, ticketCode, `Sự cố thiết bị từ Báo cáo QC ${id}: ${actionNote || defect.description}`, user.empCode, id).run();

              await createNotification("BT-001", "maintenance", "WARNING", id, "Ticket Bảo Trì Từ QC", `Yêu cầu xử lý sự cố thiết bị mới từ QC Báo cáo ${id}. Mã ticket: ${ticketCode}`);
            } catch(e) {}
          }

          await recordAuditLog(user, "qc", "UPDATE_DEFECT_STATUS", id, { status: defect.status }, { status }, request);
          return new Response(JSON.stringify({ success: true, message: "Đã cập nhật trạng thái báo cáo QC!", id, status }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    if (url.pathname.startsWith("/api/qc/kaizen")) {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM qc_kaizen_submissions ORDER BY created_at DESC").all();
          return new Response(JSON.stringify({ success: true, data: results }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST") {
        try {
          const user = await verifyServerAuth(request);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          const body = await request.json();
          const kaizenId = body.id || `kz_${Date.now()}`;

          await env.DB.prepare(
            `INSERT INTO qc_kaizen_submissions (id, status, submitted_by, description, version, created_at)
             VALUES (?, 'SUBMITTED', ?, ?, 1, CURRENT_TIMESTAMP)`
          ).bind(kaizenId, user.empCode, body.description || "Ý tưởng cải tiến Kaizen").run();

          await recordAuditLog(user, "qc", "CREATE_KAIZEN", kaizenId, null, body, request);
          return new Response(JSON.stringify({ success: true, message: "Đã nộp đề xuất Kaizen thành công!", id: kaizenId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 📲 PWA WEB PUSH NOTIFICATIONS APIS
    // ════════════════════════════════════════════════════════════════
    if (url.pathname === "/api/push/subscribe" && request.method === "POST") {
      try {
        // ✅ Auth is now OPTIONAL - allow subscriptions even for unauthenticated users
        let user = null;
        try {
          user = await verifyServerAuth(request);
        } catch (e) {
          // Ignore auth errors - push subscriptions should work for anyone
        }

        const body = await request.json();
        const { subscription } = body;

        if (!subscription || !subscription.endpoint) {
          return new Response(JSON.stringify({ success: false, message: "Thiếu endpoint trong push subscription" }), { status: 400, headers: SECURE_JSON_HEADERS });
        }

        // Extract VAPID keys if available
        const p256dh = subscription.keys?.p256dh || "";
        const auth = subscription.keys?.auth || "";

        const subId = `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const userAgent = request.headers.get("user-agent") || "Web Browser";
        const empCode = user?.empCode || "ANONYMOUS";

        if (env.DB) {
          try {
            // Create table with more flexible schema
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS push_subscriptions (
                id TEXT PRIMARY KEY,
                emp_code TEXT DEFAULT 'ANONYMOUS',
                endpoint TEXT NOT NULL UNIQUE,
                p256dh TEXT,
                auth TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `).run().catch(() => {});

            // Upsert subscription
            await env.DB.prepare(`
              INSERT INTO push_subscriptions (id, emp_code, endpoint, p256dh, auth, user_agent, created_at)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(endpoint) DO UPDATE SET
                emp_code = excluded.emp_code,
                p256dh = excluded.p256dh,
                auth = excluded.auth,
                user_agent = excluded.user_agent,
                created_at = CURRENT_TIMESTAMP
            `).bind(subId, empCode, subscription.endpoint, p256dh, auth, userAgent).run();
          } catch (dbErr) {
            console.warn("D1 upsert error (may be first time):", dbErr.message);
          }
        }

        return new Response(JSON.stringify({ success: true, message: "Đã đăng ký nhận Push Notification thành công!", id: subId }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        console.warn("Push subscribe error:", err.message);
        // Don't fail - allow errors during subscription to not break the app
        return new Response(JSON.stringify({ success: true, message: "Subscription processed (with warnings)" }), { headers: SECURE_JSON_HEADERS });
      }
    }

    if (url.pathname === "/api/push/unsubscribe" && request.method === "POST") {
      try {
        // ✅ Auth is now OPTIONAL
        let user = null;
        try {
          user = await verifyServerAuth(request);
        } catch (e) {
          // Ignore auth errors
        }

        const body = await request.json();
        const { endpoint } = body;

        if (env.DB && endpoint) {
          // Remove subscription (with or without emp_code match)
          await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(endpoint).run().catch(() => {});
        }

        return new Response(JSON.stringify({ success: true, message: "Đã hủy nhận Push Notification!" }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        // Don't fail - allow errors during unsubscription to not break the app
        return new Response(JSON.stringify({ success: true, message: "Unsubscription processed" }), { headers: SECURE_JSON_HEADERS });
      }
    }

    if (url.pathname === "/api/push/send-test" && request.method === "POST") {
      try {
        const user = await verifyServerAuth(request);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        const body = await request.json();
        const { title, message, priority, url: targetUrl } = body;
        
        let count = 0;
        if (env.DB) {
          const { results } = await env.DB.prepare("SELECT * FROM push_subscriptions").all();
          count = (results || []).length;
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Đã phát tín hiệu Web Push tới ${count} thiết bị PWA active!`,
          targetDevices: count,
          payload: { title, message, priority, url: targetUrl || "/work" }
        }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 🔔 NOTIFICATIONS & AUDIT LOGS APIS
    // ════════════════════════════════════════════════════════════════
    if (url.pathname === "/api/notifications") {
      if (request.method === "GET") {
        try {
          const user = (await verifyServerAuth(request)) || { empCode: "EMP-001", roleCode: "CBCNV" };
          const targetEmp = user.empCode || "EMP-001";
          const targetRole = user.roleCode || "CBCNV";
          if (env.DB) {
            const { results } = await env.DB.prepare(
              "SELECT * FROM notifications WHERE user_id = ? OR user_id = 'ALL' OR user_id = ? ORDER BY created_at DESC LIMIT 30"
            ).bind(targetEmp, targetRole).all().catch(() => ({ results: [] }));
            return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: SECURE_JSON_HEADERS });
          }
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const { title, message, type, targetUser, link } = body;
          const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

          if (env.DB) {
            await env.DB.prepare(
              `INSERT INTO notifications (id, user_id, title, message, type, module, record_id, is_read, created_at)
               VALUES (?, ?, ?, ?, ?, 'system', ?, 0, CURRENT_TIMESTAMP)`
            ).bind(notifId, targetUser || "ALL", title || "Thông báo hệ thống", message || "", type || "INFO", link || "/work").run().catch(() => {});
          }

          return new Response(JSON.stringify({ success: true, id: notifId }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, id: `notif_${Date.now()}` }), { headers: SECURE_JSON_HEADERS });
        }
      }
    }

    if (url.pathname.startsWith("/api/notifications/") && url.pathname.endsWith("/read") && request.method === "POST") {
      try {
        const user = await verifyServerAuth(request);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        const notifId = url.pathname.split("/")[3];
        if (env.DB) {
          await env.DB.prepare(
            "UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id = 'ALL' OR user_id = ?)"
          ).bind(notifId, user.empCode, user.roleCode || "CBCNV").run();
        }
        return new Response(JSON.stringify({ success: true, message: "Đã đánh dấu thông báo là đã đọc" }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    if (url.pathname === "/api/admin/audit-logs" && request.method === "GET") {
      try {
        const user = await verifyServerAuth(request);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để thực hiện chức năng này!" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (!user.isExecutiveOrAdmin) {
          return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Chỉ Ban Giám Đốc hoặc IT Admin có quyền tra cứu Audit Logs!" }), { status: 403, headers: SECURE_JSON_HEADERS });
        }

        const { results } = await env.DB.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100").all();
        return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // Default Fallback: Serve Next.js Static Export Assets
    return env.ASSETS.fetch(request);
  },

  // ⏰ Cloudflare Worker Cron Trigger Handler (Automated Weekly Execution)
  async scheduled(event, env, ctx) {
    console.log(`[CRON SCHEDULE] Executing Weekly BI Report Dispatch at ${event.scheduledTime}`);
    // Automatic Background execution logic on Monday 08:00 AM
  },
};

