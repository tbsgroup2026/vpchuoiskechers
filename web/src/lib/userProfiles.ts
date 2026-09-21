import { EquipmentScope } from './equipmentScope';

export interface UserProfile {
  userId: number;
  empCode: string;
  name: string;
  title: string;
  department: string;
  departmentCode?: string;
  managementLevel?: number;
  projectIds?: string[];
  email: string;
  phone?: string;
  roleCode: string;
  roles: string[];
  roleLevel: number;
  avatar: string;
  redirectUrl: string;
  managedDepartmentId?: string;
  allowedScopes?: EquipmentScope[];
}

export const SYSTEM_USERS: Record<string, UserProfile> = {
  "202608001": {
    userId: 205,
    empCode: "202608001",
    name: "Phạm Nguyễn Anh Huy",
    title: "NV — LẬP TRÌNH",
    department: "NHÂN SỰ",
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
    title: "NV — LẬP TRÌNH",
    department: "NHÂN SỰ",
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
    title: "NV — LẬP TRÌNH",
    department: "NHÂN SỰ",
    email: "tranhuy110421@gmail.com",
    phone: "0522511246",
    roleCode: "TRUONG_PHONG",
    roles: ["employee", "department_head", "ci", "admin"],
    roleLevel: 3,
    avatar: "",
    redirectUrl: "/work",
    managedDepartmentId: "ci",
  },
  "202608003": {
    userId: 207,
    empCode: "202608003",
    name: "Ngô Hà Thanh An",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    email: "ngohathanhan@tbsgroup.vn",
    phone: "0903800003",
    roleCode: "NHAN_VIEN",
    roles: ["employee", "hr"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/work",
    managedDepartmentId: "hr",
  },
  "210602002": {
    userId: 301,
    empCode: "210602002",
    name: "Trần Thị Ngoan",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    email: "210602002@tbsgroup.vn",
    phone: "",
    roleCode: "NHAN_VIEN",
    roles: ["employee", "hr"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/work",
  },
  "201506009": {
    userId: 302,
    empCode: "201506009",
    name: "Lê Thúy Diễm",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    email: "201506009@tbsgroup.vn",
    phone: "",
    roleCode: "NHAN_VIEN",
    roles: ["employee", "hr"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/work",
  },
  "201607010": {
    userId: 303,
    empCode: "201607010",
    name: "Nguyễn Thị Đào",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    email: "201607010@tbsgroup.vn",
    phone: "",
    roleCode: "NHAN_VIEN",
    roles: ["employee", "hr"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/work",
  },
  "201507009": {
    userId: 304,
    empCode: "201507009",
    name: "Hồ Thị Thảo",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    email: "201507009@tbsgroup.vn",
    phone: "",
    roleCode: "NHAN_VIEN",
    roles: ["employee", "hr"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/work",
  },
  "201507015": {
    userId: 305,
    empCode: "201507015",
    name: "Đoàn Thị Trinh",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    email: "201507015@tbsgroup.vn",
    phone: "",
    roleCode: "NHAN_VIEN",
    roles: ["employee", "hr"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/work",
  },
  "212103096": {
    userId: 306,
    empCode: "212103096",
    name: "Nguyễn Văn Nguyện",
    title: "Chuyên Viên Nhân Sự & Hành Chánh",
    department: "Nhân Sự - Hành Chính",
    email: "212103096@tbsgroup.vn",
    phone: "",
    roleCode: "NHAN_VIEN",
    roles: ["employee", "hr"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/work",
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
    avatar: "",
    redirectUrl: "/rooms",
    managedDepartmentId: "hr",
  },
  "202409009": {
    userId: 216,
    empCode: "202409009",
    name: "Nguyễn Kim Nguyên",
    title: "Nhân Viên Hành Chính - Lễ Tân",
    department: "NHÂN SỰ-HC",
    email: "202409009@tbsgroup.vn",
    phone: "",
    roleCode: "LE_TAN",
    roles: ["employee", "receptionist"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/rooms",
    managedDepartmentId: "hr",
  },
  "202010004": {
    userId: 217,
    empCode: "202010004",
    name: "Nguyễn Minh Hùng",
    title: "Nhân Viên Hành Chính - Lễ Tân",
    department: "NHÂN SỰ-HC",
    email: "202010004@tbsgroup.vn",
    phone: "",
    roleCode: "LE_TAN",
    roles: ["employee", "receptionist"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/rooms",
    managedDepartmentId: "hr",
  },
  "202206011": {
    userId: 215,
    empCode: "202206011",
    name: "Lễ Tân (Trưởng Team LT)",
    title: "Trưởng Team Lễ Tân",
    department: "Văn Phòng Chuỗi SKECHERS",
    email: "letan.teamlead@tbsgroup.vn",
    phone: "0522511247",
    roleCode: "LE_TAN",
    roles: ["employee", "receptionist"],
    roleLevel: 4,
    avatar: "",
    redirectUrl: "/rooms",
    managedDepartmentId: "hr",
  },
};

export const ROLE_ALIAS_MAP: Record<string, string> = {
  ceo: "202608001",
  deputy_ceo: "202608001",
  director: "202608001",
  deputy_director: "202608001",
  admin: "202608001",
  receptionist: "202206011",
  letan: "202206011",
  "lt-001": "202206011",
  ci: "202608001",
  hr: "202608003",
  accountant: "210602002",
  qc: "202608003",
  maintenance: "202112003",
  logistics: "202112003",
  rd: "202608001",
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
  "2026080003": "202608003",
  "20260800003": "202608003",
  "20260803": "202608003",
  "ngohathanhan@tbsgroup.vn": "202608003",
  "ngohathanhan": "202608003",
};

export function normalizeEmpCode(input: any): string {
  if (input === null || input === undefined || input === "") return "";
  const strInput = String(input).trim();
  if (!strInput) return "";
  const trimmed = strInput.toLowerCase();
  if (
    trimmed === "lt-001" ||
    trimmed === "lt001" ||
    trimmed === "letan" ||
    trimmed === "le_tan"
  ) {
    return "202206011";
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
  if (
    trimmed === "202608003" ||
    trimmed === "2026080003" ||
    trimmed === "20260803" ||
    trimmed === "20260800003" ||
    trimmed === "ngohathanhan@tbsgroup.vn" ||
    trimmed === "ngohathanhan"
  ) {
    return "202608003";
  }
  return ROLE_ALIAS_MAP[trimmed] || strInput;
}

/**
 * Lấy thông tin user trong SYSTEM_USERS một cách an toàn (tránh ReferenceError)
 */
export function getSystemUser(empCode: any): UserProfile | null {
  if (!empCode) return null;
  const normalized = normalizeEmpCode(empCode);
  if (!normalized) return null;
  return SYSTEM_USERS[normalized] || null;
}

/**
 * Lấy danh sách tất cả các UserProfile trong hệ thống
 */
export function getAllSystemUsers(): UserProfile[] {
  return Object.values(SYSTEM_USERS);
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
    custom !== "/images/tbs-logo.png" &&
    !custom.includes("unsplash.com")
  ) {
    if (cleanCode !== "202608001" && custom.includes("nzcft200bebofw7b4uzg")) {
      localStorage.removeItem(`tbs_avatar_${cleanCode}`);
    } else {
      return custom;
    }
  }

  if (
    SYSTEM_USERS[cleanCode] &&
    SYSTEM_USERS[cleanCode].avatar &&
    SYSTEM_USERS[cleanCode].avatar !== "/images/tbs-logo.png" &&
    !SYSTEM_USERS[cleanCode].avatar.includes("unsplash.com")
  ) {
    if (cleanCode !== "202608001" && SYSTEM_USERS[cleanCode].avatar.includes("nzcft200bebofw7b4uzg")) {
      return null;
    }
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
 * Lưu thông tin cá nhân tùy chỉnh RIÊNG BIỆT theo đúng mã nhân viên (empCode).
 * Khóa chặt dữ liệu theo key tbs_profile_info_${cleanCode} để tránh rò rỉ thông tin sang người khác.
 */
export function setUserProfileInfo(empCode: string, info: Partial<UserProfile>): void {
  if (typeof window === "undefined" || !empCode) return;
  const cleanCode = normalizeEmpCode(empCode);
  const key = `tbs_profile_info_${cleanCode}`;

  let existing: Record<string, any> = {};
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      existing = JSON.parse(stored);
    } catch {}
  }

  const updated = {
    ...existing,
    ...info,
    empCode: cleanCode,
  };

  localStorage.setItem(key, JSON.stringify(updated));

  if (info.avatar && typeof info.avatar === "string") {
    setUserAvatar(cleanCode, info.avatar);
  }

  const storedSession = sessionStorage.getItem("tbs_current_user");
  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession);
      if (normalizeEmpCode(parsed.empCode) === cleanCode) {
        const merged = { ...parsed, ...updated };
        sessionStorage.setItem("tbs_current_user", JSON.stringify(merged));
      }
    } catch {}
  }

  window.dispatchEvent(new Event("tbs_profile_updated"));
}

/**
 * Lấy thông tin cá nhân tùy chỉnh RIÊNG BIỆT theo đúng mã nhân viên (empCode).
 */
export function getUserProfileInfo(empCode: string): Partial<UserProfile> | null {
  if (typeof window === "undefined" || !empCode) return null;
  const cleanCode = normalizeEmpCode(empCode);
  const key = `tbs_profile_info_${cleanCode}`;

  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return null;
}

/**
 * Lấy tiêu đề / badge hiển thị chuẩn cho tài khoản trên tất cả các tab/màn hình.
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
    "IE": "Kỹ Sư IE (Industrial Engineering)",
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
 * Lấy thông tin user hiện tại đang đăng nhập từ Session Storage/LocalStorage.
 * Đảm bảo avatar & thông tin luôn thuộc về đúng empCode của user đó.
 */
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;

  // Dọn dẹp key rác dùng chung nguy hiểm nếu còn sót
  if (localStorage.getItem("tbs_user_custom_avatar")) {
    localStorage.removeItem("tbs_user_custom_avatar");
  }

  // Ưu tiên lấy từ sessionStorage (định danh tab độc lập) và đối chiếu với cookie tbs_token
  let cookieEmpCode: string | null = null;
  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie.match(/tbs_token=tbs_token_([^_]+)_/);
    if (cookieMatch && cookieMatch[1]) {
      cookieEmpCode = normalizeEmpCode(cookieMatch[1]);
    }
  }

  let stored = sessionStorage.getItem("tbs_current_user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (cookieEmpCode && normalizeEmpCode(parsed?.empCode) !== cookieEmpCode) {
        stored = null; // Session cũ từ tab khác không khớp cookie
      }
    } catch {
      stored = null;
    }
  }

  if (!stored && cookieEmpCode && SYSTEM_USERS[cookieEmpCode]) {
    const sysProfile = { ...SYSTEM_USERS[cookieEmpCode] };
    stored = JSON.stringify(sysProfile);
    sessionStorage.setItem("tbs_current_user", stored);
  }

  if (!stored) {
    stored = localStorage.getItem("tbs_current_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (cookieEmpCode && normalizeEmpCode(parsed?.empCode) !== cookieEmpCode) {
          stored = null;
        } else {
          sessionStorage.setItem("tbs_current_user", stored);
        }
      } catch {
        stored = null;
      }
    }
  }
  if (!stored) return null;

  try {
    const parsed: UserProfile = JSON.parse(stored);
    if (!parsed || !parsed.empCode) return null;

    // Auto-heal tbs_token cookie if missing to ensure persistent login across page refreshes
    if (typeof document !== "undefined") {
      const hasTokenCookie = document.cookie.split("; ").some((row) => row.startsWith("tbs_token="));
      if (!hasTokenCookie) {
        const token = `tbs_token_${parsed.empCode}_${Date.now()}`;
        document.cookie = `tbs_token=${token}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }

    const normalizedCode = normalizeEmpCode(parsed.empCode);
    const baseInfo = SYSTEM_USERS[normalizedCode];
    const customInfo = getUserProfileInfo(normalizedCode);
    const customAvatar = getUserAvatar(normalizedCode);

    let finalAvatar =
      customAvatar ||
      (customInfo?.avatar && !customInfo.avatar.includes("unsplash.com") ? customInfo.avatar : null) ||
      (baseInfo?.avatar && !baseInfo.avatar.includes("unsplash.com") ? baseInfo.avatar : null) ||
      (parsed.avatar && !parsed.avatar.includes("unsplash.com") && parsed.avatar !== "/images/tbs-logo.png" ? parsed.avatar : "");

    if (normalizedCode !== "202608001" && finalAvatar && finalAvatar.includes("nzcft200bebofw7b4uzg")) {
      finalAvatar = "";
    }
    if (!finalAvatar) {
      finalAvatar = "";
    }

    const defaultAllowedScopes: EquipmentScope[] = baseInfo?.allowedScopes || parsed.allowedScopes || ['ALL', 'OFFICE', 'EAST', 'KIEN_GIANG'];

    const isValidParsed = normalizeEmpCode(parsed.empCode) === normalizedCode;

    const fallbackName = baseInfo?.name || (normalizedCode === "202608001" ? "Phạm Nguyễn Anh Huy" : `Nhân Viên (${normalizedCode})`);
    const fallbackTitle = baseInfo?.title || (normalizedCode === "202608001" ? "IT - Team Chuyển Đổi Số" : "Chuyên Viên Vận Hành");
    const fallbackDept = baseInfo?.department || "Văn Phòng Chuỗi SKECHERS";
    const fallbackEmail = baseInfo?.email || `${normalizedCode.toLowerCase()}@tbsgroup.vn`;
    const fallbackPhone = baseInfo?.phone || "";

    const name = customInfo?.name || (baseInfo?.name ? baseInfo.name : (isValidParsed && parsed.name && !parsed.name.startsWith("Cán Bộ") ? parsed.name : fallbackName));
    const title = customInfo?.title || (baseInfo?.title ? baseInfo.title : (isValidParsed && parsed.title && parsed.title !== "NV" ? parsed.title : fallbackTitle));
    const department = customInfo?.department || (baseInfo?.department ? baseInfo.department : (isValidParsed && parsed.department ? parsed.department : fallbackDept));
    const email = customInfo?.email || (baseInfo?.email ? baseInfo.email : (isValidParsed && parsed.email ? parsed.email : fallbackEmail));
    const phone = customInfo?.phone || (baseInfo?.phone ? baseInfo.phone : (isValidParsed && parsed.phone ? parsed.phone : fallbackPhone));

    return {
      ...parsed,
      empCode: normalizedCode,
      name,
      title,
      department,
      email,
      phone,
      avatar: finalAvatar,
      allowedScopes: defaultAllowedScopes,
    };
  } catch {
    return null;
  }
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
    const isMgmt = targetEmpCode.length > 0;
    baseProfile = {
      userId: 888,
      empCode: targetEmpCode || "202608001",
      name: `Cán Bộ Quản Lý (${targetEmpCode})`,
      title: "Trưởng Phòng / Cán Bộ Quản Lý",
      department: "Văn Phòng Chuỗi SKECHERS",
      email: `${targetEmpCode.toLowerCase()}@tbsgroup.vn`,
      roleCode: isMgmt ? "TRUONG_PHONG" : "CBCNV",
      roles: isMgmt ? ["employee", "department_head", "ci", "admin"] : ["employee"],
      roleLevel: isMgmt ? 3 : 4,
      avatar: "",
      redirectUrl: "/work",
    };
  }

  // Đảm bảo avatar thuộc về đúng empCode
  const customAvatar = getUserAvatar(baseProfile.empCode);
  if (customAvatar) {
    baseProfile.avatar = customAvatar;
  } else if (baseProfile.avatar && baseProfile.avatar.includes("unsplash.com")) {
    baseProfile.avatar = "";
  }

  // Lưu session riêng biệt cho tab (sessionStorage) & mặc định mới (localStorage)
  sessionStorage.setItem("tbs_current_user", JSON.stringify(baseProfile));
  localStorage.setItem("tbs_current_user", JSON.stringify(baseProfile));

  // Thiết lập cookie token (max-age 365 ngày cho duy trì đăng nhập)
  const token = `tbs_token_${baseProfile.empCode}_${Date.now()}`;
  document.cookie = `tbs_token=${token}; path=/; max-age=31536000; SameSite=Lax`;

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

        const resolvedAvatar = (u.avatar && u.avatar !== "/images/tbs-logo.png" && !u.avatar.includes("unsplash.com") && (mappedCode === "202608001" || !u.avatar.includes("nzcft200bebofw7b4uzg")))
          ? u.avatar
          : (getUserAvatar(mappedCode) || (sysUser?.avatar && !sysUser.avatar.includes("unsplash.com") ? sysUser.avatar : ""));

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
          avatar: resolvedAvatar,
          redirectUrl: u.redirectUrl || sysUser?.redirectUrl || "/work",
        };
      }
    }
  } catch (err) {
    console.warn("D1 /api/auth/login sync error:", err);
  }

  const finalProfile = d1Profile || loginUserProfile(normalized, password);

  if (typeof window !== "undefined") {
    if (finalProfile.avatar && finalProfile.avatar !== "/images/tbs-logo.png" && !finalProfile.avatar.includes("unsplash.com")) {
      localStorage.setItem(`tbs_avatar_${finalProfile.empCode}`, finalProfile.avatar);
    }
    sessionStorage.setItem("tbs_current_user", JSON.stringify(finalProfile));
    localStorage.setItem("tbs_current_user", JSON.stringify(finalProfile));
    const token = `tbs_token_${finalProfile.empCode}_${Date.now()}`;
    document.cookie = `tbs_token=${token}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event("tbs_profile_updated"));
  }

  return finalProfile;
}

/**
 * Đăng xuất an toàn: Xóa hoàn toàn Cookie token, Session User, và dọn dẹp state
 */
export function logoutUserProfile(): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Expire cookies across all paths
    document.cookie = "tbs_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "tbs_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "tbs_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

    // 2. Clear Session and Local Storage completely
    sessionStorage.removeItem("tbs_current_user");
    localStorage.removeItem("tbs_current_user");
    sessionStorage.removeItem("tbs_token");
    localStorage.removeItem("tbs_token");
    localStorage.removeItem("tbs_user_custom_avatar");

    sessionStorage.clear();
    localStorage.clear();

    // 3. Dispatch global profile updated event
    window.dispatchEvent(new Event("tbs_profile_updated"));
  } catch (e) {
    console.warn("[logoutUserProfile] Cleanup error:", e);
  }
}

