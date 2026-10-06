export const STANDARD_DASHBOARD_REGIONS = [
  "Văn phòng Chuỗi",
  "Nhà Máy Miền Đông",
  "Kiên Giang 1",
  "Kiên Giang 2",
  "Kiên Giang 3",
  "Hoàn thiện đế",
  "Phòng kế hoạch",
  "Phòng CI",
  "Phòng CN",
  "Phòng chất lượng",
  "Phòng nhân sự",
  "Phòng Ban THKG",
  "Chưa phân loại"
] as const;

export type StandardRegion = (typeof STANDARD_DASHBOARD_REGIONS)[number];

export function getProposalValueVnd(p: any): number {
  if (!p) return 0;

  const directTotalVnd = Number(p.total_savings_vnd || p.tong_tien_tiet_kiem || 0);
  if (directTotalVnd > 0) {
    return directTotalVnd;
  }

  const pairQty = Number(p.pair_quantity || p.so_luong_giay || p.quantity || 0);
  const savedSecs = Number(p.saved_seconds || p.so_giay_tiet_kiem || 0);
  if (pairQty > 0 && savedSecs > 0) {
    const totalVnd = Math.round(savedSecs * 12.5) * pairQty;
    return totalVnd;
  }

  const effVnd = Number(p.efficiency_value_vnd || 0);
  if (effVnd > 0) {
    return effVnd;
  }

  if (p.value !== undefined && p.value !== null && Number(p.value) > 0) {
    return Number(p.value) * 1000000;
  }
  if (p.estimated_value !== undefined && p.estimated_value !== null && Number(p.estimated_value) > 0) {
    return Number(p.estimated_value) * 1000000;
  }

  return 0;
}

export function getProposalValueTr(p: any): number {
  const vnd = getProposalValueVnd(p);
  return vnd / 1000000;
}

export function normalizeRegion(p: any): StandardRegion {
  if (!p) return "Nhà Máy Miền Đông";

  let regStr = "";
  let factoryStr = "";
  let sourceRegStr = "";
  let deptStr = "";
  let siteCode = "";

  if (typeof p === "string") {
    regStr = p;
  } else if (typeof p === "object") {
    regStr = String(p.region || "");
    factoryStr = String(p.factory || "");
    sourceRegStr = String(p.source_region || "");
    deptStr = String(p.department || "");
    siteCode = String(p.site_code || "");
  }

  // Step 1: Check region/factory FIRST (the primary location field)
  // This is the field that indicates the physical production area
  const regionUpper = `${regStr} ${factoryStr}`.toUpperCase();
  const sourceRegUpper = sourceRegStr.toUpperCase();
  const deptUpper = deptStr.toUpperCase();

  if (!regionUpper.trim() && !sourceRegUpper.trim() && !deptUpper.trim()) {
    return "Nhà Máy Miền Đông";
  }

  // 1. Check Hoàn Thiện Đế (region/factory takes priority)
  if (
    regionUpper.includes("HOÀN THIỆN ĐẾ") ||
    regionUpper.includes("HOAN THIEN DE") ||
    regionUpper.includes("HTĐ") ||
    regionUpper.includes("HTD")
  ) {
    return "Hoàn thiện đế";
  }

  // 2. Check specific Kiên Giang 1, 2, 3 (region/factory takes priority)
  if (
    regionUpper.includes("KIÊN GIANG 1") ||
    regionUpper.includes("KIEN GIANG 1") ||
    regionUpper.includes("KG 1") ||
    regionUpper.includes("KG1")
  ) {
    return "Kiên Giang 1";
  }

  if (
    regionUpper.includes("KIÊN GIANG 2") ||
    regionUpper.includes("KIEN GIANG 2") ||
    regionUpper.includes("KG 2") ||
    regionUpper.includes("KG2")
  ) {
    return "Kiên Giang 2";
  }

  if (
    regionUpper.includes("KIÊN GIANG 3") ||
    regionUpper.includes("KIEN GIANG 3") ||
    regionUpper.includes("KG 3") ||
    regionUpper.includes("KG3")
  ) {
    return "Kiên Giang 3";
  }

  // 3. Flat mapping for THKG units
  const combinedForDept = `${regionUpper} ${deptUpper} ${sourceRegUpper}`;
  if (combinedForDept.includes("PHÒNG CI") || combinedForDept.includes("PHONG CI")) return "Phòng CI";
  if (combinedForDept.includes("PHÒNG CN") || combinedForDept.includes("PHONG CN")) return "Phòng CN";
  if (combinedForDept.includes("PHÒNG KẾ HOẠCH") || combinedForDept.includes("PHONG KE HOACH")) return "Phòng kế hoạch";
  if (combinedForDept.includes("PHÒNG CHẤT LƯỢNG") || combinedForDept.includes("PHONG CHAT LUONG")) return "Phòng chất lượng";
  if (combinedForDept.includes("PHÒNG NHÂN SỰ") || combinedForDept.includes("PHONG NHAN SU")) return "Phòng nhân sự";
  if (combinedForDept.includes("PHÒNG KỸ THUẬT") || combinedForDept.includes("PHONG KY THUAT")) return "Chưa phân loại";
  if (combinedForDept.includes("PHÒNG TÀI CHÍNH") || combinedForDept.includes("PHONG TAI CHINH")) return "Chưa phân loại";
  if (combinedForDept.includes("PHÒNG HÀNH CHÍNH") || combinedForDept.includes("PHONG HANH CHINH")) return "Chưa phân loại";

  // 4. Check Hoàn Thiện Đế from department/source_region (fallback)
  if (
    deptUpper.includes("HOÀN THIỆN ĐẾ") || deptUpper.includes("HOAN THIEN DE") ||
    deptUpper.includes("HTĐ") || deptUpper.includes("HTD") ||
    sourceRegUpper.includes("HOÀN THIỆN ĐẾ") || sourceRegUpper.includes("HTĐ")
  ) {
    return "Hoàn thiện đế";
  }

  // 5. Check Miền Đông (explicit)
  const fullCombined = `${regionUpper} ${sourceRegUpper} ${deptUpper}`;
  if (
    fullCombined.includes("MIỀN ĐÔNG") ||
    fullCombined.includes("MIEN DONG") ||
    fullCombined.includes("NMMĐ") ||
    fullCombined.includes("NMMD")
  ) {
    return "Nhà Máy Miền Đông";
  }

  // 6. Check Văn phòng Chuỗi (explicit)
  if (
    fullCombined.includes("VP CHUỖI") ||
    fullCombined.includes("VP CHUOI") ||
    fullCombined.includes("VĂN PHÒNG CHUỖI") ||
    fullCombined.includes("VAN PHONG CHUOI") ||
    fullCombined.includes("SUPPLY CHAIN") ||
    fullCombined.includes("SKECHERS")
  ) {
    // If site_code is thkiengiangshoes and no Mien Dong mention -> THKG
    if (siteCode === "thkiengiangshoes" && !fullCombined.includes("MIỀN ĐÔNG")) {
      return "Phòng Ban THKG";
    }
    return "Văn phòng Chuỗi";
  }

  // 7. Site code or KIÊN GIANG general fallback
  if (siteCode === "thkiengiangshoes" || fullCombined.includes("KIÊN GIANG") || fullCombined.includes("THKG")) {
    return "Chưa phân loại";
  }

  // Default fallback
  return "Nhà Máy Miền Đông";
}

