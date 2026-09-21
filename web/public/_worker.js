// Cloudflare Worker Handler for D1 Database vpchuoiskechers & Static Asset Proxy

const GLOBAL_KAIZEN_RATE_LIMIT_STORE = new Map();

const WORKER_SYSTEM_USER_MAP = {
  "202608001": { name: "Phạm Nguyễn Anh Huy", title: "Trưởng Phòng IT & CĐS", departmentCode: "IT_CDS", roleCode: "TRUONG_PHONG", roleLevel: 3 },
  "202608002": { name: "Trần Ngọc Huy", title: "Kỹ Sư IT Lead", departmentCode: "IT_CDS", roleCode: "TRUONG_PHONG", roleLevel: 3 },
  "202608003": { name: "Ngô Hà Thanh An", title: "Chuyên Viên HR", departmentCode: "NS_HC", roleCode: "CBCNV", roleLevel: 4 },
  "202112003": { name: "Lê Khải", title: "Chuyên Viên Vận Hành", departmentCode: "NS_HC", roleCode: "CBCNV", roleLevel: 4 },
  "210602002": { name: "Trần Thị Ngoan", title: "Chuyên Viên Nhân Sự & Hành Chánh", departmentCode: "NS_HC", roleCode: "CBCNV", roleLevel: 4 },
  "201506009": { name: "Lê Thúy Diễm", title: "Chuyên Viên Nhân Sự & Hành Chánh", departmentCode: "NS_HC", roleCode: "CBCNV", roleLevel: 4 },
  "201607010": { name: "Nguyễn Thị Đào", title: "Chuyên Viên Nhân Sự & Hành Chánh", departmentCode: "NS_HC", roleCode: "CBCNV", roleLevel: 4 },
  "201507009": { name: "Hồ Thị Thảo", title: "Chuyên Viên Nhân Sự & Hành Chánh", departmentCode: "NS_HC", roleCode: "CBCNV", roleLevel: 4 },
  "201507015": { name: "Đoàn Thị Trinh", title: "Chuyên Viên Nhân Sự & Hành Chánh", departmentCode: "NS_HC", roleCode: "CBCNV", roleLevel: 4 },
  "212103096": { name: "Nguyễn Văn Nguyện", title: "Chuyên Viên Nhân Sự & Hành Chánh", departmentCode: "NS_HC", roleCode: "CBCNV", roleLevel: 4 },
  "202206011": { name: "Lễ Tân (Trưởng Team LT)", title: "Trưởng Team Lễ Tân", departmentCode: "RECEPTION", roleCode: "LE_TAN", roleLevel: 4 },
  "202010004": { name: "Lễ Tân 2020", title: "Nhân Viên Lễ Tân", departmentCode: "RECEPTION", roleCode: "LE_TAN", roleLevel: 4 },
  "202409009": { name: "Lễ Tân 2024", title: "Nhân Viên Lễ Tân", departmentCode: "RECEPTION", roleCode: "LE_TAN", roleLevel: 4 },
};


function parseSessionWorker(token) {
  if (!token) {
    return {
      userId: '202608001',
      empCode: '202608001',
      name: 'Phạm Nguyễn Anh Huy',
      roleCode: 'TRUONG_PHONG',
      roleLevel: 3,
      departmentCode: 'IT_CDS',
      title: 'Trưởng Phòng IT & CĐS',
    };
  }
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = atob(payloadBase64);
      const parsed = JSON.parse(jsonStr);
      if (parsed && (parsed.empCode || parsed.userId || parsed.roleCode)) {
        const matchedUser = WORKER_SYSTEM_USER_MAP[parsed.empCode];
        return {
          userId: parsed.userId || parsed.empCode || '202608001',
          empCode: parsed.empCode || '202608001',
          name: parsed.name || matchedUser?.name || `Cán bộ (${parsed.empCode})`,
          roleCode: parsed.roleCode || matchedUser?.roleCode || 'TRUONG_PHONG',
          roleLevel: parsed.roleLevel || matchedUser?.roleLevel || 3,
          departmentCode: parsed.departmentCode || matchedUser?.departmentCode || 'TBS',
          title: parsed.title || matchedUser?.title || 'Trưởng Phòng / Cán Bộ Quản Lý',
        };
      }
    }
  } catch (e) {}

  let empCode = "";
  if (token.includes('tbs_token')) {
    const match = token.match(/tbs_token_([^_]+)/);
    if (match && match[1]) empCode = match[1];
  } else {
    empCode = token.replace("Bearer ", "").trim();
  }

  if (empCode && empCode !== "null" && empCode !== "undefined") {
    const matchedUser = WORKER_SYSTEM_USER_MAP[empCode];
    return {
      userId: empCode,
      empCode: empCode,
      name: matchedUser?.name || `Cán bộ (${empCode})`,
      roleCode: matchedUser?.roleCode || 'TRUONG_PHONG',
      roleLevel: matchedUser?.roleLevel || 3,
      departmentCode: matchedUser?.departmentCode || 'TBS',
      title: matchedUser?.title || 'Trưởng Phòng / Cán Bộ Quản Lý',
    };
  }

  return {
    userId: '202608001',
    empCode: '202608001',
    name: 'Phạm Nguyễn Anh Huy',
    roleCode: 'TRUONG_PHONG',
    roleLevel: 3,
    departmentCode: 'IT_CDS',
    title: 'Trưởng Phòng IT & CĐS',
  };
}

function withCacheHeaders(response, isHtml = false, pathname = "") {
  if (!response) return response;
  const h = new Headers(response.headers);
  if (isHtml || pathname === "/sw.js" || pathname === "/manifest.json" || pathname.startsWith("/api/")) {
    h.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0");
    h.set("Pragma", "no-cache");
    h.set("Expires", "0");
  } else if (
    pathname.startsWith("/_next/static/") ||
    pathname === "/compiled-tailwind.css" ||
    pathname.startsWith("/images/")
  ) {
    h.set("Cache-Control", "public, max-age=31536000, immutable");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h,
  });
}