/**
 * Kiểm tra người dùng có vai trò Admin / Super Admin (hoặc Ban Giám Đốc / IT Admin)
 * để cho phép hiển thị & truy cập Trang Quản Trị (/admin).
 * Các tài khoản nhân viên / user thông thường sẽ KHÔNG được hiển thị nút này.
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false;

  const roleCode = (user.roleCode || user.role_code || "").toString().trim().toUpperCase();
  const roleLevel = user.roleLevel || user.role_level || 4;
  const roles: string[] = Array.isArray(user.roles)
    ? user.roles.map((r: any) => r.toString().toLowerCase())
    : [];

  // 1. Kiểm tra vai trò Admin / Super Admin chuẩn
  if (
    roleCode === "SUPER_ADMIN" ||
    roleCode === "ADMIN" ||
    roleCode === "SYSTEM_ADMIN" ||
    roleCode === "ADMIN-2026" ||
    roleLevel === 1
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

  return false;
}

export function formatTitleWithDepartment(title?: string, department?: string): string {
  if (!title) return department || "";
  if (!department || title.includes(department)) return title;
  return `${title} - ${department}`;
}

/**
 * Tra cứu tên thật chính xác của nhân viên theo Mã NV (empCode).
 * Quy tắc ưu tiên:
 * 1. Nếu mã là SYSTEM hoặc rỗng: trả về "Hệ thống".
 * 2. Tra trong danh mục SYSTEM_USERS (ví dụ 202608001 -> "Phạm Nguyễn Anh Huy").
 * 3. Nếu không có trong danh mục, dùng tên đã lưu (nếu có) ngoại trừ chuỗi mặc định "Cán Bộ Công Nhân Viên".
 * 4. Ngược lại trả về "Không xác định". Tuyệt đối KHÔNG dùng chuỗi cứng "Cán Bộ Công Nhân Viên".
 */
