/**
 * TBS Group - Hệ Thống Quản Lý User Profile & Phân Quyền Đăng Nhập Độc Lập
 * Đảm bảo mỗi tài khoản (202608001, 202608002, TGĐ-001, NS-001, KT-001...) có Profile & Avatar RIÊNG BIỆT.
 * Tuyệt đối không dùng chung avatar hay fallback sai lệch giữa các session.
 */

export interface UserProfile {
  userId: number;
  empCode: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone?: string;
  roleCode: string;
  roles: string[];
  roleLevel: number;
  avatar: string;
  redirectUrl: string;
  managedDepartmentId?: string;
}

export const SYSTEM_USERS: Record<string, UserProfile> = {
  "202608001": {
    userId: 205,
    empCode: "202608001",
    name: "Phạm Nguyễn Anh Huy",
    title: "IT - Team Chuyển Đổi Số",
    department: "IT - Team Chuyển Đổi Số",
    email: "anhy.work.2004@gmail.com",
    phone: "0522511245",
    roleCode: "TRUONG_PHONG",
    roles: ["employee", "department_head", "ci", "admin"],
    roleLevel: 3,
    avatar: "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1787117525/nzcft200bebofw7b4uzg.jpg",
    redirectUrl: "/work",
    managedDepartmentId: "ci",
  },
  "2026080001": {
    userId: 205,
    empCode: "202608001",
    name: "Phạm Nguyễn Anh Huy",
    title: "IT - Team Chuyển Đổi Số",
    department: "IT - Team Chuyển Đổi Số",
    email: "anhy.work.2004@gmail.com",
    phone: "0522511245",
    roleCode: "TRUONG_PHONG",
    roles: ["employee", "department_head", "ci", "admin"],
    roleLevel: 3,
    avatar: "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1787117525/nzcft200bebofw7b4uzg.jpg",
    redirectUrl: "/work",
    managedDepartmentId: "ci",
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
    roles: ["employee", "department_head", "ci", "admin"],
    roleLevel: 3,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
    managedDepartmentId: "ci",
  },
  "LT-001": {
    userId: 215,
    empCode: "LT-001",
    name: "Lễ Tân Văn Phòng",
    title: "Chuyên Viên Lễ Tân Văn Phòng",
    department: "Văn Phòng Chuỗi SKECHERS",
    email: "letan@tbsgroup.vn",
    phone: "0522511246",
    roleCode: "LE_TAN",
    roles: ["employee", "receptionist"],
    roleLevel: 4,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/rooms",
    managedDepartmentId: "hr",
  },
  "TGĐ-001": {
    userId: 201,
    empCode: "TGĐ-001",
    name: "Nguyễn Đức Thuấn",
    title: "Chủ Tịch HĐQT & Tổng Giám Đốc Tập Đoàn TBS Group",
    department: "Ban Giám Đốc Tập Đoàn",
    email: "tgd.nguyenducthuan@tbsgroup.vn",
    phone: "0903800001",
    roleCode: "TONG_GIAM_DOC",
    roles: ["ceo"],
    roleLevel: 1,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
  },
  "TGĐ-002": {
    userId: 2012,
    empCode: "TGĐ-002",
    name: "Nguyễn Thị Vui",
    title: "Tổng Giám Đốc Vận Hành SKECHERS",
    department: "Ban Giám Đốc Tập Đoàn",
    email: "tgd.nguyenthivui@tbsgroup.vn",
    phone: "0903800012",
    roleCode: "TONG_GIAM_DOC",
    roles: ["ceo"],
    roleLevel: 1,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
  },
  "PTGĐ-001": {
    userId: 2021,
    empCode: "PTGĐ-001",
    name: "Bùi Đình Trung",
    title: "Phó Tổng Giám Đốc KHCB & TTPP",
    department: "Ban Giám Đốc Kế Hoạch & TTPP",
    email: "ptgd.buidinhtrung@tbsgroup.vn",
    phone: "0903800021",
    roleCode: "PHO_TONG_GIAM_DOC",
    roles: ["deputy_ceo"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
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
    roles: ["deputy_ceo"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
  },
  "PTGĐ-003": {
    userId: 2023,
    empCode: "PTGĐ-003",
    name: "Trịnh Văn Thành",
    title: "Phó Tổng Giám Đốc Kỹ Thuật & R&D",
    department: "Ban Giám Đốc Kỹ Thuật",
    email: "ptgd.trinhvanthanh@tbsgroup.vn",
    phone: "0903800023",
    roleCode: "PHO_TONG_GIAM_DOC",
    roles: ["deputy_ceo"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
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
    roles: ["director"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
  },
  "GĐ-004": {
    userId: 2034,
    empCode: "GĐ-004",
    name: "Vũ Thị Thanh",
    title: "Giám Đốc Khối Chuỗi Cung Ứng SKECHERS",
    department: "Khối Chuỗi Cung Ứng",
    email: "gd.vuthithanh@tbsgroup.vn",
    phone: "0903800034",
    roleCode: "GIAM_DOC",
    roles: ["director"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
  },
  "PGĐ-001": {
    userId: 2041,
    empCode: "PGĐ-001",
    name: "Kiều Thanh Vũ",
    title: "Phó Giám Đốc Phân Hệ CN CI PPH (PGĐ)",
    department: "Phân Hệ CN CI PPH",
    email: "pgd.kieuthanhvu@tbsgroup.vn",
    phone: "0903800041",
    roleCode: "PHO_GIAM_DOC",
    roles: ["deputy_director"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
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
    roles: ["deputy_director"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
  },
  "PGĐ-005": {
    userId: 2045,
    empCode: "PGĐ-005",
    name: "Bùi Văn Hùng",
    title: "Phó Giám Đốc Sản Xuất Nhà Máy KG1",
    department: "Khối Sản Xuất & Nhà Máy",
    email: "pgd.buivanhung@tbsgroup.vn",
    phone: "0903800045",
    roleCode: "PHO_GIAM_DOC",
    roles: ["deputy_director"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
  },
  "PGĐ-006": {
    userId: 2046,
    empCode: "PGĐ-006",
    name: "Đỗ Thị Thu",
    title: "Phó Giám Đốc Nhân Sự & Hành Chánh",
    department: "Khối Nhân Sự & Hành Chánh",
    email: "pgd.dothithu@tbsgroup.vn",
    phone: "0903800046",
    roleCode: "PHO_GIAM_DOC",
    roles: ["deputy_director"],
    roleLevel: 2,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
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
    roles: ["admin"],
    roleLevel: 1,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/admin",
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
    roles: ["employee", "department_head", "hr"],
    roleLevel: 3,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
    managedDepartmentId: "hr",
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
    roles: ["employee", "department_head", "accountant"],
    roleLevel: 3,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/finance",
    managedDepartmentId: "accounting",
  },
  "QC-001": {
    userId: 214,
    empCode: "QC-001",
    name: "Bùi Thị Hằng",
    title: "Quản Lý QC & Kiểm Soát Chất Lượng",
    department: "Khối Quản Lý Chất Lượng (QC)",
    email: "qc001@tbsgroup.vn",
    phone: "0988400001",
    roleCode: "QC_MANAGER",
    roles: ["employee", "qc"],
    roleLevel: 3,
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
    managedDepartmentId: "qc",
  },
  "BT-001": {
    userId: 216,
    empCode: "BT-001",
    name: "Phạm Văn Bảo",
    title: "Kỹ Thuật Viên Bảo Trì Trưởng",
    department: "Tổ Hợp Nhà Máy & Sản Xuất",
    email: "bt001@tbsgroup.vn",
    phone: "0988500001",
    roleCode: "KY_THUAT_VIEN",
    roles: ["employee", "maintenance"],
    roleLevel: 4,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/maintenance",
    managedDepartmentId: "factory",
  },
  "LG-001": {
    userId: 219,
    empCode: "LG-001",
    name: "Nguyễn Văn Minh",
    title: "Trưởng Phòng Logistics",
    department: "Logistics - KH Chuẩn Bị TTPP",
    email: "lg001@tbsgroup.vn",
    phone: "0988600001",
    roleCode: "TRUONG_PHONG",
    roles: ["employee", "department_head", "logistics"],
    roleLevel: 3,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
    managedDepartmentId: "logistics",
  },
  "RD-001": {
    userId: 212,
    empCode: "RD-001",
    name: "Võ Thị Kim Loan",
    title: "Trưởng Phòng R&D",
    department: "R&D - Phát Triển Sản Phẩm",
    email: "rd001@tbsgroup.vn",
    phone: "0988300001",
    roleCode: "TRUONG_PHONG",
    roles: ["employee", "department_head", "rd"],
    roleLevel: 3,
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    redirectUrl: "/work",
    managedDepartmentId: "rd",
  },
};

export const ROLE_ALIAS_MAP: Record<string, string> = {
  ceo: "TGĐ-001",
  deputy_ceo: "PTGĐ-002",
  director: "GĐ-003",
  deputy_director: "PGĐ-004",
  admin: "ADMIN-2026",
  receptionist: "LT-001",
  letan: "LT-001",
  "lt-001": "LT-001",
  ci: "202608001",
  hr: "NS-001",
  accountant: "KT-001",
  qc: "QC-001",
  maintenance: "BT-001",
  logistics: "LG-001",
  rd: "RD-001",
  "2026080001": "202608001",
  "20260800001": "202608001",
  "20260801": "202608001",
  "2026080002": "202608002",
  "20260800002": "202608002",
  "20260802": "202608002",
  "anhy.work.2004@gmail.com": "202608001",
  "it": "202608001",
  "cds": "202608001",
  "anhhuy": "202608001",
  "huy": "202608001",
  "tranhuy110421@gmail.com": "202608002",
};

export function normalizeEmpCode(input: string): string {
  if (!input) return "202608001";
  const trimmed = input.trim().toLowerCase();
  if (
    trimmed === "lt-001" ||
    trimmed === "lt001" ||
    trimmed === "letan" ||
    trimmed === "le_tan"
  ) {
    return "LT-001";
  }
  if (
    trimmed === "202608001" ||
    trimmed === "2026080001" ||
    trimmed === "20260801" ||
    trimmed === "20260800001" ||
    trimmed === "anhy.work.2004@gmail.com" ||
    trimmed === "it" ||
    trimmed === "ci" ||
    trimmed === "cds" ||
    trimmed === "huy" ||
    trimmed === "anhhuy"
  ) {
    return "202608001";
  }
  if (
    trimmed === "202608002" ||
    trimmed === "2026080002" ||
    trimmed === "20260802" ||
    trimmed === "20260800002" ||
    trimmed === "tranhuy110421@gmail.com"
  ) {
    return "202608002";
  }
  return ROLE_ALIAS_MAP[trimmed] || input.trim();
}

/**
 * Lấy avatar tùy chỉnh RIÊNG BIỆT của đúng một mã nhân viên (empCode).
 * Tự động xóa rác nếu nhận nhầm avatar IT guy trên tài khoản khác.
 */
export function getUserAvatar(empCode: string): string | null {
  if (typeof window === "undefined" || !empCode) return null;
  const cleanCode = normalizeEmpCode(empCode);

  const custom = localStorage.getItem(`tbs_avatar_${cleanCode}`);
  if (
    custom &&
    custom.trim() !== "" &&
    custom !== "/images/tbs-logo.png"
  ) {
    return custom;
  }

  if (
    SYSTEM_USERS[cleanCode] &&
    SYSTEM_USERS[cleanCode].avatar &&
    SYSTEM_USERS[cleanCode].avatar !== "/images/tbs-logo.png"
  ) {
    return SYSTEM_USERS[cleanCode].avatar;
  }

  return null;
}

/**
 * Lưu avatar tùy chỉnh RIÊNG BIỆT cho đúng một mã nhân viên (empCode).
 * Đồng thời dọn dẹp triệt để bất kỳ key dùng chung nào (tbs_user_custom_avatar).
 */
export function setUserAvatar(empCode: string, avatarUrl: string): void {
  if (typeof window === "undefined" || !empCode) return;
  const cleanCode = normalizeEmpCode(empCode);

  // 1. Lưu vào key riêng biệt của tài khoản
  localStorage.setItem(`tbs_avatar_${cleanCode}`, avatarUrl);

  // 2. Xóa sạch key avatar dùng chung cũ để tránh rò rỉ avatar
  localStorage.removeItem("tbs_user_custom_avatar");

  // 3. Nếu đang đăng nhập đúng tài khoản này, cập nhật cả session
  const storedSession = sessionStorage.getItem("tbs_current_user");
  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession);
      if (normalizeEmpCode(parsed.empCode) === cleanCode) {
        parsed.avatar = avatarUrl;
        sessionStorage.setItem("tbs_current_user", JSON.stringify(parsed));
      }
    } catch {}
  }
  const storedLocal = localStorage.getItem("tbs_current_user");
  if (storedLocal) {
    try {
      const parsed = JSON.parse(storedLocal);
      if (normalizeEmpCode(parsed.empCode) === cleanCode) {
        parsed.avatar = avatarUrl;
        localStorage.setItem("tbs_current_user", JSON.stringify(parsed));
      }
    } catch {}
  }

  // 4. Phát sự kiện thông báo toàn bộ giao diện cập nhật ngay lập tức
  window.dispatchEvent(new Event("tbs_profile_updated"));
}

/**
 * Lấy tiêu đề / badge hiển thị chuẩn cho tài khoản trên tất cả các tab/màn hình.
 * Quy tắc ưu tiên:
 * 1. Định dạng "Department - Team" (ví dụ: "IT - Team Chuyển Đổi Số")
 * 2. Nếu title/department đã có dạng kết hợp (hoặc có trong SYSTEM_USERS theo empCode), dùng trực tiếp
 * 3. Nếu khuyết department/team, dùng department hoặc title readable
 * 4. Nếu có roleCode, ánh xạ sang tên chức danh tiếng Việt thân thiện — tuyệt đối KHÔNG hiển thị mã rút gọn thô như "NV" hay "CBCNV".
 * 5. Mặc định fallback: "IT - Team Chuyển Đổi Số" cho tài khoản 202608001/202608002 hoặc "Văn Phòng Chuỗi SKECHERS".
 */
export function getUserDisplayBadgeTitle(user?: Partial<UserProfile> | null): string {
  if (!user) return "IT - Team Chuyển Đổi Số";

  const empCode = user.empCode ? normalizeEmpCode(user.empCode) : "";
  const sysUser = empCode ? SYSTEM_USERS[empCode] : null;

  // 1. Ưu tiên thông tin chuẩn từ SYSTEM_USERS nếu empCode hợp lệ
  if (sysUser && sysUser.title) {
    return sysUser.title;
  }

  // 2. Nếu user object có title hoặc department dạng chuẩn "Department - Team"
  const rawTitle = user.title || "";
  const rawDept = user.department || "";

  if (rawTitle && rawTitle.includes(" - ")) {
    return rawTitle;
  }
  if (rawDept && rawDept.includes(" - ")) {
    return rawDept;
  }

  // 3. Nếu có cả department và team khác nhau
  const teamName = (user as any).team || (user as any).teamName || "";
  if (rawDept && teamName && !rawDept.includes(teamName)) {
    return `${rawDept} - ${teamName}`;
  }

  // 4. Nếu có department hoặc title đơn
  if (rawTitle && rawTitle !== "Cán Bộ Công Nhân Viên" && rawTitle !== "Staff" && rawTitle !== "NV") {
    return rawTitle;
  }
  if (rawDept && rawDept !== "Văn Phòng Chuỗi SKECHERS") {
    return rawDept;
  }

  // 5. Ánh xạ roleCode sang tên chức danh thân thiện (không dùng mã "NV" thô)
  const roleCode = user.roleCode || sysUser?.roleCode || "";
  const roleTitleMap: Record<string, string> = {
    "SUPER_ADMIN": "Quản Trị Viên Hệ Thống",
    "ADMIN": "Quản Trị Viên",
    "TONG_GIAM_DOC": "Tổng Giám Đốc",
    "PHO_TONG_GIAM_DOC": "Phó Tổng Giám Đốc",
    "GIAM_DOC": "Giám Đốc Phân Hệ",
    "PHO_GIAM_DOC": "Phó Giám Đốc Phân Hệ",
    "TRUONG_PHONG": "Trưởng Phòng",
    "LE_TAN": "Lễ Tân Văn Phòng",
    "QC_MANAGER": "Quản Lý Quality Control",
    "KY_THUAT_VIEN": "Kỹ Thuật Viên",
    "CBCNV": "Chuyên Viên Vận Hành",
    "NV": "Chuyên Viên Vận Hành",
  };

  if (roleCode && roleTitleMap[roleCode]) {
    return roleTitleMap[roleCode];
  }

  return "IT - Team Chuyển Đổi Số";
}

/**
 * Xác thực & Đăng nhập tài khoản, gán chính xác Profile + Avatar theo MSNV
 */
export function loginUserProfile(empCodeOrRole: string, password?: string): UserProfile {
  if (typeof window === "undefined") {
    throw new Error("Window environment required");
  }

  // Clear previous session & tokens before logging in new user
  logoutUserProfile();

  const cleanInput = (empCodeOrRole || "").trim();
  const targetEmpCode = normalizeEmpCode(cleanInput);

  // Dọn dẹp key rác cũ
  localStorage.removeItem("tbs_user_custom_avatar");

  // Xóa cache avatar bị dính của IT guy trên tài khoản khác
  if (targetEmpCode !== "202608001") {
    const cachedAvatar = localStorage.getItem(`tbs_avatar_${targetEmpCode}`);
    if (cachedAvatar && cachedAvatar.includes("nzcft200bebofw7b4uzg")) {
      localStorage.removeItem(`tbs_avatar_${targetEmpCode}`);
    }
  }

  let baseProfile: UserProfile;

  if (SYSTEM_USERS[targetEmpCode]) {
    baseProfile = { ...SYSTEM_USERS[targetEmpCode] };
  } else {
    baseProfile = {
      userId: 888,
      empCode: targetEmpCode || "202608001",
      name: `Cán Bộ Nhân Viên (${targetEmpCode})`,
      title: "Cán Bộ Công Nhân Viên",
      department: "Văn Phòng Chuỗi SKECHERS",
      email: `${targetEmpCode.toLowerCase()}@tbsgroup.vn`,
      roleCode: "CBCNV",
      roles: ["employee"],
      roleLevel: 4,
      avatar: "/images/tbs-logo.png",
      redirectUrl: "/work",
    };
  }

  // Đảm bảo avatar thuộc về đúng empCode
  const customAvatar = getUserAvatar(baseProfile.empCode);
  if (customAvatar) {
    baseProfile.avatar = customAvatar;
  }

  // Lưu session riêng biệt cho tab (sessionStorage) & mặc định mới (localStorage)
  sessionStorage.setItem("tbs_current_user", JSON.stringify(baseProfile));
  localStorage.setItem("tbs_current_user", JSON.stringify(baseProfile));

  // Thiết lập cookie token
  const token = `tbs_token_${baseProfile.empCode}_${Date.now()}`;
  document.cookie = `tbs_token=${token}; path=/; max-age=86400`;

  // Bắn event cập nhật toàn bộ components
  window.dispatchEvent(new Event("tbs_profile_updated"));

  return baseProfile;
}

/**
 * Đăng nhập đồng bộ trực tiếp với Cloudflare D1 Database
 */
export async function loginWithD1Database(
  empCodeOrRole: string,
  password?: string,
  role?: string
): Promise<UserProfile> {
  const cleanInput = (empCodeOrRole || role || "").trim();
  const normalized = normalizeEmpCode(cleanInput);

  let d1Profile: UserProfile | null = null;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empCode: cleanInput,
        role: role || cleanInput,
        password: password || "123456",
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.user) {
        const u = json.user;
        const mappedCode = normalizeEmpCode(u.empCode || u.emp_code || normalized);
        const sysUser = SYSTEM_USERS[mappedCode];

        d1Profile = {
          userId: u.userId || u.id || sysUser?.userId || 205,
          empCode: mappedCode,
          name: u.name || sysUser?.name || "Cán bộ công nhân viên",
          title: u.title || sysUser?.title || "Cán bộ công nhân viên",
          department: u.department || sysUser?.department || "TBS Group",
          email: u.email || sysUser?.email || `${mappedCode}@tbsgroup.vn`,
          phone: u.phone || sysUser?.phone || "",
          roleCode: u.roleCode || u.role_code || sysUser?.roleCode || "CBCNV",
          roles: sysUser?.roles || (u.roleCode === "SUPER_ADMIN" ? ["admin"] : ["employee"]),
          roleLevel: u.roleLevel || sysUser?.roleLevel || 3,
          avatar: (u.avatar && u.avatar !== "/images/tbs-logo.png" && (mappedCode === "202608001" || !u.avatar.includes("nzcft200bebofw7b4uzg")))
            ? u.avatar
            : (getUserAvatar(mappedCode) || sysUser?.avatar || "/images/tbs-logo.png"),
          redirectUrl: u.redirectUrl || sysUser?.redirectUrl || "/work",
        };
      }
    }
  } catch (err) {
    console.warn("D1 /api/auth/login sync error:", err);
  }

  const finalProfile = d1Profile || loginUserProfile(normalized, password);

  if (typeof window !== "undefined") {
    if (finalProfile.avatar && finalProfile.avatar !== "/images/tbs-logo.png") {
      localStorage.setItem(`tbs_avatar_${finalProfile.empCode}`, finalProfile.avatar);
    }
    sessionStorage.setItem("tbs_current_user", JSON.stringify(finalProfile));
    localStorage.setItem("tbs_current_user", JSON.stringify(finalProfile));
    const token = `tbs_token_${finalProfile.empCode}_${Date.now()}`;
    document.cookie = `tbs_token=${token}; path=/; max-age=86400`;
    window.dispatchEvent(new Event("tbs_profile_updated"));
  }

  return finalProfile;
}

/**
 * Đăng xuất an toàn: Xóa hoàn toàn Cookie token, Session User, và dọn dẹp state
 */
export function logoutUserProfile(): void {
  if (typeof window === "undefined") return;

  // Xóa cookie xác thực
  document.cookie = "tbs_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  // Xóa session user ở cả sessionStorage (tab hiện tại) và localStorage (toàn cục)
  sessionStorage.removeItem("tbs_current_user");
  localStorage.removeItem("tbs_current_user");

  // Dọn dẹp key rác dùng chung
  localStorage.removeItem("tbs_user_custom_avatar");

  // Bắn event để tất cả các page/component tự động reset về trạng thái chưa đăng nhập
  window.dispatchEvent(new Event("tbs_profile_updated"));
}

/**
 * Kiểm tra người dùng có vai trò Admin / Super Admin (hoặc Ban Giám Đốc / IT Admin)
 * để cho phép hiển thị & truy cập Trang Quản Trị (/admin).
 * Các tài khoản nhân viên / user thông thường sẽ KHÔNG được hiển thị nút này.
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false;

  const empCode = (user.empCode || user.emp_code || "").toString().trim().toUpperCase();
  const roleCode = (user.roleCode || user.role_code || "").toString().trim().toUpperCase();
  const roles: string[] = Array.isArray(user.roles)
    ? user.roles.map((r: any) => r.toString().toLowerCase())
    : [];

  // 1. Kiểm tra vai trò Admin / Super Admin chuẩn
  if (
    roleCode === "SUPER_ADMIN" ||
    roleCode === "ADMIN" ||
    roleCode === "SYSTEM_ADMIN" ||
    roleCode === "ADMIN-2026"
  ) {
    return true;
  }

  // 2. Kiểm tra mảng roles
  if (
    roles.includes("admin") ||
    roles.includes("superadmin") ||
    roles.includes("system_admin")
  ) {
    return true;
  }

  // 3. Kiểm tra mã nhân viên quản trị đặc biệt
  if (
    empCode === "ADMIN-2026" ||
    empCode === "202608001" ||
    empCode === "2026080001" ||
    empCode === "202608002"
  ) {
    return true;
  }

  return false;
}

export function formatTitleWithDepartment(title?: string, department?: string): string {
  if (!title) return department || "";
  if (!department || title.includes(department)) return title;
  return `${title} - ${department}`;
}

