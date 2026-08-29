export const PERMISSIONS = {
  // Dashboard /work
  WORK_VIEW_ALL_DEPTS: "work:view_all_depts",
  WORK_MANAGE_DEPT: "work:manage_dept",

  // Rooms /rooms
  ROOMS_VIEW: "rooms:view",
  ROOMS_BOOK: "rooms:book",
  ROOMS_APPROVE: "rooms:approve",
  ROOMS_REASSIGN: "rooms:reassign",
  ROOMS_CHECKIN_GUEST: "rooms:checkin_guest",
  ROOMS_ISSUE_BADGE: "rooms:issue_badge",

  // Business trip /business-trip — DUYỆT 2 CẤP TUẦN TỰ
  TRIP_CREATE: "trip:create",
  TRIP_APPROVE_LEVEL1: "trip:approve_level1", // Trưởng phòng
  TRIP_APPROVE_LEVEL2: "trip:approve_level2", // Ban Giám Đốc
  TRIP_DISPATCH_VEHICLE: "trip:dispatch_vehicle",
  TRIP_APPROVE_ADVANCE: "trip:approve_advance",

  // Maintenance /maintenance
  MAINT_CREATE_TICKET: "maintenance:create_ticket",
  MAINT_MANAGE: "maintenance:manage",
  MAINT_VIEW_MACHINES: "maintenance:view_machines",

  // Documents /documents
  DOC_CREATE: "documents:create",
  DOC_APPROVE: "documents:approve",
  DOC_MANAGE_TEMPLATES: "documents:manage_templates",

  // Admin /admin
  ADMIN_MANAGE_USERS: "admin:manage_users",
  ADMIN_MANAGE_ROLES: "admin:manage_roles",
  ADMIN_MANAGE_DEPARTMENTS: "admin:manage_departments",

  // Module chuyên môn
  QC_MANAGE: "qc:manage",
  CI_MANAGE: "ci:manage",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLES: Record<string, Permission[]> = {
  admin: Object.values(PERMISSIONS),

  // Ban Giám Đốc - dùng chung bộ quyền executive_board (tách role để mở rộng sau)
  ceo: [
    PERMISSIONS.WORK_VIEW_ALL_DEPTS,
    PERMISSIONS.TRIP_APPROVE_LEVEL2,
    PERMISSIONS.DOC_APPROVE,
  ],
  deputy_ceo: [
    PERMISSIONS.WORK_VIEW_ALL_DEPTS,
    PERMISSIONS.TRIP_APPROVE_LEVEL2,
    PERMISSIONS.DOC_APPROVE,
  ],
  director: [
    PERMISSIONS.WORK_VIEW_ALL_DEPTS,
    PERMISSIONS.TRIP_APPROVE_LEVEL2,
    PERMISSIONS.DOC_APPROVE,
  ],
  deputy_director: [
    PERMISSIONS.WORK_VIEW_ALL_DEPTS,
    PERMISSIONS.TRIP_APPROVE_LEVEL2,
    PERMISSIONS.DOC_APPROVE,
  ],

  department_head: [
    PERMISSIONS.WORK_MANAGE_DEPT,
    PERMISSIONS.ROOMS_VIEW,
    PERMISSIONS.ROOMS_BOOK,
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_APPROVE_LEVEL1,
    PERMISSIONS.DOC_CREATE,
    PERMISSIONS.DOC_APPROVE,
  ],

  hr: [
    PERMISSIONS.WORK_MANAGE_DEPT,
    PERMISSIONS.ROOMS_VIEW,
    PERMISSIONS.ROOMS_BOOK,
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.DOC_CREATE,
    // TODO: bổ sung quyền quản lý hồ sơ nhân sự khi có module riêng
  ],

  receptionist: [
    PERMISSIONS.ROOMS_VIEW,
    PERMISSIONS.ROOMS_BOOK,
    PERMISSIONS.ROOMS_APPROVE,
    PERMISSIONS.ROOMS_REASSIGN,
    PERMISSIONS.ROOMS_CHECKIN_GUEST,
    PERMISSIONS.ROOMS_ISSUE_BADGE,
  ],

  admin_office: [
    PERMISSIONS.ROOMS_VIEW,
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_DISPATCH_VEHICLE,
  ],

  accountant: [
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_APPROVE_ADVANCE,
  ],

  maintenance: [
    PERMISSIONS.MAINT_CREATE_TICKET,
    PERMISSIONS.MAINT_MANAGE,
    PERMISSIONS.MAINT_VIEW_MACHINES,
  ],

  qc: [PERMISSIONS.QC_MANAGE],
  ci: [PERMISSIONS.CI_MANAGE],

  // TODO: Các phòng ban R&D, Kế hoạch TTPP, Tổ hợp Nhà máy tạm thời dùng employee (xem) + department_head/admin (quản lý).
  // Bổ sung role riêng (ví dụ rd, logistics, factory_manager...) khi có yêu cầu chuyên sâu.
  employee: [
    PERMISSIONS.ROOMS_VIEW,
    PERMISSIONS.ROOMS_BOOK,
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.MAINT_CREATE_TICKET,
    PERMISSIONS.DOC_CREATE,
  ],
};

// Map role hiển thị trên dropdown đăng nhập (UI-facing) sang loginMethod
export const LOGIN_ROLE_OPTIONS = [
  { value: "ceo", label: "👑 Tổng Giám Đốc", icon: "👑", loginMethod: "password_only" },
  { value: "deputy_ceo", label: "🌟 Phó Tổng Giám Đốc", icon: "🌟", loginMethod: "password_only" },
  { value: "director", label: "🏢 Giám Đốc Khối", icon: "🏢", loginMethod: "password_only" },
  { value: "deputy_director", label: "💼 Phó Giám Đốc Khối", icon: "💼", loginMethod: "password_only" },
  { value: "department_head", label: "👔 Trưởng Phòng / Quản Lý", icon: "👔", loginMethod: "msnv_password" },
  { value: "admin", label: "🔧 Quản Trị Viên Hệ Thống (Admin)", icon: "🔧", loginMethod: "msnv_password" },
  { value: "employee", label: "👤 Cán Bộ Công Nhân Viên (CBCNV)", icon: "👤", loginMethod: "msnv_password", defaultEmpCode: "" },
] as const;