export function resolveEmployeeName(empCode?: string | null, storedName?: string | null): string {
  if (!empCode || String(empCode).trim().toUpperCase() === "SYSTEM") {
    return "Hệ thống";
  }

  const normalized = normalizeEmpCode(empCode);
  if (normalized && SYSTEM_USERS[normalized] && SYSTEM_USERS[normalized].name) {
    return SYSTEM_USERS[normalized].name;
  }

  if (storedName && typeof storedName === "string") {
    const clean = storedName.trim();
    if (
      clean !== "" &&
      clean !== "Cán Bộ Công Nhân Viên" &&
      clean !== "Cán Bộ Nhân Viên" &&
      clean !== "CBCNV" &&
      !clean.startsWith("Cán Bộ Nhân Viên (")
    ) {
      return clean;
    }
  }

  return "Không xác định";
}

/**
 * Tra cứu tên nhân viên theo LÔ (Batch Lookup) cho danh sách mã NV.
 * Trả về Map (empCode -> Tên thật) để xử lý tập trung trong bộ nhớ, tối ưu hiệu năng.
 */
export function buildEmpCodeNameMap(empCodes: (string | null | undefined)[]): Record<string, string> {
  const map: Record<string, string> = {
    SYSTEM: "Hệ thống",
    system: "Hệ thống",
  };

  const uniqueCodes = Array.from(new Set(empCodes.filter((c): c is string => Boolean(c))));

  for (const rawCode of uniqueCodes) {
    const normalized = normalizeEmpCode(rawCode);
    if (normalized && SYSTEM_USERS[normalized]) {
      map[rawCode] = SYSTEM_USERS[normalized].name;
      map[normalized] = SYSTEM_USERS[normalized].name;
    } else if (String(rawCode).toUpperCase() === "SYSTEM") {
      map[rawCode] = "Hệ thống";
    } else {
      map[rawCode] = resolveEmployeeName(rawCode);
    }
  }

  return map;
}


