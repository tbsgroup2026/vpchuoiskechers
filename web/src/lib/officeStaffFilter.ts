/**
 * Utility module for filtering and classifying Office Staff (CBNV Văn Phòng).
 * 
 * Rules:
 * Non-office staff (excluded) if EITHER condition is met:
 * Condition A: Job Title (Chức vụ) = 'CN' (Công nhân)
 * Condition B: Department (Bộ phận) includes 'LÁI XE', 'VSCN - TẠP VỤ', 'NHÀ ĂN', 'BẢO TRÌ ĐIỆN - ĐIỆN LẠNH'
 */

export interface PersonnelRecord {
  empCode?: string;
  name?: string;
  chucVu?: string;
  title?: string;
  vtcvHienTai?: string;
  boPhan?: string;
  department?: string;
  phongBanHienTai?: string;
  roleCode?: string;
}

export function isOfficeStaff(record: PersonnelRecord): boolean {
  const rawTitle = String(
    record.chucVu || record.title || record.vtcvHienTai || ""
  )
    .trim()
    .toUpperCase();

  const rawDept = String(
    record.boPhan || record.department || record.phongBanHienTai || ""
  )
    .trim()
    .toUpperCase();

  // Condition A: Job Title = 'CN' (Công nhân) -> Exclude
  if (rawTitle === "CN" || rawTitle === "CÔNG NHÂN" || rawTitle === "CONG NHAN") {
    return false;
  }

  // Condition B: Department belongs to non-office categories -> Exclude regardless of title
  const excludedDeptPatterns = [
    "LÁI XE",
    "LAI XE",
    "VSCN - TẠP VỤ",
    "VSCN-TẠP VỤ",
    "VSCN - TAP VU",
    "VSCN-TAP VU",
    "VSCN",
    "TẠP VỤ",
    "TAP VU",
    "NHÀ ĂN",
    "NHA AN",
    "BẢO TRÌ ĐIỆN",
    "BAO TRI DIEN",
  ];

  for (const pattern of excludedDeptPatterns) {
    if (rawDept.includes(pattern)) {
      return false;
    }
  }

  return true;
}

/**
 * Official 12 Office Staff members retained in the system
 */
export const OFFICIAL_OFFICE_STAFF = [
  { empCode: "222102020", name: "DƯ THỊ THANH TÌNH", title: "Trưởng Phòng Quản Trị Nguồn Nhân Lực", department: "NHÂN SỰ-HC", roleCode: "PHO_GIAM_DOC" },
  { empCode: "211206004", name: "NGUYỄN VĂN TÌNH", title: "Trưởng Nhóm Quản Trị Nguồn Nhân Lực", department: "NHÂN SỰ", roleCode: "TRUONG_PHONG" },
  { empCode: "201606014", name: "TRẦN THỊ HỒNG NHUNG", title: "Chuyên Viên Quản Trị & Phát Triển NNL", department: "NHÂN SỰ", roleCode: "CBCNV" },
  { empCode: "210612005", name: "NGUYỄN THỊ HẰNG", title: "Chuyên Viên Định Mức & Phân Bổ Ngân Sách TL", department: "NHÂN SỰ", roleCode: "CBCNV" },
  { empCode: "202404001", name: "NGUYỄN NGỌC TUYẾN", title: "Chuyên Viên Tuyển Dụng & Đào Tạo", department: "NHÂN SỰ", roleCode: "CBCNV" },
  { empCode: "201906023", name: "ĐẶNG THỊ THANH LỊCH", title: "Chuyên Viên Nhân Sự Tiền Lương & CS", department: "NHÂN SỰ", roleCode: "CBCNV" },
  { empCode: "202206011", name: "TRẦN THỊ BÍCH TRÂM", title: "Trưởng Nhóm Hành Chính & Lễ Tân", department: "HÀNH CHÍNH", roleCode: "TRUONG_PHONG" },
  { empCode: "202203002", name: "NGUYỄN TIẾN HẠNH", title: "Chuyên Viên Audit & Doanh Trí KLLĐ", department: "HÀNH CHÍNH", roleCode: "CBCNV" },
  { empCode: "202409009", name: "NGUYỄN KIM NGUYÊN", title: "Nhân Viên Hành Chính - Lễ Tân", department: "HÀNH CHÍNH", roleCode: "CBCNV" },
  { empCode: "202010004", name: "NGUYỄN MINH HÙNG", title: "Nhân Viên Hành Chính - Lễ Tân", department: "HÀNH CHÍNH", roleCode: "CBCNV" },
  { empCode: "202608001", name: "PHẠM NGUYỄN ANH HUY", title: "NV — LẬP TRÌNH", department: "NHÂN SỰ", roleCode: "SUPER_ADMIN" },
  { empCode: "202608002", name: "TRẦN NGỌC HUY", title: "NV — LẬP TRÌNH", department: "NHÂN SỰ", roleCode: "SUPER_ADMIN" },
];