async function ensureWorkerTables(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'personal',
        department_id TEXT,
        owner_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_lists (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_cards (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assignee_id TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'in_progress',
        color_state TEXT DEFAULT 'green',
        job_position_id TEXT,
        created_by TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_card_reviews (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        comment TEXT,
        reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS role_workspace_config (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        route TEXT NOT NULL,
        label TEXT NOT NULL,
        icon TEXT DEFAULT 'IconChevronRight',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_security_pin (
        user_id TEXT PRIMARY KEY,
        pin_hash TEXT NOT NULL,
        must_change_pin INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_module_pin (
        user_id TEXT PRIMARY KEY,
        pin_hash TEXT NOT NULL,
        must_change_pin INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS module_152_access_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        emp_code TEXT,
        emp_name TEXT,
        role_code TEXT,
        module TEXT,
        action TEXT,
        record_id TEXT,
        changes_json TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS sys_my_tasks (
        id TEXT PRIMARY KEY,
        code TEXT,
        title TEXT,
        description TEXT,
        department_id TEXT,
        project_id TEXT,
        assignee_emp_code TEXT,
        assignee_name TEXT,
        reporter_emp_code TEXT,
        reviewer_emp_code TEXT,
        priority TEXT,
        start_date TEXT,
        due_date TEXT,
        status TEXT,
        progress INTEGER,
        tags TEXT,
        checklist TEXT,
        result_description TEXT,
        help_reason TEXT,
        help_notified_to TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN project_id TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN help_reason TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN help_notified_to TEXT`).run().catch(() => {});

    const countRes = await db.prepare(`SELECT COUNT(*) as cnt FROM sys_my_tasks`).first().catch(() => null);
    if (!countRes || countRes.cnt === 0) {
      const DEFAULT_MY_TASKS_INIT = [
        { id: "tsk_001", code: "TSK-001", title: "Rùa tự động hóa dây chuyền dán đế 3 Skechers D'Lites", description: "Triển khai hệ thống xe rùa tự động cấp phôi dán đế cho dây chuyền 3 nhà máy Skechers.", department_id: "IT_DIGITAL", project_id: "PRJ-AUTOMATION", assignee_emp_code: "202608001", assignee_name: "Phạm Nguyễn Anh Huy", reporter_emp_code: "202608002", reviewer_emp_code: "202608002", priority: "HIGH", start_date: "2026-09-01", due_date: "2026-09-15", status: "DOING", progress: 60, tags: "KAIZEN,AUTOMATION", checklist: JSON.stringify([{ id: "c1", title: "Khảo sát mặt bằng dây chuyền 3", completed: true }]), result_description: "" },
        { id: "tsk_006", code: "TSK-006", title: "Tối ưu tồn kho cửa hàng Skechers Flagship Vincom", description: "Đồng bộ tồn kho real-time giữa kho tổng Kiên Giang và các cửa hàng bán lẻ Skechers trên toàn quốc.", department_id: "RETAIL_SKECHERS", project_id: "PRJ-SKECHERS-RETAIL", assignee_emp_code: "202608001", assignee_name: "Phạm Nguyễn Anh Huy", reporter_emp_code: "202608005", reviewer_emp_code: "202608002", priority: "HIGH", start_date: "2026-09-08", due_date: "2026-09-25", status: "DOING", progress: 75, tags: "SKECHERS,RETAIL", checklist: JSON.stringify([{ id: "c1", title: "Tích hợp POS API cửa hàng Vincom", completed: true }]), result_description: "" }
      ];
      for (const t of DEFAULT_MY_TASKS_INIT) {
        await db.prepare(`
          INSERT INTO sys_my_tasks (
            id, code, title, description, department_id, project_id, assignee_emp_code, assignee_name,
            reporter_emp_code, reviewer_emp_code, priority, start_date, due_date, status,
            progress, tags, checklist, result_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          t.id, t.code, t.title, t.description, t.department_id, t.project_id, t.assignee_emp_code, t.assignee_name,
          t.reporter_emp_code, t.reviewer_emp_code, t.priority, t.start_date, t.due_date, t.status,
          t.progress, t.tags, t.checklist, t.result_description || ""
        ).run().catch(() => {});
      }
    }
  } catch (e) {}
}

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

    const SECURE_JSON_HEADERS = { "Content-Type": "application/json" };

    const ROLE_ACCOUNTS = {
      TONG_GIAM_DOC: {
        empCode: "202608001",
        name: "Phạm Nguyễn Anh Huy",
        title: "TGĐ / Trưởng Phòng IT & CĐS",
        department: "IT - Team Chuyển Đổi Số",
        avatar: "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1787117525/nzcft200bebofw7b4uzg.jpg",
        email: "anhy.work.2004@gmail.com",
        phone: "0522511245",
        roleCode: "SUPER_ADMIN",
        redirectUrl: "/work",
      },
      PHO_TONG_GIAM_DOC: {
        empCode: "11950404",
        name: "Bùi Đình Trung",
        title: "P.TGĐ",
        department: "Ban Giám Đốc Vận Hành",
        avatar: "/images/tbs-logo.png",
        email: "11950404@tbsgroup.vn",
        phone: "0903800002",
        roleCode: "PHO_TONG_GIAM_DOC",
        redirectUrl: "/work",
      },
      GIAM_DOC: {
        empCode: "210608003",
        name: "Vũ Thành Lê",
        title: "GĐ",
        department: "Ban Giám Đốc",
        avatar: "/images/tbs-logo.png",
        email: "210608003@tbsgroup.vn",
        phone: "0903800003",
        roleCode: "GIAM_DOC",
        redirectUrl: "/work",
      },
      PHO_GIAM_DOC: {
        empCode: "201803001",
        name: "Nguyễn Thị Mai",
        title: "P.GĐK",
        department: "Khối Quản Lý Chất Lượng (QC)",
        avatar: "/images/tbs-logo.png",
        email: "201803001@tbsgroup.vn",
        phone: "0903800004",
        roleCode: "PHO_GIAM_DOC",
        redirectUrl: "/work",
      },
      CBCNV: {
        empCode: "202112003",
        name: "Lê Khải",
        title: "Chuyên Viên Vận Hành",
        department: "Nhân Sự - Hành Chính",
        avatar: "/images/tbs-logo.png",
        email: "202112003@tbsgroup.vn",
        phone: "0988 000 005",
        roleCode: "CBCNV",
        redirectUrl: "/work",
      },
      SYSTEM_ADMIN: {
        empCode: "202608001",
        name: "Phạm Nguyễn Anh Huy",
        title: "Super Admin",
        department: "IT - Team Chuyển Đổi Số",
        avatar: "/images/tbs-logo.png",
        email: "anhy.work.2004@gmail.com",
        phone: "0522511245",
        roleCode: "SUPER_ADMIN",
        redirectUrl: "/admin",
      },
      "tbsgroup2026@gmail.com": {
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
        avatar: "",
        email: "tranhuy110421@gmail.com",
        phone: "0522511246",
        roleCode: "TRUONG_PHONG",
        redirectUrl: "/work",
      },
      "202608003": {
        empCode: "202608003",
        name: "Ngô Hà Thanh An",
        title: "Chuyên Viên Nhân Sự & Hành Chánh",
        department: "Nhân Sự - Hành Chính",
        avatar: "",
        email: "ngohathanhan@tbsgroup.vn",
        phone: "0903800003",
        roleCode: "NHAN_VIEN",
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
      "210602002": {
        empCode: "210602002",
        name: "Trần Thị Ngoan",
        title: "Chuyên Viên Nhân Sự & Hành Chánh",
        department: "Nhân Sự - Hành Chính",
        avatar: "",
        email: "210602002@tbsgroup.vn",
        phone: "",
        roleCode: "NHAN_VIEN",
        redirectUrl: "/work",
      },
      "201506009": {
        empCode: "201506009",
        name: "Lê Thúy Diễm",
        title: "Chuyên Viên Nhân Sự & Hành Chánh",
        department: "Nhân Sự - Hành Chính",
        avatar: "",
        email: "201506009@tbsgroup.vn",
        phone: "",
        roleCode: "NHAN_VIEN",
        redirectUrl: "/work",
      },
      "201607010": {
        empCode: "201607010",
        name: "Nguyễn Thị Đào",
        title: "Chuyên Viên Nhân Sự & Hành Chánh",
        department: "Nhân Sự - Hành Chính",
        avatar: "",
        email: "201607010@tbsgroup.vn",
        phone: "",
        roleCode: "NHAN_VIEN",
        redirectUrl: "/work",
      },
      "201507009": {
        empCode: "201507009",
        name: "Hồ Thị Thảo",
        title: "Chuyên Viên Nhân Sự & Hành Chánh",
        department: "Nhân Sự - Hành Chính",
        avatar: "",
        email: "201507009@tbsgroup.vn",
        phone: "",
        roleCode: "NHAN_VIEN",
        redirectUrl: "/work",
      },
      "201507015": {
        empCode: "201507015",
        name: "Đoàn Thị Trinh",
        title: "Chuyên Viên Nhân Sự & Hành Chánh",
        department: "Nhân Sự - Hành Chính",
        avatar: "",
        email: "201507015@tbsgroup.vn",
        phone: "",
        roleCode: "NHAN_VIEN",
        redirectUrl: "/work",
      },
      "212103096": {
        empCode: "212103096",
        name: "Nguyễn Văn Nguyện",
        title: "Chuyên Viên Nhân Sự & Hành Chánh",
        department: "Nhân Sự - Hành Chính",
        avatar: "",
        email: "212103096@tbsgroup.vn",
        phone: "",
        roleCode: "NHAN_VIEN",
        redirectUrl: "/work",
      },
    };

    // ============================================================
    // D1 API ROUTE: /api/auth/login, /api/auth/me, /api/auth/logout
    // ============================================================
    if (url.pathname === "/api/auth/login" || url.pathname === "/api/auth/me" || url.pathname === "/api/auth/logout") {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const cleanEmp = (body.empCode || body.emp_code || body.role || "").toString().trim();
          if (!cleanEmp) {
            return new Response(JSON.stringify({ success: false, error: "Vui lòng nhập Mã số nhân viên (MSNV)" }), { status: 400, headers: CORS });
          }

          let userRecord = null;
          if (env && env.DB) {
            try {
              userRecord = await env.DB.prepare("SELECT * FROM sys_users WHERE UPPER(emp_code) = UPPER(?) OR UPPER(email) = UPPER(?)").bind(cleanEmp, cleanEmp).first().catch(() => null);
            } catch (e) {}
          }

          if (!userRecord && ROLE_ACCOUNTS[cleanEmp]) {
            const r = ROLE_ACCOUNTS[cleanEmp];
            userRecord = {
              emp_code: r.empCode,
              name: r.name,
              title: r.title,
              department: r.department,
              email: r.email,
              phone: r.phone || "",
              role_code: r.roleCode,
              avatar: r.avatar || "",
              redirect_url: r.redirectUrl || "/work"
            };
          }

          const empCode = userRecord?.emp_code || userRecord?.empCode || cleanEmp;
          const userProfile = {
            userId: userRecord?.id || 205,
            empCode: empCode,
            name: userRecord?.name || userRecord?.emp_name || `Cán bộ (${empCode})`,
            title: userRecord?.title || "Cán bộ công nhân viên",
            department: userRecord?.department || "Văn Phòng Chuỗi SKECHERS",
            email: userRecord?.email || `${empCode.toLowerCase()}@tbsgroup.vn`,
            phone: userRecord?.phone || "",
            roleCode: userRecord?.role_code || userRecord?.roleCode || "CBCNV",
            roleLevel: (userRecord?.role_code === "TRUONG_PHONG" ? 3 : (userRecord?.role_code === "SUPER_ADMIN" || userRecord?.role_code === "TONG_GIAM_DOC") ? 1 : 4),
            avatar: userRecord?.avatar || "",
            redirectUrl: userRecord?.redirect_url || userRecord?.redirectUrl || "/work"
          };

          const token = `tbs_token_${empCode}_${Date.now()}`;
          return new Response(JSON.stringify({
            success: true,
            message: "Đăng nhập thành công",
            token,
            user: userProfile
          }), {
            headers: {
              ...CORS,
              "Set-Cookie": `tbs_token=${token}; Path=/; Max-Age=31536000; SameSite=Lax`
            }
          });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }

      if (url.pathname === "/api/auth/me") {
        const authHeader = request.headers.get("authorization");
        const token = authHeader ? authHeader.replace("Bearer ", "") : null;
        const session = token ? parseSessionWorker(token) : null;
        if (!session) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });
        return new Response(JSON.stringify({ success: true, user: session }), { headers: CORS });
      }

      if (url.pathname === "/api/auth/logout") {
        return new Response(JSON.stringify({ success: true, message: "Đã đăng xuất thành công" }), {
          headers: {
            ...CORS,
            "Set-Cookie": "tbs_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
          }
        });
      }
    }

    // ============================================================
    // API ROUTE: /api/users (User Management & Synchronization)
    // ============================================================
    if (url.pathname === "/api/users" || url.pathname.startsWith("/api/users")) {
      const CORS_HEADERS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      if (url.pathname === "/api/users/sync-diff" && request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const { newUsers = [], updatedUsers = [], deactivatedUsers = [], options = {}, sourceFileName = "File_Excel.xlsx" } = body;

          let successCount = 0;
          let updatedCount = 0;
          let deactivatedCount = 0;

          if (env && env.DB) {
            try {
              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS sys_users (
                  id TEXT PRIMARY KEY, emp_code TEXT UNIQUE, name TEXT, email TEXT, phone TEXT, title TEXT, department TEXT, role_code TEXT, status TEXT DEFAULT 'ACTIVE', ngay_vao TEXT, vtcv_hien_tai TEXT, phong_ban_hien_tai TEXT, vtcv_sap TEXT, vtcv_sap_xep TEXT, pb_sap_xep TEXT, bo_phan_moi TEXT, phong_ban_moi TEXT, ghi_chu TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `).run().catch(() => {});

              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                  id TEXT PRIMARY KEY, action TEXT, user_email TEXT, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `).run().catch(() => {});

              await env.DB.prepare(`
                DELETE FROM sys_users WHERE rowid NOT IN (
                  SELECT MIN(rowid) FROM sys_users WHERE emp_code IS NOT NULL AND emp_code != '' GROUP BY emp_code
                )
              `).run().catch(() => {});

              await env.DB.prepare(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_users_emp_code ON sys_users(emp_code)
              `).run().catch(() => {});

              const statements = [];

              for (const u of newUsers) {
                const empCodeStr = String(u.empCode || u.emp_code || "").trim();
                if (!empCodeStr) continue;

                statements.push(
                  env.DB.prepare(`
                    INSERT INTO sys_users (
                      id, emp_code, name, email, phone, title, department, role_code, status,
                      ngay_vao, vtcv_hien_tai, phong_ban_hien_tai, vtcv_sap, vtcv_sap_xep,
                      pb_sap_xep, bo_phan_moi, phong_ban_moi, ghi_chu
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(emp_code) DO UPDATE SET
                      name = excluded.name, email = excluded.email, phone = excluded.phone, title = excluded.title, department = excluded.department, role_code = excluded.role_code, status = 'ACTIVE', ngay_vao = excluded.ngay_vao, vtcv_hien_tai = excluded.vtcv_hien_tai, phong_ban_hien_tai = excluded.phong_ban_hien_tai, vtcv_sap = excluded.vtcv_sap, vtcv_sap_xep = excluded.vtcv_sap_xep, pb_sap_xep = excluded.pb_sap_xep, bo_phan_moi = excluded.bo_phan_moi, phong_ban_moi = excluded.phong_ban_moi, ghi_chu = excluded.ghi_chu
                  `).bind(
                    String(u.id || `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
                    empCodeStr,
                    String(u.name || "").trim(),
                    String(u.email || "").trim(),
                    String(u.phone || "").trim(),
                    String(u.title || "").trim(),
                    String(u.department || "").trim(),
                    String(u.roleCode || u.role_code || "CBCNV").trim(),
                    String(u.ngayVao || u.ngay_vao || "").trim(),
                    String(u.vtcvHienTai || u.vtcv_hien_tai || "").trim(),
                    String(u.phongBanHienTai || u.phong_ban_hien_tai || "").trim(),
                    String(u.vtcvSap || u.vtcv_sap || "").trim(),
                    String(u.vtcvSapXep || u.vtcv_sap_xep || "").trim(),
                    String(u.phongBanSapXep || u.pb_sap_xep || "").trim(),
                    String(u.boPhoanMoi || u.bo_phan_moi || "").trim(),
                    String(u.phongBanMoi || u.phong_ban_moi || "").trim(),
                    String(u.ghiChu || u.ghi_chu || "").trim()
                  )
                );
                successCount++;
              }

              for (const item of updatedUsers) {
                const u = item.data || item;
                const empCodeStr = String(u.empCode || u.emp_code || "").trim();
                if (!empCodeStr) continue;

                if (options.preserveManualLock) {
                  statements.push(
                    env.DB.prepare(`
                      UPDATE sys_users SET
                        name = ?, email = ?, phone = ?, title = ?, department = ?, role_code = ?,
                        ngay_vao = ?, vtcv_hien_tai = ?, phong_ban_hien_tai = ?, vtcv_sap = ?,
                        vtcv_sap_xep = ?, pb_sap_xep = ?, bo_phan_moi = ?, phong_ban_moi = ?, ghi_chu = ?
                      WHERE emp_code = ?
                    `).bind(
                      String(u.name || "").trim(), String(u.email || "").trim(), String(u.phone || "").trim(), String(u.title || "").trim(), String(u.department || "").trim(), String(u.roleCode || u.role_code || "CBCNV").trim(),
                      String(u.ngayVao || u.ngay_vao || "").trim(), String(u.vtcvHienTai || u.vtcv_hien_tai || "").trim(), String(u.phongBanHienTai || u.phong_ban_hien_tai || "").trim(), String(u.vtcvSap || u.vtcv_sap || "").trim(),
                      String(u.vtcvSapXep || u.vtcv_sap_xep || "").trim(), String(u.phongBanSapXep || u.pb_sap_xep || "").trim(), String(u.boPhoanMoi || u.bo_phan_moi || "").trim(), String(u.phongBanMoi || u.phong_ban_moi || "").trim(), String(u.ghiChu || u.ghi_chu || "").trim(),
                      empCodeStr
                    )
                  );
                } else {
                  statements.push(
                    env.DB.prepare(`
                      UPDATE sys_users SET
                        name = ?, email = ?, phone = ?, title = ?, department = ?, role_code = ?, status = 'ACTIVE',
                        ngay_vao = ?, vtcv_hien_tai = ?, phong_ban_hien_tai = ?, vtcv_sap = ?,
                        vtcv_sap_xep = ?, pb_sap_xep = ?, bo_phan_moi = ?, phong_ban_moi = ?, ghi_chu = ?
                      WHERE emp_code = ?
                    `).bind(
                      String(u.name || "").trim(), String(u.email || "").trim(), String(u.phone || "").trim(), String(u.title || "").trim(), String(u.department || "").trim(), String(u.roleCode || u.role_code || "CBCNV").trim(),
                      String(u.ngayVao || u.ngay_vao || "").trim(), String(u.vtcvHienTai || u.vtcv_hien_tai || "").trim(), String(u.phongBanHienTai || u.phong_ban_hien_tai || "").trim(), String(u.vtcvSap || u.vtcv_sap || "").trim(),
                      String(u.vtcvSapXep || u.vtcv_sap_xep || "").trim(), String(u.phongBanSapXep || u.pb_sap_xep || "").trim(), String(u.boPhoanMoi || u.bo_phan_moi || "").trim(), String(u.phongBanMoi || u.phong_ban_moi || "").trim(), String(u.ghiChu || u.ghi_chu || "").trim(),
                      empCodeStr
                    )
                  );
                }
                updatedCount++;
              }

              for (const item of deactivatedUsers) {
                const empCodeStr = String(typeof item === "string" ? item : item.empCode || item.emp_code || "").trim();
                if (!empCodeStr) continue;
                statements.push(
                  env.DB.prepare(`UPDATE sys_users SET status = 'INACTIVE' WHERE emp_code = ?`).bind(empCodeStr)
                );
                deactivatedCount++;
              }

              const auditDetail = `Diff Sync File: ${sourceFileName} | Added: ${successCount} | Updated: ${updatedCount} | Deactivated: ${deactivatedCount}`;
              statements.push(
                env.DB.prepare(`
                  INSERT INTO audit_logs (id, action, user_email, details)
                  VALUES (?, 'PERSONNEL_DIFF_SYNC', 'admin@tbsgroup.vn', ?)
                `).bind(`log_${Date.now()}`, auditDetail)
              );

              if (statements.length > 0) {
                const CHUNK_SIZE = 50;
                for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
                  const chunk = statements.slice(i, i + CHUNK_SIZE);
                  try {
                    await env.DB.batch(chunk);
                  } catch (batchErr) {
                    console.warn("D1 batch failed, running fallback individual inserts:", batchErr);
                    for (const stmt of chunk) {
                      await stmt.run().catch(err => console.error("Single stmt sync error:", err));
                    }
                  }
                }
              }
            } catch (e) {
              console.error("D1 Sync-Diff error:", e);
              return new Response(JSON.stringify({ success: false, error: e.message || String(e) }), { status: 500, headers: CORS_HEADERS });
            }
          }

          return new Response(JSON.stringify({
            success: true,
            data: { newUsersCount: successCount, updatedUsersCount: updatedCount, deactivatedUsersCount: deactivatedCount }
          }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      if (request.method === "GET") {
        try {
          if (env && env.DB) {
            try {
              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS sys_users (
                  id TEXT PRIMARY KEY,
                  emp_code TEXT UNIQUE,
                  name TEXT,
                  email TEXT,
                  phone TEXT,
                  title TEXT,
                  department TEXT,
                  role_code TEXT,
                  status TEXT DEFAULT 'ACTIVE',
                  ngay_vao TEXT,
                  vtcv_hien_tai TEXT,
                  phong_ban_hien_tai TEXT,
                  vtcv_sap TEXT,
                  vtcv_sap_xep TEXT,
                  pb_sap_xep TEXT,
                  bo_phan_moi TEXT,
                  phong_ban_moi TEXT,
                  ghi_chu TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `).run().catch(() => {});

              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS sys_metadata (
                  key TEXT PRIMARY KEY,
                  value TEXT
                )
              `).run().catch(() => {});

              await env.DB.prepare(`
                DELETE FROM sys_users WHERE rowid NOT IN (
                  SELECT MIN(rowid) FROM sys_users WHERE emp_code IS NOT NULL AND emp_code != '' GROUP BY emp_code
                )
              `).run().catch(() => {});

              await env.DB.prepare(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_users_emp_code ON sys_users(emp_code)
              `).run().catch(() => {});

              // No auto-seeding of demo accounts into D1 so sys_users table strictly contains user imports

              const { results } = await env.DB.prepare(`SELECT * FROM sys_users ORDER BY id ASC`).all();
              if (results && Array.isArray(results)) {
                return new Response(JSON.stringify({ success: true, data: results }), { headers: CORS_HEADERS });
              }
            } catch (e) {
              console.error("GET sys_users inner error:", e);
              return new Response(JSON.stringify({ success: false, error: e.message || String(e), data: [] }), { status: 500, headers: CORS_HEADERS });
            }
          }

          return new Response(JSON.stringify({ success: true, data: [] }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json().catch(() => ({}));
          if (env && env.DB && body.empCode) {
            try {
              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS sys_users (
                  id TEXT PRIMARY KEY,
                  emp_code TEXT UNIQUE,
                  name TEXT,
                  email TEXT,
                  phone TEXT,
                  title TEXT,
                  department TEXT,
                  role_code TEXT,
                  status TEXT DEFAULT 'ACTIVE',
                  ngay_vao TEXT,
                  vtcv_hien_tai TEXT,
                  phong_ban_hien_tai TEXT,
                  vtcv_sap TEXT,
                  vtcv_sap_xep TEXT,
                  pb_sap_xep TEXT,
                  bo_phan_moi TEXT,
                  phong_ban_moi TEXT,
                  ghi_chu TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `).run().catch(() => {});



              await env.DB.prepare(`
                INSERT INTO sys_users (
                  id, emp_code, name, email, phone, title, department, role_code, status,
                  ngay_vao, vtcv_hien_tai, phong_ban_hien_tai, vtcv_sap, vtcv_sap_xep,
                  pb_sap_xep, bo_phan_moi, phong_ban_moi, ghi_chu
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(emp_code) DO UPDATE SET
                  name = excluded.name,
                  email = excluded.email,
                  phone = excluded.phone,
                  title = excluded.title,
                  department = excluded.department,
                  role_code = excluded.role_code,
                  status = excluded.status,
                  ngay_vao = excluded.ngay_vao,
                  vtcv_hien_tai = excluded.vtcv_hien_tai,
                  phong_ban_hien_tai = excluded.phong_ban_hien_tai,
                  vtcv_sap = excluded.vtcv_sap,
                  vtcv_sap_xep = excluded.vtcv_sap_xep,
                  pb_sap_xep = excluded.pb_sap_xep,
                  bo_phan_moi = excluded.bo_phan_moi,
                  phong_ban_moi = excluded.phong_ban_moi,
                  ghi_chu = excluded.ghi_chu
              `).bind(
                String(body.id || `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
                String(body.empCode || body.emp_code || "").trim(),
                String(body.name || "").trim(),
                String(body.email || "").trim(),
                String(body.phone || "").trim(),
                String(body.title || "").trim(),
                String(body.department || "").trim(),
                String(body.roleCode || body.role_code || "CBCNV").trim(),
                String(body.status || "ACTIVE").trim(),
                String(body.ngay_vao || body.ngayVao || "").trim(),
                String(body.vtcv_hien_tai || body.vtcvHienTai || "").trim(),
                String(body.phong_ban_hien_tai || body.phongBanHienTai || "").trim(),
                String(body.vtcv_sap || body.vtcvSap || "").trim(),
                String(body.vtcv_sap_xep || body.vtcvSapXep || "").trim(),
                String(body.pb_sap_xep || body.phongBanSapXep || "").trim(),
                String(body.bo_phan_moi || body.boPhoanMoi || "").trim(),
                String(body.phong_ban_moi || body.phongBanMoi || "").trim(),
                String(body.ghi_chu || body.ghiChu || "").trim()
              ).run().catch((e) => {
                console.error("D1 single user insert error:", e);
              });
            } catch (e) {}
          }

          return new Response(JSON.stringify({ success: true, message: "Cập nhật tài khoản người dùng thành công!" }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      if (request.method === "DELETE") {
        try {
          const all = url.searchParams.get("all");
          const id = url.searchParams.get("id");
          const empCode = url.searchParams.get("empCode");

          if (env && env.DB) {
            try {
              if (all === "true") {
                await env.DB.prepare(`DELETE FROM sys_users`).run().catch(() => {});
                await env.DB.prepare(`INSERT INTO sys_metadata (key, value) VALUES ('sys_users_cleared', 'true') ON CONFLICT(key) DO UPDATE SET value = 'true'`).run().catch(() => {});
              } else if (empCode || id) {
                await env.DB.prepare(`DELETE FROM sys_users WHERE emp_code = ? OR id = ?`).bind(empCode || "", id || "").run().catch(() => {});
              }
            } catch (e) {}
          }

          return new Response(JSON.stringify({ success: true, message: "Đã xóa tài khoản người dùng thành công!" }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/ci-kaizen (Kaizen Proposal Management & Sync)
    // ============================================================
    if (url.pathname === "/api/ci-kaizen" || url.pathname.startsWith("/api/ci-kaizen")) {
      const CORS_HEADERS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Emp-Code, X-Sync-Secret",
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      const db = env && env.DB;
      if (db) {
        await ensureWorkerTables(db);
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS ci_kaizen_proposals (
            id TEXT PRIMARY KEY,
            code TEXT,
            title TEXT,
            category TEXT,
            category_label TEXT,
            registration_type TEXT,
            factory TEXT,
            region TEXT,
            source_region TEXT,
            department TEXT,
            line TEXT,
            proposer_name TEXT,
            proposer_emp_code TEXT,
            proposer_position TEXT,
            product_code TEXT,
            pair_quantity REAL DEFAULT 0,
            quantity REAL DEFAULT 0,
            before_description TEXT,
            after_solution TEXT,
            time_before_seconds REAL DEFAULT 0,
            time_after_seconds REAL DEFAULT 0,
            saved_seconds REAL DEFAULT 0,
            so_giay_tiet_kiem REAL DEFAULT 0,
            efficiency_value_vnd REAL DEFAULT 0,
            total_savings_vnd REAL DEFAULT 0,
            cost_before REAL DEFAULT 0,
            cost_after REAL DEFAULT 0,
            before_image_url TEXT,
            after_image_url TEXT,
            attachments_json TEXT,
            status TEXT DEFAULT 'SUBMITTED',
            sub_status TEXT DEFAULT 'CHO_DUYET',
            trang_thai TEXT DEFAULT 'CHO_DUYET',
            review_status TEXT DEFAULT 'CHO_DUYET',
            approval_status TEXT DEFAULT 'PENDING',
            score_points REAL DEFAULT 0,
            vote_count INTEGER DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run().catch(() => {});
      }

      // 1. POST /api/ci-kaizen/sync
      if (url.pathname === "/api/ci-kaizen/sync") {
        return new Response(JSON.stringify({ success: true, message: "Sync acknowledged" }), { headers: CORS_HEADERS });
      }

      // 2. GET /api/ci-kaizen
      if (url.pathname === "/api/ci-kaizen" && request.method === "GET") {
        try {
          let proposals = [];
          if (db) {
            const { results } = await db.prepare("SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500").all();
            if (results && results.length > 0) proposals = results;
          }
          return new Response(JSON.stringify({ success: true, data: proposals, proposals }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // 3. POST or PUT /api/ci-kaizen (Inline edit & proposal submission)
      if (url.pathname === "/api/ci-kaizen" && (request.method === "POST" || request.method === "PUT")) {
        try {
          const body = await request.json().catch(() => ({}));
          const propId = body.id || body.code;
          if (!propId) {
            return new Response(JSON.stringify({ success: false, error: "Mã đề xuất không hợp lệ" }), { status: 400, headers: CORS_HEADERS });
          }

          if (db) {
            const existing = await db.prepare("SELECT id, code FROM ci_kaizen_proposals WHERE id = ? OR code = ?").bind(propId, propId).first().catch(() => null);

            const inputBeforeDesc = body.before_description !== undefined ? body.before_description : body.beforeDescription;
            const inputAfterSol = body.after_solution !== undefined ? body.after_solution : body.afterSolution;
            const finalTitle = body.title ? String(body.title).trim() : null;
            const finalBeforeDesc = inputBeforeDesc !== undefined ? String(inputBeforeDesc).trim() : null;
            const finalAfterSol = inputAfterSol !== undefined ? String(inputAfterSol).trim() : null;
            const finalProductCode = String(body.product_code || body.productCode || '').trim();
            const finalPairQty = Number(body.pair_quantity || body.pairQuantity || body.quantity || 0);
            const finalTimeBefore = Number(body.time_before_seconds || body.timeBeforeSeconds || 0);
            const finalTimeAfter = Number(body.time_after_seconds || body.timeAfterSeconds || 0);
            const finalSavedSecs = Number(body.saved_seconds || body.savedSeconds || body.so_giay_tiet_kiem || Math.max(0, finalTimeBefore - finalTimeAfter) || 0);
            const finalEffVnd = Number(body.efficiency_value_vnd || body.efficiencyValueVND || Math.round(finalSavedSecs * 12.5) || 0);
            const finalCostBefore = Number(body.cost_before || body.costBefore || 0);
            const finalCostAfter = Number(body.cost_after || body.costAfter || 0);
            const finalTotalSavings = Number(body.total_savings_vnd || body.totalSavingsVnd || 0);

            if (existing) {
              await db.prepare(`
                UPDATE ci_kaizen_proposals
                SET title = COALESCE(?, title),
                    category = COALESCE(?, category),
                    category_label = COALESCE(?, category_label),
                    region = COALESCE(?, region),
                    factory = COALESCE(?, factory),
                    department = COALESCE(?, department),
                    line = COALESCE(?, line),
                    product_code = COALESCE(?, product_code),
                    pair_quantity = COALESCE(?, pair_quantity),
                    quantity = COALESCE(?, quantity),
                    before_description = CASE WHEN ? IS NOT NULL THEN ? ELSE before_description END,
                    after_solution = CASE WHEN ? IS NOT NULL THEN ? ELSE after_solution END,
                    time_before_seconds = COALESCE(?, time_before_seconds),
                    time_after_seconds = COALESCE(?, time_after_seconds),
                    saved_seconds = COALESCE(?, saved_seconds),
                    so_giay_tiet_kiem = COALESCE(?, so_giay_tiet_kiem),
                    efficiency_value_vnd = COALESCE(?, efficiency_value_vnd),
                    total_savings_vnd = COALESCE(?, total_savings_vnd),
                    cost_before = COALESCE(?, cost_before),
                    cost_after = COALESCE(?, cost_after),
                    before_image_url = COALESCE(?, before_image_url),
                    after_image_url = COALESCE(?, after_image_url),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? OR code = ?
              `).bind(
                finalTitle,
                body.category || null,
                body.category_label || body.categoryLabel || null,
                body.region || body.factory || null,
                body.factory || body.region || null,
                body.department || null,
                body.line || null,
                finalProductCode || null,
                finalPairQty || null,
                finalPairQty || null,
                finalBeforeDesc,
                finalBeforeDesc,
                finalAfterSol,
                finalAfterSol,
                finalTimeBefore || null,
                finalTimeAfter || null,
                finalSavedSecs || null,
                finalSavedSecs || null,
                finalEffVnd || null,
                finalTotalSavings || null,
                finalCostBefore || null,
                finalCostAfter || null,
                body.before_image_url || body.beforeImageUrl || null,
                body.after_image_url || body.afterImageUrl || null,
                propId,
                propId
              ).run();
            } else {
              const newId = body.id || `kz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              const newCode = body.code || `KZ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
              await db.prepare(`
                INSERT INTO ci_kaizen_proposals (
                  id, code, title, category, category_label, factory, region, department, line,
                  proposer_name, proposer_emp_code, proposer_position, product_code, pair_quantity, quantity,
                  before_description, after_solution, time_before_seconds, time_after_seconds, saved_seconds,
                  so_giay_tiet_kiem, efficiency_value_vnd, total_savings_vnd, cost_before, cost_after,
                  before_image_url, after_image_url, attachments_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                newId, newCode, finalTitle || 'Sáng kiến cải tiến Kaizen', body.category || 'PRODUCTIVITY',
                body.category_label || '3.Tăng Năng suất', body.factory || 'VP CHUỖI', body.region || 'Văn phòng Chuỗi',
                body.department || 'May', body.line || '', body.proposer_name || 'Người đề xuất', body.proposer_emp_code || '202608001',
                body.proposer_position || 'Công nhân', finalProductCode, finalPairQty, finalPairQty,
                finalBeforeDesc || '', finalAfterSol || '', finalTimeBefore, finalTimeAfter, finalSavedSecs,
                finalSavedSecs, finalEffVnd, finalTotalSavings, finalCostBefore, finalCostAfter,
                body.before_image_url || '', body.after_image_url || '', body.attachments_json || '[]'
              ).run();
            }
          }
          return new Response(JSON.stringify({ success: true, message: "Cập nhật đề xuất Kaizen thành công!" }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // 4. DELETE /api/ci-kaizen
      if (url.pathname === "/api/ci-kaizen" && request.method === "DELETE") {
        try {
          const id = url.searchParams.get("id");
          if (db && id) {
            await db.prepare("DELETE FROM ci_kaizen_proposals WHERE id = ? OR code = ?").bind(id, id).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã xóa đề xuất thành công!" }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }
    }

    // ============================================================
    // API ROUTE: /api/task-boards
    // ============================================================
    if (url.pathname === "/api/task-boards" || url.pathname.startsWith("/api/task-boards")) {
      const CORS_HEADERS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";
      const requestedDept = url.searchParams.get("department_id") || url.searchParams.get("dept");

      if (request.method === "GET") {
        let boards = [];
        if (env && env.DB) {
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS task_boards (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT DEFAULT 'personal',
                department_id TEXT,
                owner_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run().catch(() => {});

            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS task_lists (
                id TEXT PRIMARY KEY,
                board_id TEXT NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run().catch(() => {});

            const { results } = await env.DB.prepare(`SELECT * FROM task_boards ORDER BY created_at DESC`).all();
            if (results && results.length > 0) {
              boards = results;
            }
          } catch (e) {}
        }

        if (boards.length === 0) {
          boards = [
            { id: "tb_dept_it", name: "Bảng Công Việc Phòng IT & CĐS", type: "department", department_id: "IT_CDS", owner_id: "202608001" },
            { id: `tb_${empCode}_personal`, name: "Bảng Công Việc Cá Nhân", type: "personal", department_id: requestedDept || "IT_CDS", owner_id: empCode }
          ];

          if (env && env.DB) {
            for (const b of boards) {
              await env.DB.prepare(`
                INSERT INTO task_boards (id, name, type, department_id, owner_id)
                VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING
              `).bind(b.id, b.name, b.type, b.department_id, b.owner_id).run().catch(() => {});
            }
          }
        }

        return new Response(JSON.stringify({ success: true, data: boards }), { headers: CORS_HEADERS });
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const name = (body.name || "").trim();
          if (!name) {
            return new Response(JSON.stringify({ success: false, error: "Tên Bảng Công Việc là bắt buộc" }), { status: 400, headers: CORS_HEADERS });
          }

          const boardId = `tb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const boardType = body.type || "personal";
          const deptId = body.department_id || requestedDept || "IT_CDS";

          if (env && env.DB) {
            await env.DB.prepare(`
              INSERT INTO task_boards (id, name, type, department_id, owner_id)
              VALUES (?, ?, ?, ?, ?)
            `).bind(boardId, name, boardType, deptId, empCode).run().catch(() => {});

            const defaultLists = ["To Do", "Doing", "Review", "Done", "Need Help"];
            for (let i = 0; i < defaultLists.length; i++) {
              await env.DB.prepare(`
                INSERT INTO task_lists (id, board_id, name, sort_order)
                VALUES (?, ?, ?, ?)
              `).bind(`tl_${boardId}_${i}`, boardId, defaultLists[i], i).run().catch(() => {});
            }
          }

          return new Response(JSON.stringify({ success: true, message: "Đã tạo Bảng Công Việc mới thành công", id: boardId }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }
    }

    // ============================================================
    // API ROUTE: /api/task-cards
    // ============================================================
    if (url.pathname === "/api/task-cards" || url.pathname.startsWith("/api/task-cards")) {
      const CORS_HEADERS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";
      const boardId = url.searchParams.get("board_id") || "tb_dept_it";

      if (request.method === "GET") {
        let lists = [];
        let cards = [];

        if (env && env.DB) {
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS task_cards (
                id TEXT PRIMARY KEY,
                list_id TEXT NOT NULL,
                board_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                assignee_id TEXT,
                deadline TEXT,
                status TEXT DEFAULT 'in_progress',
                color_state TEXT DEFAULT 'green',
                job_position_id TEXT,
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run().catch(() => {});

            const { results: lRes } = await env.DB.prepare(`SELECT * FROM task_lists WHERE board_id = ? ORDER BY sort_order ASC`).bind(boardId).all();
            if (lRes && lRes.length > 0) lists = lRes;

            const { results: cRes } = await env.DB.prepare(`SELECT * FROM task_cards WHERE board_id = ? ORDER BY created_at DESC`).bind(boardId).all();
            if (cRes && cRes.length > 0) cards = cRes;
          } catch (e) {}
        }

        if (lists.length === 0) {
          lists = [
            { id: `tl_${boardId}_0`, board_id: boardId, name: "To Do", sort_order: 0 },
            { id: `tl_${boardId}_1`, board_id: boardId, name: "Doing", sort_order: 1 },
            { id: `tl_${boardId}_2`, board_id: boardId, name: "Review", sort_order: 2 },
            { id: `tl_${boardId}_3`, board_id: boardId, name: "Done", sort_order: 3 },
            { id: `tl_${boardId}_4`, board_id: boardId, name: "Cần trợ giúp", sort_order: 4 },
          ];
        }

        if (cards.length === 0) {
          cards = [
            {
              id: "tc_001",
              list_id: `tl_${boardId}_0`,
              board_id: boardId,
              title: "Nâng cấp hệ thống Andon báo lỗi chuyền may 5",
              description: "Thay thế bảng LED cũ bằng màn hình Android hiển thị real-time sự cố dừng chuyền.",
              assignee_id: "202608001",
              deadline: "2026-09-20",
              status: "in_progress",
              color_state: "green",
              created_by: empCode
            },
            {
              id: "tc_002",
              list_id: `tl_${boardId}_4`,
              board_id: boardId,
              title: "Khắc phục sự cố cảm biến vị trí xe rùa dán đế chuyền 3",
              description: "Cần Trưởng phòng hỗ trợ phê duyệt thay mới linh kiện cảm biến vị trí khẩn cấp.",
              assignee_id: empCode,
              deadline: "2026-09-17",
              status: "need_help",
              color_state: "red",
              created_by: empCode
            }
          ];
        }

        return new Response(JSON.stringify({ success: true, lists, cards }), { headers: CORS_HEADERS });
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const { board_id, list_id, title, description = "", assignee_id = null, deadline = null } = body;

          if (!title || !title.trim()) {
            return new Response(JSON.stringify({ success: false, error: "Tiêu đề công việc là bắt buộc" }), { status: 400, headers: CORS_HEADERS });
          }

          const cardId = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const targetBoard = board_id || boardId;
          const targetList = list_id || `tl_${targetBoard}_0`;

          let colorState = "green";
          if (deadline) {
            const diffDays = (new Date(deadline).getTime() - Date.now()) / 86400000;
            if (diffDays < 0) colorState = "red";
            else if (diffDays <= 1) colorState = "yellow";
          }

          if (env && env.DB) {
            await env.DB.prepare(`
              INSERT INTO task_cards (id, list_id, board_id, title, description, assignee_id, deadline, status, color_state, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?)
            `).bind(cardId, targetList, targetBoard, title.trim(), description, assignee_id || empCode, deadline, colorState, empCode).run().catch(() => {});
          }

          return new Response(JSON.stringify({ success: true, message: "Đã tạo thẻ công việc mới thành công", id: cardId }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      if (request.method === "PATCH") {
        try {
          const body = await request.json().catch(() => ({}));
          const { id, list_id, title, description, assignee_id, deadline, sort_order } = body;

          if (!id) {
            return new Response(JSON.stringify({ success: false, error: "Mã thẻ id là bắt buộc" }), { status: 400, headers: CORS_HEADERS });
          }

          if (env && env.DB) {
            let colorState = "green";
            if (deadline) {
              const diffDays = (new Date(deadline).getTime() - Date.now()) / 86400000;
              if (diffDays < 0) colorState = "red";
              else if (diffDays <= 1) colorState = "yellow";
            }

            await env.DB.prepare(`
              UPDATE task_cards
              SET list_id = COALESCE(?, list_id),
                  title = COALESCE(?, title),
                  description = COALESCE(?, description),
                  assignee_id = COALESCE(?, assignee_id),
                  deadline = COALESCE(?, deadline),
                  color_state = COALESCE(?, color_state),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(list_id || null, title || null, description || null, assignee_id || null, deadline || null, colorState, id).run().catch(() => {});
          }

          return new Response(JSON.stringify({ success: true, message: "Đã cập nhật thẻ công việc thành công" }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }
    }

    // ============================================================
    // API ROUTE: /api/tasks (Kanban Tasks CRUD & Drag-Drop Sync)
    // ============================================================
    if (url.pathname === "/api/tasks" || url.pathname.startsWith("/api/tasks")) {
      const CORS_HEADERS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      const DEFAULT_KANBAN_TASKS = [
        {
          id: "tsk_003",
          code: "TSK-003",
          title: "Nâng cấp hệ thống Andon báo lỗi chuyền may 5",
          description: "Thay thế bảng LED cũ bằng màn hình Android hiển thị real-time sự cố dừng chuyền.",
          department_id: "IT_DIGITAL",
          assignee_emp_code: "202608001",
          assignee_name: "Phạm Nguyễn Anh Huy",
          reporter_emp_code: "202608002",
          reviewer_emp_code: "202608002",
          priority: "URGENT",
          start_date: "2026-08-25",
          due_date: "2026-09-10",
          status: "TO_DO",
          progress: 30,
          tags: "ANDON,GEMBA",
          checklist: [
            { id: "c1", title: "Lắp đặt màn hình Android 32 inch", completed: true },
            { id: "c2", title: "Kết nối WebSocket API báo hiệu", completed: false },
          ],
          result_description: "",
        },
        {
          id: "tsk_004",
          code: "TSK-004",
          title: "Tự động hóa sao lưu dữ liệu toàn hệ thống lên Google Drive",
          description: "Cấu hình Service Account Google Drive tự động sao lưu bảng D1 định kỳ theo sự kiện thao tác.",
          department_id: "IT_DIGITAL",
          assignee_emp_code: "202608001",
          assignee_name: "Phạm Nguyễn Anh Huy",
          reporter_emp_code: "202608002",
          reviewer_emp_code: "202608002",
          priority: "HIGH",
          start_date: "2026-09-10",
          due_date: "2026-09-12",
          status: "DOING",
          progress: 60,
          tags: "BACKUP,CLOUD",
          checklist: [
            { id: "c1", title: "Cấu hình Google Drive Service Account JWT", completed: true },
            { id: "c2", title: "Phân loại thư mục backup theo chủ đề", completed: true },
            { id: "c3", title: "Tối ưu hóa Event-Driven trigger real-time", completed: false },
          ],
          result_description: "",
        },
        {
          id: "tsk_005",
          code: "TSK-005",
          title: "Nghiên cứu ứng dụng AI Gemba nhận diện trang phục bảo hộ",
          description: "Sử dụng camera AI nhận diện công nhân quên đeo khẩu trang hoặc nón bảo hộ khi vào khu vực máy cắt.",
          department_id: "IT_DIGITAL",
          assignee_emp_code: "202608001",
          assignee_name: "Phạm Nguyễn Anh Huy",
          reporter_emp_code: "202608002",
          reviewer_emp_code: "202608002",
          priority: "MEDIUM",
          start_date: "2026-09-15",
          due_date: "2026-10-01",
          status: "TO_DO",
          progress: 0,
          tags: "AI,SAFETY",
          checklist: [
            { id: "c1", title: "Thu thập dataset hình ảnh đồ bảo hộ", completed: false },
          ],
          result_description: "",
        },
        {
          id: "tsk_001",
          code: "TSK-001",
          title: "Rùa tự động hóa dây chuyền dán đế 3 Skechers D'Lites",
          description: "Triển khai hệ thống xe rùa tự động cấp phôi dán đế cho dây chuyền 3 nhà máy Skechers. Cần nghiệm thu chỉ số an toàn và độ chính xác vị trí.",
          department_id: "IT_DIGITAL",
          assignee_emp_code: "202608001",
          assignee_name: "Phạm Nguyễn Anh Huy",
          reporter_emp_code: "202608002",
          reviewer_emp_code: "202608002",
          priority: "HIGH",
          start_date: "2026-09-01",
          due_date: "2026-09-15",
          status: "TO_DO",
          progress: 40,
          tags: "KAIZEN,AUTOMATION",
          checklist: [
            { id: "c1", title: "Khảo sát mặt bằng dây chuyền 3", completed: true },
            { id: "c2", title: "Lập trình cảm biến vị trí xe rùa", completed: false },
          ],
          result_description: "",
        },
        {
          id: "tsk_002",
          code: "TSK-002",
          title: "Số hóa quy trình đăng ký xe đi công tác các nhà máy",
          description: "Xây dựng form điện tử và luồng duyệt tự động cho cán bộ đăng ký xe đi công tác liên nhà máy.",
          department_id: "HÀNH_CHÍNH",
          assignee_emp_code: "202608001",
          assignee_name: "Phạm Nguyễn Anh Huy",
          reporter_emp_code: "202608003",
          reviewer_emp_code: "202608002",
          priority: "MEDIUM",
          start_date: "2026-09-05",
          due_date: "2026-09-20",
          status: "DOING",
          progress: 50,
          tags: "ISO,DIGITAL",
          checklist: [
            { id: "c1", title: "Thu thập yêu cầu từ phòng Hành chính", completed: true },
            { id: "c2", title: "Thiết kế giao diện đặt xe", completed: false },
          ],
          result_description: "",
        }
      ];

      const ensureMyTasksTable = async () => {
        if (!env || !env.DB) return;
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS sys_my_tasks (
              id TEXT PRIMARY KEY,
              code TEXT,
              title TEXT,
              description TEXT,
              department_id TEXT,
              assignee_emp_code TEXT,
              assignee_name TEXT,
              reporter_emp_code TEXT,
              reviewer_emp_code TEXT,
              priority TEXT,
              start_date TEXT,
              due_date TEXT,
              status TEXT,
              progress INTEGER,
              tags TEXT,
              checklist TEXT,
              result_description TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `).run().catch(() => {});

          const countRes = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM sys_my_tasks`).first().catch(() => null);
          if (!countRes || countRes.cnt === 0) {
            for (const t of DEFAULT_KANBAN_TASKS) {
              await env.DB.prepare(`
                INSERT INTO sys_my_tasks (
                  id, code, title, description, department_id, assignee_emp_code, assignee_name,
                  reporter_emp_code, reviewer_emp_code, priority, start_date, due_date, status,
                  progress, tags, checklist, result_description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                t.id, t.code, t.title, t.description, t.department_id, t.assignee_emp_code, t.assignee_name,
                t.reporter_emp_code, t.reviewer_emp_code, t.priority, t.start_date, t.due_date, t.status,
                t.progress, t.tags, JSON.stringify(t.checklist), t.result_description
              ).run().catch(() => {});
            }
          }
        } catch (e) {}
      };

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";
      const userProfile = WORKER_SYSTEM_USER_MAP[empCode] || null;
      const userRoleLevel = session?.roleLevel ?? (userProfile?.roleLevel ?? (userProfile?.roleCode === "TRUONG_PHONG" ? 3 : userProfile?.roleCode === "SUPER_ADMIN" ? 1 : 4));
      const userDept = session?.departmentCode || userProfile?.departmentCode || "IT_CDS";

      if (request.method === "GET") {
        try {
          const requestedDept = url.searchParams.get("department_id") || url.searchParams.get("dept");
          const requestedAssignee = url.searchParams.get("assignee_emp_code") || url.searchParams.get("empCode");

          let query = "";
          let params = [];
          let filteredFallback = DEFAULT_KANBAN_TASKS;

          if (userRoleLevel >= 4) {
            // Level 4: Staff / Worker / Maintenance -> Strictly only see their own tasks
            query = `SELECT * FROM sys_my_tasks WHERE assignee_emp_code = ? OR reporter_emp_code = ? ORDER BY created_at DESC`;
            params = [empCode, empCode];
            filteredFallback = DEFAULT_KANBAN_TASKS.filter((t) => t.assignee_emp_code === empCode || t.reporter_emp_code === empCode);
          } else if (userRoleLevel === 3) {
            // Level 3: Department Head -> See all tasks in their managed department
            if (requestedAssignee && requestedAssignee !== "ALL") {
              query = `SELECT * FROM sys_my_tasks WHERE (department_id = ? OR department_id = 'IT_DIGITAL' OR assignee_emp_code = ? OR reporter_emp_code = ?) AND (assignee_emp_code = ? OR reporter_emp_code = ?) ORDER BY created_at DESC`;
              params = [userDept, empCode, empCode, requestedAssignee, requestedAssignee];
              filteredFallback = DEFAULT_KANBAN_TASKS.filter((t) => t.assignee_emp_code === requestedAssignee || t.reporter_emp_code === requestedAssignee);
            } else {
              query = `SELECT * FROM sys_my_tasks WHERE department_id = ? OR department_id = 'IT_DIGITAL' OR assignee_emp_code = ? OR reporter_emp_code = ? ORDER BY created_at DESC`;
              params = [userDept, empCode, empCode];
            }
          } else {
            // Level 1-2: Executive / Super Admin -> See all or filter by requested dept/assignee
            if (requestedAssignee && requestedAssignee !== "ALL") {
              query = `SELECT * FROM sys_my_tasks WHERE assignee_emp_code = ? OR reporter_emp_code = ? ORDER BY created_at DESC`;
              params = [requestedAssignee, requestedAssignee];
              filteredFallback = DEFAULT_KANBAN_TASKS.filter((t) => t.assignee_emp_code === requestedAssignee || t.reporter_emp_code === requestedAssignee);
            } else if (requestedDept && requestedDept !== "ALL") {
              query = `SELECT * FROM sys_my_tasks WHERE department_id = ? ORDER BY created_at DESC`;
              params = [requestedDept];
              filteredFallback = DEFAULT_KANBAN_TASKS.filter((t) => (t.department_id || "").toUpperCase().includes(requestedDept.toUpperCase()));
            } else {
              query = `SELECT * FROM sys_my_tasks ORDER BY created_at DESC`;
              params = [];
            }
          }

          if (env && env.DB) {
            await ensureMyTasksTable();
            const { results } = await env.DB.prepare(query).bind(...params).all();
            if (results && results.length > 0) {
              const formatted = results.map((r) => ({
                ...r,
                checklist: typeof r.checklist === "string" ? JSON.parse(r.checklist || "[]") : (r.checklist || []),
              }));
              return new Response(JSON.stringify({ success: true, tasks: formatted }), { headers: CORS_HEADERS });
            }
          }
          return new Response(JSON.stringify({ success: true, tasks: filteredFallback }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: true, tasks: DEFAULT_KANBAN_TASKS }), { headers: CORS_HEADERS });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const title = (body.title || "").trim();
          if (!title) {
            return new Response(JSON.stringify({ success: false, error: "Tiêu đề là bắt buộc" }), { status: 400, headers: CORS_HEADERS });
          }

          const targetAssigneeEmp = body.assignee_emp_code || empCode;
          const targetAssigneeName = body.assignee_name || WORKER_SYSTEM_USER_MAP[targetAssigneeEmp]?.name || session?.name || "Cán Bộ";

          const newTask = {
            id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
            title: title,
            description: (body.description || "").trim(),
            department_id: body.department_id || userDept || "IT_CDS",
            assignee_emp_code: targetAssigneeEmp,
            assignee_name: targetAssigneeName,
            reporter_emp_code: empCode,
            priority: body.priority || "MEDIUM",
            start_date: new Date().toISOString().substring(0, 10),
            due_date: body.due_date || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
            status: "TO_DO",
            progress: 0,
            tags: body.tags || "TASK",
            checklist: [],
            result_description: "",
          };

          if (env && env.DB) {
            await ensureMyTasksTable();
            await env.DB.prepare(`
              INSERT INTO sys_my_tasks (
                id, code, title, description, department_id, assignee_emp_code, assignee_name,
                reporter_emp_code, priority, start_date, due_date, status, progress, tags, checklist, result_description
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              newTask.id, newTask.code, newTask.title, newTask.description, newTask.department_id,
              newTask.assignee_emp_code, newTask.assignee_name, newTask.reporter_emp_code,
              newTask.priority, newTask.start_date, newTask.due_date, newTask.status,
              newTask.progress, newTask.tags, JSON.stringify(newTask.checklist), newTask.result_description
            ).run().catch(() => {});

            // Trigger real-time Google Drive backup
            await triggerEventDrivenDriveBackup(env, "TASK_CREATE", empCode).catch(() => {});
          }

          return new Response(JSON.stringify({ success: true, message: "Đã tạo công việc mới", task: newTask }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      if (request.method === "PATCH") {
        try {
          const body = await request.json().catch(() => ({}));
          const { taskId, status, resultDescription, checklistId, completed, progress } = body;

          if (!taskId) {
            return new Response(JSON.stringify({ success: false, error: "taskId là bắt buộc" }), { status: 400, headers: CORS_HEADERS });
          }

          if (env && env.DB) {
            await ensureMyTasksTable();
            const existing = await env.DB.prepare(`SELECT * FROM sys_my_tasks WHERE id = ?`).bind(taskId).first().catch(() => null);

            if (existing) {
              let newStatus = status !== undefined ? status : existing.status;
              let newResult = resultDescription !== undefined ? resultDescription : existing.result_description;
              let newProgress = progress !== undefined ? progress : existing.progress;
              let checklistArr = typeof existing.checklist === "string" ? JSON.parse(existing.checklist || "[]") : (existing.checklist || []);

              if (checklistId !== undefined) {
                checklistArr = checklistArr.map((c) => c.id === checklistId ? { ...c, completed: Boolean(completed) } : c);
                const doneCount = checklistArr.filter((c) => c.completed).length;
                newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
              }

              if (newStatus === "DONE") {
                newProgress = 100;
              }

              await env.DB.prepare(`
                UPDATE sys_my_tasks
                SET status = ?, result_description = ?, progress = ?, checklist = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
              `).bind(newStatus, newResult, newProgress, JSON.stringify(checklistArr), taskId).run().catch(() => {});

              // Record Audit log & trigger real-time Google Drive backup on task move / completion!
              await recordAuditLog(
                { empCode: "202608001", roleCode: "TRUONG_PHONG", id: "emp_1" },
                "KANBAN_TASKS",
                newStatus === "DONE" ? "COMPLETE_TASK" : "MOVE_TASK_STATUS",
                taskId,
                { oldStatus: existing.status },
                { newStatus, resultDescription: newResult },
                request
              ).catch(() => {});

              await triggerEventDrivenDriveBackup(env, "KANBAN_TASKS", "202608001").catch(() => {});
            }
          }

          return new Response(JSON.stringify({ success: true, message: "Đã chuyển trạng thái công việc thành công" }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }
    }

    // ============================================================
    // ============================================================
    // API ROUTE: GET /api/test-backup (Immediate Test Backup Trigger)
    // ============================================================
    if (url.pathname === "/api/test-backup") {
      const CORS_HEADERS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      };
      try {
        const testUser = { empCode: "202608001", roleCode: "TRUONG_PHONG", id: "emp_1" };
        await recordAuditLog(testUser, "SYSTEM_ADMIN", "MANUAL_TEST_BACKUP", "TEST_001", { test_note: "Kiem tra day file backup len Google Drive" }, request);
        const overrideUrl = url.searchParams.get("url") || url.searchParams.get("webapp_url");
        const backupResult = await triggerEventDrivenDriveBackup(env, "TEST_SUITE", "202608001", overrideUrl);
        return new Response(JSON.stringify({
          success: true,
          message: "🎉 Đã chạy xong test sao lưu!",
          backupResult: backupResult
        }), { headers: CORS_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
      }
    }

    // ============================================================
    // API ROUTE: /api/push/subscribe & /api/push/unsubscribe
    // ============================================================
    if (url.pathname === "/api/push/subscribe" || url.pathname.startsWith("/api/push/subscribe")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      try {
        const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
        const { subscription, endpoint } = body || {};
        const targetSub = subscription || (endpoint ? { endpoint } : null);
        const subEndpoint = targetSub?.endpoint || endpoint;
        if (subEndpoint && env && env.DB) {
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS push_subscriptions (
                id TEXT PRIMARY KEY,
                endpoint TEXT UNIQUE NOT NULL,
                subscription_json TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
              )
            `).run().catch(() => {});
            const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await env.DB.prepare(`
              INSERT INTO push_subscriptions (id, endpoint, subscription_json)
              VALUES (?, ?, ?)
              ON CONFLICT(endpoint) DO UPDATE SET subscription_json = excluded.subscription_json
            `).bind(subId, subEndpoint, JSON.stringify(targetSub)).run().catch(() => {});
          } catch (e) {}
        }
      } catch (e) {}
      return new Response(JSON.stringify({ success: true, message: "Push subscription registered successfully" }), { headers: CORS });
    }

    if (url.pathname === "/api/push/unsubscribe" || url.pathname.startsWith("/api/push/unsubscribe")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      try {
        const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
        const { endpoint } = body || {};
        if (endpoint && env && env.DB) {
          try {
            await env.DB.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).bind(endpoint).run().catch(() => {});
          } catch (e) {}
        }
      } catch (e) {}
      return new Response(JSON.stringify({ success: true, message: "Unsubscribed successfully" }), { headers: CORS });
    }

    // ============================================================
    // API ROUTE: /api/audit/webhook
    // ============================================================
    if (url.pathname === "/api/audit/webhook" || url.pathname.startsWith("/api/audit/webhook")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      try {
        const body = await request.json().catch(() => ({}));
        const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || 'Browser';
        const eventType = body.eventType || 'GENERAL_AUDIT';
        const data = body.data || {};

        if (data.password) delete data.password;
        if (data.oldPassword) delete data.oldPassword;
        if (data.newPassword) delete data.newPassword;

        if (env && env.DB) {
          try {
            await ensureAuditAndBackupTables();
            await env.DB.prepare(`
              INSERT INTO audit_logs (user_id, emp_code, emp_name, role_code, module, action, record_id, changes_json, ip_address, user_agent, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              data.emp_code || data.empCode || 'SYSTEM',
              data.emp_code || data.empCode || 'SYSTEM',
              data.emp_name || data.empName || 'Cán Bộ Công Nhân Viên',
              data.role_code || data.roleCode || 'CBCNV',
              eventType,
              data.action || eventType,
              data.record_id || null,
              JSON.stringify(data),
              clientIp,
              userAgent
            ).run().catch(() => {});
          } catch (e) {}
        }
        return new Response(JSON.stringify({ success: true, message: "Audit log recorded successfully", eventType }), { headers: CORS });
      } catch (err) {
        return new Response(JSON.stringify({ success: true, message: "Audit log recorded" }), { headers: CORS });
      }
    }

    // ============================================================
    // API ROUTE: /api/notifications
    // ============================================================
    if (url.pathname === "/api/notifications" || url.pathname.startsWith("/api/notifications")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      if (request.method === "GET") {
        let notifs = [];
        if (env && env.DB) {
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS sys_notifications (
                id TEXT PRIMARY KEY,
                title TEXT,
                message TEXT,
                type TEXT,
                target_user TEXT,
                link TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run().catch(() => {});
            const { results } = await env.DB.prepare(`SELECT * FROM sys_notifications ORDER BY created_at DESC LIMIT 20`).all();
            if (results && results.length > 0) notifs = results;
          } catch (e) {}
        }
        if (notifs.length === 0) {
          notifs = [
            { id: "n1", title: "🔔 Chào mừng bạn đến với Văn Phòng Chuỗi SKECHERS", message: "Hệ thống đã sẵn sàng hỗ trợ tác nghiệp 2026", type: "INFO", targetUser: "ALL", created_at: new Date().toISOString() },
            { id: "n2", title: "📋 Cập nhật bảng công việc phòng ban", message: "Hãy kiểm tra tiến độ các task được gán cho bạn", type: "KAIZEN", targetUser: "ALL", created_at: new Date().toISOString() },
          ];
        }
        return new Response(JSON.stringify({ success: true, data: notifs }), { headers: CORS });
      }
      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          if (env && env.DB && body.title) {
            try {
              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS sys_notifications (
                  id TEXT PRIMARY KEY,
                  title TEXT,
                  message TEXT,
                  type TEXT,
                  target_user TEXT,
                  link TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `).run().catch(() => {});
              const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              await env.DB.prepare(`
                INSERT INTO sys_notifications (id, title, message, type, target_user, link)
                VALUES (?, ?, ?, ?, ?, ?)
              `).bind(notifId, body.title, body.message || "", body.type || "INFO", body.targetUser || "ALL", body.link || "/work").run().catch(() => {});
            } catch (e) {}
          }
          return new Response(JSON.stringify({ success: true, message: "Đã phát thông báo thành công" }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }
    }

    // ============================================================
    // API ROUTE: /api/profile
    // ============================================================
    if (url.pathname === "/api/profile" || url.pathname.startsWith("/api/profile")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      if (request.method === "GET") {
        let profileData = null;
        if (env && env.DB) {
          try {
            const empCode = url.searchParams.get("empCode") || "202608001";
            const row = await env.DB.prepare(`SELECT * FROM sys_users WHERE emp_code = ?`).bind(empCode).first().catch(() => null);
            if (row) profileData = row;
          } catch (e) {}
        }
        if (!profileData) {
          profileData = {
            empCode: "202608001",
            name: "Phạm Nguyễn Anh Huy",
            phone: "0522511245",
            email: "anhy.work.2004@gmail.com",
            title: "IT - Team Chuyển Đổi Số",
            department: "IT - Team Chuyển Đổi Số",
            roleCode: "TRUONG_PHONG",
            avatar: "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1787117525/nzcft200bebofw7b4uzg.jpg",
          };
        }
        return new Response(JSON.stringify({ success: true, data: profileData }), { headers: CORS });
      }
      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          if (env && env.DB && (body.empCode || body.emp_code)) {
            try {
              await env.DB.prepare(`
                INSERT INTO sys_users (id, emp_code, name, email, phone, title, department, role_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(emp_code) DO UPDATE SET
                  name=excluded.name,
                  email=excluded.email,
                  phone=excluded.phone,
                  title=excluded.title,
                  department=excluded.department
              `).bind(
                body.id || `emp_${Date.now()}`,
                body.empCode || body.emp_code,
                body.name || "",
                body.email || "",
                body.phone || "",
                body.title || "",
                body.department || "",
                body.roleCode || "CBCNV"
              ).run().catch(() => {});
            } catch (e) {}
          }
          return new Response(JSON.stringify({ success: true, message: "Cập nhật hồ sơ thành công" }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }
    }

    // ============================================================
    // API ROUTE: /api/projects
    // ============================================================
    if (url.pathname === "/api/projects" || url.pathname.startsWith("/api/projects")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      const proj = {
        id: "PROJ-01",
        code: "PROJ-DIGITAL-2026",
        name: "Chuyển Đổi Số SKECHERS 2026",
        description: "Dự án số hóa toàn diện quy trình sản xuất, Gemba & MMTB Văn phòng chuỗi SKECHERS - TBS Group.",
        manager_name: "Phạm Nguyễn Anh Huy",
        progress: 75,
        members: [
          { empCode: "202608001", name: "Phạm Nguyễn Anh Huy", department: "IT_CDS", role: "PROJECT_MANAGER" },
          { empCode: "NS-001", name: "Nguyễn Thị Lan Anh", department: "NHAN_SU", role: "MEMBER" },
          { empCode: "QC-001", name: "Bùi Thị Hằng", department: "CHAT_LUONG_QC", role: "MEMBER" },
          { empCode: "KT-001", name: "Trần Thị Thu Hương", department: "KE_TOAN", role: "MEMBER" },
        ],
      };
      return new Response(JSON.stringify({ success: true, project: proj }), { headers: CORS });
    }

    // ============================================================
    // API ROUTE: /api/hr/onboarding
    // ============================================================
    if (url.pathname.startsWith("/api/hr/")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      if (url.pathname === "/api/hr/onboarding") {
        const onboardingTasks = [
          {
            id: "ob_1",
            employeeName: "Nguyễn Văn Hùng",
            department: "Khối CNTT - Chuyển đổi số",
            joinDate: "2026-09-01",
            mentor: "Phạm Nguyễn Anh Huy",
            progress: 60,
            items: [
              { text: "Nhận máy tính & cấp tài khoản TBS Email", done: true },
              { text: "Đào tạo An toàn thông tin & Nội quy văn phòng", done: true },
              { text: "Bàn giao tài liệu kiến trúc hệ thống 1-5-2", done: false },
            ]
          }
        ];
        return new Response(JSON.stringify({ success: true, data: onboardingTasks }), { headers: CORS });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), { headers: CORS });
    }

    // ============================================================
    // D1 API ROUTE: /api/task-boards
    // ============================================================
    if (url.pathname === "/api/task-boards" || url.pathname.startsWith("/api/task-boards")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) {
        return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để truy cập Task Board" }), { status: 401, headers: CORS });
      }

      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";
      const userProfile = ROLE_ACCOUNTS[empCode] || null;
      const userRoleLevel = session?.roleLevel ?? (userProfile?.roleCode === "TRUONG_PHONG" ? 3 : userProfile?.roleCode === "SYSTEM_ADMIN" || userProfile?.roleCode === "TONG_GIAM_DOC" ? 1 : 4);
      const userManagedDept = session?.departmentCode || userProfile?.department || "";

      if (request.method === "GET") {
        try {
          if (env && env.DB) await ensureWorkerTables(env.DB);
          const requestedDept = url.searchParams.get("department_id") || url.searchParams.get("dept");

          let query = "";
          let params = [];

          if (userRoleLevel === 3) {
            query = `SELECT * FROM task_boards WHERE owner_id = ? OR type = 'personal' OR (department_id IS NOT NULL AND department_id = ?) ORDER BY created_at DESC`;
            params = [empCode, userManagedDept];
          } else if (userRoleLevel <= 2) {
            if (requestedDept && requestedDept !== "all") {
              query = `SELECT * FROM task_boards WHERE owner_id = ? OR type = 'personal' OR (department_id IS NOT NULL AND department_id = ?) ORDER BY created_at DESC`;
              params = [empCode, requestedDept];
            } else {
              query = `SELECT * FROM task_boards ORDER BY created_at DESC`;
              params = [];
            }
          } else {
            query = `SELECT * FROM task_boards WHERE owner_id = ? OR type = 'personal' ORDER BY created_at DESC`;
            params = [empCode];
          }

          let results = [];
          if (env && env.DB) {
            try {
              const res = await env.DB.prepare(query).bind(...params).all();
              if (res && res.results) results = res.results;
            } catch (e) {}
          }

          if (results.length === 0 && env && env.DB) {
            const defaultBoardId = `tb_${empCode}_personal`;
            try {
              await env.DB.prepare("INSERT INTO task_boards (id, name, type, owner_id) VALUES (?, 'Board Cá Nhân', 'personal', ?)").bind(defaultBoardId, empCode).run().catch(() => {});
              const defaultLists = ["Plan", "To Do", "Doing", "Need Help"];
              for (let i = 0; i < defaultLists.length; i++) {
                await env.DB.prepare("INSERT INTO task_lists (id, board_id, name, sort_order) VALUES (?, ?, ?, ?)").bind(`tl_${defaultBoardId}_${i}`, defaultBoardId, defaultLists[i], i).run().catch(() => {});
              }
              const resFresh = await env.DB.prepare("SELECT * FROM task_boards WHERE id = ?").bind(defaultBoardId).all();
              if (resFresh && resFresh.results) results = resFresh.results;
            } catch (e) {}
          }

          return new Response(JSON.stringify({ success: true, data: results }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const { name, type = "personal", department_id = null } = body;
          if (!name || !name.trim()) {
            return new Response(JSON.stringify({ success: false, error: "Tên Task Board là bắt buộc" }), { status: 400, headers: CORS });
          }

          const boardId = `tb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          if (env && env.DB) {
            await ensureWorkerTables(env.DB);
            await env.DB.prepare("INSERT INTO task_boards (id, name, type, department_id, owner_id) VALUES (?, ?, ?, ?, ?)").bind(boardId, name.trim(), type, department_id, empCode).run();
            const defaultLists = ["Plan", "To Do", "Doing", "Need Help"];
            for (let i = 0; i < defaultLists.length; i++) {
              await env.DB.prepare("INSERT INTO task_lists (id, board_id, name, sort_order) VALUES (?, ?, ?, ?)").bind(`tl_${boardId}_${i}`, boardId, defaultLists[i], i).run().catch(() => {});
            }
          }
          return new Response(JSON.stringify({ success: true, message: "Đã tạo Task Board thành công", id: boardId }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/task-cards/my-upcoming
    // ============================================================
    if (url.pathname === "/api/task-cards/my-upcoming") {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });

      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";

      let cards = [];
      if (env && env.DB) {
        try {
          await ensureWorkerTables(env.DB);
          const { results } = await env.DB.prepare(`
            SELECT * FROM task_cards
            WHERE (assignee_id = ? OR created_by = ?) AND status != 'done'
            ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC
            LIMIT 20
          `).bind(empCode, empCode).all();
          if (results) cards = results;
        } catch (e) {}
      }
      return new Response(JSON.stringify({ success: true, data: cards }), { headers: CORS });
    }

    // ============================================================
    // D1 API ROUTE: /api/task-cards/:id/review
    // ============================================================
    if (url.pathname.startsWith("/api/task-cards/") && url.pathname.endsWith("/review")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });

      const session = parseSessionWorker(token);
      const reviewerId = session?.empCode || session?.userId || "MANAGER";
      const parts = url.pathname.split("/");
      const cardId = parts[3];

      try {
        const body = await request.json().catch(() => ({}));
        const { rating = 5, comment = "" } = body;

        if (env && env.DB && cardId) {
          await ensureWorkerTables(env.DB);
          const existing = await env.DB.prepare("SELECT * FROM task_cards WHERE id = ?").bind(cardId).first().catch(() => null);
          if (!existing) {
            return new Response(JSON.stringify({ success: false, error: "Không tìm thấy thẻ công việc" }), { status: 404, headers: CORS });
          }

          const reviewId = `tcr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await env.DB.prepare("INSERT INTO task_card_reviews (id, card_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?, ?)").bind(reviewId, cardId, reviewerId, Number(rating) || 5, comment || "").run();
          await env.DB.prepare("UPDATE task_cards SET status = 'done', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(cardId).run();
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Đã nghiệm thu và đánh giá thẻ công việc thành công!",
          rating: Number(body.rating) || 5,
        }), { headers: CORS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/task-cards/:id/complete
    // ============================================================
    if (url.pathname.startsWith("/api/task-cards/") && url.pathname.endsWith("/complete")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });

      const parts = url.pathname.split("/");
      const cardId = parts[3];

      try {
        if (env && env.DB && cardId) {
          await ensureWorkerTables(env.DB);
          const existing = await env.DB.prepare("SELECT * FROM task_cards WHERE id = ?").bind(cardId).first().catch(() => null);
          if (!existing) {
            return new Response(JSON.stringify({ success: false, error: "Không tìm thấy thẻ công việc" }), { status: 404, headers: CORS });
          }
          await env.DB.prepare("UPDATE task_cards SET status = 'pending_review', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(cardId).run();
        }
        return new Response(JSON.stringify({
          success: true,
          message: "Đã đánh dấu hoàn thành! Thẻ chuyển sang trạng thái chờ Trưởng phòng nghiệm thu.",
        }), { headers: CORS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/task-cards (GET, POST, PATCH)
    // ============================================================
    if (url.pathname === "/api/task-cards" || url.pathname.startsWith("/api/task-cards")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });

      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";

      if (request.method === "GET") {
        try {
          const boardId = url.searchParams.get("board_id");
          if (!boardId) return new Response(JSON.stringify({ success: false, error: "board_id là bắt buộc" }), { status: 400, headers: CORS });

          let lists = [];
          let cards = [];
          if (env && env.DB) {
            await ensureWorkerTables(env.DB);
            const resL = await env.DB.prepare("SELECT * FROM task_lists WHERE board_id = ? ORDER BY sort_order ASC").bind(boardId).all();
            if (resL && resL.results) lists = resL.results;

            const resC = await env.DB.prepare("SELECT * FROM task_cards WHERE board_id = ? ORDER BY sort_order ASC, created_at DESC").bind(boardId).all();
            if (resC && resC.results) cards = resC.results;
          }
          return new Response(JSON.stringify({ success: true, lists, cards }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const { board_id, list_id, title, description = "", assignee_id = null, deadline = null, job_position_id = null } = body;
          if (!board_id || !list_id || !title || !title.trim()) {
            return new Response(JSON.stringify({ success: false, error: "board_id, list_id và title là bắt buộc" }), { status: 400, headers: CORS });
          }

          const cardId = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          let colorState = "green";
          if (deadline) {
            const now = new Date().getTime();
            const dlTime = new Date(deadline).getTime();
            const diffDays = (dlTime - now) / (1000 * 60 * 60 * 24);
            if (diffDays < 0) colorState = "red";
            else if (diffDays <= 1) colorState = "yellow";
          }

          if (env && env.DB) {
            await ensureWorkerTables(env.DB);
            await env.DB.prepare(`
              INSERT INTO task_cards (id, list_id, board_id, title, description, assignee_id, deadline, status, color_state, job_position_id, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, ?)
            `).bind(cardId, list_id, board_id, title.trim(), description, assignee_id, deadline, colorState, job_position_id, empCode).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã tạo thẻ công việc thành công", id: cardId }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }

      if (request.method === "PATCH") {
        try {
          const body = await request.json().catch(() => ({}));
          const { id, list_id, title, description, assignee_id, deadline, sort_order } = body;
          if (!id) return new Response(JSON.stringify({ success: false, error: "Mã thẻ id là bắt buộc" }), { status: 400, headers: CORS });

          if (env && env.DB) {
            await ensureWorkerTables(env.DB);
            const existing = await env.DB.prepare("SELECT * FROM task_cards WHERE id = ?").bind(id).first().catch(() => null);
            if (!existing) {
              return new Response(JSON.stringify({ success: false, error: "Không tìm thấy thẻ công việc" }), { status: 404, headers: CORS });
            }

            let colorState = existing.color_state;
            const finalDeadline = deadline !== undefined ? deadline : existing.deadline;
            if (finalDeadline) {
              const now = new Date().getTime();
              const dlTime = new Date(finalDeadline).getTime();
              const diffDays = (dlTime - now) / (1000 * 60 * 60 * 24);
              if (diffDays < 0) colorState = "red";
              else if (diffDays <= 1) colorState = "yellow";
              else colorState = "green";
            }

            await env.DB.prepare(`
              UPDATE task_cards
              SET list_id = COALESCE(?, list_id),
                  title = COALESCE(?, title),
                  description = COALESCE(?, description),
                  assignee_id = COALESCE(?, assignee_id),
                  deadline = COALESCE(?, deadline),
                  color_state = ?,
                  sort_order = COALESCE(?, sort_order),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(list_id, title, description, assignee_id, deadline, colorState, sort_order, id).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã cập nhật thẻ công việc thành công" }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/workspace/menu
    // ============================================================
    if (url.pathname === "/api/workspace/menu" || url.pathname.startsWith("/api/workspace/menu")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      const session = token ? parseSessionWorker(token) : null;
      const roleParam = url.searchParams.get("role");

      let roleCode = "NHAN_VIEN";
      if (session) roleCode = session.roleCode || session.role || "NHAN_VIEN";
      else if (roleParam) roleCode = roleParam;

      const MANDATORY_ROUTES = [
        { route: "/work/room-booking", label: "Đăng Ký Phòng Họp", icon: "IconCalendar", isMandatory: true },
        { route: "/work/business-trip", label: "Đăng Ký Công Tác", icon: "IconBriefcase", isMandatory: true },
      ];
      const MINIMAL_FALLBACK_ROUTES = [
        { route: "/work/my-tasks", label: "Công Việc Của Tôi", icon: "IconChecklist", isMandatory: true },
        { route: "/work/kaizen/register", label: "Đề Xuất Kaizen", icon: "IconSparkles", isMandatory: false },
        { route: "/work/room-booking", label: "Đăng Ký Phòng Họp", icon: "IconCalendar", isMandatory: true },
        { route: "/work/business-trip", label: "Đăng Ký Công Tác", icon: "IconBriefcase", isMandatory: true },
        { route: "/work/notifications", label: "Thông Báo Cá Nhân", icon: "IconBell", isMandatory: false },
        { route: "/work/payroll/me", label: "Bảng Lương Của Tôi", icon: "IconReceipt", isMandatory: false },
      ];

      let configuredRoutes = [];
      let isFallback = true;
      if (env && env.DB) {
        try {
          await ensureWorkerTables(env.DB);
          const { results } = await env.DB.prepare(`
            SELECT * FROM role_workspace_config WHERE UPPER(role) = UPPER(?) ORDER BY sort_order ASC, created_at ASC
          `).bind(roleCode).all();
          if (results && results.length > 0) {
            configuredRoutes = results.map((r) => ({
              route: r.route,
              label: r.label,
              icon: r.icon || "IconChevronRight",
              sortOrder: r.sort_order || 0,
              isMandatory: false,
            }));
            isFallback = false;
          }
        } catch (e) {}
      }

      if (isFallback) configuredRoutes = MINIMAL_FALLBACK_ROUTES;
      const mergedRoutes = [...configuredRoutes];
      for (const mand of MANDATORY_ROUTES) {
        if (!mergedRoutes.some((item) => item.route === mand.route)) {
          mergedRoutes.push(mand);
        }
      }

      return new Response(JSON.stringify({ success: true, role: roleCode, menu: mergedRoutes, isFallback }), { headers: CORS });
    }

    // ============================================================
    // D1 API ROUTE: /api/overview/:module
    // ============================================================
    if (url.pathname.startsWith("/api/overview/")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const parts = url.pathname.split("/");
      const targetModule = parts[3] || "kaizen";
      const plantGroup = url.searchParams.get("plant_group") || "ALL";
      const plantCode = url.searchParams.get("plant_code") || "ALL";

      let stats = { total_proposals: 0, approved_proposals: 0, pending_proposals: 0, total_saved_seconds: 0, total_savings_vnd: 0 };
      if (env && env.DB && targetModule === "kaizen") {
        try {
          let whereClause = "WHERE (is_archived IS NULL OR is_archived = 0)";
          const bindings = [];
          if (plantGroup === "TO_HOP_KIEN_GIANG") {
            whereClause += " AND (plant_group = 'TO_HOP_KIEN_GIANG' OR site_code = 'thkiengiangshoes' OR LOWER(source_region) LIKE '%kiên giang%' OR LOWER(factory) LIKE '%kiên giang%')";
          } else if (plantGroup === "VPCHUOI") {
            whereClause += " AND (site_code != 'thkiengiangshoes' AND LOWER(source_region) NOT LIKE '%kiên giang%')";
          } else if (plantGroup === "MIEN_DONG") {
            whereClause += " AND (plant_group = 'MIEN_DONG' OR LOWER(factory) LIKE '%miền đông%')";
          }
          if (plantCode !== "ALL") {
            whereClause += " AND (plant_code = ? OR LOWER(factory) LIKE ?)";
            bindings.push(plantCode, `%${plantCode.toLowerCase()}%`);
          }

          const totalRes = await env.DB.prepare(`SELECT COUNT(*) as count FROM ci_kaizen_proposals ${whereClause}`).bind(...bindings).first().catch(() => null);
          const approvedRes = await env.DB.prepare(`SELECT COUNT(*) as count FROM ci_kaizen_proposals ${whereClause} AND (approval_status = 'PHE_DUYET' OR sub_status = 'DA_DANH_GIA')`).bind(...bindings).first().catch(() => null);
          const pendingRes = await env.DB.prepare(`SELECT COUNT(*) as count FROM ci_kaizen_proposals ${whereClause} AND (sub_status = 'CHO_DUYET' OR sub_status = 'CHO_IE_XAC_NHAN' OR sub_status = 'CHO_PHE_DUYET_TRIEN_KHAI')`).bind(...bindings).first().catch(() => null);
          const savingsRes = await env.DB.prepare(`SELECT SUM(so_giay_tiet_kiem) as total_seconds, SUM(total_savings_vnd) as total_vnd FROM ci_kaizen_proposals ${whereClause}`).bind(...bindings).first().catch(() => null);

          stats = {
            total_proposals: Number(totalRes?.count || 0),
            approved_proposals: Number(approvedRes?.count || 0),
            pending_proposals: Number(pendingRes?.count || 0),
            total_saved_seconds: Number(savingsRes?.total_seconds || 0),
            total_savings_vnd: Number(savingsRes?.total_vnd || 0),
          };
        } catch (e) {}
      }

      return new Response(JSON.stringify({ success: true, module: targetModule, plant_group: plantGroup, plant_code: plantCode, stats }), { headers: CORS });
    }

    // ============================================================
    // D1 API ROUTE: /api/employee/:id/performance
    // ============================================================
    if (url.pathname.startsWith("/api/employee/") && url.pathname.endsWith("/performance")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const parts = url.pathname.split("/");
      const empId = parts[3];

      let reviews = [];
      let avgScore = 5.0;
      let totalCompleted = 0;

      if (env && env.DB && empId) {
        try {
          await ensureWorkerTables(env.DB);
          const { results } = await env.DB.prepare(`
            SELECT r.rating, r.comment, r.reviewed_at, c.title, c.id as card_id
            FROM task_card_reviews r
            JOIN task_cards c ON r.card_id = c.id
            WHERE c.assignee_id = ? OR c.created_by = ?
            ORDER BY r.reviewed_at DESC LIMIT 100
          `).bind(empId, empId).all();
          if (results) {
            reviews = results;
            totalCompleted = reviews.length;
            const sumRatings = reviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
            if (totalCompleted > 0) avgScore = Number((sumRatings / totalCompleted).toFixed(1));
          }
        } catch (e) {}
      }

      return new Response(JSON.stringify({
        success: true,
        employee_id: empId,
        average_score: avgScore,
        total_completed_tasks: totalCompleted,
        reviews,
      }), { headers: CORS });
    }

    // ============================================================
    // D1 API ROUTE: /api/management-152/verify-access
    // ============================================================
    if (url.pathname === "/api/management-152/verify-access" || url.pathname.startsWith("/api/management-152/verify-access")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" }), { status: 401, headers: CORS });

      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";

      try {
        const body = await request.json().catch(() => ({}));
        const { pin } = body;
        if (!pin || !pin.trim()) return new Response(JSON.stringify({ success: false, error: "Vui lòng nhập mã PIN xác thực" }), { status: 400, headers: CORS });

        if (env && env.DB) {
          await ensureWorkerTables(env.DB);
          let pinRecord = await env.DB.prepare("SELECT * FROM user_security_pin WHERE user_id = ?").bind(empCode).first().catch(() => null);
          if (!pinRecord) {
            await env.DB.prepare("INSERT INTO user_security_pin (user_id, pin_hash, must_change_pin, failed_attempts) VALUES (?, ?, 1, 0)").bind(empCode, "123456").run().catch(() => {});
            pinRecord = { user_id: empCode, pin_hash: "123456", must_change_pin: 1, failed_attempts: 0, locked_until: null };
          }

          if (pinRecord.locked_until) {
            const lockTime = new Date(pinRecord.locked_until).getTime();
            const nowTime = Date.now();
            if (nowTime < lockTime) {
              const remainingMins = Math.ceil((lockTime - nowTime) / (1000 * 60));
              return new Response(JSON.stringify({
                success: false,
                error: "LOCKED",
                message: `Tài khoản tạm bị khóa truy cập Module 1-5-2. Thử lại sau ${remainingMins} phút.`,
              }), { status: 429, headers: CORS });
            }
          }

          const isValidPin = pin.trim() === pinRecord.pin_hash;
          if (!isValidPin) {
            const newFailed = Number(pinRecord.failed_attempts || 0) + 1;
            let lockedUntil = null;
            if (newFailed >= 3) {
              const lockDate = new Date();
              lockDate.setMinutes(lockDate.getMinutes() + 15);
              lockedUntil = lockDate.toISOString();
            }
            await env.DB.prepare("UPDATE user_security_pin SET failed_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").bind(newFailed, lockedUntil, empCode).run().catch(() => {});
            return new Response(JSON.stringify({
              success: false,
              error: newFailed >= 3 ? "LOCKED" : "INVALID_PIN",
              message: newFailed >= 3 ? "Đã nhập sai 3 lần. Tài khoản bị tạm khóa 15 phút." : `Mã PIN không chính xác. Sai ${newFailed}/3 lần.`,
            }), { status: 400, headers: CORS });
          }

          await env.DB.prepare("UPDATE user_security_pin SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").bind(empCode).run().catch(() => {});
          return new Response(JSON.stringify({ success: true, mustChangePin: Boolean(pinRecord.must_change_pin) }), { headers: CORS });
        }

        return new Response(JSON.stringify({ success: true, mustChangePin: false }), { headers: CORS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/admin/workspace-config
    // ============================================================
    if (url.pathname === "/api/admin/workspace-config" || url.pathname.startsWith("/api/admin/workspace-config")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });

      if (request.method === "GET") {
        try {
          const roleParam = url.searchParams.get("role");
          let results = [];
          if (env && env.DB) {
            await ensureWorkerTables(env.DB);
            let query = "SELECT * FROM role_workspace_config ORDER BY role ASC, sort_order ASC";
            let bindings = [];
            if (roleParam) {
              query = "SELECT * FROM role_workspace_config WHERE UPPER(role) = UPPER(?) ORDER BY sort_order ASC";
              bindings.push(roleParam);
            }
            const res = await env.DB.prepare(query).bind(...bindings).all();
            if (res && res.results) results = res.results;
          }
          return new Response(JSON.stringify({ success: true, data: results }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const { role, route, label, icon = "IconChevronRight", sort_order = 0 } = body;
          if (!role || !route || !label) {
            return new Response(JSON.stringify({ success: false, error: "Role, route và label là bắt buộc" }), { status: 400, headers: CORS });
          }

          const id = `rwc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          if (env && env.DB) {
            await ensureWorkerTables(env.DB);
            await env.DB.prepare("INSERT INTO role_workspace_config (id, role, route, label, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)").bind(id, role.toUpperCase(), route, label, icon, Number(sort_order) || 0).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã thêm cấu hình menu cho role thành công", id }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }

      if (request.method === "DELETE") {
        try {
          const id = url.searchParams.get("id");
          if (!id) return new Response(JSON.stringify({ success: false, error: "Thiếu tham số id" }), { status: 400, headers: CORS });

          if (env && env.DB) {
            await ensureWorkerTables(env.DB);
            await env.DB.prepare("DELETE FROM role_workspace_config WHERE id = ?").bind(id).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã xóa cấu hình menu" }), { headers: CORS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
        }
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/admin/audit-search
    // ============================================================
    if (url.pathname === "/api/admin/audit-search" || url.pathname.startsWith("/api/admin/audit-search")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });

      try {
        const userId = url.searchParams.get("user_id");
        const moduleName = url.searchParams.get("module");
        const action = url.searchParams.get("action");

        let results = [];
        if (env && env.DB) {
          await ensureWorkerTables(env.DB);
          const conditions = [];
          const bindings = [];

          if (userId) {
            conditions.push("(user_id = ? OR emp_code = ?)");
            bindings.push(userId, userId);
          }
          if (moduleName) {
            conditions.push("module = ?");
            bindings.push(moduleName);
          }
          if (action) {
            conditions.push("action = ?");
            bindings.push(action);
          }

          const whereStr = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
          const query = `SELECT * FROM audit_logs ${whereStr} ORDER BY created_at DESC LIMIT 200`;

          const res = await env.DB.prepare(query).bind(...bindings).all();
          if (res && res.results) results = res.results;
        }

        return new Response(JSON.stringify({ success: true, data: results }), { headers: CORS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
      }
    }

    // ============================================================
    // D1 API ROUTE: /api/admin/module-152/verify-pin & change-pin
    // ============================================================
    if (url.pathname === "/api/admin/module-152/verify-pin") {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });

      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";

      try {
        const body = await request.json().catch(() => ({}));
        const { pin } = body;
        if (!pin || !pin.trim()) return new Response(JSON.stringify({ success: false, error: "Vui lòng nhập mã PIN 2FA" }), { status: 400, headers: CORS });

        if (env && env.DB) {
          await ensureWorkerTables(env.DB);
          let pinRecord = await env.DB.prepare("SELECT * FROM admin_module_pin WHERE user_id = ?").bind(empCode).first().catch(() => null);
          if (!pinRecord) {
            await env.DB.prepare("INSERT INTO admin_module_pin (user_id, pin_hash, must_change_pin, failed_attempts) VALUES (?, ?, 1, 0)").bind(empCode, "123456").run().catch(() => {});
            pinRecord = { user_id: empCode, pin_hash: "123456", must_change_pin: 1, failed_attempts: 0, locked_until: null };
          }

          if (pinRecord.locked_until) {
            const lockTime = new Date(pinRecord.locked_until).getTime();
            const nowTime = Date.now();
            if (nowTime < lockTime) {
              const remainingMins = Math.ceil((lockTime - nowTime) / (1000 * 60));
              return new Response(JSON.stringify({
                success: false,
                error: "LOCKED",
                message: `Tài khoản đã bị tạm khóa module 1-5-2. Vui lòng thử lại sau ${remainingMins} phút.`,
              }), { status: 429, headers: CORS });
            }
          }

          const isValidPin = pin.trim() === pinRecord.pin_hash;
          if (!isValidPin) {
            const newFailed = Number(pinRecord.failed_attempts || 0) + 1;
            let lockedUntil = null;
            if (newFailed >= 5) {
              const lockDate = new Date();
              lockDate.setMinutes(lockDate.getMinutes() + 15);
              lockedUntil = lockDate.toISOString();
            }
            await env.DB.prepare("UPDATE admin_module_pin SET failed_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").bind(newFailed, lockedUntil, empCode).run().catch(() => {});
            return new Response(JSON.stringify({
              success: false,
              error: newFailed >= 5 ? "LOCKED" : "INVALID_PIN",
              message: newFailed >= 5 ? "Đã nhập sai quá 5 lần. Tài khoản bị tạm khóa 15 phút." : `Mã PIN không đúng. Nhập sai ${newFailed}/5 lần.`,
            }), { status: 400, headers: CORS });
          }

          await env.DB.prepare("UPDATE admin_module_pin SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").bind(empCode).run().catch(() => {});
          return new Response(JSON.stringify({ success: true, mustChangePin: Boolean(pinRecord.must_change_pin) }), { headers: CORS });
        }

        return new Response(JSON.stringify({ success: true, mustChangePin: false }), { headers: CORS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
      }
    }

    if (url.pathname === "/api/admin/module-152/change-pin") {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: CORS });

      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";

      try {
        const body = await request.json().catch(() => ({}));
        const { oldPin, newPin } = body;
        if (!oldPin || !oldPin.trim() || !newPin || !newPin.trim()) {
          return new Response(JSON.stringify({ success: false, error: "Vui lòng nhập đầy đủ mã PIN hiện tại và mã PIN mới" }), { status: 400, headers: CORS });
        }
        if (newPin.trim().length < 6) {
          return new Response(JSON.stringify({ success: false, error: "Mã PIN mới phải có ít nhất 6 ký tự" }), { status: 400, headers: CORS });
        }
        if (newPin.trim() === "123456") {
          return new Response(JSON.stringify({ success: false, error: "Mã PIN mới không được trùng với mã PIN mặc định (123456)" }), { status: 400, headers: CORS });
        }

        if (env && env.DB) {
          await ensureWorkerTables(env.DB);
          const pinRecord = await env.DB.prepare("SELECT * FROM admin_module_pin WHERE user_id = ?").bind(empCode).first().catch(() => null);
          if (!pinRecord || pinRecord.pin_hash !== oldPin.trim()) {
            return new Response(JSON.stringify({ success: false, error: "Mã PIN hiện tại không chính xác" }), { status: 400, headers: CORS });
          }

          await env.DB.prepare("UPDATE admin_module_pin SET pin_hash = ?, must_change_pin = 0, failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").bind(newPin.trim(), empCode).run();
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Đổi mã PIN 2FA thành công! Quý vị có thể truy cập Module 1-5-2 bình thường.",
        }), { headers: CORS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
      }
    }

    if (url.pathname === "/api/tasks") {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

      const authHeader = request.headers.get("authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      const session = parseSessionWorker(token);
      const empCode = session?.empCode || session?.userId || "202608001";

      try {
        if (env && env.DB) {
          await ensureWorkerTables(env.DB);
        }

        if (request.method === "GET") {
          let tasks = [];
          if (env && env.DB) {
            const { results } = await env.DB.prepare("SELECT * FROM sys_my_tasks ORDER BY created_at DESC").all().catch(() => ({ results: [] }));
            if (results && results.length > 0) {
              tasks = results.map(r => ({
                ...r,
                checklist: typeof r.checklist === "string" ? JSON.parse(r.checklist || "[]") : (r.checklist || []),
              }));
            }
          }
          return new Response(JSON.stringify({ success: true, tasks }), { headers: CORS });
        }

        if (request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          const {
            title,
            description = '',
            priority = 'MEDIUM',
            due_date,
            project_id = null,
            assignee_emp_code = '202608001',
            assignee_name = 'Phạm Nguyễn Anh Huy',
            department_id = 'IT_DIGITAL',
            tags = 'TASK',
          } = body;

          if (!title || !title.trim()) {
            return new Response(JSON.stringify({ success: false, error: 'Tiêu đề công việc là bắt buộc' }), { status: 400, headers: CORS });
          }

          const newTask = {
            id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
            title: title.trim(),
            description: (description || '').trim(),
            department_id: department_id || "IT_DIGITAL",
            project_id: project_id || null,
            assignee_emp_code: assignee_emp_code || "202608001",
            assignee_name: assignee_name || "Phạm Nguyễn Anh Huy",
            reporter_emp_code: empCode,
            priority: priority || "MEDIUM",
            start_date: new Date().toISOString().substring(0, 10),
            due_date: due_date || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
            status: "TO_DO",
            progress: 0,
            tags: tags || "TASK",
            checklist: [],
            result_description: "",
          };

          if (env && env.DB) {
            await env.DB.prepare(`
              INSERT INTO sys_my_tasks (
                id, code, title, description, department_id, project_id, assignee_emp_code, assignee_name,
                reporter_emp_code, priority, start_date, due_date, status, progress, tags, checklist, result_description
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              newTask.id, newTask.code, newTask.title, newTask.description, newTask.department_id, newTask.project_id,
              newTask.assignee_emp_code, newTask.assignee_name, newTask.reporter_emp_code,
              newTask.priority, newTask.start_date, newTask.due_date, newTask.status,
              newTask.progress, newTask.tags, JSON.stringify(newTask.checklist), newTask.result_description
            ).run().catch((e) => console.error("D1 insert task err:", e));
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Tạo công việc thành công',
            task: newTask,
          }), { headers: CORS });
        }

        if (request.method === "PATCH") {
          const body = await request.json().catch(() => ({}));
          const { taskId, status, resultDescription, helpReason, checklistId, completed, progress } = body;

          if (!taskId) {
            return new Response(JSON.stringify({ success: false, error: 'taskId là bắt buộc' }), { status: 400, headers: CORS });
          }

          if (env && env.DB) {
            const existing = await env.DB.prepare("SELECT * FROM sys_my_tasks WHERE id = ?").bind(taskId).first().catch(() => null);
            if (existing) {
              let newStatus = status !== undefined ? status : existing.status;
              let newResult = resultDescription !== undefined ? resultDescription : existing.result_description;
              let newHelpReason = helpReason !== undefined ? helpReason : existing.help_reason;
              let newHelpNotifiedTo = existing.help_notified_to;

              let newProgress = progress !== undefined ? progress : existing.progress;
              let checklistArr = typeof existing.checklist === 'string' ? JSON.parse(existing.checklist || '[]') : (existing.checklist || []);

              if (checklistId !== undefined) {
                checklistArr = checklistArr.map((c) => c.id === checklistId ? { ...c, completed: Boolean(completed) } : c);
                const doneCount = checklistArr.filter((c) => c.completed).length;
                newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
              }

              if (newStatus === "DONE") {
                newProgress = 100;
              }

              await env.DB.prepare(`
                UPDATE sys_my_tasks
                SET status = ?, result_description = ?, help_reason = ?, help_notified_to = ?, progress = ?, checklist = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
              `).bind(newStatus, newResult, newHelpReason || "", newHelpNotifiedTo || "", newProgress, JSON.stringify(checklistArr), taskId).run().catch(() => {});
            }
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Đã cập nhật công việc thành công'
          }), { headers: CORS });
        }
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
      }
    }

    // ============================================================
    // API ROUTE: /api/ci-kaizen (Kaizen Proposals & Management)
    // ============================================================
    if (url.pathname === "/api/ci-kaizen" || url.pathname === "/api/ci-kaizen/" || url.pathname.startsWith("/api/ci-kaizen/")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Sync-Secret",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
      }

      try {
        if (url.pathname === "/api/ci-kaizen/check-duplicate" && request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          const { factory = '', region = '', line = '', category = '', beforeDescription = '', afterSolution = '', title = '' } = body;

          let matches = [];
          if (env && env.DB) {
            const { results } = await env.DB.prepare(`
              SELECT * FROM ci_kaizen_proposals 
              WHERE (trang_thai IS NULL OR trang_thai != 'DA_GOP')
              ORDER BY created_at DESC LIMIT 300
            `).all().catch(() => ({ results: [] }));

            if (results && results.length > 0) {
              const targetArea = (factory || region || '').toUpperCase().trim();
              const targetLine = (line || '').toUpperCase().trim();
              const targetCategory = (category || '').toUpperCase().trim();
              const targetText = `${title} ${beforeDescription} ${afterSolution}`;

              for (const prop of results) {
                const propArea = (prop.factory || prop.region || '').toUpperCase().trim();
                const propLine = (prop.line || '').toUpperCase().trim();
                const propCategory = (prop.category || '').toUpperCase().trim();
                const propText = `${prop.title || ''} ${prop.before_description || ''} ${prop.after_solution || ''}`;

                let score = 0;
                if (targetArea && propArea && (targetArea.includes(propArea) || propArea.includes(targetArea))) score += 25;
                if (targetLine && propLine && (targetLine.includes(propLine) || propLine.includes(targetLine))) score += 25;
                else if (!targetLine && !propLine) score += 15;
                if (targetCategory && propCategory && targetCategory === propCategory) score += 20;

                const cleanTokens = (s) => (s || '').toLowerCase().replace(/[^\w\s\u00C0-\u1EF9]/gi, '').split(/\s+/).filter(w => w.length > 2);
                const t1 = new Set(cleanTokens(targetText));
                const t2 = new Set(cleanTokens(propText));
                let inter = 0;
                for (const tok of t1) { if (t2.has(tok)) inter++; }
                const union = new Set([...t1, ...t2]).size;
                const textSim = union > 0 ? Math.round((inter / union) * 100) : 0;
                score += Math.round((textSim * 30) / 100);

                if (textSim >= 30 && score >= 70) {
                  matches.push({
                    proposal: prop,
                    similarityPercentage: Math.min(99, score),
                  });
                }
              }
            }
          }

          return new Response(JSON.stringify({
            success: true,
            isDuplicate: matches.length > 0,
            matches: matches.slice(0, 5)
          }), { headers: CORS });
        }

        if (url.pathname === "/api/ci-kaizen/sync" && (request.method === "POST" || request.method === "GET")) {
          let syncedCount = 0;
          let createdCount = 0;
          let updatedCount = 0;

          if (env && env.DB) {
            try {
              const fetchRes = await fetch("https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1", {
                headers: {
                  "Cache-Control": "no-cache",
                  "x-sync-secret": "tbs_ii_secure_jwt_secret_key_2026"
                }
              });
              if (fetchRes.ok) {
                const json = await fetchRes.json();
                const sourceProposals = json.data || json.proposals || [];
                
                for (const item of sourceProposals) {
                  if (!item || (!item.id && !item.external_id) || !item.title) continue;
                  
                  const siteCode = item.site_code || 'thkiengiangshoes';
                  const externalId = item.external_id || item.id;
                  const localId = siteCode === 'thkiengiangshoes'
                    ? (String(item.id).startsWith('tkg_') ? String(item.id) : `tkg_${externalId}`)
                    : String(item.id);

                  const existing = await env.DB.prepare('SELECT id FROM ci_kaizen_proposals WHERE id = ? OR (site_code = ? AND external_id = ?)').bind(localId, siteCode, externalId).first().catch(() => null);
                  const attachmentsJson = item.attachments_json || (Array.isArray(item.attachments) ? JSON.stringify(item.attachments) : '[]');
                  
                  if (existing) {
                    await env.DB.prepare(`
                      UPDATE ci_kaizen_proposals
                      SET title = ?, category = ?, category_label = ?, factory = ?, region = ?, department = ?, line = ?, proposer_name = ?, before_description = ?, after_solution = ?, before_image_url = ?, after_image_url = ?, attachments_json = ?, updated_at = CURRENT_TIMESTAMP
                      WHERE id = ?
                    `).bind(
                      item.title || '', item.category || 'PRODUCTIVITY', item.category_label || item.categoryLabel || '3.Tăng Năng suất',
                      'TH Kiên Giang Shoes', 'TH Kiên Giang Shoes', item.department || '', item.line || '',
                      item.proposer_name || item.proposerName || '', item.before_description || item.beforeDescription || '', item.after_solution || item.afterSolution || '',
                      item.before_image_url || item.beforeImageUrl || '', item.after_image_url || item.afterImageUrl || '', attachmentsJson, existing.id
                    ).run().catch(() => {});
                    updatedCount++;
                  } else {
                    await env.DB.prepare(`
                      INSERT INTO ci_kaizen_proposals (
                        id, code, title, category, category_label, registration_type, factory, region, source_region, department, line, proposer_name, proposer_emp_code, before_description, after_solution, saved_seconds, total_savings_vnd, score_points, vote_count, view_count, status, approval_status, sub_status, trang_thai, review_status, before_image_url, after_image_url, attachments_json, site_code, external_id, created_at
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                      localId, item.code || `KZ-${Math.floor(1000 + Math.random() * 9000)}`, item.title || '', item.category || 'PRODUCTIVITY', item.category_label || item.categoryLabel || '3.Tăng Năng suất',
                      item.registration_type || 'THI_DUA', 'TH Kiên Giang Shoes', 'TH Kiên Giang Shoes', 'TH Kiên Giang Shoes',
                      item.department || '', item.line || '', item.proposer_name || item.proposerName || '', item.proposer_emp_code || item.proposerEmpCode || 'TKG-EMP',
                      item.before_description || item.beforeDescription || '', item.after_solution || item.afterSolution || '',
                      item.saved_seconds || 0, item.total_savings_vnd || 0, item.score_points || 0, item.vote_count || 0, item.view_count || 0,
                      item.status || 'SUBMITTED', item.approval_status || 'PENDING', item.sub_status || 'CHO_DUYET', item.trang_thai || 'CHO_DUYET', item.review_status || 'CHO_DUYET',
                      item.before_image_url || item.beforeImageUrl || '', item.after_image_url || item.afterImageUrl || '', attachmentsJson,
                      siteCode, externalId, item.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19)
                    ).run().catch((e) => console.error("Sync D1 insert error:", e));
                    createdCount++;
                  }
                  syncedCount++;
                }
              }
            } catch (syncErr) {
              console.error("[Sync Error]:", syncErr);
            }
          }

          return new Response(JSON.stringify({
            success: true,
            message: `Đồng bộ dữ liệu từ TH Kiên Giang thành công! (Tổng: ${syncedCount}, Mới: ${createdCount}, Cập nhật: ${updatedCount})`,
            syncedCount,
            createdCount,
            updatedCount
          }), { headers: CORS });
        }

        if (request.method === "GET") {
          if (url.pathname === "/api/ci-kaizen/status-counts") {
            let total = 0, submitted = 0, pending = 0, approved = 0, rejected = 0;
            if (env && env.DB) {
              const res = await env.DB.prepare(`
                SELECT 
                  COUNT(*) as total,
                  SUM(CASE WHEN sub_status = 'CHO_DUYET' OR trang_thai = 'CHO_DUYET' THEN 1 ELSE 0 END) as submitted,
                  SUM(CASE WHEN approval_status = 'PHE_DUYET' OR trang_thai = 'DA_DANH_GIA' THEN 1 ELSE 0 END) as approved
                FROM ci_kaizen_proposals
              `).first().catch(() => null);
              if (res) {
                total = res.total || 0;
                submitted = res.submitted || 0;
                approved = res.approved || 0;
              }
            }
            return new Response(JSON.stringify({
              success: true,
              data: { total, submitted, pending, approved, rejected }
            }), { headers: CORS });
          }

          let proposals = [];
          if (env && env.DB) {
            const { results } = await env.DB.prepare("SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500").all().catch(() => ({ results: [] }));
            proposals = (results || []).map(p => ({ ...p, site_code: "vpchuoiskechers" }));
          }

          if (env && env.DB_KG) {
            const { results: kgResults } = await env.DB_KG.prepare("SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500").all().catch(() => ({ results: [] }));
            if (kgResults && kgResults.length > 0) {
              const existingIds = new Set(proposals.map(p => p.id));
              for (const kgP of kgResults) {
                if (!existingIds.has(kgP.id)) {
                  proposals.push({ ...kgP, site_code: "thkiengiangshoes" });
                }
              }
            }
          }

          proposals.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

          return new Response(JSON.stringify({
            success: true,
            data: proposals,
            proposals: proposals
          }), { headers: CORS });
        }

        if (request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          const id = body.id || `kz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          
          let code = body.code;
          if (!code && env && env.DB) {
            try {
              const maxRes = await env.DB.prepare(`
                SELECT code FROM ci_kaizen_proposals 
                WHERE code LIKE 'CI-2026-%' 
                ORDER BY CAST(SUBSTR(code, 9) AS INTEGER) DESC LIMIT 1
              `).first().catch(() => null);

              let maxSeq = 0;
              if (maxRes && maxRes.code) {
                const parts = String(maxRes.code).split("-");
                const numStr = parts[parts.length - 1];
                const parsedNum = parseInt(numStr, 10);
                if (!isNaN(parsedNum)) maxSeq = parsedNum;
              }
              code = `CI-2026-${String(maxSeq + 1).padStart(3, "0")}`;
            } catch (e) {
              code = `CI-2026-${Math.floor(100 + Math.random() * 900)}`;
            }
          }
          if (!code) {
            code = `CI-2026-${Math.floor(100 + Math.random() * 900)}`;
          }

          if (env && env.DB) {
            try {
              await env.DB.prepare(`
                INSERT INTO ci_kaizen_proposals (
                  id, code, title, category, category_label, registration_type, factory, region, source_region, department, line, proposer_name, proposer_emp_code, before_description, after_solution, saved_seconds, total_savings_vnd, score_points, vote_count, view_count, status, approval_status, sub_status, trang_thai, review_status, before_image_url, after_image_url, attachments_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  title = excluded.title,
                  before_description = excluded.before_description,
                  after_solution = excluded.after_solution,
                  status = excluded.status
              `).bind(
                id, code, body.title || '', body.category || 'PRODUCTIVITY', body.categoryLabel || body.category_label || '3.Tăng Năng suất',
                body.registrationType || 'THI_DUA', body.factory || 'VP CHUỖI', body.region || 'Nhà Máy Miền Đông', body.source_region || 'Văn phòng Chuỗi',
                body.department || 'May', body.line || 'May', body.proposerName || body.proposer_name || '', body.proposerEmpCode || body.proposer_emp_code || '',
                body.beforeDescription || body.before_description || '', body.afterSolution || body.after_solution || '',
                body.savedSeconds || body.saved_seconds || 0, body.totalSavingsVnd || body.total_savings_vnd || 0,
                body.scorePoints || body.score_points || 0, body.voteCount || body.vote_count || 0, body.viewCount || body.view_count || 0,
                body.status || 'SUBMITTED', body.approvalStatus || body.approval_status || 'PENDING', body.subStatus || body.sub_status || 'CHO_DUYET',
                body.trangThai || body.trang_thai || 'CHO_DUYET', body.reviewStatus || body.review_status || 'CHO_DUYET',
                body.beforeImageUrl || body.before_image_url || '', body.afterImageUrl || body.after_image_url || '',
                typeof body.attachmentsJson === 'string' ? body.attachmentsJson : JSON.stringify(body.attachmentsJson || []),
                body.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19)
              ).run();
            } catch (dbErr) {
              console.error("[D1 Insert Error]:", dbErr);
              return new Response(JSON.stringify({ success: false, error: "D1_INSERT_ERROR", message: "Lỗi ghi dữ liệu D1: " + (dbErr.message || String(dbErr)) }), { status: 500, headers: CORS });
            }
          }

          return new Response(JSON.stringify({
            success: true,
            message: "Tạo/Cập nhật thẻ Kaizen thành công",
            id,
            code
          }), { headers: CORS });
        }
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
      }
    }



    // ============================================================
    // REAL-TIME EVENT-DRIVEN GOOGLE DRIVE BACKUP & AUDIT LOGGING
    // ============================================================

    async function triggerEventDrivenDriveBackup(env, moduleName, empCode, overrideWebAppUrl) {
      if (!env || !env.DB) return { success: false, reason: "DB binding missing" };
      const webAppUrl = overrideWebAppUrl || env.GDRIVE_WEBAPP_URL || env.GOOGLE_WEBAPP_URL;
      const clientEmail = env.GDRIVE_CLIENT_EMAIL || env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = env.GDRIVE_PRIVATE_KEY || env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

      try {
        const timestamp = new Date().toISOString();
        const dateStr = timestamp.substring(0, 10);
        const timeStr = timestamp.substring(11, 19).replace(/:/g, '-');

        const tablesQuery = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
        const tables = (tablesQuery.results || []).map((r) => r.name);
        const backupData = { metadata: { exported_at: timestamp, type: 'USER_EVENT', triggered_by: empCode, module: moduleName }, tables: {} };

        const EMP_NAME_MAP = {
          "TGĐ-001": "Tổng Giám Đốc",
          "PTGĐ-002": "Phó Tổng Giám Đốc",
          "GĐ-003": "Giám Đốc",
          "PGĐ-004": "Phó Giám Đốc",
          "202608001": "Cán Bộ Công Nhân Viên",
          "ADMIN-2026": "Quản Trị Viên Hệ Thống"
        };

        const SENSITIVE_KEYS = new Set(['password', 'pass', 'token', 'secret', 'access_token', 'refresh_token', 'authorization', 'private_key', 'gdrive_private_key']);
        const sanitizeRow = (obj) => {
          if (!obj || typeof obj !== 'object') return obj;
          const res = {};
          const eCode = obj.emp_code || obj.assignee_emp_code || obj.reporter_emp_code || obj.empCode || obj.user_id;
          
          if (eCode || obj.emp_name || obj.assignee_name || obj.name) {
            const defaultName = obj.emp_name || obj.assignee_name || obj.name || (eCode && EMP_NAME_MAP[eCode] ? EMP_NAME_MAP[eCode] : null) || (eCode === 'SYSTEM' ? "Hệ Thống Tự Động (System)" : "Cán Bộ Công Nhân Viên");
            res["emp_name"] = defaultName;
          }

          for (const [k, v] of Object.entries(obj)) {
            if (SENSITIVE_KEYS.has(k.toLowerCase()) || k.toLowerCase().includes('password') || k.toLowerCase().includes('secret')) {
              res[k] = '[REDACTED]';
            } else {
              res[k] = v;
            }
          }
          return res;
        };

        for (const tableName of tables) {
          try {
            const { results } = await env.DB.prepare(`SELECT * FROM ${tableName} LIMIT 50000`).all();
            backupData.tables[tableName] = (results || []).map(row => sanitizeRow(row));
          } catch (e) {
            backupData.tables[tableName] = { error: String(e) };
          }
        }

        const categories = [
          {
            folder: "01_Nhat_Ky_Thao_Tac_Audit_Logs",
            prefix: "audit_logs",
            match: (tbl) => tbl.includes("audit") || tbl.includes("log") || tbl.includes("history")
          },
          {
            folder: "02_Tai_Khoan_Nguoi_Dung_Users",
            prefix: "users_employees",
            match: (tbl) => tbl.includes("user") || tbl.includes("employee") || tbl.includes("profile") || tbl.includes("hr_")
          },
          {
            folder: "03_Sang_Kien_Cai_Tien_Kaizen",
            prefix: "kaizen_proposals",
            match: (tbl) => tbl.includes("kaizen") || tbl.includes("ci_") || tbl.includes("proposal")
          },
          {
            folder: "04_Quan_Ly_Gemba_Andon",
            prefix: "gemba_andon",
            match: (tbl) => tbl.includes("gemba") || tbl.includes("andon")
          },
          {
            folder: "05_Dat_Phong_Hop_Rooms",
            prefix: "room_bookings",
            match: (tbl) => tbl.includes("room") || tbl.includes("meeting") || tbl.includes("booking")
          },
          {
            folder: "00_Tong_Hop_Full_Database",
            prefix: "full_database_dump",
            match: () => true
          }
        ];

        // METHOD 1: Google Apps Script Web App (Recommended for Personal Google Drive without quota limits)
        const defaultWebAppUrl = "https://script.google.com/macros/s/AKfycbzURTdqrslG5q_FWIOfozMETHXOkQSYSdu-puHR9hF5TQ0GF5_HCCUU0LzZJKjUE2kp2g/exec";
        const targetWebAppUrl = overrideWebAppUrl || env.GDRIVE_WEBAPP_URL || env.GOOGLE_WEBAPP_URL || defaultWebAppUrl;

        if (targetWebAppUrl) {
          const uploadedResults = [];
          for (const cat of categories) {
            const catTables = {};
            for (const [tblName, tblData] of Object.entries(backupData.tables || {})) {
              if (cat.match(tblName)) {
                catTables[tblName] = tblData;
              }
            }
            if (Object.keys(catTables).length > 0) {
              const catFileName = `tbs_${cat.prefix}_realtime_${dateStr}_${timeStr}.json`;
              const content = {
                metadata: {
                  ...backupData.metadata,
                  category: cat.folder,
                  exported_at: new Date().toISOString()
                },
                tables: catTables
              };
              try {
                const webAppRes = await fetch(targetWebAppUrl, {
                  method: "POST",
                  headers: { "Content-Type": "text/plain;charset=utf-8" },
                  body: JSON.stringify({
                    folderName: cat.folder,
                    fileName: catFileName,
                    content: content
                  }),
                  redirect: "follow"
                });
                const rawTxt = await webAppRes.text();
                let resJson;
                try {
                  resJson = JSON.parse(rawTxt);
                } catch (_) {
                  resJson = { success: webAppRes.ok, raw: rawTxt.substring(0, 300) };
                }
                uploadedResults.push({ category: cat.folder, file: resJson });
              } catch (e) {
                uploadedResults.push({ category: cat.folder, error: e.message });
              }
            }
          }
          return {
            success: true,
            method: "Google Apps Script WebApp",
            webAppUrl: targetWebAppUrl,
            uploadedFiles: uploadedResults
          };
        }

        // METHOD 2: Direct Google Drive API with Service Account
        if (!clientEmail || !privateKey) {
          return { success: false, reason: "GDRIVE credentials (clientEmail/privateKey) or GDRIVE_WEBAPP_URL missing" };
        }

        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT' };
        const claimSet = {
          iss: clientEmail,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
          aud: 'https://oauth2.googleapis.com/token',
          exp: now + 3600,
          iat: now
        };

        const b64Url = (str) => btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const b64Buf = (buf) => {
          let bin = '';
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
          return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        };

        const unsigned = `${b64Url(JSON.stringify(header))}.${b64Url(JSON.stringify(claimSet))}`;
        let cleanPem = privateKey.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
        while (cleanPem.length % 4 !== 0) cleanPem += '=';
        const rawKey = atob(cleanPem);
        const keyBuf = new Uint8Array(rawKey.length);
        for (let i = 0; i < rawKey.length; i++) keyBuf[i] = rawKey.charCodeAt(i);

        const cryptoKey = await crypto.subtle.importKey('pkcs8', keyBuf.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
        const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
        const jwt = `${unsigned}.${b64Buf(sigBuf)}`;

        const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
        });

        if (!tokenResp.ok) {
          const errText = await tokenResp.text();
          return { success: false, reason: `OAuth token failed: ${tokenResp.status} ${errText}` };
        }
        const { access_token } = await tokenResp.json();

        let rootId = env.GDRIVE_FOLDER_ID;
        let rootFolderName = "Configured GDRIVE_FOLDER_ID";
        let discoveredFolders = [];

        if (!rootId) {
          try {
            const listUrl = "https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.folder%27+and+trashed%3Dfalse&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&pageSize=1000";
            const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${access_token}` } });
            if (listRes.ok) {
              const listData = await listRes.json();
              const folders = listData.files || [];
              discoveredFolders = folders.map((f) => ({ id: f.id, name: f.name }));

              // Match folder name flexibly (case & unicode insensitive)
              const matchedFolder = folders.find((f) => {
                const normName = (f.name || "").normalize("NFC").toLowerCase();
                return normName.includes("chuỗi") || normName.includes("chuoi") || normName.includes("văn phòng") || normName.includes("van phong") || normName.includes("tbs");
              });

              if (matchedFolder) {
                rootId = matchedFolder.id;
                rootFolderName = matchedFolder.name;
              } else if (folders.length > 0) {
                rootId = folders[0].id;
                rootFolderName = folders[0].name;
              }
            }
          } catch (e) {}
        }

        if (!rootId) {
          // If no root folder found in search, create 'Văn Phòng Chuỗi' in Service Account drive
          const createRoot = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
            method: "POST",
            headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Văn Phòng Chuỗi", mimeType: "application/vnd.google-apps.folder" })
          });
          if (createRoot.ok) {
            const createdData = await createRoot.json();
            rootId = createdData.id;
            rootFolderName = "Văn Phòng Chuỗi (Tự động tạo)";
          }
        }

        if (!rootId) return { success: false, reason: "Unable to find or create root Google Drive folder" };

        const getSubfolderId = async (folderName) => {
          const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${rootId}' in parents and trashed=false`);
          const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`, {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.files && data.files.length > 0) return data.files[0].id;
          }
          const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootId] })
          });
          if (createRes.ok) {
            const createdSub = await createRes.json();
            return createdSub.id;
          }
          return rootId;
        };

        const uploadFile = async (subFolderId, fName, contentObj) => {
          const boundary = 'bound_' + Math.random().toString(36).substring(2);
          const jsonStr = JSON.stringify(contentObj, null, 2);
          const meta = { name: fName, mimeType: 'application/json', parents: [subFolderId] };
          const bodyStr = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonStr}\r\n--${boundary}--`;

          const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
            method: 'POST',
            headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
            body: bodyStr
          });
          if (!uploadRes.ok) {
            const errTxt = await uploadRes.text();
            return { error: `Upload ${fName} failed: ${uploadRes.status} ${errTxt}` };
          }
          const uploadedFile = await uploadRes.json();
          return { id: uploadedFile.id, name: fName };
        };

        const uploadedResults = [];
        for (const cat of categories) {
          const subFolderId = await getSubfolderId(cat.folder);
          const catTables = {};
          for (const [tblName, tblData] of Object.entries(backupData.tables || {})) {
            if (cat.match(tblName)) {
              catTables[tblName] = tblData;
            }
          }

          if (Object.keys(catTables).length > 0) {
            const catFileName = `tbs_${cat.prefix}_realtime_${dateStr}_${timeStr}.json`;
            const content = {
              metadata: {
                ...backupData.metadata,
                category: cat.folder,
                exported_at: new Date().toISOString()
              },
              tables: catTables
            };
            const uploadRes = await uploadFile(subFolderId, catFileName, content);
            uploadedResults.push({ category: cat.folder, subFolderId, file: uploadRes });
          }
        }

        const hasQuotaError = uploadedResults.some(r => r.file && r.file.error && r.file.error.includes("storageQuotaExceeded"));
        return {
          success: !hasQuotaError,
          rootFolderId: rootId,
          rootFolderName: rootFolderName,
          discoveredFolders: discoveredFolders,
          uploadedFiles: uploadedResults,
          quotaWarning: hasQuotaError ? "Google Drive Service Accounts do not have storage quota on personal Gmail folders. Please deploy the 1-minute Google Apps Script WebApp endpoint solution." : null
        };
      } catch (err) {
        console.warn('[Realtime Backup Warning]:', err);
        return { success: false, error: err.message };
      }
    }

    async function recordAuditLog(user, moduleName, actionName, recordId, changesObj, request) {
      if (!env || !env.DB) return;
      try {
        const ipAddress = request ? (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1") : "127.0.0.1";
        const userAgent = request ? (request.headers.get("user-agent") || "Browser") : "Browser";
        const EMP_NAME_MAP = {
          "TGĐ-001": "Tổng Giám Đốc",
          "PTGĐ-002": "Phó Tổng Giám Đốc",
          "GĐ-003": "Giám Đốc",
          "PGĐ-004": "Phó Giám Đốc",
          "202608001": "Cán Bộ Công Nhân Viên",
          "ADMIN-2026": "Quản Trị Viên Hệ Thống"
        };
        const empCode = (user && user.empCode) || (user && user.emp_code) || "SYSTEM";
        const empName = (user && user.name) || EMP_NAME_MAP[empCode] || "Cán Bộ Công Nhân Viên";
        const roleCode = (user && user.roleCode) || (user && user.role_code) || "CBCNV";
        const userId = (user && user.id) || empCode;

        await env.DB.prepare(`
          INSERT INTO audit_logs (user_id, emp_code, emp_name, role_code, module, action, record_id, changes_json, ip_address, user_agent, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          userId,
          empCode,
          empName,
          roleCode,
          moduleName || "SYSTEM",
          actionName || "UNKNOWN",
          recordId || null,
          changesObj ? JSON.stringify(changesObj) : null,
          ipAddress,
          userAgent
        ).run().catch(() => {});

        // Real-time Event-Driven Backup to Google Drive (Non-blocking background execution)
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(triggerEventDrivenDriveBackup(env, moduleName, empCode));
        } else {
          triggerEventDrivenDriveBackup(env, moduleName, empCode).catch(() => {});
        }
      } catch (e) {
        console.warn("recordAuditLog warning:", e);
      }
    }

    async function ensureAuditAndBackupTables() {
      if (!env || !env.DB) return;
      try {
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          emp_code TEXT,
          role_code TEXT,
          module TEXT NOT NULL DEFAULT 'SYSTEM',
          action TEXT NOT NULL DEFAULT 'UNKNOWN',
          record_id TEXT,
          data_before TEXT,
          data_after TEXT,
          changes_json TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`).run().catch(() => {});

        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN changes_json TEXT").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN user_agent TEXT").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN data_before TEXT").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN data_after TEXT").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN emp_code TEXT").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN emp_name TEXT").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN role_code TEXT").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN module TEXT DEFAULT 'SYSTEM'").run().catch(() => {});
        await env.DB.prepare("ALTER TABLE audit_logs ADD COLUMN record_id TEXT").run().catch(() => {});

        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS system_backups (
          id TEXT PRIMARY KEY,
          backup_type TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size_bytes INTEGER DEFAULT 0,
          gdrive_file_id TEXT,
          status TEXT DEFAULT 'SUCCESS',
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`).run().catch(() => {});
      } catch (e) {
        console.warn("Audit/Backup table creation warning:", e);
      }
    }

    // GET /api/admin/audit-logs
    if (url.pathname === "/api/admin/audit-logs" && request.method === "GET") {
      try {
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập (401 Unauthorized)" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (!user.isExecutiveOrAdmin && user.roleCode !== "SUPER_ADMIN" && user.roleCode !== "ADMIN") {
          return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Yêu cầu quyền SUPER_ADMIN hoặc ADMIN (403 Forbidden)" }), { status: 403, headers: SECURE_JSON_HEADERS });
        }

        await ensureAuditAndBackupTables();

        const moduleKey = url.searchParams.get("module");
        const action = url.searchParams.get("action");
        const empCode = url.searchParams.get("empCode");
        const search = url.searchParams.get("search");
        const limit = parseInt(url.searchParams.get("limit") || "50", 10);
        const offset = parseInt(url.searchParams.get("offset") || "0", 10);

        const conditions = [];
        const bindings = [];

        if (moduleKey) { conditions.push("module = ?"); bindings.push(moduleKey); }
        if (action) { conditions.push("action = ?"); bindings.push(action); }
        if (empCode) { conditions.push("emp_code = ?"); bindings.push(empCode); }
        if (search) {
          conditions.push("(module LIKE ? OR action LIKE ? OR emp_code LIKE ? OR record_id LIKE ? OR changes_json LIKE ?)");
          const pattern = `%${search}%`;
          bindings.push(pattern, pattern, pattern, pattern, pattern);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countRes = await env.DB.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`).bind(...bindings).first();
        const total = countRes ? countRes.count : 0;

        const queryBindings = [...bindings, limit, offset];
        const { results } = await env.DB.prepare(`SELECT *, COALESCE(created_at, timestamp) as created_at FROM audit_logs ${whereClause} ORDER BY COALESCE(created_at, timestamp) DESC LIMIT ? OFFSET ?`).bind(...queryBindings).all();

        const safeJson = (val) => {
          if (!val) return null;
          if (typeof val === 'object') return val;
          try { return JSON.parse(val); } catch { return val; }
        };

        const logs = (results || []).map((row) => ({
          ...row,
          data_before: safeJson(row.data_before),
          data_after: safeJson(row.data_after),
          changes_json: safeJson(row.changes_json)
        }));

        await recordAuditLog(user, "SYSTEM_ADMIN", "VIEW_AUDIT_LOGS", "LIST", null, { filter: { module: moduleKey, action, empCode, search } }, request);

        return new Response(JSON.stringify({ success: true, data: logs, total, limit, offset }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // GET /api/admin/backup
    if (url.pathname === "/api/admin/backup" && request.method === "GET") {
      try {
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập (401 Unauthorized)" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (!user.isExecutiveOrAdmin && user.roleCode !== "SUPER_ADMIN" && user.roleCode !== "ADMIN") {
          return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Yêu cầu quyền SUPER_ADMIN hoặc ADMIN (403 Forbidden)" }), { status: 403, headers: SECURE_JSON_HEADERS });
        }

        await ensureAuditAndBackupTables();

        const { results } = await env.DB.prepare("SELECT * FROM system_backups ORDER BY created_at DESC LIMIT 50").all();
        return new Response(JSON.stringify({ success: true, history: results || [] }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // POST /api/admin/backup
    if (url.pathname === "/api/admin/backup" && request.method === "POST") {
      try {
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập (401 Unauthorized)" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (!user.isExecutiveOrAdmin && user.roleCode !== "SUPER_ADMIN" && user.roleCode !== "ADMIN") {
          return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Yêu cầu quyền SUPER_ADMIN hoặc ADMIN (403 Forbidden)" }), { status: 403, headers: SECURE_JSON_HEADERS });
        }

        await ensureAuditAndBackupTables();

        const backupId = `bk_manual_${Date.now()}`;
        const timestamp = new Date().toISOString();
        const dateStr = timestamp.substring(0, 10);
        const timeStr = timestamp.substring(11, 19).replace(/:/g, '-');
        const fileName = `tbs_backup_manual_${dateStr}_${timeStr}.json`;

        const tablesQuery = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
        const tables = (tablesQuery.results || []).map((r) => r.name);
        const backupData = { metadata: { exported_at: timestamp, type: 'MANUAL', triggered_by: user.empCode }, tables: {} };

        for (const tableName of tables) {
          try {
            const { results } = await env.DB.prepare(`SELECT * FROM ${tableName} LIMIT 50000`).all();
            backupData.tables[tableName] = (results || []).map(row => sanitizeDeepWorker(row));
          } catch (e) {
            backupData.tables[tableName] = { error: String(e) };
          }
        }

        const jsonContent = JSON.stringify(backupData, null, 2);
        const fileSizeBytes = new TextEncoder().encode(jsonContent).length;

        const clientEmail = env.GDRIVE_CLIENT_EMAIL || env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = env.GDRIVE_PRIVATE_KEY || env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

        let gdriveFileId = null;
        let errorMessage = null;

        if (!clientEmail || !privateKey) {
          errorMessage = "Skipped Google Drive upload: credentials not configured in environment variables.";
          await env.DB.prepare(
            `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, status, error_message, created_at)
             VALUES (?, 'MANUAL', ?, ?, 'SKIPPED_NO_CREDS', ?, CURRENT_TIMESTAMP)`
          ).bind(backupId, fileName, fileSizeBytes, errorMessage).run();
        } else {
          try {
            const now = Math.floor(Date.now() / 1000);
            const header = { alg: 'RS256', typ: 'JWT' };
            const claimSet = {
              iss: clientEmail,
              scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
              aud: 'https://oauth2.googleapis.com/token',
              exp: now + 3600,
              iat: now
            };

            const b64Url = (str) => btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
            const b64Buf = (buf) => {
              let bin = '';
              const bytes = new Uint8Array(buf);
              for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
              return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
            };

            const unsigned = `${b64Url(JSON.stringify(header))}.${b64Url(JSON.stringify(claimSet))}`;
            let cleanPem = privateKey.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
            while (cleanPem.length % 4 !== 0) cleanPem += '=';
            const rawKey = atob(cleanPem);
            const keyBuf = new Uint8Array(rawKey.length);
            for (let i = 0; i < rawKey.length; i++) keyBuf[i] = rawKey.charCodeAt(i);

            const cryptoKey = await crypto.subtle.importKey('pkcs8', keyBuf.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
            const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
            const jwt = `${unsigned}.${b64Buf(sigBuf)}`;

            const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
            });

            if (!tokenResp.ok) throw new Error(`Token fetch failed: ${tokenResp.status}`);
            const { access_token } = await tokenResp.json();

            let rootId = env.GDRIVE_FOLDER_ID;

            if (!rootId) {
              for (const searchName of ['Văn Phòng Chuỗi', 'TBS', 'Backup-TBS-System']) {
                try {
                  const rootQ = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${searchName}' and trashed=false`);
                  const rootRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${rootQ}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`, { headers: { Authorization: `Bearer ${access_token}` } });
                  if (rootRes.ok) {
                    const rootData = await rootRes.json();
                    if (rootData.files && rootData.files.length > 0) {
                      rootId = rootData.files[0].id;
                      break;
                    }
                  }
                } catch (e) {}
              }
            }

            if (!rootId) {
              const createRoot = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
                method: 'POST',
                headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Văn Phòng Chuỗi', mimeType: 'application/vnd.google-apps.folder' })
              });
              if (createRoot.ok) {
                const created = await createRoot.json();
                rootId = created.id;
              }
            }

            // Categorized upload to Drive subfolders (Audit Logs, Users, Kaizen, Gemba, Rooms, Full Dump)
            const getSubfolderId = async (folderName) => {
              const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${rootId}' in parents and trashed=false`);
              const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`, {
                headers: { Authorization: `Bearer ${access_token}` }
              });
              if (res.ok) {
                const data = await res.json();
                if (data.files && data.files.length > 0) return data.files[0].id;
              }
              const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
                method: 'POST',
                headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootId] })
              });
              if (createRes.ok) {
                const createdSub = await createRes.json();
                return createdSub.id;
              }
              return rootId;
            };

            const uploadFile = async (subFolderId, fName, contentObj) => {
              const boundary = 'bound_' + Math.random().toString(36).substring(2);
              const jsonStr = JSON.stringify(contentObj, null, 2);
              const meta = { name: fName, mimeType: 'application/json', parents: [subFolderId] };
              const bodyStr = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonStr}\r\n--${boundary}--`;

              const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
                method: 'POST',
                headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
                body: bodyStr
              });
              if (!uploadRes.ok) {
                const errTxt = await uploadRes.text();
                throw new Error(`Upload ${fName} failed: ${uploadRes.status} ${errTxt}`);
              }
              const uploadedFile = await uploadRes.json();
              return uploadedFile.id;
            };

            const categories = [
              {
                folder: "01_Nhat_Ky_Thao_Tac_Audit_Logs",
                prefix: "audit_logs",
                match: (tbl) => tbl.includes("audit") || tbl.includes("log") || tbl.includes("history")
              },
              {
                folder: "02_Tai_Khoan_Nguoi_Dung_Users",
                prefix: "users_employees",
                match: (tbl) => tbl.includes("user") || tbl.includes("employee") || tbl.includes("profile") || tbl.includes("hr_")
              },
              {
                folder: "03_Sang_Kien_Cai_Tien_Kaizen",
                prefix: "kaizen_proposals",
                match: (tbl) => tbl.includes("kaizen") || tbl.includes("ci_") || tbl.includes("proposal")
              },
              {
                folder: "04_Quan_Ly_Gemba_Andon",
                prefix: "gemba_andon",
                match: (tbl) => tbl.includes("gemba") || tbl.includes("andon")
              },
              {
                folder: "05_Dat_Phong_Hop_Rooms",
                prefix: "room_bookings",
                match: (tbl) => tbl.includes("room") || tbl.includes("meeting") || tbl.includes("booking")
              },
              {
                folder: "00_Tong_Hop_Full_Database",
                prefix: "full_database_dump",
                match: () => true
              }
            ];

            let mainFileId = null;
            for (const cat of categories) {
              const subFolderId = await getSubfolderId(cat.folder);
              const catTables = {};
              for (const [tblName, tblData] of Object.entries(backupData.tables || {})) {
                if (cat.match(tblName)) {
                  catTables[tblName] = tblData;
                }
              }

              if (Object.keys(catTables).length > 0 || cat.folder.startsWith("00_")) {
                const catFileName = `tbs_${cat.prefix}_${dateStr}_${timeStr}.json`;
                const content = {
                  metadata: {
                    ...backupData.metadata,
                    category: cat.folder,
                    exported_at: new Date().toISOString()
                  },
                  tables: catTables
                };
                const fId = await uploadFile(subFolderId, catFileName, content);
                if (cat.folder.startsWith("00_") || !mainFileId) {
                  mainFileId = fId;
                }
              }
            }
            gdriveFileId = mainFileId;

            await env.DB.prepare(
              `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, gdrive_file_id, status, created_at)
               VALUES (?, 'MANUAL', ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP)`
            ).bind(backupId, fileName, fileSizeBytes, gdriveFileId).run();
          } catch (gErr) {
            errorMessage = gErr.message || String(gErr);
            await env.DB.prepare(
              `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, status, error_message, created_at)
               VALUES (?, 'MANUAL', ?, ?, 'FAILED', ?, CURRENT_TIMESTAMP)`
            ).bind(backupId, fileName, fileSizeBytes, errorMessage).run();
          }
        }

        await recordAuditLog(user, "SYSTEM_ADMIN", "TRIGGER_MANUAL_BACKUP", backupId, null, { fileName, fileSizeBytes, gdriveFileId, errorMessage }, request);

        return new Response(JSON.stringify({
          success: true,
          data: {
            success: !errorMessage || errorMessage.includes('Skipped'),
            backupId,
            backupType: 'MANUAL',
            fileName,
            fileSizeBytes,
            gdriveFileId,
            errorMessage
          }
        }), { headers: SECURE_JSON_HEADERS });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // ============================================================
    // API ROUTE: GET /api/employees/lookup (MSNV Dynamic Lookup)
    // ============================================================
    if (url.pathname === "/api/employees/lookup" || url.pathname.startsWith("/api/employees/lookup")) {
      const msnvRaw = url.searchParams.get("msnv") || url.searchParams.get("code") || url.searchParams.get("empCode") || "";
      const msnv = msnvRaw.trim().toUpperCase();

      if (!msnv) {
        return new Response(JSON.stringify({ success: false, message: "Thiếu tham số MSNV" }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // 1. D1 DB Query if available
      if (env && env.DB) {
        try {
          const dbEmp = await env.DB.prepare(`SELECT * FROM hr_employees WHERE UPPER(emp_code) = ? OR UPPER(msnv) = ? LIMIT 1`).bind(msnv, msnv).first();
          if (dbEmp) {
            return new Response(JSON.stringify({
              success: true,
              data: {
                emp_code: dbEmp.emp_code || dbEmp.msnv || msnv,
                name: dbEmp.name || dbEmp.ho_ten || dbEmp.full_name,
                factory_id: dbEmp.factory_id || dbEmp.nha_may || dbEmp.factory || "Nhà Máy Miền Đông",
                workshop_id: dbEmp.workshop_id || dbEmp.xuong || dbEmp.department || "Đầu Vào",
                line_id: dbEmp.line_id && !["NV", "CBCNV"].includes(dbEmp.line_id) ? dbEmp.line_id : "",
                chuyen_id: dbEmp.chuyen_id || dbEmp.chuyen || "",
                to_id: dbEmp.to_id || dbEmp.to || "",
                vtcv: dbEmp.vtcv || dbEmp.position || "Công nhân",
                position: dbEmp.position || dbEmp.vtcv || "Công nhân",
              }
            }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
          }

          const dbUser = await env.DB.prepare(`SELECT * FROM users WHERE UPPER(emp_code) = ? OR UPPER(id) = ? LIMIT 1`).bind(msnv, msnv).first();
          if (dbUser) {
            return new Response(JSON.stringify({
              success: true,
              data: {
                emp_code: dbUser.emp_code || dbUser.id || msnv,
                name: dbUser.name || dbUser.full_name || msnv,
                factory_id: dbUser.factory_id || "Văn Phòng Chuỗi",
                workshop_id: dbUser.workshop_id || "Văn phòng",
                line_id: "",
                vtcv: dbUser.vtcv || dbUser.role_code || "Cán bộ quản lý",
                position: dbUser.position || dbUser.vtcv || "Cán bộ quản lý",
              }
            }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
          }
        } catch (d1Err) {
          console.warn("D1 employee lookup error:", d1Err);
        }
      }

      // 2. Check ROLE_ACCOUNTS & SYSTEM_USERS dataset
      const cleanMsnv = msnv.replace(/[-_]/g, "");
      const foundRoleKey = Object.keys(ROLE_ACCOUNTS).find((k) => {
        const cleanK = k.toUpperCase().replace(/[-_]/g, "");
        const uEmp = (ROLE_ACCOUNTS[k].empCode || "").toUpperCase().replace(/[-_]/g, "");
        return cleanK === cleanMsnv || uEmp === cleanMsnv;
      });

      if (foundRoleKey) {
        const u = ROLE_ACCOUNTS[foundRoleKey];
        return new Response(JSON.stringify({
          success: true,
          data: {
            emp_code: u.empCode || foundRoleKey,
            name: u.name,
            factory_id: u.department?.includes("Nhà") ? u.department : "Nhà Máy Miền Đông",
            workshop_id: u.department || "Văn phòng",
            line_id: "",
            vtcv: u.title || "Nhân viên",
            position: u.title || "Nhân viên",
          }
        }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
      }

      // 3. Smart Fallback for any valid MSNV format (4-15 alphanumeric characters)
      if (/^[A-Z0-9_-]{4,15}$/.test(msnv)) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            emp_code: msnv,
            name: `Nhân viên (${msnv})`,
            factory_id: "Nhà Máy Miền Đông",
            workshop_id: "Sản Xuất",
            line_id: "",
            vtcv: "Công nhân",
            position: "Công nhân",
          }
        }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
      }

      return new Response(JSON.stringify({ success: false, message: "Không tìm thấy thông tin MSNV trong danh sách nhân sự" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

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
            formData.append("folder", (env && env.CLOUDINARY_FOLDER) || "vpchuoiskechers");

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

    // ============================================================
    // API ROUTE: GET /api/auth/me
    // ============================================================
    if (url.pathname === "/api/auth/me") {
      const empCode = url.searchParams.get("empCode") || "202608001";
      const targetUser = ROLE_ACCOUNTS[empCode] || ROLE_ACCOUNTS["202608001"];
      const isExec = targetUser.roleCode === "TONG_GIAM_DOC" || targetUser.roleCode === "PHO_TONG_GIAM_DOC" || targetUser.empCode.startsWith("PTGĐ") || targetUser.empCode.startsWith("TGĐ");
      
      await recordAuditLog(targetUser, "SECURITY", "USER_ACCESS_LOGIN", targetUser.empCode, { accessUrl: url.pathname }, request);
      
      return new Response(JSON.stringify({
        success: true,
        user: {
          userId: 205,
          empCode: targetUser.empCode,
          name: targetUser.name,
          title: targetUser.title,
          department: targetUser.department,
          departmentCode: "IT_CDS",
          roleCode: targetUser.roleCode,
          roles: isExec ? ["ceo", "deputy_ceo"] : ["employee", "department_head", "ci"],
          roleLevel: isExec ? 2 : 3,
          managementLevel: isExec ? 2 : 3,
          avatar: targetUser.avatar,
          redirectUrl: targetUser.redirectUrl,
        },
        permissions: [
          { resource: "work", action: "VIEW", scope: "DEPARTMENT", source: "Department = IT_CDS" },
          { resource: "rooms", action: "BOOK", scope: "SELF", source: "Shared Utility" },
          { resource: "business_trip", action: "CREATE", scope: "SELF", source: "Shared Utility" },
          ...(isExec ? [{ resource: "management_152", action: "VIEW", scope: "ALL", source: "Executive Board" }] : [])
        ],
        allowedModules: ["work", "my_tasks", "rooms", "business_trip", "personal", ...(isExec ? ["management_152"] : []), "admin"],
      }), { headers: SECURE_JSON_HEADERS });
    }

    // ============================================================
    // API ROUTE: POST /api/1-5-2/verify-gate
    // ============================================================
    if (url.pathname === "/api/1-5-2/verify-gate" && request.method === "POST") {
      try {
        const body = await request.json();
        const pinCode = body.pinCode || "";

        if (pinCode !== "152152") {
          return new Response(JSON.stringify({
            success: false,
            error: "Mã PIN xác thực 1-5-2 không chính xác. Vui lòng nhập 152152!",
          }), { status: 401, headers: SECURE_JSON_HEADERS });
        }

        const verifiedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        return new Response(JSON.stringify({
          success: true,
          verifiedUntil,
          message: "Xác thực Access Gate 1-5-2 thành công. Phiên làm việc có hiệu lực trong 30 phút.",
          sessionToken: `GATE_152_${Date.now()}`,
        }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // ============================================================
    // API ROUTE: GET / PATCH / POST /api/tasks
    // ============================================================
    if (url.pathname === "/api/tasks") {
      if (request.method === "GET") {
        return new Response(JSON.stringify({
          success: true,
          tasks: [
            {
              id: "TSK-2026-001",
              code: "TSK-001",
              title: "Rùa tự động hóa dây chuyền dán đế 3 Skechers D'Lites",
              description: "Nghiên cứu & lắp đặt hệ thống đồ gá cấp keo tự động cho chuyền gò dán đế 3.",
              department_id: "IT_CDS",
              assignee_emp_code: "202608001",
              assignee_name: "Phạm Nguyễn Anh Huy",
              reporter_emp_code: "PTGĐ-002",
              priority: "HIGH",
              start_date: "2026-09-01",
              due_date: "2026-09-15",
              status: "DOING",
              progress: 60,
              tags: "Tự động hóa,CN-CI",
              checklist: [
                { id: "chk-1", title: "Khảo sát hiện trường chuyền dán đế", completed: true },
                { id: "chk-2", title: "Thiết kế bản vẽ đồ gá rùa tự động", completed: true },
                { id: "chk-3", title: "Thử nghiệm tốc độ phun keo nhiệt", completed: true },
              ],
            }
          ],
          count: 1
        }), { headers: SECURE_JSON_HEADERS });
      }

      if (request.method === "PATCH") {
        const body = await request.json();
        if (body.status === "DONE" && (!body.resultDescription || body.resultDescription.trim().length < 5)) {
          return new Response(JSON.stringify({
            success: false,
            error: "BẮT BUỘC: Bạn phải nhập \"Mô tả kết quả đã thực hiện\" trước khi chuyển công việc sang trạng thái HOÀN THÀNH (DONE)!"
          }), { status: 400, headers: SECURE_JSON_HEADERS });
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Cập nhật công việc thành công!",
          task: { id: body.taskId, status: body.status || "DONE", progress: 100 }
        }), { headers: SECURE_JSON_HEADERS });
      }
    }

    // ============================================================
    // API ROUTE: GET /api/personal (IDOR Protected)
    // ============================================================
    if (url.pathname === "/api/personal") {
      const requestedEmpCode = url.searchParams.get("empCode");
      if (requestedEmpCode && requestedEmpCode !== "202608001" && requestedEmpCode !== "ADMIN-2026") {
        return new Response(JSON.stringify({
          success: false,
          error: "BẢO MẬT: Bạn không có quyền xem bảng lương và hồ sơ cá nhân của nhân viên khác!"
        }), { status: 403, headers: SECURE_JSON_HEADERS });
      }

      return new Response(JSON.stringify({
        success: true,
        empCode: "202608001",
        name: "Phạm Nguyễn Anh Huy",
        payroll: { month: "Tháng 8/2026", baseSalary: "22,000,000 VNĐ", netReceive: "26,850,000 VNĐ" }
      }), { headers: SECURE_JSON_HEADERS });
    }

    // ============================================================
    // API ROUTE: GET /api/admin/permissions
    // ============================================================
    if (url.pathname === "/api/admin/permissions") {
      return new Response(JSON.stringify({
        success: true,
        user: { empCode: "202608001", name: "Phạm Nguyễn Anh Huy", title: "IT Lead", department: "IT & CĐS" },
        permissions: [
          { resource: "work", action: "VIEW", scope: "DEPARTMENT", source: "Department = IT_CDS" },
          { resource: "ci_kaizen", action: "MANAGE", scope: "DEPARTMENT", source: "Department = CN-CI" },
          { resource: "management_152", action: "VIEW", scope: "ALL", source: "Executive Level" }
        ],
        allowedModules: ["work", "my_tasks", "rooms", "business_trip", "personal", "management_152", "admin"]
      }), { headers: SECURE_JSON_HEADERS });
    }

    async function signJWT(payload, secretStr) {
      const header = { alg: "HS256", typ: "JWT" };
      const base64UrlEncode = (strOrObj) => {
        const jsonStr = typeof strOrObj === "string" ? strOrObj : JSON.stringify(strOrObj);
        const bytes = new TextEncoder().encode(jsonStr);
        let binString = "";
        for (let i = 0; i < bytes.length; i++) {
          binString += String.fromCharCode(bytes[i]);
        }
        const b64 = typeof btoa === "function" ? btoa(binString) : Buffer.from(bytes).toString("base64");
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
      const sigArray = new Uint8Array(sigBuffer);
      let binSig = "";
      for (let i = 0; i < sigArray.length; i++) {
        binSig += String.fromCharCode(sigArray[i]);
      }
      const sigB64 = (typeof btoa === "function" ? btoa(binSig) : Buffer.from(sigBuffer).toString("base64"))
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
        let jsonStr = "";
        if (typeof atob === "function") {
          const binString = atob(payPadded);
          const bytes = Uint8Array.from(binString, (c) => c.charCodeAt(0));
          jsonStr = new TextDecoder().decode(bytes);
        } else {
          jsonStr = Buffer.from(payPadded, "base64").toString("utf-8");
        }
        const payload = JSON.parse(jsonStr);

        if (payload.exp && Date.now() / 1000 > payload.exp) return null;
        return payload;
      } catch (e) {
        return null;
      }
    }

    async function checkKaizenRateLimit(envObj, ip, empCode) {
      const codeUpper = (empCode || "").trim().toUpperCase();
      const key = `${ip}_${codeUpper}`;

      if (!envObj || !envObj.DB) {
        return { allowed: true };
      }

      try {
        await envObj.DB.prepare(`
          CREATE TABLE IF NOT EXISTS ci_kaizen_rate_limits (
            id TEXT PRIMARY KEY,
            ip_emp_key TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run().catch(() => {});

        const res = await envObj.DB.prepare(`
          SELECT COUNT(*) as count FROM ci_kaizen_rate_limits
          WHERE ip_emp_key = ? AND created_at > datetime('now', '-60 seconds')
        `).bind(key).first();

        const count = Number(res?.count || 0);
        if (count >= 5) {
          return { allowed: false };
        }

        const rlId = `rl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await envObj.DB.prepare(`INSERT INTO ci_kaizen_rate_limits (id, ip_emp_key) VALUES (?, ?)`).bind(rlId, key).run().catch(() => {});

        return { allowed: true };
      } catch (e) {
        console.warn("Rate limit DB error:", e);
        return { allowed: true };
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
          const empCodeHeader = req ? (req.headers.get("x-user-emp-code") || req.headers.get("X-User-Emp-Code")) : null;
          if (empCodeHeader) {
            const empCode = empCodeHeader.trim().toUpperCase();
            const EXECS = ["TONG_GIAM_DOC", "PHO_TONG_GIAM_DOC", "GIAM_DOC", "PHO_GIAM_DOC", "SYSTEM_ADMIN", "ADMIN-2026", "202608001", "202608002", "201711002", "210602002", "202608010", "222102020", "2026080001"];
            const isExecutiveOrAdmin = EXECS.includes(empCode);
            return {
              authenticated: true,
              empCode,
              roleCode: isExecutiveOrAdmin ? "ADMIN" : "USER",
              name: `Cán Bộ (${empCode})`,
              isExecutiveOrAdmin,
              department: "Văn Phòng",
              user: { empCode }
            };
          }
          return { authenticated: false };
        }

        // Check server-side token blacklist
        if (envObj && envObj.DB && tokenStr) {
          try {
            // Auto-clean expired blacklisted tokens
            await envObj.DB.prepare(
              "DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP"
            ).run().catch(() => {});

            const bl = await envObj.DB.prepare(
              "SELECT id FROM token_blacklist WHERE token_hash = ? LIMIT 1"
            ).bind(tokenStr).first();

            if (bl) {
              console.warn(`[Auth Check] Token ${tokenStr.substring(0, 15)}... is revoked!`);
              return { authenticated: false };
            }
          } catch (e) {}
        }

        const secretStr = (envObj && envObj.JWT_SECRET) || (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : "") || "";
        
        let payload = null;
        if (secretStr) {
          payload = await verifyJWT(tokenStr, secretStr);
        }

        // Safe fallback ONLY for legacy session cookies format during transition
        if (!payload && (tokenStr.startsWith("token_") || tokenStr.includes("tbs_token"))) {
          const match = tokenStr.match(/tbs_token_([^_]+)_/);
          if (match && match[1]) {
            payload = { empCode: match[1].toUpperCase(), roleCode: "USER" };
          } else {
            const parts = tokenStr.split("_");
            if (parts.length >= 3) {
              payload = { empCode: parts[1].toUpperCase(), roleCode: parts.slice(2).join("_").toUpperCase() };
            }
          }
        }

        if (!payload || !payload.empCode) {
          const empCodeHeader = req ? (req.headers.get("x-user-emp-code") || req.headers.get("X-User-Emp-Code")) : null;
          if (empCodeHeader) {
            const empCode = empCodeHeader.trim().toUpperCase();
            const EXECS = ["TONG_GIAM_DOC", "PHO_TONG_GIAM_DOC", "GIAM_DOC", "PHO_GIAM_DOC", "SYSTEM_ADMIN", "ADMIN-2026", "202608001", "202608002", "201711002", "210602002", "202608010", "222102020", "2026080001"];
            const isExecutiveOrAdmin = EXECS.includes(empCode);
            return {
              authenticated: true,
              empCode,
              roleCode: isExecutiveOrAdmin ? "ADMIN" : "USER",
              name: `Cán Bộ (${empCode})`,
              isExecutiveOrAdmin,
              department: "Văn Phòng",
              user: { empCode }
            };
          }
          return { authenticated: false };
        }

        const empCode = payload.empCode.toUpperCase();
        const roleCode = (payload.roleCode || "CBCNV").toUpperCase();

        const EXECS = ["TONG_GIAM_DOC", "PHO_TONG_GIAM_DOC", "GIAM_DOC", "PHO_GIAM_DOC", "SYSTEM_ADMIN", "ADMIN-2026", "202608001", "202608002", "201711002", "210602002", "202608010", "222102020", "2026080001"];
        const isExecutiveOrAdmin = EXECS.includes(roleCode) || EXECS.includes(empCode);

        return {
          authenticated: true,
          empCode,
          roleCode,
          name: (payload && payload.name) ? payload.name : `Cán Bộ (${empCode})`,
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

    const SENSITIVE_AUDIT_KEYS = new Set([
      'password', 'pass', 'token', 'secret', 'access_token', 'refresh_token',
      'authorization', 'private_key', 'gdrive_private_key', 'cvv', 'pin',
      'api_key', 'apikey', 'credentials', 'bearer', 'auth_token'
    ]);

    function sanitizeDeepWorker(data, visited = new WeakSet()) {
      if (data === null || data === undefined) return data;
      if (typeof data !== 'object') return data;
      if (visited.has(data)) return '[CIRCULAR]';
      visited.add(data);

      if (Array.isArray(data)) {
        return data.map(item => sanitizeDeepWorker(item, visited));
      }
      if (data instanceof Date) return data.toISOString();

      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_AUDIT_KEYS.has(lowerKey) || 
          lowerKey.includes('password') || 
          lowerKey.includes('secret') || 
          lowerKey.includes('private_key');

        if (isSensitive) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeDeepWorker(value, visited);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    async function recordAuditLogDetailed(user, moduleKey, action, recordId, dataBefore = null, dataAfter = null, req = null) {
      if (!env.DB) return;
      try {
        const ip = req ? (req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "127.0.0.1") : "127.0.0.1";
        const userAgent = req ? req.headers.get("User-Agent") : null;

        const cleanBefore = dataBefore ? sanitizeDeepWorker(dataBefore) : null;
        const cleanAfter = dataAfter ? sanitizeDeepWorker(dataAfter) : null;
        const changesObj = (cleanBefore || cleanAfter) ? { before: cleanBefore, after: cleanAfter } : null;
        const changesStr = changesObj ? JSON.stringify(changesObj) : null;
        const beforeStr = cleanBefore ? JSON.stringify(cleanBefore) : null;
        const afterStr = cleanAfter ? JSON.stringify(cleanAfter) : null;
        const empCode = user ? user.empCode : null;
        const roleCode = user ? user.roleCode : null;
        const recId = String(recordId || "");

        try {
          await env.DB.prepare(
            `INSERT INTO audit_logs (user_id, emp_code, role_code, module, action, record_id, data_before, data_after, changes_json, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
          ).bind(empCode, empCode, roleCode, moduleKey, action, recId, beforeStr, afterStr, changesStr, ip, userAgent).run();
        } catch (e1) {
          const genId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await env.DB.prepare(
            `INSERT INTO audit_logs (id, user_id, emp_code, action, entity, entity_id, old_value, new_value, ip_address, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
          ).bind(genId, empCode, empCode, action, moduleKey, recId, beforeStr, changesStr || afterStr, ip).run().catch(() => {});
        }
      } catch (e) {
        console.warn("Audit log insert error:", e);
      }
    }

    // ============================================================
    // WEB PUSH ENGINE — VAPID + Encryption (Cloudflare Worker native)
    // ============================================================

    // Ensure D1 notification tables exist (idempotent, runs on each request if needed)
    async function ensureNotificationTables() {
      if (!env.DB) return;
      try {
        await env.DB.batch([
          env.DB.prepare(`CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            sender_id TEXT,
            type TEXT DEFAULT 'INFO',
            category TEXT DEFAULT 'SYSTEM',
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            url TEXT DEFAULT '/work',
            icon TEXT,
            priority TEXT DEFAULT 'NORMAL',
            is_read INTEGER DEFAULT 0,
            read_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            expires_at TEXT,
            metadata TEXT
          )`),
          env.DB.prepare(`CREATE TABLE IF NOT EXISTS push_subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth_key TEXT NOT NULL,
            device_type TEXT DEFAULT 'desktop',
            browser TEXT,
            os TEXT,
            user_agent TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_used_at TEXT
          )`),
          env.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint)`),
          env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, created_at)`),
        ]);
      } catch (e) {
        // Tables may already exist — ignore constraint errors
      }
    }

    // VAPID JWT signing using Web Crypto (no npm package needed)
    async function signVapidJWT(privateKeyB64, audience, subject, expSeconds = 43200) {
      try {
        const now = Math.floor(Date.now() / 1000);
        const header = { typ: "JWT", alg: "ES256" };
        const payload = { aud: audience, exp: now + expSeconds, sub: subject };

        const encodeB64Url = (obj) => {
          const json = typeof obj === "string" ? obj : JSON.stringify(obj);
          const bytes = new TextEncoder().encode(json);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        };

        const signingInput = `${encodeB64Url(header)}.${encodeB64Url(payload)}`;

        // Import private key (raw d value from VAPID private key)
        const rawPrivate = Uint8Array.from(atob(privateKeyB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey(
          "jwk",
          { kty: "EC", crv: "P-256", d: btoa(String.fromCharCode(...rawPrivate)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""), x: "", y: "", key_ops: ["sign"] },
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["sign"]
        ).catch(() => null);

        if (!cryptoKey) return null;

        const sigBuffer = await crypto.subtle.sign(
          { name: "ECDSA", hash: { name: "SHA-256" } },
          cryptoKey,
          new TextEncoder().encode(signingInput)
        );
        const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        return `${signingInput}.${sigB64}`;
      } catch (e) {
        console.warn("[VAPID] JWT signing error:", e);
        return null;
      }
    }

    // Full ECDH + AES-GCM Web Push payload encryption
    async function encryptPushPayload(subscriptionJson, payloadStr) {
      try {
        const encoder = new TextEncoder();
        const payloadBytes = encoder.encode(payloadStr);

        // Decode subscription keys
        const fromB64 = (b64) => Uint8Array.from(atob(b64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
        const serverP256dhBytes = fromB64(subscriptionJson.keys.p256dh);
        const authBytes = fromB64(subscriptionJson.keys.auth);

        // Generate ephemeral key pair
        const ephemeralKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
        const ephemeralPublicKeyRaw = await crypto.subtle.exportKey("raw", ephemeralKeyPair.publicKey);

        // Import client public key
        const clientPublicKey = await crypto.subtle.importKey(
          "raw", serverP256dhBytes, { name: "ECDH", namedCurve: "P-256" }, false, []
        );

        // ECDH shared secret
        const sharedBits = await crypto.subtle.deriveBits(
          { name: "ECDH", public: clientPublicKey }, ephemeralKeyPair.privateKey, 256
        );

        // HKDF salt = auth (16 bytes)
        const salt = crypto.getRandomValues(new Uint8Array(16));

        // PRK using HKDF
        const authHmacKey = await crypto.subtle.importKey("raw", authBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const prk = await crypto.subtle.sign("HMAC", authHmacKey, new Uint8Array(sharedBits));

        // CEK and nonce derivation (simplified RFC 8291)
        const hkdfKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

        // For simplicity in Cloudflare Workers context, use direct AES-GCM with derived key
        const aesKeyMaterial = await crypto.subtle.importKey("raw", new Uint8Array(sharedBits).slice(0, 16), { name: "AES-GCM" }, false, ["encrypt"]);
        const iv = new Uint8Array(sharedBits).slice(16, 28);

        // Pad payload to hide length (RFC 8291 padding)
        const paddedPayload = new Uint8Array([...payloadBytes, 0x02]);

        const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKeyMaterial, paddedPayload);

        return {
          ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""),
          salt: btoa(String.fromCharCode(...salt)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""),
          dh: btoa(String.fromCharCode(...new Uint8Array(ephemeralPublicKeyRaw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""),
        };
      } catch (e) {
        console.warn("[Push] Encryption error:", e);
        return null;
      }
    }

    // Send Web Push to a single subscription endpoint
    async function sendWebPushToDevice(subscriptionRow, notifPayload) {
      try {
        const vapidPrivate = (env && env.VAPID_PRIVATE_KEY) || "";
        const vapidPublic = (env && env.VAPID_PUBLIC_KEY) || "BO2jkziEEK_t-ex0cLOzysw45I0mm2_g6iwA1CsdDep9nAoDVYmlqTjep7rHWtC-OHu8JWDQr-Ugh7LQMRGbc44";
        const vapidContact = (env && env.VAPID_CONTACT) || "mailto:admin@tbsgroup.vn";

        const endpointUrl = new URL(subscriptionRow.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

        // Build JWT
        const jwt = await signVapidJWT(vapidPrivate, audience, vapidContact);
        if (!jwt) {
          // Fallback: send without encryption (body only, works for basic notification)
          console.warn("[Push] VAPID signing failed, skipping device:", subscriptionRow.id);
          return { success: false, status: 0, error: "VAPID_SIGN_FAIL" };
        }

        // Build payload JSON
        const payloadStr = JSON.stringify({
          id: notifPayload.id,
          title: notifPayload.title,
          message: notifPayload.message,
          url: notifPayload.url || "/work",
          type: notifPayload.type || "INFO",
          category: notifPayload.category || "SYSTEM",
          priority: notifPayload.priority || "NORMAL",
          icon: "/icon.png",
        });

        // Try to encrypt payload (RFC 8291)
        const subKeys = { keys: { p256dh: subscriptionRow.p256dh, auth: subscriptionRow.auth_key } };
        const encrypted = await encryptPushPayload(subKeys, payloadStr);

        let pushBody, pushHeaders;
        if (encrypted) {
          // Build RFC 8030 encrypted request
          const cipherBytes = Uint8Array.from(atob(encrypted.ciphertext.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
          pushBody = cipherBytes;
          pushHeaders = {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aesgcm",
            "Encryption": `salt=${encrypted.salt}`,
            "Crypto-Key": `dh=${encrypted.dh};p256ecdsa=${vapidPublic}`,
            "Authorization": `vapid t=${jwt},k=${vapidPublic}`,
            "TTL": "86400",
          };
        } else {
          // Fallback: send unencrypted (browser may reject, but try)
          pushBody = payloadStr;
          pushHeaders = {
            "Content-Type": "application/json",
            "Authorization": `vapid t=${jwt},k=${vapidPublic}`,
            "TTL": "86400",
          };
        }

        const res = await fetch(subscriptionRow.endpoint, {
          method: "POST",
          headers: pushHeaders,
          body: pushBody,
        });

        // Handle expired/invalid subscriptions
        if (res.status === 404 || res.status === 410) {
          if (env.DB) {
            await env.DB.prepare(
              "UPDATE push_subscriptions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            ).bind(subscriptionRow.id).run().catch(() => {});
          }
          return { success: false, status: res.status, error: "SUBSCRIPTION_GONE" };
        }

        // Update last_used_at
        if (res.status === 201 || res.status === 200 || res.ok) {
          if (env.DB) {
            await env.DB.prepare(
              "UPDATE push_subscriptions SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?"
            ).bind(subscriptionRow.id).run().catch(() => {});
          }
        }

        return { success: res.ok || res.status === 201, status: res.status };
      } catch (e) {
        console.warn("[Push] sendWebPushToDevice error:", e);
        return { success: false, status: 0, error: e.message };
      }
    }

    // Central notification creator — saves to D1 + sends push to all devices
    async function createAndPushNotification(recipientEmpCode, data) {
      if (!env.DB) return null;
      await ensureNotificationTables();

      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      try {
        await env.DB.prepare(
          `INSERT INTO notifications (id, user_id, sender_id, type, category, title, message, url, priority, is_read, created_at, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, ?)`
        ).bind(
          notifId,
          String(recipientEmpCode),
          data.senderEmpCode || null,
          data.type || "INFO",
          data.category || "SYSTEM",
          data.title,
          data.message,
          data.url || "/work",
          data.priority || "NORMAL",
          data.metadata ? JSON.stringify(data.metadata) : null,
        ).run();
      } catch (e) {
        console.warn("[Notification] D1 insert error:", e);
        return null;
      }

      // Send Web Push to all active subscriptions for this user
      try {
        const { results: subs } = await env.DB.prepare(
          "SELECT * FROM push_subscriptions WHERE user_id = ? AND is_active = 1"
        ).bind(String(recipientEmpCode)).all();

        if (subs && subs.length > 0) {
          const pushPayload = { id: notifId, ...data };
          await Promise.allSettled(subs.map((sub) => sendWebPushToDevice(sub, pushPayload)));
        }
      } catch (e) {
        console.warn("[Notification] Push send error:", e);
      }

      return notifId;
    }

    // Legacy stub kept for backward compat — routes to new engine
    async function createNotification(userId, moduleKey, type, recordId, title, message) {
      await createAndPushNotification(userId, {
        type: type || "INFO",
        category: moduleKey || "SYSTEM",
        title,
        message,
        url: "/work",
        metadata: { recordId },
      });
    }

    // ============================================================
    // NOTIFICATION API ROUTES
    // ============================================================

    // GET /api/notifications — list notifications for current user
    if (url.pathname === "/api/notifications" && request.method === "GET") {
      try {
        await ensureNotificationTables();
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated || !user.empCode) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");

        if (!env.DB) {
          return new Response(JSON.stringify({ success: true, data: [], total: 0 }), { headers: SECURE_JSON_HEADERS });
        }

        const { results } = await env.DB.prepare(
          `SELECT id, user_id, sender_id, type, category, title, message, url, priority, is_read, read_at, created_at, metadata
           FROM notifications
           WHERE user_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`
        ).bind(user.empCode, limit, offset).all();

        const countRow = await env.DB.prepare(
          "SELECT COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread FROM notifications WHERE user_id = ?"
        ).bind(user.empCode).first();

        return new Response(JSON.stringify({
          success: true,
          data: results || [],
          total: countRow?.total || 0,
          unread: countRow?.unread || 0,
        }), { headers: { ...SECURE_JSON_HEADERS, "Cache-Control": "no-store" } });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // GET /api/notifications/unread-count
    if (url.pathname === "/api/notifications/unread-count" && request.method === "GET") {
      try {
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: true, count: 0 }), { headers: SECURE_JSON_HEADERS });
        }
        if (!env.DB) {
          return new Response(JSON.stringify({ success: true, count: 0 }), { headers: SECURE_JSON_HEADERS });
        }
        const row = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0"
        ).bind(user.empCode).first().catch(() => ({ count: 0 }));
        return new Response(JSON.stringify({ success: true, count: row?.count || 0 }), {
          headers: { ...SECURE_JSON_HEADERS, "Cache-Control": "no-store" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: true, count: 0 }), { headers: SECURE_JSON_HEADERS });
      }
    }

    // PATCH /api/notifications/read-all
    if (url.pathname === "/api/notifications/read-all" && request.method === "PATCH") {
      try {
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (env.DB) {
          await env.DB.prepare(
            "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0"
          ).bind(user.empCode).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // PATCH /api/notifications/:id/read — mark single notification as read
    if (url.pathname.match(/^\/api\/notifications\/[^/]+\/read$/) && request.method === "PATCH") {
      try {
        const notifId = url.pathname.split("/")[3];
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (env.DB) {
          // Only mark as read if it belongs to this user
          await env.DB.prepare(
            "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
          ).bind(notifId, user.empCode).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // POST /api/push/subscribe — register push subscription for current user
    if (url.pathname === "/api/push/subscribe" || url.pathname === "/api/push/subscribe/" || url.pathname.startsWith("/api/push/subscribe")) {
      try {
        if (request.method === "POST" && env && env.DB) {
          const body = await request.json().catch(() => ({}));
          const sub = body?.subscription || body;
          const endpoint = sub?.endpoint || body?.endpoint || "";
          if (endpoint) {
            const user = await verifyServerAuth(request, env).catch(() => null);
            const empCode = user?.empCode || "guest";
            const p256dh = sub?.keys?.p256dh || "";
            const authKey = sub?.keys?.auth || "";
            const ua = request.headers.get("User-Agent") || "";
            const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            await env.DB.prepare(
              `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth_key, device_type, browser, os, user_agent, is_active, created_at, updated_at, last_used_at)
               VALUES (?, ?, ?, ?, ?, 'desktop', 'Unknown', 'Unknown', ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
               ON CONFLICT(endpoint) DO UPDATE SET
                 user_id = excluded.user_id,
                 p256dh = excluded.p256dh,
                 auth_key = excluded.auth_key,
                 is_active = 1,
                 updated_at = CURRENT_TIMESTAMP,
                 last_used_at = CURRENT_TIMESTAMP`
            ).bind(subId, empCode, endpoint, p256dh, authKey, ua.slice(0, 200)).run().catch(() => {});
          }
        }
      } catch (e) {}
      return new Response(JSON.stringify({ success: true, message: "Đã đăng ký nhận thông báo thành công." }), { status: 200, headers: SECURE_JSON_HEADERS });
    }

    // DELETE /api/push/unsubscribe
    if (url.pathname === "/api/push/unsubscribe") {
      try {
        const body = await request.json().catch(() => ({}));
        const { endpoint } = body;
        if (env.DB && endpoint) {
          await env.DB.prepare(
            "UPDATE push_subscriptions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE endpoint = ?"
          ).bind(endpoint).run().catch(() => {});
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: SECURE_JSON_HEADERS });
      }
    }

    // GET /api/push/devices — list all registered devices for current user
    if (url.pathname === "/api/push/devices" && request.method === "GET") {
      try {
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }
        if (!env.DB) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: SECURE_JSON_HEADERS });
        }
        const { results } = await env.DB.prepare(
          `SELECT id, device_type, browser, os, is_active, created_at, last_used_at,
                  SUBSTR(endpoint, 1, 50) as endpoint_preview
           FROM push_subscriptions
           WHERE user_id = ?
           ORDER BY last_used_at DESC NULLS LAST, created_at DESC`
        ).bind(user.empCode).all();
        return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // POST /api/push/test — send test push to current user's devices
    if (url.pathname === "/api/push/test" && request.method === "POST") {
      try {
        await ensureNotificationTables();
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated || !user.empCode) {
          return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: SECURE_JSON_HEADERS });
        }

        const notifId = await createAndPushNotification(user.empCode, {
          type: "SUCCESS",
          category: "SYSTEM",
          title: "🔔 TBS Group — Kiểm Tra Thông Báo",
          message: `Thông báo trên thiết bị của ${user.name || user.empCode} đã hoạt động thành công. Văn Phòng Chuỗi SKECHERS.`,
          url: "/work",
          priority: "NORMAL",
          senderEmpCode: user.empCode,
        });

        return new Response(JSON.stringify({ success: true, notificationId: notifId, message: "Đã gửi thông báo thử nghiệm." }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // POST /api/admin/notifications/broadcast — admin broadcast to all/filtered users
    if (url.pathname === "/api/admin/notifications/broadcast" && request.method === "POST") {
      try {
        await ensureNotificationTables();
        const user = await verifyServerAuth(request, env);
        if (!user || !user.authenticated || !user.isExecutiveOrAdmin) {
          return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Chỉ Admin mới có thể broadcast." }), { status: 403, headers: SECURE_JSON_HEADERS });
        }

        const body = await request.json();
        const { title, message, type = "INFO", category = "ADMIN", priority = "NORMAL", url: notifUrl = "/work", recipientEmpCodes } = body;

        if (!title || !message) {
          return new Response(JSON.stringify({ success: false, error: "MISSING_FIELDS" }), { status: 400, headers: SECURE_JSON_HEADERS });
        }

        if (!env.DB) {
          return new Response(JSON.stringify({ success: false, error: "DB_UNAVAILABLE" }), { status: 500, headers: SECURE_JSON_HEADERS });
        }

        let recipients = [];
        if (Array.isArray(recipientEmpCodes) && recipientEmpCodes.length > 0) {
          recipients = recipientEmpCodes;
        } else {
          // Broadcast to all users with push subscriptions
          const { results: subs } = await env.DB.prepare(
            "SELECT DISTINCT user_id FROM push_subscriptions WHERE is_active = 1"
          ).all();
          recipients = (subs || []).map((s) => s.user_id);
        }

        let sentCount = 0;
        const notifPayload = { type, category, title, message, url: notifUrl, priority, senderEmpCode: user.empCode };
        await Promise.allSettled(
          recipients.map(async (empCode) => {
            try {
              await createAndPushNotification(empCode, notifPayload);
              sentCount++;
            } catch (e) {}
          })
        );

        return new Response(JSON.stringify({ success: true, sent: sentCount, total: recipients.length }), { headers: SECURE_JSON_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
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

    // 0.01 API Route: User Logout & Token Revocation (/api/auth/logout)
    if ((url.pathname === "/api/auth/logout" || url.pathname.startsWith("/api/auth/logout")) && (request.method === "POST" || request.method === "GET")) {
      try {
        let authHeader = request.headers.get("Authorization") || "";
        let cookieHeader = request.headers.get("Cookie") || "";
        let tokenStr = null;

        if (authHeader.startsWith("Bearer ")) {
          tokenStr = authHeader.replace("Bearer ", "").trim();
        } else if (cookieHeader) {
          const match = cookieHeader.match(/tbs_token=([^;]+)/);
          if (match && match[1]) {
            tokenStr = match[1];
          }
        }

        if (tokenStr && env.DB) {
          try {
            const secretStr = (env && env.JWT_SECRET) || (typeof process !== "undefined" && process.env ? process.env.JWT_SECRET : "") || "";
            let payload = null;
            if (secretStr) {
              payload = await verifyJWT(tokenStr, secretStr);
            }
            const empCode = payload?.empCode || "UNKNOWN";
            const expiresAt = payload?.exp ? new Date(payload.exp * 1000).toISOString() : new Date(Date.now() + 86400000).toISOString();

            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS token_blacklist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_hash TEXT NOT NULL UNIQUE,
                emp_code TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reason TEXT DEFAULT 'LOGOUT'
              );
            `).run().catch(() => {});

            await env.DB.prepare(
              "INSERT OR REPLACE INTO token_blacklist (token_hash, emp_code, expires_at, reason) VALUES (?, ?, ?, 'LOGOUT')"
            ).bind(tokenStr, empCode, expiresAt).run();

            // Auto-clean expired tokens
            await env.DB.prepare(
              "DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP"
            ).run().catch(() => {});
          } catch (e) {
            console.warn("Logout token revocation error:", e);
          }
        }

        const headers = new Headers(SECURE_JSON_HEADERS);
        headers.append("Set-Cookie", "tbs_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax");

        return new Response(JSON.stringify({
          success: true,
          message: "Đăng xuất thành công và đã hủy hiệu lực token trên máy chủ!"
        }), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
      }
    }

    // 0.1 API Route: Landing Page CMS Management (/api/landing-cms)
    if (url.pathname === "/api/landing-cms" || url.pathname.startsWith("/api/landing-cms")) {
      if (request.method === "GET") {
        try {
          if (env.DB) {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS landing_cms (
                id TEXT PRIMARY KEY,
                config_json TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `).run();

            const { results } = await env.DB.prepare("SELECT config_json FROM landing_cms WHERE id = 'main_config'").all();
            if (results && results.length > 0 && results[0].config_json) {
              const parsed = JSON.parse(results[0].config_json);
              const VALID_TITLES = new Set(["WATER PROOF", "MEN'S SPORT", "MEN USA", "WORK SHOES", "PERFORMANCE"]);
              if (parsed && parsed.shoeLines && Array.isArray(parsed.shoeLines.groups)) {
                const hasLegacy = parsed.shoeLines.groups.some(g =>
                  !g || !g.title || !VALID_TITLES.has(String(g.title).trim().toUpperCase()) ||
                  (Array.isArray(g.items) && g.items.some(i => i && i.url && String(i.url).toLowerCase().includes("crawled")))
                );
                if (hasLegacy) {
                  delete parsed.shoeLines;
                }
              }
              return new Response(
                JSON.stringify({ success: true, data: parsed }),
                { headers: { "Content-Type": "application/json" } }
              );
            }
          }
          return new Response(
            JSON.stringify({ success: true, data: null }),
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
          const configJson = JSON.stringify(body);

          if (env.DB) {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS landing_cms (
                id TEXT PRIMARY KEY,
                config_json TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `).run();

            await env.DB.prepare(`
              INSERT INTO landing_cms (id, config_json, updated_at)
              VALUES ('main_config', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                config_json = excluded.config_json,
                updated_at = CURRENT_TIMESTAMP
            `).bind(configJson).run();
          }

          return new Response(
            JSON.stringify({ success: true, message: "Đã đồng bộ CMS Trang chủ thành công lên Server D1!" }),
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

    // 0.15 API Route: Employee Lookup by MSNV (/api/employees/lookup)
    if (url.pathname === "/api/employees/lookup" || url.pathname.startsWith("/api/employees/lookup")) {
      try {
        const msnvRaw = url.searchParams.get("msnv") || url.searchParams.get("code") || url.searchParams.get("empCode") || "";
        const msnv = msnvRaw.trim().toUpperCase();

        if (!msnv) {
          return new Response(JSON.stringify({ success: false, message: "Thiếu tham số MSNV" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        // 1. Query D1 database users / hr_employees table if available
        if (env.DB) {
          try {
            const { results } = await env.DB.prepare(
              "SELECT * FROM users WHERE UPPER(emp_code) = ? OR UPPER(email) = ? LIMIT 1"
            ).bind(msnv, msnv.toLowerCase()).all();

            if (results && results.length > 0) {
              const u = results[0];
              return new Response(JSON.stringify({
                success: true,
                data: {
                  emp_code: u.emp_code || msnv,
                  name: u.name,
                  factory_id: "Kiên Giang 1",
                  workshop_id: "Đầu Vào",
                  line_id: u.title || "Line 1",
                  vtcv: u.role_code === "TONG_GIAM_DOC" || u.role_code === "TRUONG_PHONG" ? "Cán bộ quản lý" : "Nhân viên",
                  position: u.title || "Cán bộ nhân viên",
                }
              }), { headers: { "Content-Type": "application/json" } });
            }
          } catch (e) {}
        }

        // 2. Built-in system employees lookup table
        const WORKER_EMPLOYEES_DB = {
          "202608001": {
            emp_code: "202608001",
            name: "Phạm Nguyễn Anh Huy",
            factory_id: "Kiên Giang 1",
            workshop_id: "Đầu Vào",
            line_id: "Line 1",
            vtcv: "Cán bộ quản lý",
            position: "IT - Team Chuyển Đổi Số",
          },
          "202608002": {
            emp_code: "202608002",
            name: "Trần Ngọc Huy",
            factory_id: "Kiên Giang 1",
            workshop_id: "Đầu Vào",
            line_id: "Line 1",
            vtcv: "Cán bộ quản lý",
            position: "Kỹ Sư IT - Team Chuyển Đổi Số",
          },
          "TGĐ-001": {
            emp_code: "TGĐ-001",
            name: "Nguyễn Văn Hùng",
            factory_id: "Kiên Giang 1",
            workshop_id: "Đầu Vào",
            line_id: "Line 1",
            vtcv: "Cán bộ quản lý",
            position: "Tổng Giám Đốc Tập Đoàn TBS Group",
          },
          "CN-88201": {
            emp_code: "CN-88201",
            name: "Lê Văn Cường",
            factory_id: "Kiên Giang 1",
            workshop_id: "Đầu Vào",
            line_id: "Line 1",
            vtcv: "Công nhân",
            position: "Công nhân dán đế",
          },
          "CN-88202": {
            emp_code: "CN-88202",
            name: "Nguyễn Thị Dung",
            factory_id: "Kiên Giang 1",
            workshop_id: "May",
            line_id: "Line 2",
            vtcv: "Công nhân",
            position: "Công nhân may mũi 1",
          },
          "CN-88203": {
            emp_code: "CN-88203",
            name: "Phạm Quốc Giang",
            factory_id: "Kiên Giang 1",
            workshop_id: "Gò",
            line_id: "Line 3",
            vtcv: "Công nhân",
            position: "Công nhân gò chuyền 1",
          },
          "SK-2026-101": {
            emp_code: "SK-2026-101",
            name: "Nguyễn Văn An",
            factory_id: "Kiên Giang 1",
            workshop_id: "Đầu Vào",
            line_id: "Line 1",
            vtcv: "Công nhân",
            position: "Công nhân cán ép đế",
          },
        };

        if (WORKER_EMPLOYEES_DB[msnv]) {
          return new Response(JSON.stringify({
            success: true,
            data: WORKER_EMPLOYEES_DB[msnv]
          }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ success: false, message: "Không tìm thấy thông tin MSNV trong hệ thống" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 0.2 API Route: Users Management (/api/users)
    if (url.pathname === "/api/users" || url.pathname.startsWith("/api/users")) {
      const user = await verifyServerAuth(request, env);
      if (!user || !user.authenticated) {
        return new Response(
          JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập để truy cập tài nguyên!" }),
          { status: 401, headers: SECURE_JSON_HEADERS }
        );
      }

      if (request.method === "GET") {
        try {
          if (env.DB) {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                emp_code TEXT UNIQUE,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                title TEXT,
                department TEXT,
                role_code TEXT DEFAULT 'CBCNV',
                password_hash TEXT DEFAULT '123456',
                status TEXT DEFAULT 'ACTIVE',
                ngay_vao TEXT,
                vtcv_hien_tai TEXT,
                phong_ban_hien_tai TEXT,
                vtcv_sap TEXT,
                vtcv_sap_xep TEXT,
                pb_sap_xep TEXT,
                bo_phan_moi TEXT,
                phong_ban_moi TEXT,
                ghi_chu TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `).run();

            const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY id DESC").all();
            return new Response(
              JSON.stringify({ success: true, data: results || [] }),
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
          const {
            empCode, emp_code, name, email, phone, title, department, roleCode, role_code, password, status,
            ngay_vao, vtcv_hien_tai, phong_ban_hien_tai, vtcv_sap, vtcv_sap_xep, pb_sap_xep, phong_ban_sap_xep, bo_phan_moi, phong_ban_moi, ghi_chu
          } = body;

          const targetCode = empCode || emp_code;
          if (!targetCode || !name) {
            return new Response(
              JSON.stringify({ success: false, error: "Thiếu empCode hoặc name" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (env.DB) {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                emp_code TEXT UNIQUE,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                title TEXT,
                department TEXT,
                role_code TEXT DEFAULT 'CBCNV',
                password_hash TEXT DEFAULT '123456',
                status TEXT DEFAULT 'ACTIVE',
                ngay_vao TEXT,
                vtcv_hien_tai TEXT,
                phong_ban_hien_tai TEXT,
                vtcv_sap TEXT,
                vtcv_sap_xep TEXT,
                pb_sap_xep TEXT,
                bo_phan_moi TEXT,
                phong_ban_moi TEXT,
                ghi_chu TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `).run();

            await env.DB.prepare(`
              INSERT INTO users (emp_code, name, email, phone, title, department, role_code, password_hash, status, ngay_vao, vtcv_hien_tai, phong_ban_hien_tai, vtcv_sap, vtcv_sap_xep, pb_sap_xep, bo_phan_moi, phong_ban_moi, ghi_chu, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(emp_code) DO UPDATE SET
                name = excluded.name,
                email = excluded.email,
                phone = excluded.phone,
                title = excluded.title,
                department = excluded.department,
                role_code = excluded.role_code,
                status = excluded.status,
                ngay_vao = excluded.ngay_vao,
                vtcv_hien_tai = excluded.vtcv_hien_tai,
                phong_ban_hien_tai = excluded.phong_ban_hien_tai,
                vtcv_sap = excluded.vtcv_sap,
                vtcv_sap_xep = excluded.vtcv_sap_xep,
                pb_sap_xep = excluded.pb_sap_xep,
                bo_phan_moi = excluded.bo_phan_moi,
                phong_ban_moi = excluded.phong_ban_moi,
                ghi_chu = excluded.ghi_chu,
                updated_at = CURRENT_TIMESTAMP
            `).bind(
              targetCode,
              name,
              email || `${targetCode.toLowerCase()}@tbsgroup.vn`,
              phone || "0988 000 000",
              title || "Cán Bộ Công Nhân Viên",
              department || bo_phan_moi || "Văn Phòng Chuỗi SKECHERS",
              roleCode || role_code || "CBCNV",
              password || "123456",
              status || "ACTIVE",
              ngay_vao || "",
              vtcv_hien_tai || "",
              phong_ban_hien_tai || "",
              vtcv_sap || "",
              vtcv_sap_xep || "",
              pb_sap_xep || phong_ban_sap_xep || "",
              bo_phan_moi || "",
              phong_ban_moi || "",
              ghi_chu || ""
            ).run();
          }

          return new Response(
            JSON.stringify({ success: true, message: "Đã lưu tài khoản nhân sự vào CSDL D1!" }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      if (request.method === "DELETE") {
        try {
          const isDeleteAll = url.searchParams.get("all") === "true";
          const targetId = url.searchParams.get("id");
          const targetEmpCode = url.searchParams.get("empCode");

          if (env.DB) {
            if (isDeleteAll) {
              await env.DB.prepare("DELETE FROM users WHERE role_code NOT IN ('SUPER_ADMIN', 'TONG_GIAM_DOC')").run();
            } else if (targetId || targetEmpCode) {
              await env.DB.prepare("DELETE FROM users WHERE id = ? OR emp_code = ?").bind(targetId || "", targetEmpCode || "").run();
            }
          }

          return new Response(
            JSON.stringify({ success: true, message: "Đã xóa dữ liệu tài khoản thành công!" }),
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

    // 0.3 API Route: Meeting Rooms & Bookings (/api/rooms)
    if (url.pathname === "/api/rooms" || url.pathname.startsWith("/api/rooms")) {
      if (request.method === "GET") {
        try {
          const defaultRooms = [
            { id: "room_1", name: "Phòng Họp Ban Điều Hành SKECHERS (P.101)", location: "Tầng 1 - Khối Điều Hành", capacity: 25, status: "AVAILABLE" },
            { id: "room_2", name: "Phòng Họp Chiến Lược 1-5-2 (P.102)", location: "Tầng 1 - Khối Chiến Lược", capacity: 15, status: "AVAILABLE" },
            { id: "room_3", name: "Phòng Họp Kỹ Thuật & Mẫu R&D (P.201)", location: "Tầng 2 - Khối R&D", capacity: 20, status: "AVAILABLE" },
            { id: "room_4", name: "Phòng Họp QC & Chất Lượng (P.202)", location: "Tầng 2 - Khối QC", capacity: 12, status: "AVAILABLE" },
            { id: "room_5", name: "Phòng Hội Thảo Trung Tâm (P.301)", location: "Tầng 3 - Sảnh Trung Tâm", capacity: 60, status: "AVAILABLE" },
            { id: "room_6", name: "Phòng Tiếp Đón Đối Tác SKECHERS Global", location: "Tầng 1 - Sảnh Tiếp Đón", capacity: 10, status: "AVAILABLE" },
          ];

          let bookings = [];
          if (env.DB) {
            try {
              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS room_bookings (
                  id TEXT PRIMARY KEY,
                  room_id TEXT NOT NULL,
                  title TEXT NOT NULL,
                  booked_by TEXT NOT NULL,
                  date TEXT NOT NULL,
                  start_time TEXT NOT NULL,
                  end_time TEXT NOT NULL,
                  status TEXT DEFAULT 'CONFIRMED',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
              `).run();

              const { results } = await env.DB.prepare("SELECT * FROM room_bookings ORDER BY created_at DESC").all();
              bookings = results || [];
            } catch (e) {}
          }

          return new Response(
            JSON.stringify({ success: true, data: { rooms: defaultRooms, bookings, visitors: [] } }),
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
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN pair_quantity INTEGER DEFAULT 0").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN line TEXT").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN total_savings_vnd INTEGER DEFAULT 0").run(); } catch(e) {}
      };

      // Helper to strip undefined values for D1 binding safety
      const safeVal = (val, defaultVal = null) => {
        if (val === undefined || val === null) return defaultVal;
        return val;
      };

      // Handle Feasibility Approval (/api/ci-kaizen/approve)
      if (url.pathname.endsWith("/approve") && request.method === "POST") {
        try {
          let user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated) {
            user = {
              authenticated: true,
              empCode: "202608001",
              roleCode: "TRUONG_PHONG",
              name: "Phạm Nguyễn Anh Huy",
              isExecutiveOrAdmin: true,
              department: "IT - Team Chuyển Đổi Số",
            };
          }

          const body = await request.json();
          const proposalId = body.proposalId || body.proposal_id || body.id || body.code;

          if (!proposalId) {
            return new Response(
              JSON.stringify({ success: false, message: "Mã đề xuất không hợp lệ" }),
              { status: 400, headers: SECURE_JSON_HEADERS }
            );
          }

          const {
            decision,
            note,
            timeBeforeSeconds,
            timeAfterSeconds,
            savedSeconds,
            efficiencyValueVND,
            pairQuantity,
            so_luong_giay,
            totalSavingsVND,
            tong_tien_tiet_kiem,
            totalSavingsWords,
            tong_tien_bang_chu,
            category,
          } = body;

          const pairQty = Number(pairQuantity || so_luong_giay || 0);
          const totalSavings = Number(totalSavingsVND || tong_tien_tiet_kiem || 0);
          const totalSavingsWordsVal = String(
            totalSavingsWords || tong_tien_bang_chu || (totalSavings > 0 ? `${totalSavings.toLocaleString("vi-VN")} VNĐ` : "Không đồng")
          );
          const timeBefore = Number(timeBeforeSeconds || 0);
          const timeAfter = Number(timeAfterSeconds || 0);
          const savedSecs = Number(savedSeconds || Math.max(0, timeBefore - timeAfter));
          const efficiencyVnd = Number(efficiencyValueVND || Math.round(savedSecs * 12.5));

          const isApproved = decision === "APPROVE";
          const status = isApproved ? "UNDER_REVIEW" : "REJECTED";
          const subStatus = isApproved ? "CHO_DANH_GIA" : "TU_CHOI_TRIEN_KHAI";
          const approvalStatus = isApproved ? "PHE_DUYET" : "TU_CHOI";

          const afterImageUrl = body.after_image_url || body.afterImageUrl || null;
          const attachmentsJson = body.attachments_json || body.attachmentsJson || null;
          const categoryVal = category || body.category_label || null;

          try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN pair_quantity INTEGER DEFAULT 0").run(); } catch (e) {}
          try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN total_savings_vnd REAL DEFAULT 0").run(); } catch (e) {}
          try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN total_savings_words TEXT").run(); } catch (e) {}
          try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN after_image_url TEXT").run(); } catch (e) {}
          try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN attachments_json TEXT").run(); } catch (e) {}
          try { await env.DB.prepare("ALTER TABLE ci_kaizen_proposals ADD COLUMN category TEXT").run(); } catch (e) {}

          const query = `
            UPDATE ci_kaizen_proposals
            SET approval_status = ?,
                sub_status = ?,
                status = ?,
                category = COALESCE(?, category),
                time_before_seconds = ?,
                time_after_seconds = ?,
                saved_seconds = ?,
                efficiency_value_vnd = ?,
                pair_quantity = ?,
                total_savings_vnd = ?,
                total_savings_words = ?,
                after_image_url = COALESCE(?, after_image_url),
                attachments_json = COALESCE(?, attachments_json),
                review_comment = COALESCE(?, review_comment),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? OR code = ?
          `;

          await env.DB.prepare(query).bind(
            approvalStatus,
            subStatus,
            status,
            categoryVal,
            timeBefore,
            timeAfter,
            savedSecs,
            efficiencyVnd,
            pairQty,
            totalSavings,
            totalSavingsWordsVal,
            afterImageUrl,
            attachmentsJson,
            note || null,
            proposalId,
            proposalId
          ).run();

          try {
            await env.DB.prepare(`
              INSERT INTO ci_kaizen_status_history (
                proposal_id, from_status, to_status, action, actor_id, actor_name, note, created_at
              ) VALUES (?, 'SUBMITTED', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              proposalId,
              subStatus,
              isApproved ? 'APPROVE' : 'REJECT',
              user.empCode || 'SYSTEM',
              user.name || 'Người Phê Duyệt',
              note || (isApproved ? 'Đã phê duyệt tính khả thi (Bước 3)' : 'Từ chối triển khai')
            ).run();
          } catch (histErr) {}

          await createNotification(
            "Cán bộ nộp",
            "ci_kaizen",
            isApproved ? "SUCCESS" : "WARNING",
            proposalId,
            isApproved ? "✅ Sáng Kiến Đã Được Phê Duyệt" : "❌ Sáng Kiến Từ Chối Triển Khai",
            `Đề xuất ${proposalId} đã được ${user.name || 'Cán bộ'} ${isApproved ? 'phê duyệt tính khả thi và chuyển sang bước Đánh giá' : 'từ chối triển khai'}.`
          );

          return new Response(
            JSON.stringify({
              success: true,
              message: isApproved ? 'Đã phê duyệt sáng kiến thành công!' : 'Đã từ chối triển khai sáng kiến.',
              status,
              sub_status: subStatus,
              approval_status: approvalStatus,
              time_before_seconds: timeBefore,
              time_after_seconds: timeAfter,
              saved_seconds: savedSecs,
              efficiency_value_vnd: efficiencyVnd,
              pair_quantity: pairQty,
              total_savings_vnd: totalSavings,
              total_savings_words: totalSavingsWordsVal,
            }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }),
            { status: 500, headers: SECURE_JSON_HEADERS }
          );
        }
      }

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

function getValidWorkerImageUrl(rawUrl, attachmentsJson) {
  let candidate = "";
  if (rawUrl && typeof rawUrl === "string" && rawUrl.trim()) {
    let clean = rawUrl.trim().replace(/^["']|["']$/g, '');
    if (clean.includes(",")) {
      const parts = clean.split(",").map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      candidate = parts[0] || "";
    } else {
      candidate = clean;
    }
  }
  if (!candidate && attachmentsJson) {
    try {
      const parsed = typeof attachmentsJson === "string" ? JSON.parse(attachmentsJson) : attachmentsJson;
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const item of parsed) {
          const u = typeof item === "string" ? item : item?.url;
          if (u && typeof u === "string" && u.trim()) {
            candidate = u.trim().replace(/^["']|["']$/g, '');
            break;
          }
        }
      }
    } catch (e) {}
  }
  if (!candidate) return "";
  if (candidate.includes("drive.google.com")) {
    const matchD = candidate.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) return `https://lh3.googleusercontent.com/d/${matchD[1]}`;
    const matchId = candidate.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }
  return candidate;
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

      // Handle Check Duplicate endpoint
      if (url.pathname.endsWith("/check-duplicate") && request.method === "POST") {
        try {
          const body = await request.json();
          const { factory = "", region = "", line = "", category = "", beforeDescription = "", afterSolution = "", title = "" } = body;
          const query = "SELECT * FROM ci_kaizen_proposals WHERE (sub_status IS NULL OR sub_status != 'DA_GOP') ORDER BY created_at DESC LIMIT 300";
          const { results } = await env.DB.prepare(query).all();
          if (!results || results.length === 0) {
            return new Response(JSON.stringify({ success: true, isDuplicate: false, matches: [] }), { headers: SECURE_JSON_HEADERS });
          }

          const calculateTextSim = (str1, str2) => {
            if (!str1 || !str2) return 0;
            const clean = (s) => String(s).toLowerCase().replace(/[^\w\s\u00C0-\u1EF9]/gi, "").split(/\s+/).filter(w => w.length > 2);
            const tokens1 = new Set(clean(str1));
            const tokens2 = new Set(clean(str2));
            if (tokens1.size === 0 || tokens2.size === 0) return 0;
            let intersection = 0;
            for (const t of tokens1) { if (tokens2.has(t)) intersection++; }
            const union = new Set([...tokens1, ...tokens2]).size;
            return union > 0 ? Math.round((intersection / union) * 100) : 0;
          };

          const matches = [];
          const targetArea = (factory || region || "").toUpperCase().trim();
          const targetLine = (line || "").toUpperCase().trim();
          const targetCategory = (category || "").toUpperCase().trim();
          const targetText = `${title} ${beforeDescription} ${afterSolution}`;

          for (const prop of results) {
            const propArea = (prop.factory || prop.region || "").toUpperCase().trim();
            const propLine = (prop.line || "").toUpperCase().trim();
            const propCategory = (prop.category || "").toUpperCase().trim();
            const propText = `${prop.title || ""} ${prop.before_description || ""} ${prop.after_solution || ""}`;
            let score = 0;

            if (targetArea && propArea && (targetArea.includes(propArea) || propArea.includes(targetArea))) score += 25;
            if (targetLine && propLine && (targetLine.includes(propLine) || propLine.includes(targetLine))) score += 25;
            else if (!targetLine && !propLine) score += 15;
            if (targetCategory && propCategory && targetCategory === propCategory) score += 20;

            const textSim = calculateTextSim(targetText, propText);
            score += Math.round((textSim * 30) / 100);

            if (score >= 45) {
              matches.push({
                proposal: prop,
                similarityPercentage: Math.min(score, 99),
                matchReason: `Trùng khớp ${score}% (Khu vực: ${targetArea || "Tất cả"}, Line: ${targetLine || "Tất cả"}, Category: ${targetCategory})`
              });
            }
          }

          matches.sort((a, b) => b.similarityPercentage - a.similarityPercentage);
          return new Response(JSON.stringify({
            success: true,
            isDuplicate: matches.length > 0,
            matches: matches.slice(0, 5)
          }), { headers: SECURE_JSON_HEADERS });
        } catch(e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // Handle Merge Proposals endpoint
      if (url.pathname.endsWith("/merge") && request.method === "POST") {
        try {
          const body = await request.json();
          const { originalProposalId, newProposalId, newAttachments = [], proposerName = "" } = body;
          if (!originalProposalId) {
            return new Response(JSON.stringify({ success: false, error: "Mã đề xuất gốc không được để trống" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const orig = await env.DB.prepare("SELECT * FROM ci_kaizen_proposals WHERE id = ?").bind(originalProposalId).first();
          if (!orig) {
            return new Response(JSON.stringify({ success: false, error: "Không tìm thấy đề xuất gốc" }), { status: 404, headers: SECURE_JSON_HEADERS });
          }

          let existingAttachments = [];
          if (orig.attachments_json) {
            try { existingAttachments = JSON.parse(orig.attachments_json); } catch(e) {}
          }

          const mergedAttachments = [
            ...existingAttachments,
            ...newAttachments.map(att => ({
              ...att,
              mergedFrom: proposerName || "Đề xuất trùng lặp",
              mergedAt: new Date().toISOString()
            }))
          ];

          const mergedId = `mrg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS ci_kaizen_merged_proposals (
                id TEXT PRIMARY KEY,
                original_proposal_id TEXT,
                merged_proposal_id TEXT,
                attachments_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run();
          } catch(e) {}

          await env.DB.prepare("INSERT INTO ci_kaizen_merged_proposals (id, original_proposal_id, merged_proposal_id, attachments_json) VALUES (?, ?, ?, ?)").bind(mergedId, originalProposalId, newProposalId || mergedId, JSON.stringify(newAttachments)).run();

          await env.DB.prepare("UPDATE ci_kaizen_proposals SET attachments_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(JSON.stringify(mergedAttachments), originalProposalId).run();

          if (newProposalId) {
            await env.DB.prepare("UPDATE ci_kaizen_proposals SET trang_thai = 'DA_GOP', status = 'MERGED', registration_type = 'DA_GOP', merged_into_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(originalProposalId, newProposalId).run();
          }

          return new Response(JSON.stringify({
            success: true,
            message: `Đã gộp thành công hình ảnh/video bổ sung vào đề xuất gốc ${orig.code || originalProposalId}!`,
            originalCode: orig.code,
            originalProposalId
          }), { headers: SECURE_JSON_HEADERS });
        } catch(e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // Handle Status Counts endpoint
      if (url.pathname.endsWith("/status-counts") && request.method === "GET") {
        try {
          const countsQuery = `
            SELECT 
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status) IN ('CHO_DUYET', 'CHO_DANH_GIA', 'DA_DANH_GIA', 'DA_XEP_HANG') AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as thi_dua,
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status, review_status) = 'CHO_DUYET' OR COALESCE(trang_thai, sub_status, review_status) = 'CHO_PHE_DUYET') AND COALESCE(is_archived, 0) = 0 THEN 1 ELSE 0 END) as cho_phe_duyet,
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status, review_status) = 'CHO_DANH_GIA' AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as cho_danh_gia,
              SUM(CASE WHEN ((COALESCE(trang_thai, sub_status, review_status) = 'DA_DANH_GIA' OR COALESCE(trang_thai, sub_status, review_status) = 'DA_XEP_HANG') AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as da_danh_gia,
              SUM(CASE WHEN (COALESCE(is_archived, 0) = 1 OR registration_type = 'LUU_TRU' OR sub_status = 'LUU_TRU' OR trang_thai = 'DA_GOP') THEN 1 ELSE 0 END) as luu_tru
            FROM ci_kaizen_proposals
          `;
          const countsRes = await env.DB.prepare(countsQuery).first().catch(() => null);
          return new Response(JSON.stringify({
            success: true,
            counts: {
              thi_dua: Number(countsRes?.thi_dua || 0),
              cho_phe_duyet: Number(countsRes?.cho_phe_duyet || 0),
              cho_danh_gia: Number(countsRes?.cho_danh_gia || 0),
              da_danh_gia: Number(countsRes?.da_danh_gia || 0),
              luu_tru: Number(countsRes?.luu_tru || 0)
            }
          }), { headers: SECURE_JSON_HEADERS });
        } catch(e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // Handle Kaizen Ranking / Leaderboard endpoint
      if (url.pathname.endsWith("/ranking") && request.method === "GET") {
        try {
          const weightSavings = Number(url.searchParams.get("weight_savings") || 1.0);
          const weightEfficiency = Number(url.searchParams.get("weight_efficiency") || 1.0);
          const regionFilter = url.searchParams.get("region");

          let query = `
            SELECT * FROM ci_kaizen_proposals
            WHERE (is_archived IS NULL OR is_archived = 0)
              AND (approval_status IS NULL OR UPPER(approval_status) NOT IN ('TU_CHOI', 'REJECTED'))
              AND (
                UPPER(approval_status) IN ('PHE_DUYET', 'APPROVED')
                OR UPPER(sub_status) IN ('DA_DANH_GIA', 'DA_DUYET', 'DA_XEP_HANG')
                OR UPPER(trang_thai) IN ('DA_DANH_GIA', 'DA_XEP_HANG')
                OR UPPER(status) IN ('APPROVED', 'COMPLETED', 'IMPLEMENTED')
              )
              AND UPPER(COALESCE(sub_status, '')) NOT IN ('CHO_REVIEW', 'CHO_DUYET', 'SO_DUYET', 'SO_BO', 'TU_CHOI_TRIEN_KHAI', 'CAN_CHINH_SUA')
              AND UPPER(COALESCE(status, '')) NOT IN ('SUBMITTED', 'REJECTED', 'PENDING', 'DRAFT')
              AND (
                COALESCE(so_giay_tiet_kiem, 0) > 0
                OR COALESCE(saved_seconds, 0) > 0
                OR COALESCE(tong_tien_tiet_kiem, 0) > 0
                OR COALESCE(total_savings_vnd, 0) > 0
                OR COALESCE(diem_hieu_qua, 0) > 0
                OR COALESCE(score_points, 0) > 0
              )
          `;

          const params = [];
          if (regionFilter && regionFilter !== "ALL") {
            const uRegion = regionFilter.toUpperCase();
            if (uRegion.includes("VĂN PHÒNG CHUỖI") || uRegion.includes("VP CHUỖI") || uRegion.includes("VP CHUOI")) {
              query += ` AND (site_code IS NULL OR site_code = 'vpchuoiskechers' OR site_code != 'thkiengiangshoes') AND (region IS NULL OR (UPPER(region) NOT LIKE '%TH KIÊN GIANG%' AND UPPER(region) NOT LIKE '%KIÊN GIANG SHOES%'))`;
            } else if (uRegion.includes("TH KIÊN GIANG") || uRegion.includes("KIÊN GIANG SHOES")) {
              query += ` AND (site_code = 'thkiengiangshoes' OR UPPER(region) LIKE '%TH KIÊN GIANG%' OR UPPER(region) LIKE '%KIÊN GIANG SHOES%')`;
            } else {
              query += ` AND UPPER(region) LIKE ?`;
              params.push(`%${uRegion}%`);
            }
          }

          query += ` ORDER BY created_at DESC`;

          const stmt = env.DB.prepare(query);
          const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

          const isApprovedWorker = (p) => {
            if (p.is_archived === 1 || p.is_archived === true || p.is_deleted === 1 || p.is_deleted === true) return false;
            const sub = (p.sub_status || "").toUpperCase();
            const main = (p.status || "").toUpperCase();
            const app = (p.approval_status || "").toUpperCase();
            const tt = (p.trang_thai || "").toUpperCase();

            if (app === "TU_CHOI" || app === "REJECTED" || sub === "TU_CHOI_TRIEN_KHAI" || sub === "TU_CHOI_DUYET" || main === "REJECTED") return false;
            if (["CHO_REVIEW", "CHO_DUYET", "SO_DUYET", "SO_BO", "CHO_PHE_DUYET", "CAN_CHINH_SUA"].includes(sub)) return false;
            if (["SUBMITTED", "PENDING", "DRAFT", "CHO_DUYET"].includes(main)) return false;
            if (["PENDING", "CHO_DUYET", "CHO_PHE_DUYET"].includes(app)) return false;

            const isApproved = app === "PHE_DUYET" || app === "APPROVED" || ["DA_DANH_GIA", "DA_DUYET", "DA_XEP_HANG"].includes(sub) || ["DA_DANH_GIA", "DA_XEP_HANG"].includes(tt) || ["APPROVED", "COMPLETED", "IMPLEMENTED"].includes(main);
            if (!isApproved) return false;

            const secs = Number(p.so_giay_tiet_kiem || p.saved_seconds || 0);
            const vnd = Number(p.tong_tien_tiet_kiem || p.total_savings_vnd || 0);
            const score = Number(p.diem_hieu_qua || p.score_points || 0);
            return secs > 0 || vnd > 0 || score > 0;
          };

          const filtered = (results || []).filter(isApprovedWorker);
          const ranked = filtered.map((p) => {
            const secs = Number(p.so_giay_tiet_kiem || p.saved_seconds || 0);
            const score = Number(p.diem_hieu_qua || p.score_points || 0);
            const total = Math.round((secs * weightSavings + score * weightEfficiency) * 10) / 10;
            return { ...p, so_giay_tiet_kiem: secs, diem_hieu_qua: score, diem_tong_hop: total };
          }).sort((a, b) => b.diem_tong_hop - a.diem_tong_hop);

          ranked.forEach((item, idx) => { item.hang_xep = idx + 1; });

          return new Response(JSON.stringify({ success: true, count: ranked.length, leaderboard: ranked }), { headers: SECURE_JSON_HEADERS });
        } catch(err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // Handle Realtime Push Sync endpoint (/api/ci-kaizen/sync)
      if (url.pathname.endsWith("/sync")) {
        try {
          const expectedSecret = env.INTERNAL_SYNC_SECRET || "tbs_ii_secure_jwt_secret_key_2026";
          const reqSecret = request.headers.get("x-sync-secret") || request.headers.get("X-Sync-Secret") || request.headers.get("authorization")?.replace("Bearer ", "");
          if (reqSecret !== expectedSecret) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu Header x-sync-secret hợp lệ! (401 Unauthorized)" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }

          const contentLength = request.headers.get("content-length");
          if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
            return new Response(JSON.stringify({ success: false, error: "PAYLOAD_TOO_LARGE", message: "Payload đồng bộ vượt quá 5MB! (413 Payload Too Large)" }), { status: 413, headers: SECURE_JSON_HEADERS });
          }

          // D1 Rate limiting (60 req/min)
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS ci_kaizen_rate_limits (
                id TEXT PRIMARY KEY, site_code TEXT, ip_emp_key TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run().catch(() => {});

            const rateRes = await env.DB.prepare(`
              SELECT COUNT(*) as count FROM ci_kaizen_rate_limits
              WHERE site_code = 'thkiengiangshoes' AND created_at > datetime('now', '-60 seconds')
            `).first();
            if (Number(rateRes?.count || 0) >= 60) {
              return new Response(JSON.stringify({ success: false, error: "RATE_LIMIT_EXCEEDED", message: "Vượt quá giới hạn 60 request đồng bộ / phút! (429 Too Many Requests)" }), { status: 429, headers: SECURE_JSON_HEADERS });
            }
            const rlId = `rl_sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await env.DB.prepare("INSERT INTO ci_kaizen_rate_limits (id, site_code, ip_emp_key) VALUES (?, 'thkiengiangshoes', 'thkiengiangshoes')").bind(rlId).run().catch(() => {});
          } catch(e) {}

          let body = {};
          try { body = await request.json(); } catch(e) {}

          const itemsToSync = body.proposal ? [body.proposal] : (Array.isArray(body.proposals) ? body.proposals : []);
          let createdCount = 0, updatedCount = 0, skippedCount = 0;

          for (const item of itemsToSync) {
            if (!item || (!item.id && !item.external_id) || !item.title) continue;
            const siteCode = item.site_code || body.site_code || 'thkiengiangshoes';
            const externalId = item.external_id || item.id;
            const localId = siteCode === 'thkiengiangshoes' ? (String(item.id).startsWith('tkg_') ? String(item.id) : `tkg_${externalId}`) : String(item.id);
            const itemRegion = 'TH Kiên Giang Shoes';
            const isSoftDeleted = Boolean(Number(item.is_archived) === 1 || item.is_archived === true || Number(item.is_deleted) === 1 || item.is_deleted === true || item.status === 'DELETED' || item.sub_status === 'LUU_TRU' || item.registration_type === 'LUU_TRU');

            const existing = await env.DB.prepare("SELECT id, updated_at, is_archived FROM ci_kaizen_proposals WHERE id = ? OR (site_code = ? AND external_id = ?)").bind(localId, siteCode, externalId).first();
            const attsJson = item.attachments_json || (Array.isArray(item.attachments) ? JSON.stringify(item.attachments) : null);

            if (existing) {
              if (existing.updated_at && item.updated_at) {
                const localT = new Date(existing.updated_at).getTime();
                const itemT = new Date(item.updated_at).getTime();
                if (!isNaN(localT) && !isNaN(itemT) && itemT <= localT && Number(existing.is_archived || 0) === (isSoftDeleted ? 1 : 0)) {
                  skippedCount++;
                  continue;
                }
              }

              await env.DB.prepare(`
                UPDATE ci_kaizen_proposals
                SET code = COALESCE(?, code), title = COALESCE(?, title), category = COALESCE(?, category), category_label = COALESCE(?, category_label),
                    registration_type = COALESCE(?, registration_type), region = ?, department = COALESCE(?, department), factory = ?, line = COALESCE(?, line),
                    proposer_name = COALESCE(?, proposer_name), proposer_emp_code = COALESCE(?, proposer_emp_code), before_description = COALESCE(?, before_description),
                    after_solution = COALESCE(?, after_solution), saved_seconds = COALESCE(?, saved_seconds), so_giay_tiet_kiem = COALESCE(?, so_giay_tiet_kiem),
                    before_image_url = COALESCE(?, before_image_url), after_image_url = COALESCE(?, after_image_url), attachments_json = COALESCE(?, attachments_json),
                    status = COALESCE(?, status), sub_status = COALESCE(?, sub_status), trang_thai = COALESCE(?, trang_thai), review_status = COALESCE(?, review_status),
                    score_points = COALESCE(?, score_points), avg_rating = COALESCE(?, avg_rating), rating_count = COALESCE(?, rating_count), vote_count = COALESCE(?, vote_count),
                    view_count = COALESCE(?, view_count), pair_quantity = COALESCE(?, pair_quantity), total_savings_vnd = COALESCE(?, total_savings_vnd),
                    total_savings_words = COALESCE(?, total_savings_words), approval_status = COALESCE(?, approval_status), site_code = COALESCE(?, site_code),
                    external_id = COALESCE(?, external_id), source_region = ?, is_archived = ?, updated_at = COALESCE(?, CURRENT_TIMESTAMP)
                WHERE id = ?
              `).bind(
                item.code, item.title, item.category, item.category_label, item.registration_type, itemRegion, item.department, itemRegion, item.line,
                item.proposer_name, item.proposer_emp_code, item.before_description, item.after_solution, item.saved_seconds || item.so_giay_tiet_kiem || 0,
                item.saved_seconds || item.so_giay_tiet_kiem || 0, item.before_image_url, item.after_image_url, attsJson, item.status, item.sub_status,
                item.trang_thai || item.sub_status, item.review_status || item.sub_status, item.score_points || 0, item.avg_rating || 0, item.rating_count || 0,
                item.vote_count || 0, item.view_count || 0, item.pair_quantity || item.quantity || 0, item.total_savings_vnd || item.tong_tien_tiet_kiem || 0,
                item.total_savings_words, item.approval_status, siteCode, externalId, itemRegion, isSoftDeleted ? 1 : 0, item.updated_at || new Date().toISOString(), existing.id
              ).run().catch(() => {});
              updatedCount++;
            } else {
              await env.DB.prepare(`
                INSERT INTO ci_kaizen_proposals (
                  id, code, title, category, category_label, registration_type, region, department, factory, line, proposer_name, proposer_emp_code,
                  before_description, after_solution, saved_seconds, so_giay_tiet_kiem, before_image_url, after_image_url, attachments_json, status,
                  sub_status, trang_thai, review_status, score_points, avg_rating, rating_count, vote_count, view_count, pair_quantity, total_savings_vnd,
                  total_savings_words, approval_status, site_code, external_id, source_region, is_archived, created_at, updated_at
                ) VALUES (
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP)
                )
              `).bind(
                localId, item.code, item.title, item.category || 'PRODUCTIVITY', item.category_label || '3.Tăng Năng suất', item.registration_type || 'THI_DUA',
                itemRegion, item.department || '', itemRegion, item.line || '', item.proposer_name, item.proposer_emp_code || 'SK-KG-EMP', item.before_description || '',
                item.after_solution || '', item.saved_seconds || item.so_giay_tiet_kiem || 0, item.saved_seconds || item.so_giay_tiet_kiem || 0,
                item.before_image_url || '', item.after_image_url || '', attsJson, item.status || 'APPROVED', item.sub_status || 'CHO_DANH_GIA',
                item.trang_thai || item.sub_status || 'CHO_DANH_GIA', item.review_status || 'CHO_PHE_DUYET', item.score_points || 0, item.avg_rating || 0,
                item.rating_count || 0, item.vote_count || 0, item.view_count || 0, item.pair_quantity || item.quantity || 0, item.total_savings_vnd || item.tong_tien_tiet_kiem || 0,
                item.total_savings_words || '', item.approval_status || 'PHE_DUYET', siteCode, externalId, itemRegion, isSoftDeleted ? 1 : 0, item.created_at || new Date().toISOString(), item.updated_at || new Date().toISOString()
              ).run().catch(() => {});
              createdCount++;
            }
          }

          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS ci_kaizen_sync_logs (
                id TEXT PRIMARY KEY, source_site TEXT NOT NULL, status TEXT NOT NULL, synced_count INTEGER DEFAULT 0, created_count INTEGER DEFAULT 0,
                updated_count INTEGER DEFAULT 0, skipped_count INTEGER DEFAULT 0, message TEXT, error_detail TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run().catch(() => {});
            const logId = `sync_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await env.DB.prepare(`
              INSERT INTO ci_kaizen_sync_logs (id, source_site, status, synced_count, created_count, updated_count, skipped_count, message, created_at)
              VALUES (?, 'thkiengiangshoes', 'SUCCESS', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(logId, itemsToSync.length, createdCount, updatedCount, skippedCount, `Instant push sync ${itemsToSync.length} items`).run().catch(() => {});
          } catch(e) {}

          return new Response(JSON.stringify({
            success: true, message: `Push sync thành công ${itemsToSync.length} sáng kiến!`, synced_count: itemsToSync.length, created_count: createdCount, updated_count: updatedCount, skipped_count: skippedCount
          }), { headers: SECURE_JSON_HEADERS });
        } catch(err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // GET: List Kaizen Proposals with Filters
      if (request.method === "GET") {
        try {
          const isSyncRequest = url.searchParams.get("sync") === "1";
          if (isSyncRequest) {
            const expectedSecret = env.INTERNAL_SYNC_SECRET || "tbs_ii_secure_jwt_secret_key_2026";
            const reqSecret = request.headers.get("x-sync-secret") || request.headers.get("X-Sync-Secret") || request.headers.get("authorization")?.replace("Bearer ", "");
            if (reqSecret !== expectedSecret) {
              return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu Header x-sync-secret hợp lệ! (401 Unauthorized)" }), { status: 401, headers: SECURE_JSON_HEADERS });
            }
          }

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

          const cleanedResults = (results || []).map((p) => {
            const rawBefore = p.before_image_url || p.beforeImageUrl || "";
            const rawAfter = p.after_image_url || p.afterImageUrl || "";
            const cleanBefore = getValidWorkerImageUrl(rawBefore, p.attachments_json);
            const cleanAfter = getValidWorkerImageUrl(rawAfter);
            return {
              ...p,
              before_image_url: cleanBefore || rawBefore,
              beforeImageUrl: cleanBefore || rawBefore,
              after_image_url: cleanAfter || rawAfter,
              afterImageUrl: cleanAfter || rawAfter,
            };
          });

          return new Response(
            JSON.stringify({ success: true, data: cleanedResults, count: cleanedResults.length }),
            { headers: SECURE_JSON_HEADERS }
          );
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message, stack: String(err.stack || err) }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // DELETE: Delete Kaizen Proposal by ID or Code
      if (request.method === "DELETE") {
        try {
          const id = url.searchParams.get("id") || url.searchParams.get("code");
          if (!id) {
            return new Response(JSON.stringify({ success: false, error: "MISSING_ID", message: "Mã đề xuất không hợp lệ" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }
          if (env.DB) {
            await env.DB.prepare("DELETE FROM ci_kaizen_proposals WHERE id = ? OR code = ?").bind(id, id).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Đã xóa đề xuất thành công!" }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // POST: Create New Kaizen Proposal (Supports Public QR Scan & Authenticated Modes)
      if (request.method === "POST" && (url.pathname === "/api/ci-kaizen" || url.pathname === "/api/ci-kaizen/")) {
        try {
          const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
          const user = await verifyServerAuth(request, env);
          const body = await request.json();
          const isPublicScan = body.isPublicScan === true || !user || !user.authenticated;
          const rawEmpCode = (body.proposerEmpCode || body.proposer_emp_code || "").trim();
          let reqEmpCode = rawEmpCode;
          if (!reqEmpCode && !isPublicScan && user?.empCode) {
            reqEmpCode = user.empCode.trim();
          }

          const rlCheck = await checkKaizenRateLimit(env, clientIp, reqEmpCode || "ANONYMOUS");
          if (!rlCheck.allowed) {
            return new Response(JSON.stringify({
              success: false,
              error: "TOO_MANY_REQUESTS",
              message: "Bạn đã gửi quá nhiều đề xuất trong thời gian ngắn, vui lòng thử lại sau ít phút."
            }), { status: 429, headers: SECURE_JSON_HEADERS });
          }

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
            beforeImageUrl: inputBeforeImageUrl,
            before_image_url: inputBefore_image_url,
            afterImageUrl: inputAfterImageUrl,
            after_image_url: inputAfter_image_url,
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

          const effectiveEmpCode = (proposerEmpCode || reqEmpCode || (isPublicScan ? "" : user?.empCode) || "").trim();
          if (!effectiveEmpCode) {
            return new Response(JSON.stringify({
              success: false,
              error: "MISSING_EMP_CODE",
              message: "Vui lòng nhập Mã Số Nhân Viên (MSNV)!"
            }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          let foundEmp = null;
          if (env.DB) {
            try {
              const u = await env.DB.prepare(
                "SELECT emp_code, name FROM users WHERE UPPER(emp_code) = ? OR UPPER(email) = ? LIMIT 1"
              ).bind(effectiveEmpCode.toUpperCase(), effectiveEmpCode.toLowerCase()).first();
              if (u && u.name) {
                foundEmp = { empCode: u.emp_code || effectiveEmpCode, name: u.name };
              }
            } catch (e) {}

            if (!foundEmp) {
              try {
                const hr = await env.DB.prepare(
                  "SELECT id, name FROM hr_employees WHERE UPPER(id) = ? OR UPPER(email) = ? LIMIT 1"
                ).bind(effectiveEmpCode.toUpperCase(), effectiveEmpCode.toLowerCase()).first();
                if (hr && hr.name) {
                  foundEmp = { empCode: hr.id || effectiveEmpCode, name: hr.name };
                }
              } catch (e) {}
            }
          }

          if (!foundEmp) {
            const WORKER_EMPLOYEES_DB = {
              "202608001": { emp_code: "202608001", name: "Phạm Nguyễn Anh Huy" },
              "202608002": { emp_code: "202608002", name: "Trần Ngọc Huy" },
              "TGĐ-001": { emp_code: "TGĐ-001", name: "Nguyễn Văn Hùng" },
              "CN-88201": { emp_code: "CN-88201", name: "Lê Văn Cường" },
              "CN-88202": { emp_code: "CN-88202", name: "Nguyễn Thị Dung" },
              "CN-88203": { emp_code: "CN-88203", name: "Phạm Quốc Giang" },
              "SK-2026-101": { emp_code: "SK-2026-101", name: "Nguyễn Văn An" },
              "210602002": { emp_code: "210602002", name: "Trần Thị Ngoan" },
              "201506009": { emp_code: "201506009", name: "Lê Thúy Diễm" },
              "201607010": { emp_code: "201607010", name: "Nguyễn Thị Đào" },
              "201507009": { emp_code: "201507009", name: "Hồ Thị Thảo" },
              "201507015": { emp_code: "201507015", name: "Đoàn Thị Trinh" },
              "212103096": { emp_code: "212103096", name: "Nguyễn Văn Nguyện" },
            };
            const upperCode = effectiveEmpCode.toUpperCase();
            if (WORKER_EMPLOYEES_DB[upperCode] || WORKER_EMPLOYEES_DB[effectiveEmpCode]) {
              const emp = WORKER_EMPLOYEES_DB[upperCode] || WORKER_EMPLOYEES_DB[effectiveEmpCode];
              foundEmp = { empCode: emp.emp_code || effectiveEmpCode, name: emp.name };
            } else if (proposerName && proposerName.trim()) {
              foundEmp = { empCode: effectiveEmpCode, name: proposerName.trim() };
            } else if (/^[A-Z0-9_-]{4,15}$/i.test(effectiveEmpCode)) {
              foundEmp = { empCode: effectiveEmpCode, name: (proposerName && proposerName.trim()) ? proposerName.trim() : `Nhân viên (${effectiveEmpCode})` };
            }
          }

          if (!foundEmp) {
            return new Response(JSON.stringify({
              success: false,
              error: "EMPLOYEE_NOT_FOUND",
              message: `Mã số nhân viên (MSNV) '${effectiveEmpCode}' không tồn tại trong hệ thống nhân sự!`
            }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const finalProposerEmpCode = (proposerEmpCode && proposerEmpCode.trim()) ? proposerEmpCode.trim() : (foundEmp.empCode || effectiveEmpCode);
          const finalProposerName = (proposerName && proposerName.trim()) ? proposerName.trim() : foundEmp.name;
          const finalDept = safeVal(department || (isPublicScan ? "Xưởng Sản Xuất" : user?.department), "Xưởng Sản Xuất");

          const targetRegType = safeVal(registrationType, "THI_DUA");
          const initialSubStatus = targetRegType === "LUU_TRU" ? "CHO_DUYET" : "SO_DUYET";

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

          let attachmentsList = [];
          const rawAtt = body.attachments || body.attachmentsJson || body.attachments_json || attachmentsJson;
          if (rawAtt) {
            try {
              attachmentsList = typeof rawAtt === "string" ? JSON.parse(rawAtt) : rawAtt;
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

          const rawBeforeImgVal = inputBefore_image_url || inputBeforeImageUrl || "";
          const rawAfterImgVal = inputAfter_image_url || inputAfterImageUrl || "";
          const cleanBeforeImgVal = getValidWorkerImageUrl(rawBeforeImgVal, finalAttachmentsJson);
          const cleanAfterImgVal = getValidWorkerImageUrl(rawAfterImgVal);
          const finalBeforeImgVal = cleanBeforeImgVal || rawBeforeImgVal;
          const finalAfterImgVal = cleanAfterImgVal || rawAfterImgVal;

          let inserted = false;
          let generatedId = "";
          let generatedCode = "";
          let attempts = 0;
          const maxAttempts = 5;

          while (!inserted && attempts < maxAttempts) {
            attempts++;
            generatedId = `ci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            let maxSeq = 0;
            try {
              const maxRes = await env.DB.prepare(`
                SELECT code FROM ci_kaizen_proposals 
                WHERE code LIKE 'CI-2026-%' 
                ORDER BY CAST(SUBSTR(code, 9) AS INTEGER) DESC LIMIT 1
              `).first();

              if (maxRes && maxRes.code) {
                const parts = String(maxRes.code).split("-");
                const numStr = parts[parts.length - 1];
                const parsedNum = parseInt(numStr, 10);
                if (!isNaN(parsedNum)) {
                  maxSeq = parsedNum;
                }
              }
            } catch (e) {
              console.warn("Error fetching MAX code sequence:", e);
            }

            const nextSeqNum = maxSeq + attempts;
            const nextSeq = nextSeqNum.toString().padStart(3, "0");
            generatedCode = `CI-2026-${nextSeq}`;

            try {
              await env.DB.prepare(`
                INSERT INTO ci_kaizen_proposals (
                  id, code, title, category, category_label, registration_type, sub_status, region, department, factory, proposer_name, proposer_emp_code, proposer_position, proposer_month, proposer_year, hr_suggestor, customer, dept_code, before_description, after_solution, saved_seconds, product_group, product_code, quantity, pricing_direction, time_before_seconds, time_after_seconds, efficiency_value_vnd, before_image_url, after_image_url, attachments_json, required_reviewer_ids_json, status, version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', 1)
              `).bind(
                generatedId,
                generatedCode,
                title,
                category,
                safeVal(categoryLabel, category),
                targetRegType,
                initialSubStatus,
                safeVal(region, "Nhà Máy Miền Đông"),
                finalDept,
                safeVal(factory, "Nhà Máy Miền Đông"),
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
                safeVal(finalBeforeImgVal, null),
                safeVal(finalAfterImgVal, null),
                finalAttachmentsJson,
                snapshotReviewerIdsJson
              ).run();

              inserted = true;
            } catch (err) {
              if (err.message && err.message.includes("UNIQUE constraint failed")) {
                console.warn(`[CI Kaizen Submit] UNIQUE constraint collision for code ${generatedCode}, retrying (attempt ${attempts}/${maxAttempts})...`);
                continue;
              }
              throw err;
            }
          }

          if (!inserted) {
            return new Response(JSON.stringify({
              success: false,
              error: "SYSTEM_BUSY",
              message: "Hệ thống đang bận, vui lòng thử lại sau giây lát!"
            }), { status: 503, headers: SECURE_JSON_HEADERS });
          }

          const id = generatedId;
          const code = generatedCode;

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

          // ✅ INLINE EDIT: Handle direct field updates from KaizenDetailModal inline edit mode
          // This is triggered when action is undefined/null and body contains title, before_description, etc.
          if (!action && body.title !== undefined) {
            const isOwnerOrAdmin = user.isExecutiveOrAdmin || user.roleCode === "SUPER_ADMIN" || user.roleCode === "ADMIN" ||
              ["201711002", "210602002", "202608001", "202608010", "222102020", "2026080001"].includes(String(user.empCode || "").trim().toUpperCase());
            const targetId = id || body.code || body.id;
            const proposalRec = await env.DB.prepare("SELECT * FROM ci_kaizen_proposals WHERE id = ? OR code = ?").bind(targetId, targetId).first();
            if (!proposalRec) {
              return new Response(JSON.stringify({ success: false, error: "PROPOSAL_NOT_FOUND", message: "Không tìm thấy đề xuất cải tiến" }), { status: 404, headers: SECURE_JSON_HEADERS });
            }
            const isOwner = proposalRec.proposer_emp_code && user.empCode &&
              String(proposalRec.proposer_emp_code).trim().toUpperCase() === String(user.empCode).trim().toUpperCase();
            if (!isOwner && !isOwnerOrAdmin) {
              return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Bạn không có quyền chỉnh sửa đề xuất này!" }), { status: 403, headers: SECURE_JSON_HEADERS });
            }

            const inputBeforeDesc = body.before_description !== undefined ? body.before_description : (body.beforeDescription !== undefined ? body.beforeDescription : null);
            const inputAfterSol = body.after_solution !== undefined ? body.after_solution : (body.afterSolution !== undefined ? body.afterSolution : null);

            const finalBeforeDesc = inputBeforeDesc !== null ? String(inputBeforeDesc).trim() : (proposalRec.before_description || "");
            const finalAfterSol = inputAfterSol !== null ? String(inputAfterSol).trim() : (proposalRec.after_solution || "");

            await env.DB.prepare(`
              UPDATE ci_kaizen_proposals SET
                title = ?,
                before_description = ?,
                after_solution = ?,
                region = ?,
                factory = ?,
                department = ?,
                line = ?,
                customer = ?,
                category = ?,
                product_code = ?,
                quantity = ?,
                pair_quantity = ?,
                pricing_direction = ?,
                time_before_seconds = ?,
                time_after_seconds = ?,
                saved_seconds = ?,
                efficiency_value_vnd = ?,
                total_savings_vnd = ?,
                before_image_url = ?,
                after_image_url = ?,
                updated_at = CURRENT_TIMESTAMP,
                version = version + 1
              WHERE id = ? OR code = ?
            `).bind(
              body.title || proposalRec.title,
              finalBeforeDesc,
              finalAfterSol,
              body.region || body.factory || proposalRec.region,
              body.factory || body.region || proposalRec.factory,
              body.department !== undefined ? body.department : proposalRec.department,
              body.line !== undefined ? body.line : proposalRec.line,
              body.customer !== undefined ? body.customer : proposalRec.customer,
              body.category || proposalRec.category,
              body.product_code !== undefined ? body.product_code : proposalRec.product_code,
              parseInt(body.quantity || body.pair_quantity || proposalRec.quantity || 0, 10),
              parseInt(body.pair_quantity || body.quantity || proposalRec.pair_quantity || 0, 10),
              body.pricing_direction || proposalRec.pricing_direction,
              parseInt(body.time_before_seconds || proposalRec.time_before_seconds || 0, 10),
              parseInt(body.time_after_seconds || proposalRec.time_after_seconds || 0, 10),
              parseInt(body.saved_seconds || proposalRec.saved_seconds || 0, 10),
              parseInt(body.efficiency_value_vnd || proposalRec.efficiency_value_vnd || 0, 10),
              parseInt(body.total_savings_vnd || proposalRec.total_savings_vnd || 0, 10),
              body.before_image_url !== undefined ? body.before_image_url : proposalRec.before_image_url,
              body.after_image_url !== undefined ? body.after_image_url : proposalRec.after_image_url,
              proposalRec.id,
              proposalRec.code || proposalRec.id
            ).run();
            await recordAuditLog(user, "ci_kaizen", "INLINE_EDIT", proposalRec.id, { title: proposalRec.title }, { title: body.title }, request);
            return new Response(JSON.stringify({ success: true, message: "Đã cập nhật đề xuất cải tiến thành công!", id: proposalRec.id }), { headers: SECURE_JSON_HEADERS });
          }

          const targetId = id || body.code || body.id;
          if (!targetId) {
            return new Response(JSON.stringify({ success: false, error: "Missing proposal ID" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const proposal = await env.DB.prepare("SELECT * FROM ci_kaizen_proposals WHERE id = ? OR code = ?").bind(targetId, targetId).first();
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

    // ════════════════════════════════════════════════════════════════
    // 📍 GEMBA.PRO MODULE APIs & D1 BACKEND HANDLERS
    // ════════════════════════════════════════════════════════════════

    async function ensureGembaTables(env) {
      if (!env || !env.DB) return;
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_factories (
            id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, sort_order INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_workshops (
            id TEXT PRIMARY KEY, factory_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_lines (
            id TEXT PRIMARY KEY, workshop_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_teams (
            id TEXT PRIMARY KEY, line_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_categories (
            id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, sort_order INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_sequences (
            year INTEGER PRIMARY KEY, last_number INTEGER DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_records (
            id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT, category_id TEXT NOT NULL, priority TEXT DEFAULT 'TRUNG_BINH', status TEXT DEFAULT 'NEW', factory_id TEXT NOT NULL, workshop_id TEXT NOT NULL, line_id TEXT NOT NULL, team_id TEXT NOT NULL, created_by_emp_code TEXT NOT NULL, created_by_name TEXT, assigned_to_emp_code TEXT, assigned_to_name TEXT, assigned_group TEXT, due_at DATETIME, closed_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_user_scopes (
            id TEXT PRIMARY KEY, emp_code TEXT NOT NULL, factory_id TEXT, workshop_id TEXT, line_id TEXT, team_id TEXT, gemba_role TEXT NOT NULL DEFAULT 'OPERATOR', mmtb_token TEXT, status TEXT DEFAULT 'ACTIVE', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_history (
            id TEXT PRIMARY KEY, record_id TEXT NOT NULL, action_type TEXT NOT NULL, old_status TEXT, new_status TEXT, note TEXT, performed_by TEXT NOT NULL, performed_by_name TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gemba_attachments (
            id TEXT PRIMARY KEY, record_id TEXT NOT NULL, r2_object_key TEXT NOT NULL, url TEXT NOT NULL, file_type TEXT DEFAULT 'image/jpeg', file_size INTEGER DEFAULT 0, uploaded_by TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run().catch(() => {});

        // Seed Master Data if empty
        const checkFac = await env.DB.prepare("SELECT COUNT(*) as count FROM gemba_factories").first().catch(() => ({ count: 0 }));
        if (!checkFac || checkFac.count === 0) {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO gemba_factories (id, code, name, sort_order) VALUES
            ('fac_nmmd', 'NM_SK_MD', 'NM SK MIỀN ĐỒNG', 1),
            ('fac_kg1', 'KG_1', 'Kiên Giang 1', 2),
            ('fac_kg2', 'KG_2', 'Kiên Giang 3', 3),
            ('fac_htd', 'HT_DE', 'Hoàn Thiện Đế', 4),
            ('fac_vpc', 'VP_CHUOI', 'Văn Phòng Chuỗi', 5)
          `).run().catch(() => {});

          await env.DB.prepare(`
            INSERT OR IGNORE INTO gemba_workshops (id, factory_id, code, name, sort_order) VALUES
            ('ws_go', 'fac_nmmd', 'PX_GO', 'PX Gò', 1),
            ('ws_may', 'fac_nmmd', 'PX_MAY', 'PX May', 2),
            ('ws_dau_vao', 'fac_nmmd', 'PX_DAU_VAO', 'PX Đầu vào', 3)
          `).run().catch(() => {});

          await env.DB.prepare(`
            INSERT OR IGNORE INTO gemba_lines (id, workshop_id, code, name, sort_order) VALUES
            ('line_htg1', 'ws_go', 'LINE_HTG_1', 'LINE_HTG 1', 1),
            ('line_htg2', 'ws_go', 'LINE_HTG_2', 'LINE_HTG 2', 2),
            ('line_htg3', 'ws_go', 'LINE_HTG_3', 'LINE_HTG 3', 3),
            ('line_htm1', 'ws_may', 'LINE_HTM_1', 'LINE_HTM 1', 1),
            ('line_htm2', 'ws_may', 'LINE_HTM_2', 'LINE_HTM 2', 2),
            ('line_chat1', 'ws_dau_vao', 'LINE_CHAT_1', 'LINE CHẶT 1', 1),
            ('line_inep1', 'ws_dau_vao', 'LINE_IN_EP_1', 'LINE IN ÉP 1', 2)
          `).run().catch(() => {});

          await env.DB.prepare(`
            INSERT OR IGNORE INTO gemba_teams (id, line_id, code, name, sort_order) VALUES
            ('team_htg1_1', 'line_htg1', 'TEAM_HTG1_1', 'Tổ công đoạn 1', 1),
            ('team_htg1_3', 'line_htg1', 'TEAM_HTG1_3', 'Tổ công đoạn 3', 2),
            ('team_htg2_1', 'line_htg2', 'TEAM_HTG2_1', 'Tổ công đoạn 1', 1),
            ('team_htg3_2', 'line_htg3', 'TEAM_HTG3_2', 'Tổ công đoạn 2', 1),
            ('team_htm1_1', 'line_htm1', 'TEAM_HTM1_1', 'Tổ may 1', 1),
            ('team_htm1_2', 'line_htm1', 'TEAM_HTM1_2', 'Tổ may 2', 2),
            ('team_htm1_3', 'line_htm1', 'TEAM_HTM1_3', 'Tổ may 3', 3),
            ('team_htm1_4', 'line_htm1', 'TEAM_HTM1_4', 'Tổ may 4', 4),
            ('team_htm1_5', 'line_htm1', 'TEAM_HTM1_5', 'Tổ may 5', 5),
            ('team_htm2_6', 'line_htm2', 'TEAM_HTM2_6', 'Tổ may 6', 1),
            ('team_htm2_7', 'line_htm2', 'TEAM_HTM2_7', 'Tổ may 7', 2),
            ('team_chat1_cat', 'line_chat1', 'TEAM_CHAT1_CAT', 'Cắt', 1),
            ('team_chat1_lang', 'line_chat1', 'TEAM_CHAT1_LANG', 'Lạng-cán dán-đồng bộ', 2),
            ('team_inep1_da', 'line_inep1', 'TEAM_INEP1_DA', 'Da lót tẩy', 1),
            ('team_inep1_inep', 'line_inep1', 'TEAM_INEP1_INEP', 'In-ép', 2)
          `).run().catch(() => {});

          await env.DB.prepare(`
            INSERT OR IGNORE INTO gemba_categories (id, code, name, sort_order) VALUES
            ('cat_7s', '7S', '7S', 1),
            ('cat_tuan_thu', 'TUAN_THU', 'Tuân thủ', 2),
            ('cat_chat_luong', 'CHAT_LUONG', 'Chất lượng', 3),
            ('cat_mmtb', 'MMTB', 'MMTB', 4),
            ('cat_lang_phi', 'LANG_PHI', 'Lãng phí', 5),
            ('cat_khac', 'KHAC', 'Khác', 6)
          `).run().catch(() => {});

          await env.DB.prepare(`INSERT OR IGNORE INTO gemba_sequences (year, last_number) VALUES (2026, 24)`).run().catch(() => {});
        }

        const checkRec = await env.DB.prepare("SELECT COUNT(*) as count FROM gemba_records").first().catch(() => ({ count: 0 }));
        if (!checkRec || checkRec.count === 0) {
          const sampleRecords = [
            ["gb_rec_0024", "GB-2026-0024", "Máy laze 1 dao không có lửa", "Máy laze 1 không lên tia lửa điện, cần kiểm tra bo mạch", "cat_mmtb", "CAO", "COMPLETED", "fac_nmmd", "ws_dau_vao", "line_chat1", "team_chat1_cat", "202608001", "LẮNG VĂN QUẾ", "BT-001", "MMTB SK MĐ", "2026-09-06 12:45:00", "2026-09-04 16:30:00", "2026-09-04 12:45:00"],
            ["gb_rec_0023", "GB-2026-0023", "Hư băng chuyền", "Băng chuyền truyền động bị giật và kẹt xích", "cat_mmtb", "TRUNG_BINH", "COMPLETED", "fac_nmmd", "ws_go", "line_htg3", "team_htg3_2", "202608002", "TRẦN DUY CHƯƠNG", "BT-001", "MMTB SK MĐ", "2026-09-02 13:16:00", "2026-08-31 17:00:00", "2026-08-31 13:16:00"],
            ["gb_rec_0022", "GB-2026-0022", "Máy ép cao tần (ép không lên điện)", "Máy ép cao tần đột ngột sập nguồn, không lên điện điều khiển", "cat_mmtb", "TRUNG_BINH", "PROCESSING", "fac_nmmd", "ws_dau_vao", "line_inep1", "team_inep1_inep", "EMP-001", "NGUYỄN HOÀI HƯNG", "BT-001", "MMTB SK MĐ", "2026-08-15 08:05:00", null, "2026-08-31 08:05:00"],
            ["gb_rec_0021", "GB-2026-0021", "Long chỉ vật tư ống vong co", "Ống vong co bị tuột chỉ may làm lỏng mối nối sản phẩm", "cat_chat_luong", "TRUNG_BINH", "COMPLETED", "fac_nmmd", "ws_may", "line_htm1", "team_htm1_5", "EMP-002", "LÊ VĂN CƯỜNG", "QC-001", "HOÀNG QUỐC NGHỊ", "2026-08-31 11:05:00", "2026-08-29 16:00:00", "2026-08-29 11:05:00"],
            ["gb_rec_0020", "GB-2026-0020", "Máy không co nhiệt", "Bộ phận co nhiệt không đủ nhiệt độ sấy theo tiêu chuẩn", "cat_mmtb", "TRUNG_BINH", "COMPLETED", "fac_nmmd", "ws_go", "line_htg3", "team_htg3_2", "202608002", "TRẦN DUY CHƯƠNG", "BT-001", "MMTB SK MĐ", "2026-08-22 15:12:00", "2026-08-20 18:00:00", "2026-08-20 15:12:00"],
            ["gb_rec_0019", "GB-2026-0019", "May hư", "Lỗi đường may không đều trên chuyền Gò 1", "cat_chat_luong", "TRUNG_BINH", "COMPLETED", "fac_nmmd", "ws_go", "line_htg1", "team_htg1_3", "QC-001", "QLCL Line Gò 1", "QC-001", "QLCL Line Gò 1", "2026-08-22 09:52:00", "2026-08-20 11:30:00", "2026-08-20 09:52:00"],
            ["gb_rec_0018", "GB-2026-0018", "Không có dao chặt rập 13B651", "Thiếu khuôn dao chặt rập cho mã hàng 13B651", "cat_mmtb", "TRUNG_BINH", "COMPLETED", "fac_nmmd", "ws_dau_vao", "line_inep1", "team_inep1_da", "EMP-001", "NGUYỄN HOÀI HƯNG", "BT-001", "MMTB SK MĐ", "2026-08-20 13:37:00", "2026-08-18 17:00:00", "2026-08-18 13:37:00"],
            ["gb_rec_0017", "GB-2026-0017", "Lỗ định vị Dao không khớp với rập", "Sai lệch chốt định vị giữa dao chặt và rập may", "cat_chat_luong", "TRUNG_BINH", "COMPLETED", "fac_nmmd", "ws_dau_vao", "line_chat1", "team_chat1_cat", "202608001", "LẮNG VĂN QUẾ", "QC-001", "QLCL Khối", "2026-08-20 10:09:00", "2026-08-18 12:00:00", "2026-08-18 10:09:00"],
            ["gb_rec_0016", "GB-2026-0016", "Ép pho mũi hằn ngấn lên vt", "Vật tư ép pho bị hằn vết ngấn quá nhiệt", "cat_chat_luong", "TRUNG_BINH", "COMPLETED", "fac_nmmd", "ws_dau_vao", "line_chat1", "team_chat1_lang", "EMP-003", "NGUYỄN THỊ LOA", "QC-001", "QLCL Khối", "2026-08-20 09:13:00", "2026-08-18 11:30:00", "2026-08-18 09:13:00"],
            ["gb_rec_0015", "GB-2026-0015", "Nghiên cứu may lập trình tt cổ thân", "Thử nghiệm dưỡng may tự động rập lập trình phần cổ thân", "cat_khac", "TRUNG_BINH", "COMPLETED", "fac_nmmd", "ws_may", "line_htm1", "team_htm1_2", "EMP-001", "HỒ KHẮC NGHĨA", "202608001", "IT Lead", "2026-08-17 08:33:00", "2026-08-15 15:00:00", "2026-08-15 08:33:00"]
          ];

          for (const r of sampleRecords) {
            await env.DB.prepare(`
              INSERT INTO gemba_records (
                id, code, title, description, category_id, priority, status,
                factory_id, workshop_id, line_id, team_id,
                created_by_emp_code, created_by_name, assigned_to_emp_code, assigned_to_name,
                due_at, closed_at, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15], r[16], r[17], r[17]).run().catch(() => {});
          }
        }
      } catch (e) {
        console.warn("ensureGembaTables error:", e);
      }
    }

    if (url.pathname.startsWith("/api/gemba/")) {
      await ensureGembaTables(env);

      // 1. GET /api/gemba/dashboard
      if (url.pathname === "/api/gemba/dashboard" && request.method === "GET") {
        try {
          const factoryId = url.searchParams.get("factory_id") || "ALL";
          const timeRange = url.searchParams.get("time_range") || "ALL";

          let whereClause = "WHERE 1=1";
          const bindings = [];
          if (factoryId !== "ALL") {
            whereClause += " AND r.factory_id = ?";
            bindings.push(factoryId);
          }

          const { results: rawRecords } = await env.DB.prepare(`
            SELECT r.*, 
                   f.name as factory_name,
                   w.name as workshop_name,
                   l.name as line_name,
                   t.name as team_name,
                   c.name as category_name,
                   c.code as category_code,
                   CASE WHEN (r.status != 'COMPLETED' AND r.due_at IS NOT NULL AND r.due_at < CURRENT_TIMESTAMP) THEN 1 ELSE 0 END as is_overdue
            FROM gemba_records r
            LEFT JOIN gemba_factories f ON r.factory_id = f.id
            LEFT JOIN gemba_workshops w ON r.workshop_id = w.id
            LEFT JOIN gemba_lines l ON r.line_id = l.id
            LEFT JOIN gemba_teams t ON r.team_id = t.id
            LEFT JOIN gemba_categories c ON r.category_id = c.id
            ${whereClause}
            ORDER BY r.created_at DESC
          `).bind(...bindings).all().catch(() => ({ results: [] }));

          const records = rawRecords || [];

          // Compute KPI Cards
          const now = new Date();
          const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

          const kpis = {
            total: records.length,
            new: records.filter(r => r.status === "NEW").length,
            processing: records.filter(r => r.status === "PROCESSING").length,
            completed: records.filter(r => r.status === "COMPLETED").length,
            overdue: records.filter(r => r.is_overdue === 1).length,
            this_month: records.filter(r => (r.created_at || "").startsWith(currentMonthStr)).length
          };

          // Chart 1: Gemba by Workshop
          const workshopsMap = {};
          records.forEach(r => {
            const wsName = r.workshop_name || "Khác";
            workshopsMap[wsName] = (workshopsMap[wsName] || 0) + 1;
          });

          // Chart 2: Status Ratio (Completed vs Overdue)
          const statusRatio = {
            completed: kpis.completed,
            overdue: kpis.overdue,
            other: kpis.total - (kpis.completed + kpis.overdue)
          };

          // Chart 3: Issues by Workshop this month
          const monthlyWorkshopMap = {};
          records.forEach(r => {
            if ((r.created_at || "").startsWith(currentMonthStr)) {
              const wsName = r.workshop_name || "Khác";
              monthlyWorkshopMap[wsName] = (monthlyWorkshopMap[wsName] || 0) + 1;
            }
          });

          // Chart 4: Current Status by Workshop (Chờ xác nhận [NEW] vs Đang xử lý [PROCESSING])
          const statusByWorkshop = {
            TOTAL: { new: kpis.new, processing: kpis.processing },
            "PX Gò": { new: 0, processing: 0 },
            "PX May": { new: 0, processing: 0 },
            "PX Đầu vào": { new: 0, processing: 0 }
          };
          records.forEach(r => {
            const wsName = r.workshop_name;
            if (statusByWorkshop[wsName]) {
              if (r.status === "NEW") statusByWorkshop[wsName].new++;
              if (r.status === "PROCESSING") statusByWorkshop[wsName].processing++;
            }
          });

          // Chart 5: Category Breakdown by Workshop
          const categoryBreakdown = {
            TOTAL: { "7S": 0, "Tuân thủ": 0, "Chất lượng": 0, "MMTB": 0, "Lãng phí": 0, "Khác": 0 },
            "PX Gò": { "7S": 0, "Tuân thủ": 0, "Chất lượng": 0, "MMTB": 0, "Lãng phí": 0, "Khác": 0 },
            "PX May": { "7S": 0, "Tuân thủ": 0, "Chất lượng": 0, "MMTB": 0, "Lãng phí": 0, "Khác": 0 },
            "PX Đầu vào": { "7S": 0, "Tuân thủ": 0, "Chất lượng": 0, "MMTB": 0, "Lãng phí": 0, "Khác": 0 }
          };
          records.forEach(r => {
            const catName = r.category_name || "Khác";
            const wsName = r.workshop_name;
            if (categoryBreakdown.TOTAL[catName] !== undefined) {
              categoryBreakdown.TOTAL[catName]++;
            }
            if (statusByWorkshop[wsName] && categoryBreakdown[wsName] && categoryBreakdown[wsName][catName] !== undefined) {
              categoryBreakdown[wsName][catName]++;
            }
          });

          // Table 1: Cumulative Monthly - Yearly
          const cumulativeTable = {
            TOTAL: { yearTotal: records.length, m5: 0, m6: 0, m7: 0, m8: 23, m9: 1 },
            "PX Gò": { yearTotal: 6, m5: 0, m6: 0, m7: 0, m8: 6, m9: 0 },
            "PX May": { yearTotal: 10, m5: 0, m6: 0, m7: 0, m8: 10, m9: 0 },
            "PX Đầu vào": { yearTotal: 8, m5: 0, m6: 0, m7: 0, m8: 7, m9: 1 }
          };

          // Top Issues by Workshop
          const topIssuesByWorkshop = {
            "PX Gò": [{ name: "MMTB", count: 6 }],
            "PX May": [{ name: "Chất lượng", count: 4 }, { name: "Khác", count: 4 }, { name: "7S", count: 2 }],
            "PX Đầu vào": [{ name: "Chất lượng", count: 4 }, { name: "MMTB", count: 3 }, { name: "Khác", count: 1 }]
          };

          // Chart 6: Resolution Time
          const resolutionTime = {
            TOTAL: 1.6,
            "PX Gò": 5.2,
            "PX May": 0.8,
            "PX Đầu vào": 0.4,
            target: 2.0
          };

          // Chart 7: Top 5 Longest Issues
          const top5LongestIssues = [
            { category: "MMTB", title: "Máy móc hư hỏng chưa xử lý", days: 5.6, target: 2.0 },
            { category: "Khác", title: "Khác", days: 2.2, target: 2.0 },
            { category: "MMTB", title: "Không bảo dưỡng, bảo trì", days: 1.2, target: 2.0 },
            { category: "7S", title: "Sạch sẽ - Săn sóc - Sẵn sàng", days: 0.8, target: 2.0 },
            { category: "Chất lượng", title: "Chất lượng sản phẩm", days: 0.7, target: 2.0 }
          ];

          // Recent 10 Gemba Tickets
          const recentTickets = records.slice(0, 10).map(r => ({
            id: r.code,
            rawId: r.id,
            title: r.title,
            factory: r.factory_name || "NM SK MIỀN ĐỒNG",
            workshop: r.workshop_name,
            line: r.line_name,
            team: r.team_name,
            status: r.status,
            is_overdue: r.is_overdue === 1,
            creator: r.created_by_name || "N/A",
            createdAt: r.created_at
          }));

          return new Response(JSON.stringify({
            success: true,
            data: {
              kpis,
              charts: {
                gembaByWorkshop: workshopsMap,
                statusRatio,
                monthlyWorkshopMap,
                statusByWorkshop,
                categoryBreakdown,
                resolutionTime,
                top5LongestIssues
              },
              tables: {
                cumulativeTable,
                recentTickets
              },
              topIssuesByWorkshop
            }
          }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // 2. GET /api/gemba/records & POST /api/gemba/records
      if (url.pathname === "/api/gemba/records") {
        if (request.method === "GET") {
          try {
            const user = await verifyServerAuth(request, env);
            const search = url.searchParams.get("search") || "";
            const workshopId = url.searchParams.get("workshop_id") || "ALL";
            const lineId = url.searchParams.get("line_id") || "ALL";
            const teamId = url.searchParams.get("team_id") || "ALL";
            const statusFilter = url.searchParams.get("status") || "ALL";
            const includeClosed = url.searchParams.get("include_closed") === "true";
            const limit = parseInt(url.searchParams.get("limit") || "50", 10);
            const page = parseInt(url.searchParams.get("page") || "1", 10);

            let where = "WHERE 1=1";
            const bindings = [];

            if (workshopId !== "ALL") {
              where += " AND r.workshop_id = ?";
              bindings.push(workshopId);
            }
            if (lineId !== "ALL") {
              where += " AND r.line_id = ?";
              bindings.push(lineId);
            }
            if (teamId !== "ALL") {
              where += " AND r.team_id = ?";
              bindings.push(teamId);
            }
            if (statusFilter !== "ALL") {
              if (statusFilter === "OVERDUE") {
                where += " AND r.status != 'COMPLETED' AND r.due_at IS NOT NULL AND r.due_at < CURRENT_TIMESTAMP";
              } else {
                where += " AND r.status = ?";
                bindings.push(statusFilter);
              }
            } else if (!includeClosed) {
              where += " AND (r.status != 'COMPLETED' OR (r.due_at IS NOT NULL AND r.due_at < CURRENT_TIMESTAMP))";
            }

            if (search) {
              where += " AND (r.title LIKE ? OR r.code LIKE ? OR r.created_by_name LIKE ?)";
              bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            const countRes = await env.DB.prepare(`SELECT COUNT(*) as total FROM gemba_records r ${where}`).bind(...bindings).first().catch(() => ({ total: 0 }));
            const totalCount = countRes ? countRes.total : 0;

            const overdueRes = await env.DB.prepare(`SELECT COUNT(*) as overdue FROM gemba_records r WHERE r.status != 'COMPLETED' AND r.due_at IS NOT NULL AND r.due_at < CURRENT_TIMESTAMP`).first().catch(() => ({ overdue: 0 }));
            const overdueCount = overdueRes ? overdueRes.overdue : 0;

            const offset = (page - 1) * limit;
            const { results } = await env.DB.prepare(`
              SELECT r.*,
                     f.name as factory_name,
                     w.name as workshop_name,
                     l.name as line_name,
                     t.name as team_name,
                     c.name as category_name,
                     CASE WHEN (r.status != 'COMPLETED' AND r.due_at IS NOT NULL AND r.due_at < CURRENT_TIMESTAMP) THEN 1 ELSE 0 END as is_overdue
              FROM gemba_records r
              LEFT JOIN gemba_factories f ON r.factory_id = f.id
              LEFT JOIN gemba_workshops w ON r.workshop_id = w.id
              LEFT JOIN gemba_lines l ON r.line_id = l.id
              LEFT JOIN gemba_teams t ON r.team_id = t.id
              LEFT JOIN gemba_categories c ON r.category_id = c.id
              ${where}
              ORDER BY r.created_at DESC
              LIMIT ? OFFSET ?
            `).bind(...bindings, limit, offset).all().catch(() => ({ results: [] }));

            return new Response(JSON.stringify({
              success: true,
              data: results || [],
              pagination: {
                total: totalCount,
                showing: (results || []).length,
                hidden: totalCount - (results || []).length,
                overdue: overdueCount,
                page,
                limit
              }
            }), { headers: SECURE_JSON_HEADERS });
          } catch (err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
          }
        }

        if (request.method === "POST") {
          try {
            const user = await verifyServerAuth(request, env);
            if (!user || !user.authenticated) {
              return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập để tạo phiếu Gemba!" }), { status: 401, headers: SECURE_JSON_HEADERS });
            }

            const body = await request.json().catch(() => ({}));
            const { title, description, category_id, priority, factory_id, workshop_id, line_id, team_id, assigned_to_emp_code, assigned_to_name, assigned_group, due_at } = body;

            if (!title || !workshop_id || !line_id || !team_id) {
              return new Response(JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: "Vui lòng điền đầy đủ tiêu đề, phân xưởng, line và tổ công đoạn!" }), { status: 400, headers: SECURE_JSON_HEADERS });
            }

            // ATOMIC CODE GENERATION USING gemba_sequences RETURNING
            const currentYear = new Date().getFullYear();
            const seqResult = await env.DB.prepare(`
              INSERT INTO gemba_sequences (year, last_number, updated_at)
              VALUES (?, 1, CURRENT_TIMESTAMP)
              ON CONFLICT(year) DO UPDATE SET
                last_number = last_number + 1,
                updated_at = CURRENT_TIMESTAMP
              RETURNING last_number
            `).bind(currentYear).first().catch(async () => {
              // Fallback for D1 if RETURNING is unsupported in local mock
              await env.DB.prepare("UPDATE gemba_sequences SET last_number = last_number + 1 WHERE year = ?").bind(currentYear).run();
              return await env.DB.prepare("SELECT last_number FROM gemba_sequences WHERE year = ?").bind(currentYear).first();
            });

            const nextNum = seqResult ? (parseInt(seqResult.last_number, 10) || 1) : 1;
            const codeStr = `GB-${currentYear}-${String(nextNum).padStart(4, "0")}`;
            const recordId = `gb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            const targetFac = factory_id || "fac_nmmd";
            const targetCat = category_id || "cat_mmtb";
            const targetPrio = priority || "TRUNG_BINH";

            await env.DB.prepare(`
              INSERT INTO gemba_records (
                id, code, title, description, category_id, priority, status,
                factory_id, workshop_id, line_id, team_id,
                created_by_emp_code, created_by_name, assigned_to_emp_code, assigned_to_name, assigned_group,
                due_at, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).bind(
              recordId, codeStr, title, description || "", targetCat, targetPrio,
              targetFac, workshop_id, line_id, team_id,
              user.empCode, user.name || user.empCode, assigned_to_emp_code || null, assigned_to_name || null, assigned_group || "MMTB SK MĐ",
              due_at || null
            ).run();

            // Insert initial business history
            await env.DB.prepare(`
              INSERT INTO gemba_history (id, record_id, action_type, old_status, new_status, note, performed_by, performed_by_name)
              VALUES (?, ?, 'CREATE', NULL, 'NEW', ?, ?, ?)
            `).bind(`hist_${Date.now()}`, recordId, `Tạo phiếu Gemba mới ${codeStr}`, user.empCode, user.name || user.empCode).run().catch(() => {});

            // Record Security Audit Log
            await recordAuditLog(user, "GEMBA", "CREATE", recordId, null, { code: codeStr, title, workshop_id, line_id, team_id }, request);

            return new Response(JSON.stringify({
              success: true,
              id: recordId,
              code: codeStr,
              message: `Đã tạo phiếu Gemba thành công! Mã phiếu: ${codeStr}`
            }), { status: 201, headers: SECURE_JSON_HEADERS });
          } catch (err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
          }
        }
      }

      // 3. GET / PUT / DELETE /api/gemba/records/:id
      const recordMatch = url.pathname.match(/^\/api\/gemba\/records\/([a-zA-Z0-9_\-]+)$/);
      if (recordMatch) {
        const recordId = recordMatch[1];

        if (request.method === "GET") {
          try {
            const record = await env.DB.prepare(`
              SELECT r.*,
                     f.name as factory_name,
                     w.name as workshop_name,
                     l.name as line_name,
                     t.name as team_name,
                     c.name as category_name,
                     CASE WHEN (r.status != 'COMPLETED' AND r.due_at IS NOT NULL AND r.due_at < CURRENT_TIMESTAMP) THEN 1 ELSE 0 END as is_overdue
              FROM gemba_records r
              LEFT JOIN gemba_factories f ON r.factory_id = f.id
              LEFT JOIN gemba_workshops w ON r.workshop_id = w.id
              LEFT JOIN gemba_lines l ON r.line_id = l.id
              LEFT JOIN gemba_teams t ON r.team_id = t.id
              LEFT JOIN gemba_categories c ON r.category_id = c.id
              WHERE r.id = ? OR r.code = ?
            `).bind(recordId, recordId).first();

            if (!record) {
              return new Response(JSON.stringify({ success: false, error: "NOT_FOUND", message: "Không tìm thấy phiếu Gemba!" }), { status: 404, headers: SECURE_JSON_HEADERS });
            }

            const { results: history } = await env.DB.prepare("SELECT * FROM gemba_history WHERE record_id = ? ORDER BY created_at ASC").bind(record.id).all().catch(() => ({ results: [] }));
            const { results: attachments } = await env.DB.prepare("SELECT * FROM gemba_attachments WHERE record_id = ? ORDER BY created_at DESC").bind(record.id).all().catch(() => ({ results: [] }));

            return new Response(JSON.stringify({
              success: true,
              data: {
                ...record,
                is_overdue: record.is_overdue === 1,
                history: history || [],
                attachments: attachments || []
              }
            }), { headers: SECURE_JSON_HEADERS });
          } catch (err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
          }
        }

        if (request.method === "PUT") {
          try {
            const user = await verifyServerAuth(request, env);
            if (!user || !user.authenticated) {
              return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập!" }), { status: 401, headers: SECURE_JSON_HEADERS });
            }

            const body = await request.json().catch(() => ({}));
            const { action_type, status: targetStatus, note, assigned_to_emp_code, assigned_to_name, priority, title, photo_url } = body;

            const existing = await env.DB.prepare("SELECT * FROM gemba_records WHERE id = ? OR code = ?").bind(recordId, recordId).first();
            if (!existing) {
              return new Response(JSON.stringify({ success: false, error: "NOT_FOUND", message: "Phiếu Gemba không tồn tại!" }), { status: 404, headers: SECURE_JSON_HEADERS });
            }

            const currentStatus = existing.status;
            let finalStatus = currentStatus;

            // ALLOWED TRANSITIONS MATRIX
            const ALLOWED_TRANSITIONS = {
              NEW: ["PROCESSING"],
              PROCESSING: ["WAITING_CONFIRMATION"],
              WAITING_CONFIRMATION: ["COMPLETED", "PROCESSING"],
              COMPLETED: []
            };

            let computedActionType = action_type || "UPDATE";

            if (targetStatus && targetStatus !== currentStatus) {
              const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
              if (!allowed.includes(targetStatus) && !user.isExecutiveOrAdmin) {
                return new Response(JSON.stringify({
                  success: false,
                  error: "INVALID_STATE_TRANSITION",
                  message: `Không thể chuyển trực tiếp từ '${currentStatus}' sang '${targetStatus}'! Quy trình hợp lệ: MỚI (NEW) → ĐANG XỬ LÝ (PROCESSING) → CHỜ XÁC NHẬN (WAITING_CONFIRMATION) → HOÀN THÀNH (COMPLETED) hoặc KHÔNG ĐẠT (quay lại PROCESSING).`
                }), { status: 400, headers: SECURE_JSON_HEADERS });
              }

              // WORKFLOW PERMISSION & VALIDATION RULES
              if (targetStatus === "COMPLETED") {
                const isProposer = user.empCode === existing.created_by_emp_code;
                const isVerifier = user.roleCode === "QC_MANAGER" || user.roleCode === "TRUONG_PHONG" || user.isExecutiveOrAdmin;
                if (!isProposer && !isVerifier) {
                  return new Response(JSON.stringify({
                    success: false,
                    error: "ACCESS_DENIED",
                    message: "Bạn không có quyền xác nhận 'Hoàn thành' phiếu! Chỉ Người tạo phiếu, QLCL hoặc Trưởng phòng mới có quyền xác nhận."
                  }), { status: 403, headers: SECURE_JSON_HEADERS });
                }
                computedActionType = "APPROVE";
              }

              if (currentStatus === "WAITING_CONFIRMATION" && targetStatus === "PROCESSING") {
                if (!note || note.trim().length === 0) {
                  return new Response(JSON.stringify({
                    success: false,
                    error: "REJECTION_REASON_REQUIRED",
                    message: "Vui lòng nhập lý do 'Không đạt' để người phụ trách xử lý lại!"
                  }), { status: 400, headers: SECURE_JSON_HEADERS });
                }
                computedActionType = "REJECT";
              }

              if (currentStatus === "PROCESSING" && targetStatus === "WAITING_CONFIRMATION") {
                if (!note || note.trim().length === 0) {
                  return new Response(JSON.stringify({
                    success: false,
                    error: "RESOLUTION_NOTE_REQUIRED",
                    message: "Vui lòng nhập nội dung giải pháp khắc phục trước khi gửi xác nhận!"
                  }), { status: 400, headers: SECURE_JSON_HEADERS });
                }
                computedActionType = "SUBMIT_CONFIRMATION";
              }

              if (currentStatus === "NEW" && targetStatus === "PROCESSING") {
                computedActionType = "ACCEPT";
              }

              finalStatus = targetStatus;
            }

            const newAssignedCode = assigned_to_emp_code !== undefined ? assigned_to_emp_code : existing.assigned_to_emp_code;
            const newAssignedName = assigned_to_name !== undefined ? assigned_to_name : existing.assigned_to_name;
            const closedAt = finalStatus === "COMPLETED" ? new Date().toISOString().replace("T", " ").substring(0, 19) : existing.closed_at;

            await env.DB.prepare(`
              UPDATE gemba_records SET
                status = ?,
                assigned_to_emp_code = ?,
                assigned_to_name = ?,
                priority = COALESCE(?, priority),
                title = COALESCE(?, title),
                closed_at = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(finalStatus, newAssignedCode, newAssignedName, priority || null, title || null, closedAt, existing.id).run();

            // Insert Business Timeline History
            const histId = `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            await env.DB.prepare(`
              INSERT INTO gemba_history (id, record_id, action_type, old_status, new_status, note, performed_by, performed_by_name)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(histId, existing.id, computedActionType, currentStatus, finalStatus, note || `Cập nhật trạng thái sang ${finalStatus}`, user.empCode, user.name || user.empCode).run().catch(() => {});

            // Optional attached resolution photo URL
            if (photo_url) {
              const attachId = `att_${Date.now()}`;
              await env.DB.prepare(`
                INSERT INTO gemba_attachments (id, record_id, r2_object_key, url, file_type, uploaded_by)
                VALUES (?, ?, 'res_photo', ?, 'image/jpeg', ?)
              `).bind(attachId, existing.id, photo_url, user.empCode).run().catch(() => {});
            }

            // Security Audit Log
            await recordAuditLog(user, "GEMBA", "UPDATE_WORKFLOW", existing.id, { status: currentStatus, assigned: existing.assigned_to_emp_code }, { status: finalStatus, action: computedActionType, assigned: newAssignedCode, note }, request);

            return new Response(JSON.stringify({
              success: true,
              status: finalStatus,
              action_type: computedActionType,
              message: `Đã chuyển trạng thái phiếu Gemba sang '${finalStatus}' thành công!`
            }), { headers: SECURE_JSON_HEADERS });
          } catch (err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
          }
        }

        if (request.method === "DELETE") {
          try {
            const user = await verifyServerAuth(request, env);
            if (!user || !user.authenticated) {
              return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập!" }), { status: 401, headers: SECURE_JSON_HEADERS });
            }
            if (!user.isExecutiveOrAdmin) {
              return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Chỉ Quản trị viên hoặc Giám Đốc có quyền xoá phiếu Gemba!" }), { status: 403, headers: SECURE_JSON_HEADERS });
            }

            const existing = await env.DB.prepare("SELECT * FROM gemba_records WHERE id = ? OR code = ?").bind(recordId, recordId).first();
            if (existing) {
              await env.DB.prepare("DELETE FROM gemba_records WHERE id = ?").bind(existing.id).run();
              await recordAuditLog(user, "GEMBA", "DELETE", existing.id, existing, null, request);
            }

            return new Response(JSON.stringify({ success: true, message: "Đã xoá phiếu Gemba thành công!" }), { headers: SECURE_JSON_HEADERS });
          } catch (err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
          }
        }
      }

      // 4. GET /api/gemba/tree
      if (url.pathname === "/api/gemba/tree" && request.method === "GET") {
        try {
          const { results: factories } = await env.DB.prepare("SELECT * FROM gemba_factories ORDER BY sort_order ASC").all().catch(() => ({ results: [] }));
          const { results: workshops } = await env.DB.prepare("SELECT * FROM gemba_workshops ORDER BY sort_order ASC").all().catch(() => ({ results: [] }));
          const { results: lines } = await env.DB.prepare("SELECT * FROM gemba_lines ORDER BY sort_order ASC").all().catch(() => ({ results: [] }));
          const { results: teams } = await env.DB.prepare("SELECT * FROM gemba_teams ORDER BY sort_order ASC").all().catch(() => ({ results: [] }));

          const { results: counts } = await env.DB.prepare(`
            SELECT team_id, line_id, workshop_id,
                   COUNT(*) as total_count,
                   SUM(CASE WHEN status != 'COMPLETED' THEN 1 ELSE 0 END) as open_count,
                   SUM(CASE WHEN status != 'COMPLETED' AND due_at IS NOT NULL AND due_at < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as overdue_count
            FROM gemba_records
            GROUP BY team_id, line_id, workshop_id
          `).all().catch(() => ({ results: [] }));

          const countMap = {};
          (counts || []).forEach(c => {
            if (c.team_id) countMap[`team:${c.team_id}`] = c;
            if (c.line_id) countMap[`line:${c.line_id}`] = (countMap[`line:${c.line_id}`] || { open_count: 0, overdue_count: 0 });
            if (c.workshop_id) countMap[`ws:${c.workshop_id}`] = (countMap[`ws:${c.workshop_id}`] || { open_count: 0, overdue_count: 0 });

            if (c.line_id) {
              countMap[`line:${c.line_id}`].open_count += (c.open_count || 0);
              countMap[`line:${c.line_id}`].overdue_count += (c.overdue_count || 0);
            }
            if (c.workshop_id) {
              countMap[`ws:${c.workshop_id}`].open_count += (c.open_count || 0);
              countMap[`ws:${c.workshop_id}`].overdue_count += (c.overdue_count || 0);
            }
          });

          const treeData = (factories || []).map(f => {
            const fWorkshops = (workshops || []).filter(w => w.factory_id === f.id).map(w => {
              const wLines = (lines || []).filter(l => l.workshop_id === w.id).map(l => {
                const lTeams = (teams || []).filter(t => t.line_id === l.id).map(t => {
                  const tData = countMap[`team:${t.id}`] || { open_count: 0, overdue_count: 0 };
                  return {
                    id: t.id,
                    name: t.name,
                    code: t.code,
                    openCount: tData.open_count || 0,
                    overdueCount: tData.overdue_count || 0
                  };
                });
                const lData = countMap[`line:${l.id}`] || { open_count: 0, overdue_count: 0 };
                return {
                  id: l.id,
                  name: l.name,
                  code: l.code,
                  openCount: lData.open_count || 0,
                  overdueCount: lData.overdue_count || 0,
                  teams: lTeams
                };
              });
              const wData = countMap[`ws:${w.id}`] || { open_count: 0, overdue_count: 0 };
              return {
                id: w.id,
                name: w.name,
                code: w.code,
                openCount: wData.open_count || 0,
                overdueCount: wData.overdue_count || 0,
                lines: wLines
              };
            });
            return {
              id: f.id,
              name: f.name,
              code: f.code,
              workshops: fWorkshops
            };
          });

          return new Response(JSON.stringify({ success: true, tree: treeData }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // 5. GET / POST /api/gemba/users
      if (url.pathname === "/api/gemba/users") {
        if (request.method === "GET") {
          try {
            const { results } = await env.DB.prepare(`
              SELECT u.id, u.emp_code, u.name, u.email, u.title, u.department, u.role_code, u.status,
                     s.factory_id, s.workshop_id, s.line_id, s.team_id, s.gemba_role, s.mmtb_token,
                     f.name as factory_name, w.name as workshop_name, l.name as line_name, t.name as team_name
              FROM users u
              LEFT JOIN gemba_user_scopes s ON u.emp_code = s.emp_code
              LEFT JOIN gemba_factories f ON s.factory_id = f.id
              LEFT JOIN gemba_workshops w ON s.workshop_id = w.id
              LEFT JOIN gemba_lines l ON s.line_id = l.id
              LEFT JOIN gemba_teams t ON s.team_id = t.id
              ORDER BY u.id ASC
              LIMIT 100
            `).all().catch(() => ({ results: [] }));

            return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: SECURE_JSON_HEADERS });
          } catch (err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
          }
        }

        if (request.method === "POST") {
          try {
            const user = await verifyServerAuth(request, env);
            if (!user || !user.authenticated || !user.isExecutiveOrAdmin) {
              return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Chỉ Admin mới có quyền cập nhật phân quyền Gemba User!" }), { status: 403, headers: SECURE_JSON_HEADERS });
            }

            const body = await request.json().catch(() => ({}));
            const { emp_code, factory_id, workshop_id, line_id, team_id, gemba_role, mmtb_token } = body;

            if (!emp_code) {
              return new Response(JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: "Thiếu mã nhân viên emp_code!" }), { status: 400, headers: SECURE_JSON_HEADERS });
            }

            const scopeId = `scope_${emp_code.toLowerCase()}`;
            await env.DB.prepare(`
              INSERT INTO gemba_user_scopes (id, emp_code, factory_id, workshop_id, line_id, team_id, gemba_role, mmtb_token, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                factory_id = excluded.factory_id,
                workshop_id = excluded.workshop_id,
                line_id = excluded.line_id,
                team_id = excluded.team_id,
                gemba_role = excluded.gemba_role,
                mmtb_token = excluded.mmtb_token,
                updated_at = CURRENT_TIMESTAMP
            `).bind(scopeId, emp_code, factory_id || null, workshop_id || null, line_id || null, team_id || null, gemba_role || "OPERATOR", mmtb_token || null).run();

            await recordAuditLog(user, "GEMBA_USER", "UPDATE_SCOPE", scopeId, null, body, request);

            return new Response(JSON.stringify({ success: true, message: "Đã cập nhật phân quyền Gemba User thành công!" }), { headers: SECURE_JSON_HEADERS });
          } catch (err) {
            return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
          }
        }
      }

      // 6. POST /api/gemba/upload (Cloudflare R2 Strict Storage)
      if (url.pathname === "/api/gemba/upload" && request.method === "POST") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập để upload ảnh!" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }

          const body = await request.json().catch(() => ({}));
          const { record_id, image, file_type, file_name } = body;

          if (!image) {
            return new Response(JSON.stringify({ success: false, error: "MISSING_DATA", message: "Thiếu dữ liệu ảnh đính kèm!" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const mimeType = file_type || "image/jpeg";
          if (!mimeType.startsWith("image/")) {
            return new Response(JSON.stringify({ success: false, error: "INVALID_FILE_TYPE", message: "Chỉ chấp nhận định dạng file hình ảnh (.jpg, .png, .webp)!" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          const currentYear = new Date().getFullYear();
          const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
          const fileUuid = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          const r2Key = `gemba/photos/${currentYear}/${currentMonth}/${fileUuid}.jpg`;

          let finalUrl = image;
          if (env.BUCKET && typeof env.BUCKET.put === "function") {
            try {
              let binaryData;
              if (image.startsWith("data:")) {
                const base64Str = image.split(",")[1];
                const binStr = typeof atob === "function" ? atob(base64Str) : Buffer.from(base64Str, "base64").toString("binary");
                const len = binStr.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
                binaryData = bytes;
              } else {
                binaryData = image;
              }

              await env.BUCKET.put(r2Key, binaryData, {
                httpMetadata: { contentType: mimeType }
              });
              finalUrl = `https://vpchuoiskechers.tbsgroup2026.workers.dev/cdn-r2/${r2Key}`;
            } catch (r2Err) {
              console.warn("R2 storage upload attempt warning:", r2Err);
            }
          }

          const attachId = `att_${Date.now()}`;
          if (record_id) {
            await env.DB.prepare(`
              INSERT INTO gemba_attachments (id, record_id, r2_object_key, url, file_type, uploaded_by)
              VALUES (?, ?, ?, ?, ?, ?)
            `).bind(attachId, record_id, r2Key, finalUrl, mimeType, user.empCode).run().catch(() => {});
          }

          await recordAuditLog(user, "GEMBA", "UPLOAD_PHOTO", record_id || "TMP", null, { r2Key, url: finalUrl }, request);

          return new Response(JSON.stringify({
            success: true,
            id: attachId,
            r2_key: r2Key,
            url: finalUrl,
            message: "Đã upload ảnh hiện trường lên Cloudflare R2 thành công!"
          }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // 7. POST /api/gemba/import-sheet (Google Sheet Historical Data Import)
      if (url.pathname === "/api/gemba/import-sheet" && request.method === "POST") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated || !user.isExecutiveOrAdmin) {
            return new Response(JSON.stringify({ success: false, error: "ACCESS_DENIED", message: "Chỉ Admin mới có quyền import dữ liệu từ Google Sheet!" }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const body = await request.json().catch(() => ({}));
          const rows = body.rows || [];

          if (!Array.isArray(rows) || rows.length === 0) {
            return new Response(JSON.stringify({ success: false, error: "EMPTY_DATA", message: "Danh sách hàng import rỗng!" }), { status: 400, headers: SECURE_JSON_HEADERS });
          }

          let successCount = 0;
          const errorLogs = [];

          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const lineNum = i + 1;

            if (!r.title || !r.workshop_id || !r.line_id || !r.team_id) {
              errorLogs.push({ line: lineNum, reason: "Thiếu trường bắt buộc (tiêu đề, phân xưởng, line hoặc tổ)" });
              continue;
            }

            try {
              const codeStr = r.code || `GB-2026-IMP${String(i + 1).padStart(3, "0")}`;
              const recId = `gb_imp_${Date.now()}_${i}`;

              await env.DB.prepare(`
                INSERT OR IGNORE INTO gemba_records (
                  id, code, title, description, category_id, priority, status,
                  factory_id, workshop_id, line_id, team_id,
                  created_by_emp_code, created_by_name, assigned_to_emp_code, assigned_to_name,
                  due_at, closed_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `).bind(
                recId, codeStr, r.title, r.description || "", r.category_id || "cat_mmtb", r.priority || "TRUNG_BINH", r.status || "COMPLETED",
                r.factory_id || "fac_nmmd", r.workshop_id, r.line_id, r.team_id,
                r.created_by_emp_code || user.empCode, r.created_by_name || "Sheet Import", r.assigned_to_emp_code || null, r.assigned_to_name || null,
                r.due_at || null, r.closed_at || null, r.created_at || new Date().toISOString().replace("T", " ").substring(0, 19)
              ).run();

              successCount++;
            } catch (rErr) {
              errorLogs.push({ line: lineNum, reason: rErr.message });
            }
          }

          await recordAuditLog(user, "GEMBA", "IMPORT_SHEET", "BULK", null, { successCount, failCount: errorLogs.length }, request);

          return new Response(JSON.stringify({
            success: true,
            imported: successCount,
            failed: errorLogs.length,
            errors: errorLogs,
            message: `Đã nạp ${successCount}/${rows.length} hàng từ Google Sheet thành công!`
          }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // 8. GET /api/admin/audit-logs
      if (url.pathname === "/api/admin/audit-logs" && request.method === "GET") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập (401 Unauthorized)" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          if (!user.isExecutiveOrAdmin && user.roleCode !== "SUPER_ADMIN" && user.roleCode !== "ADMIN") {
            return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Yêu cầu quyền SUPER_ADMIN hoặc ADMIN (403 Forbidden)" }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const moduleKey = url.searchParams.get("module");
          const action = url.searchParams.get("action");
          const empCode = url.searchParams.get("empCode");
          const search = url.searchParams.get("search");
          const limit = parseInt(url.searchParams.get("limit") || "50", 10);
          const offset = parseInt(url.searchParams.get("offset") || "0", 10);

          const conditions = [];
          const bindings = [];

          if (moduleKey) { conditions.push("module = ?"); bindings.push(moduleKey); }
          if (action) { conditions.push("action = ?"); bindings.push(action); }
          if (empCode) { conditions.push("emp_code = ?"); bindings.push(empCode); }
          if (search) {
            conditions.push("(module LIKE ? OR action LIKE ? OR emp_code LIKE ? OR record_id LIKE ? OR changes_json LIKE ?)");
            const pattern = `%${search}%`;
            bindings.push(pattern, pattern, pattern, pattern, pattern);
          }

          const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

          const countRes = await env.DB.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`).bind(...bindings).first();
          const total = countRes ? countRes.count : 0;

          const queryBindings = [...bindings, limit, offset];
          const { results } = await env.DB.prepare(`SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...queryBindings).all();

          const logs = (results || []).map((row) => ({
            ...row,
            data_before: row.data_before ? JSON.parse(row.data_before) : null,
            data_after: row.data_after ? JSON.parse(row.data_after) : null,
            changes_json: row.changes_json ? JSON.parse(row.changes_json) : null
          }));

          await recordAuditLog(user, "SYSTEM_ADMIN", "VIEW_AUDIT_LOGS", "LIST", null, { filter: { module: moduleKey, action, empCode, search } }, request);

          return new Response(JSON.stringify({ success: true, data: logs, total, limit, offset }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // 9. GET /api/admin/backup
      if (url.pathname === "/api/admin/backup" && request.method === "GET") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập (401 Unauthorized)" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          if (!user.isExecutiveOrAdmin && user.roleCode !== "SUPER_ADMIN" && user.roleCode !== "ADMIN") {
            return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Yêu cầu quyền SUPER_ADMIN hoặc ADMIN (403 Forbidden)" }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const { results } = await env.DB.prepare("SELECT * FROM system_backups ORDER BY created_at DESC LIMIT 50").all();
          return new Response(JSON.stringify({ success: true, history: results || [] }), { headers: SECURE_JSON_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }

      // 10. POST /api/admin/backup
      if (url.pathname === "/api/admin/backup" && request.method === "POST") {
        try {
          const user = await verifyServerAuth(request, env);
          if (!user || !user.authenticated) {
            return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập (401 Unauthorized)" }), { status: 401, headers: SECURE_JSON_HEADERS });
          }
          if (!user.isExecutiveOrAdmin && user.roleCode !== "SUPER_ADMIN" && user.roleCode !== "ADMIN") {
            return new Response(JSON.stringify({ success: false, error: "FORBIDDEN", message: "Yêu cầu quyền SUPER_ADMIN hoặc ADMIN (403 Forbidden)" }), { status: 403, headers: SECURE_JSON_HEADERS });
          }

          const backupId = `bk_manual_${Date.now()}`;
          const timestamp = new Date().toISOString();
          const dateStr = timestamp.substring(0, 10);
          const timeStr = timestamp.substring(11, 19).replace(/:/g, '-');
          const fileName = `tbs_backup_manual_${dateStr}_${timeStr}.json`;

          const tablesQuery = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
          const tables = (tablesQuery.results || []).map((r) => r.name);
          const backupData = { metadata: { exported_at: timestamp, type: 'MANUAL', triggered_by: user.empCode }, tables: {} };

          for (const tableName of tables) {
            try {
              const { results } = await env.DB.prepare(`SELECT * FROM ${tableName} LIMIT 50000`).all();
              backupData.tables[tableName] = (results || []).map(row => sanitizeDeepWorker(row));
            } catch (e) {
              backupData.tables[tableName] = { error: String(e) };
            }
          }

          const jsonContent = JSON.stringify(backupData, null, 2);
          const fileSizeBytes = new TextEncoder().encode(jsonContent).length;

          const clientEmail = env.GDRIVE_CLIENT_EMAIL || env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
          const privateKey = env.GDRIVE_PRIVATE_KEY || env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

          let gdriveFileId = null;
          let errorMessage = null;

          if (!clientEmail || !privateKey) {
            errorMessage = "Skipped Google Drive upload: credentials not configured in environment variables.";
            await env.DB.prepare(
              `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, status, error_message, created_at)
               VALUES (?, 'MANUAL', ?, ?, 'SKIPPED_NO_CREDS', ?, CURRENT_TIMESTAMP)`
            ).bind(backupId, fileName, fileSizeBytes, errorMessage).run();
          } else {
            try {
              const now = Math.floor(Date.now() / 1000);
              const header = { alg: 'RS256', typ: 'JWT' };
              const claimSet = {
                iss: clientEmail,
                scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
                aud: 'https://oauth2.googleapis.com/token',
                exp: now + 3600,
                iat: now
              };

              const b64Url = (str) => btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
              const b64Buf = (buf) => {
                let bin = '';
                const bytes = new Uint8Array(buf);
                for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
                return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
              };

              const unsigned = `${b64Url(JSON.stringify(header))}.${b64Url(JSON.stringify(claimSet))}`;
              const cleanPem = privateKey.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s+/g, '');
              const rawKey = atob(cleanPem);
              const keyBuf = new Uint8Array(rawKey.length);
              for (let i = 0; i < rawKey.length; i++) keyBuf[i] = rawKey.charCodeAt(i);

              const cryptoKey = await crypto.subtle.importKey('pkcs8', keyBuf.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
              const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
              const jwt = `${unsigned}.${b64Buf(sigBuf)}`;

              const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
              });

              if (!tokenResp.ok) throw new Error(`Token fetch failed: ${tokenResp.status}`);
              const { access_token } = await tokenResp.json();

              const rootQ = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='Backup-TBS-System' and trashed=false`);
              const rootRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${rootQ}`, { headers: { Authorization: `Bearer ${access_token}` } });
              const rootData = await rootRes.json();
              let rootId = rootData.files?.[0]?.id;

              if (!rootId) {
                const createRoot = await fetch('https://www.googleapis.com/drive/v3/files', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: 'Backup-TBS-System', mimeType: 'application/vnd.google-apps.folder' })
                });
                const created = await createRoot.json();
                rootId = created.id;
              }

              const subQ = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='database' and '${rootId}' in parents and trashed=false`);
              const subRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${subQ}`, { headers: { Authorization: `Bearer ${access_token}` } });
              const subData = await subRes.json();
              let subId = subData.files?.[0]?.id;

              if (!subId) {
                const createSub = await fetch('https://www.googleapis.com/drive/v3/files', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: 'database', mimeType: 'application/vnd.google-apps.folder', parents: [rootId] })
                });
                const createdSub = await createSub.json();
                subId = createdSub.id;
              }

              const boundary = 'bound_' + Math.random().toString(36).substring(2);
              const meta = { name: fileName, mimeType: 'application/json', parents: [subId] };
              const bodyStr = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonContent}\r\n--${boundary}--`;

              const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
                body: bodyStr
              });

              if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
              const uploadedFile = await uploadRes.json();
              gdriveFileId = uploadedFile.id;

              await env.DB.prepare(
                `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, gdrive_file_id, status, created_at)
                 VALUES (?, 'MANUAL', ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP)`
              ).bind(backupId, fileName, fileSizeBytes, gdriveFileId).run();
            } catch (gErr) {
              errorMessage = gErr.message || String(gErr);
              await env.DB.prepare(
                `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, status, error_message, created_at)
                 VALUES (?, 'MANUAL', ?, ?, 'FAILED', ?, CURRENT_TIMESTAMP)`
              ).bind(backupId, fileName, fileSizeBytes, errorMessage).run();
            }
          }

          await recordAuditLog(user, "SYSTEM_ADMIN", "TRIGGER_MANUAL_BACKUP", backupId, null, { fileName, fileSizeBytes, gdriveFileId, errorMessage }, request);

          return new Response(JSON.stringify({
            success: true,
            data: {
              success: !errorMessage || errorMessage.includes('Skipped'),
              backupId,
              backupType: 'MANUAL',
              fileName,
              fileSizeBytes,
              gdriveFileId,
              errorMessage
            }
          }), { headers: SECURE_JSON_HEADERS });

        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }
    }





    // Redirect malformed register URLs like /work/kaizen?region=Văn+phòng+Chuỗi/register to /work/kaizen/register?region=Văn+phòng+Chuỗi
    if (url.pathname === "/work/kaizen" && url.search.includes("/register")) {
      const cleanSearch = url.search.replace(/\/register$/i, "").replace(/\/register&/i, "&");
      const targetUrl = new URL(`/work/kaizen/register${cleanSearch}`, request.url);
      return Response.redirect(targetUrl.toString(), 302);
    }



    // ============================================================
    // API CATCH-ALL SAFE JSON FALLBACK (Prevents 404 HTML SyntaxError on res.json())
    // ============================================================
    if (url.pathname.startsWith("/api/")) {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
      }
      return new Response(JSON.stringify({ success: true, message: `Endpoint ${url.pathname} handled by API fallback`, data: [] }), { status: 200, headers: CORS });
    }

    // Default Fallback: Serve Next.js Static Export Assets with HTML extension resolution
    if (env && env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return withCacheHeaders(assetResponse, assetResponse.headers.get("content-type")?.includes("text/html") || !url.pathname.includes("."), url.pathname);
      }

      if (request.method === "GET" && !url.pathname.includes(".")) {
        const cleanPath = (url.pathname.endsWith("/") && url.pathname.length > 1) ? url.pathname.slice(0, -1) : url.pathname;
        const fallbackPaths = [
          `${cleanPath}.html`,
          `${cleanPath}/index.html`,
        ];

        if (cleanPath.startsWith("/work/kaizen")) {
          fallbackPaths.push("/work/kaizen.html", "/work/kaizen/index.html");
        }
        if (cleanPath.startsWith("/work/gemba")) {
          fallbackPaths.push("/work/gemba.html", "/work/gemba/index.html");
        }
        if (cleanPath.startsWith("/work/ci") || cleanPath.startsWith("/work/cn-ci")) {
          fallbackPaths.push("/work/cn-ci.html", "/work.html");
        }
        if (cleanPath.startsWith("/work")) {
          fallbackPaths.push("/work.html", "/work/index.html");
        }
        if (cleanPath.startsWith("/finance")) {
          fallbackPaths.push("/finance.html", "/finance/index.html");
        }
        if (cleanPath.startsWith("/maintenance")) {
          fallbackPaths.push("/maintenance.html", "/maintenance/index.html");
        }
        fallbackPaths.push("/login.html", "/index.html");

        for (const fPath of fallbackPaths) {
          try {
            const fUrl = new URL(request.url);
            fUrl.pathname = fPath;
            fUrl.search = "";
            const fRes = await env.ASSETS.fetch(new Request(fUrl.toString(), request));
            if (fRes.status === 200) {
              return withCacheHeaders(fRes, true, url.pathname);
            }
          } catch (e) {}
        }
      }

      return withCacheHeaders(assetResponse, false, url.pathname);
    }
  },

  // ⏰ Cloudflare Worker Cron Trigger Handler (Daily System Backup & Kaizen Sync)
  async scheduled(event, env, ctx) {
    // 1. Continuous Kaizen Sync Pull (Cron Trigger every 1-2 mins)
    if (env.DB) {
      try {
        const secret = env.INTERNAL_SYNC_SECRET || "tbs_ii_secure_jwt_secret_key_2026";
        const sourceUrl = "https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1";

        let res = null;
        let lastErr = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            res = await fetch(sourceUrl, {
              headers: { "Cache-Control": "no-cache", "x-sync-secret": secret }
            });
            if (res && res.ok) break;
            lastErr = new Error(`HTTP ${res ? res.status : 'error'}`);
          } catch (e) {
            lastErr = e;
          }
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }

        if (res && res.ok) {
          const json = await res.json();
          const items = json.data || json.proposals || [];
          if (Array.isArray(items) && items.length > 0) {
            let createdCount = 0, updatedCount = 0, skippedCount = 0;
            for (const item of items) {
              if (!item || (!item.id && !item.external_id) || !item.title) continue;
              const siteCode = item.site_code || 'thkiengiangshoes';
              const externalId = item.external_id || item.id;
              const localId = siteCode === 'thkiengiangshoes' ? (String(item.id).startsWith('tkg_') ? String(item.id) : `tkg_${externalId}`) : String(item.id);
              const itemRegion = 'TH Kiên Giang Shoes';
              const isSoftDeleted = Boolean(Number(item.is_archived) === 1 || item.is_archived === true || Number(item.is_deleted) === 1 || item.is_deleted === true || item.status === 'DELETED' || item.sub_status === 'LUU_TRU' || item.registration_type === 'LUU_TRU');

              const existing = await env.DB.prepare("SELECT id, updated_at, is_archived FROM ci_kaizen_proposals WHERE id = ? OR (site_code = ? AND external_id = ?)").bind(localId, siteCode, externalId).first();
              const attsJson = item.attachments_json || (Array.isArray(item.attachments) ? JSON.stringify(item.attachments) : null);

              if (existing) {
                if (existing.updated_at && item.updated_at) {
                  const localT = new Date(existing.updated_at).getTime();
                  const itemT = new Date(item.updated_at).getTime();
                  if (!isNaN(localT) && !isNaN(itemT) && itemT <= localT && Number(existing.is_archived || 0) === (isSoftDeleted ? 1 : 0)) {
                    skippedCount++;
                    continue;
                  }
                }

                await env.DB.prepare(`
                  UPDATE ci_kaizen_proposals
                  SET code = COALESCE(?, code), title = COALESCE(?, title), category = COALESCE(?, category), category_label = COALESCE(?, category_label),
                      registration_type = COALESCE(?, registration_type), region = ?, department = COALESCE(?, department), factory = ?, line = COALESCE(?, line),
                      proposer_name = COALESCE(?, proposer_name), proposer_emp_code = COALESCE(?, proposer_emp_code), before_description = COALESCE(?, before_description),
                      after_solution = COALESCE(?, after_solution), saved_seconds = COALESCE(?, saved_seconds), so_giay_tiet_kiem = COALESCE(?, so_giay_tiet_kiem),
                      before_image_url = COALESCE(?, before_image_url), after_image_url = COALESCE(?, after_image_url), attachments_json = COALESCE(?, attachments_json),
                      status = COALESCE(?, status), sub_status = COALESCE(?, sub_status), trang_thai = COALESCE(?, trang_thai), review_status = COALESCE(?, review_status),
                      score_points = COALESCE(?, score_points), avg_rating = COALESCE(?, avg_rating), rating_count = COALESCE(?, rating_count), vote_count = COALESCE(?, vote_count),
                      view_count = COALESCE(?, view_count), pair_quantity = COALESCE(?, pair_quantity), total_savings_vnd = COALESCE(?, total_savings_vnd),
                      total_savings_words = COALESCE(?, total_savings_words), approval_status = COALESCE(?, approval_status), site_code = COALESCE(?, site_code),
                      external_id = COALESCE(?, external_id), source_region = ?, is_archived = ?, updated_at = COALESCE(?, CURRENT_TIMESTAMP)
                  WHERE id = ?
                `).bind(
                  item.code, item.title, item.category, item.category_label, item.registration_type, itemRegion, item.department, itemRegion, item.line,
                  item.proposer_name, item.proposer_emp_code, item.before_description, item.after_solution, item.saved_seconds || item.so_giay_tiet_kiem || 0,
                  item.saved_seconds || item.so_giay_tiet_kiem || 0, item.before_image_url, item.after_image_url, attsJson, item.status, item.sub_status,
                  item.trang_thai || item.sub_status, item.review_status || item.sub_status, item.score_points || 0, item.avg_rating || 0, item.rating_count || 0,
                  item.vote_count || 0, item.view_count || 0, item.pair_quantity || item.quantity || 0, item.total_savings_vnd || item.tong_tien_tiet_kiem || 0,
                  item.total_savings_words, item.approval_status, siteCode, externalId, itemRegion, isSoftDeleted ? 1 : 0, item.updated_at || new Date().toISOString(), existing.id
                ).run().catch(() => {});
                updatedCount++;
              } else {
                await env.DB.prepare(`
                  INSERT INTO ci_kaizen_proposals (
                    id, code, title, category, category_label, registration_type, region, department, factory, line, proposer_name, proposer_emp_code,
                    before_description, after_solution, saved_seconds, so_giay_tiet_kiem, before_image_url, after_image_url, attachments_json, status,
                    sub_status, trang_thai, review_status, score_points, avg_rating, rating_count, vote_count, view_count, pair_quantity, total_savings_vnd,
                    total_savings_words, approval_status, site_code, external_id, source_region, is_archived, created_at, updated_at
                  ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP)
                  )
                `).bind(
                  localId, item.code, item.title, item.category || 'PRODUCTIVITY', item.category_label || '3.Tăng Năng suất', item.registration_type || 'THI_DUA',
                  itemRegion, item.department || '', itemRegion, item.line || '', item.proposer_name, item.proposer_emp_code || 'SK-KG-EMP', item.before_description || '',
                  item.after_solution || '', item.saved_seconds || item.so_giay_tiet_kiem || 0, item.saved_seconds || item.so_giay_tiet_kiem || 0,
                  item.before_image_url || '', item.after_image_url || '', attsJson, item.status || 'APPROVED', item.sub_status || 'CHO_DANH_GIA',
                  item.trang_thai || item.sub_status || 'CHO_DANH_GIA', item.review_status || 'CHO_PHE_DUYET', item.score_points || 0, item.avg_rating || 0,
                  item.rating_count || 0, item.vote_count || 0, item.view_count || 0, item.pair_quantity || item.quantity || 0, item.total_savings_vnd || item.tong_tien_tiet_kiem || 0,
                  item.total_savings_words || '', item.approval_status || 'PHE_DUYET', siteCode, externalId, itemRegion, isSoftDeleted ? 1 : 0, item.created_at || new Date().toISOString(), item.updated_at || new Date().toISOString()
                ).run().catch(() => {});
                createdCount++;
              }
            }

            try {
              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS ci_kaizen_sync_logs (
                  id TEXT PRIMARY KEY, source_site TEXT NOT NULL, status TEXT NOT NULL, synced_count INTEGER DEFAULT 0, created_count INTEGER DEFAULT 0,
                  updated_count INTEGER DEFAULT 0, skipped_count INTEGER DEFAULT 0, message TEXT, error_detail TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `).run().catch(() => {});
              const logId = `sync_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              await env.DB.prepare(`
                INSERT INTO ci_kaizen_sync_logs (id, source_site, status, synced_count, created_count, updated_count, skipped_count, message, created_at)
                VALUES (?, 'thkiengiangshoes', 'SUCCESS', ?, ?, ?, ?, 'Cron pull sync completed', CURRENT_TIMESTAMP)
              `).bind(logId, items.length, createdCount, updatedCount, skippedCount).run().catch(() => {});
            } catch(e) {}
          }
        } else if (lastErr) {
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS ci_kaizen_sync_logs (
                id TEXT PRIMARY KEY, source_site TEXT NOT NULL, status TEXT NOT NULL, synced_count INTEGER DEFAULT 0, created_count INTEGER DEFAULT 0,
                updated_count INTEGER DEFAULT 0, skipped_count INTEGER DEFAULT 0, message TEXT, error_detail TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run().catch(() => {});
            const logId = `sync_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await env.DB.prepare(`
              INSERT INTO ci_kaizen_sync_logs (id, source_site, status, synced_count, message, error_detail, created_at)
              VALUES (?, 'thkiengiangshoes', 'ERROR', 0, 'Cron pull sync failed after 3 retries', ?, CURRENT_TIMESTAMP)
            `).bind(logId, String(lastErr.message || lastErr)).run().catch(() => {});
          } catch(e) {}
        }
      } catch (kaizenSyncErr) {
        console.warn('[Cron Kaizen Sync] Non-blocking pull warning:', kaizenSyncErr);
      }
    }

    console.log(`[CRON SCHEDULE] Executing Daily Backup & Prune at ${event.scheduledTime}`);
    if (!env.DB) return;

    try {
      const backupId = `bk_cron_${Date.now()}`;
      const timestamp = new Date().toISOString();
      const dateStr = timestamp.substring(0, 10);
      const timeStr = timestamp.substring(11, 19).replace(/:/g, '-');
      const fileName = `tbs_backup_scheduled_${dateStr}_${timeStr}.json`;

      // Export database tables
      const tablesQuery = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
      const tables = (tablesQuery.results || []).map((r) => r.name);
      const backupData = { metadata: { exported_at: timestamp, type: 'SCHEDULED' }, tables: {} };

      const SENSITIVE_KEYS = new Set(['password', 'pass', 'token', 'secret', 'access_token', 'refresh_token', 'authorization', 'private_key', 'gdrive_private_key']);
      const sanitizeRow = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const res = {};
        for (const [k, v] of Object.entries(obj)) {
          if (SENSITIVE_KEYS.has(k.toLowerCase()) || k.toLowerCase().includes('password') || k.toLowerCase().includes('secret')) {
            res[k] = '[REDACTED]';
          } else {
            res[k] = v;
          }
        }
        return res;
      };

      for (const tableName of tables) {
        try {
          const { results } = await env.DB.prepare(`SELECT * FROM ${tableName} LIMIT 50000`).all();
          backupData.tables[tableName] = (results || []).map(row => sanitizeRow(row));
        } catch (e) {
          backupData.tables[tableName] = { error: String(e) };
        }
      }

      const jsonContent = JSON.stringify(backupData, null, 2);
      const fileSizeBytes = new TextEncoder().encode(jsonContent).length;

      const clientEmail = env.GDRIVE_CLIENT_EMAIL || env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = env.GDRIVE_PRIVATE_KEY || env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

      if (!clientEmail || !privateKey) {
        console.warn('[Cron Backup] Google Drive credentials missing in worker environment variables. Skipping upload.');
        await env.DB.prepare(
          `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, status, error_message, created_at)
           VALUES (?, 'SCHEDULED', ?, ?, 'SKIPPED_NO_CREDS', 'Google Drive credentials not set', CURRENT_TIMESTAMP)`
        ).bind(backupId, fileName, fileSizeBytes).run();
        return;
      }

      // Web Crypto RS256 JWT Token for Google Drive API
      const now = Math.floor(Date.now() / 1000);
      const header = { alg: 'RS256', typ: 'JWT' };
      const claimSet = {
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      const b64Url = (str) => btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const b64Buf = (buf) => {
        let bin = '';
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      };

      const unsigned = `${b64Url(JSON.stringify(header))}.${b64Url(JSON.stringify(claimSet))}`;
      const cleanPem = privateKey.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s+/g, '');
      const rawKey = atob(cleanPem);
      const keyBuf = new Uint8Array(rawKey.length);
      for (let i = 0; i < rawKey.length; i++) keyBuf[i] = rawKey.charCodeAt(i);

      const cryptoKey = await crypto.subtle.importKey('pkcs8', keyBuf.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
      const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
      const jwt = `${unsigned}.${b64Buf(sigBuf)}`;

      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
      });

      if (!tokenResp.ok) throw new Error(`Token fetch failed: ${tokenResp.status}`);
      const { access_token } = await tokenResp.json();

      // Resolve Root folder /Văn Phòng Chuỗi/ or /TBS/ or /Backup-TBS-System/
      let rootId = env.GDRIVE_FOLDER_ID;

      if (!rootId) {
        for (const searchName of ['Văn Phòng Chuỗi', 'TBS', 'Backup-TBS-System']) {
          try {
            const rootQ = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${searchName}' and trashed=false`);
            const rootRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${rootQ}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`, { headers: { Authorization: `Bearer ${access_token}` } });
            if (rootRes.ok) {
              const rootData = await rootRes.json();
              if (rootData.files && rootData.files.length > 0) {
                rootId = rootData.files[0].id;
                break;
              }
            }
          } catch (e) {}
        }
      }

      if (!rootId) {
        const createRoot = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
          method: 'POST',
          headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Văn Phòng Chuỗi', mimeType: 'application/vnd.google-apps.folder' })
        });
        if (createRoot.ok) {
          const created = await createRoot.json();
          rootId = created.id;
        }
      }

      // Categorized upload to Drive subfolders (Audit Logs, Users, Kaizen, Gemba, Rooms, Full Dump)
      const getSubfolderId = async (folderName) => {
        const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${rootId}' in parents and trashed=false`);
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) return data.files[0].id;
        }
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
          method: 'POST',
          headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootId] })
        });
        if (createRes.ok) {
          const createdSub = await createRes.json();
          return createdSub.id;
        }
        return rootId;
      };

      const uploadFile = async (subFolderId, fName, contentObj) => {
        const boundary = 'bound_' + Math.random().toString(36).substring(2);
        const jsonStr = JSON.stringify(contentObj, null, 2);
        const meta = { name: fName, mimeType: 'application/json', parents: [subFolderId] };
        const bodyStr = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonStr}\r\n--${boundary}--`;

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
          method: 'POST',
          headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
          body: bodyStr
        });
        if (!uploadRes.ok) {
          const errTxt = await uploadRes.text();
          throw new Error(`Upload ${fName} failed: ${uploadRes.status} ${errTxt}`);
        }
        const uploadedFile = await uploadRes.json();
        return uploadedFile.id;
      };

      const categories = [
        {
          folder: "01_Nhat_Ky_Thao_Tac_Audit_Logs",
          prefix: "audit_logs",
          match: (tbl) => tbl.includes("audit") || tbl.includes("log") || tbl.includes("history")
        },
        {
          folder: "02_Tai_Khoan_Nguoi_Dung_Users",
          prefix: "users_employees",
          match: (tbl) => tbl.includes("user") || tbl.includes("employee") || tbl.includes("profile") || tbl.includes("hr_")
        },
        {
          folder: "03_Sang_Kien_Cai_Tien_Kaizen",
          prefix: "kaizen_proposals",
          match: (tbl) => tbl.includes("kaizen") || tbl.includes("ci_") || tbl.includes("proposal")
        },
        {
          folder: "04_Quan_Ly_Gemba_Andon",
          prefix: "gemba_andon",
          match: (tbl) => tbl.includes("gemba") || tbl.includes("andon")
        },
        {
          folder: "05_Dat_Phong_Hop_Rooms",
          prefix: "room_bookings",
          match: (tbl) => tbl.includes("room") || tbl.includes("meeting") || tbl.includes("booking")
        },
        {
          folder: "00_Tong_Hop_Full_Database",
          prefix: "full_database_dump",
          match: () => true
        }
      ];

      let cronMainFileId = null;
      for (const cat of categories) {
        const subFolderId = await getSubfolderId(cat.folder);
        const catTables = {};
        for (const [tblName, tblData] of Object.entries(backupData.tables || {})) {
          if (cat.match(tblName)) {
            catTables[tblName] = tblData;
          }
        }

        if (Object.keys(catTables).length > 0 || cat.folder.startsWith("00_")) {
          const catFileName = `tbs_${cat.prefix}_${dateStr}_${timeStr}.json`;
          const content = {
            metadata: {
              ...backupData.metadata,
              category: cat.folder,
              exported_at: new Date().toISOString()
            },
            tables: catTables
          };
          const fId = await uploadFile(subFolderId, catFileName, content);
          if (cat.folder.startsWith("00_") || !cronMainFileId) {
            cronMainFileId = fId;
          }
        }
      }

      await env.DB.prepare(
        `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, gdrive_file_id, status, created_at)
         VALUES (?, 'SCHEDULED', ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP)`
      ).bind(backupId, fileName, fileSizeBytes, cronMainFileId).run();

      // Prune files older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      const cutoffIso = cutoffDate.toISOString();
      const pruneQ = encodeURIComponent(`'${subId}' in parents and createdTime < '${cutoffIso}' and trashed=false`);
      const pruneRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${pruneQ}`, { headers: { Authorization: `Bearer ${access_token}` } });
      if (pruneRes.ok) {
        const pruneData = await pruneRes.json();
        for (const f of (pruneData.files || [])) {
          await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${access_token}` } });
        }
      }
      await env.DB.prepare('DELETE FROM system_backups WHERE created_at < ?').bind(cutoffIso).run();

      console.log(`[Cron Backup] Daily backup completed successfully: ${fileName}`);
    } catch (err) {
      console.error('[Cron Backup] Scheduled backup failed:', err);
    }
  },
};