export function isTHKGRegion(region: string): boolean {
  const norm = typeof region === "string" ? region : normalizeRegion(region);
  return (
    norm === "Kiên Giang 1" ||
    norm === "Kiên Giang 2" ||
    norm === "Kiên Giang 3" ||
    norm === "Hoàn thiện đế" ||
    norm === "Phòng CI" ||
    norm === "Phòng CN" ||
    norm === "Phòng kế hoạch" ||
    norm === "Phòng chất lượng" ||
    norm === "Phòng nhân sự" ||
    norm === "Phòng Ban THKG" ||
    norm === "Chưa phân loại"
  );
}

export function matchRegionFilter(propRegionOrObj: any, filterRegion: string): boolean {
  if (!filterRegion || filterRegion === "ALL") return true;
  if (!propRegionOrObj) return false;

  const norm = normalizeRegion(propRegionOrObj);
  const filterClean = filterRegion.replace(/\+/g, " ").trim();
  const filterUpper = filterClean.toUpperCase();

  if (filterUpper === "THKG" || filterUpper.includes("TỔ HỢP KIÊN GIANG") || filterUpper.includes("TỔ HỢP MIỀN NAM") || filterUpper.includes("TO HOP MIEN NAM")) {
    return isTHKGRegion(norm);
  }

  if (filterUpper.includes("MIỀN ĐÔNG") || filterUpper.includes("NMMĐ") || filterUpper.includes("NMMD")) {
    return norm === "Nhà Máy Miền Đông";
  }

  if (filterUpper.includes("VĂN PHÒNG CHUỖI") || filterUpper.includes("VP CHUỖI") || filterUpper.includes("VP CHUOI")) {
    return norm === "Văn phòng Chuỗi";
  }

  if (filterUpper.includes("PHÒNG BAN THKG") || filterUpper.includes("PHONG BAN THKG")) {
    return (
      norm === "Phòng CI" ||
      norm === "Phòng CN" ||
      norm === "Phòng kế hoạch" ||
      norm === "Phòng chất lượng" ||
      norm === "Phòng nhân sự" ||
      norm === "Phòng Ban THKG" ||
      norm === "Chưa phân loại"
    );
  }

  if (filterUpper.includes("HOÀN THIỆN ĐẾ") || filterUpper.includes("HOAN THIEN DE") || filterUpper.includes("HTĐ")) {
    return norm === "Hoàn thiện đế";
  }

  if (filterUpper.includes("KIÊN GIANG 1") || filterUpper.includes("KG 1") || filterUpper.includes("KG1")) {
    return norm === "Kiên Giang 1";
  }
  if (filterUpper.includes("KIÊN GIANG 2") || filterUpper.includes("KG 2") || filterUpper.includes("KG2")) {
    return norm === "Kiên Giang 2";
  }
  if (filterUpper.includes("KIÊN GIANG 3") || filterUpper.includes("KG 3") || filterUpper.includes("KG3")) {
    return norm === "Kiên Giang 3";
  }

  return norm.toUpperCase() === filterUpper || norm === filterRegion;
}

