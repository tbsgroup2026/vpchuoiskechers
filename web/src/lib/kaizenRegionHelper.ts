export const STANDARD_DASHBOARD_REGIONS = [
  "Văn phòng Chuỗi",
  "Nhà Máy Miền Đông",
  "Phòng Ban THKG",
  "Kiên Giang 1",
  "Kiên Giang 2",
  "Kiên Giang 3",
  "Hoàn Thiện Đế",
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

  const combined = `${regStr} ${factoryStr} ${sourceRegStr} ${deptStr}`.toUpperCase();
  if (!combined.trim()) return "Nhà Máy Miền Đông";

  // 1. Check Hoàn Thiện Đế
  if (
    combined.includes("HOÀN THIỆN ĐẾ") ||
    combined.includes("HOAN THIEN DE") ||
    combined.includes("HTĐ") ||
    combined.includes("HTD")
  ) {
    return "Hoàn Thiện Đế";
  }

  // 2. Check Kiên Giang 1, 2, 3
  if (
    combined.includes("KIÊN GIANG 1") ||
    combined.includes("KIEN GIANG 1") ||
    combined.includes("KG 1") ||
    combined.includes("KG1")
  ) {
    return "Kiên Giang 1";
  }

  if (
    combined.includes("KIÊN GIANG 2") ||
    combined.includes("KIEN GIANG 2") ||
    combined.includes("KG 2") ||
    combined.includes("KG2")
  ) {
    return "Kiên Giang 2";
  }

  if (
    combined.includes("KIÊN GIANG 3") ||
    combined.includes("KIEN GIANG 3") ||
    combined.includes("KG 3") ||
    combined.includes("KG3")
  ) {
    return "Kiên Giang 3";
  }

  // 3. Check Phòng Ban THKG
  if (
    combined.includes("PHÒNG CI") ||
    combined.includes("PHONG CI") ||
    combined.includes("PHÒNG CN") ||
    combined.includes("PHONG CN") ||
    combined.includes("PHÒNG KẾ HOẠCH") ||
    combined.includes("PHONG KE HOACH") ||
    combined.includes("PHÒNG CHẤT LƯỢNG") ||
    combined.includes("PHONG CHAT LUONG") ||
    combined.includes("PHÒNG NHÂN SỰ") ||
    combined.includes("PHONG NHAN SU") ||
    combined.includes("PHÒNG BAN THKG") ||
    combined.includes("PHONG BAN THKG")
  ) {
    return "Phòng Ban THKG";
  }

  // 4. Check Miền Đông (explicit)
  if (
    combined.includes("MIỀN ĐÔNG") ||
    combined.includes("MIEN DONG") ||
    combined.includes("NMMĐ") ||
    combined.includes("NMMD")
  ) {
    return "Nhà Máy Miền Đông";
  }

  // 5. Check Văn phòng Chuỗi (explicit)
  if (
    combined.includes("VP CHUỖI") ||
    combined.includes("VP CHUOI") ||
    combined.includes("VĂN PHÒNG CHUỖI") ||
    combined.includes("VAN PHONG CHUOI") ||
    combined.includes("SUPPLY CHAIN") ||
    combined.includes("SKECHERS")
  ) {
    // If it mentions VP CHUỖI but site_code is thkiengiangshoes and no Mien Dong mention -> THKG
    if (siteCode === "thkiengiangshoes" && !combined.includes("MIỀN ĐÔNG")) {
      return "Phòng Ban THKG";
    }
    return "Văn phòng Chuỗi";
  }

  // 6. Site code or KIÊN GIANG general fallback
  if (siteCode === "thkiengiangshoes" || combined.includes("KIÊN GIANG") || combined.includes("THKG")) {
    return "Phòng Ban THKG";
  }

  // Default fallback
  return "Nhà Máy Miền Đông";
}

export function isTHKGRegion(region: string): boolean {
  const norm = typeof region === "string" ? region : normalizeRegion(region);
  return (
    norm === "Phòng Ban THKG" ||
    norm === "Kiên Giang 1" ||
    norm === "Kiên Giang 2" ||
    norm === "Kiên Giang 3" ||
    norm === "Hoàn Thiện Đế"
  );
}
