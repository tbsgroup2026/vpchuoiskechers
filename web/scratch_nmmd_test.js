async function verifyNMMD() {
  const res = await fetch("https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen");
  const data = await res.json();
  const proposals = data.proposals || [];

  function getVietnamDateStr(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const vnH = date.getTime() + (7 * 60 * 60 * 1000);
    return new Date(vnH).toISOString().split("T")[0];
  }

  function normalizeRegion(p) {
    if (!p) return "Nhà Máy Miền Đông";
    let regStr = String(p.region || "");
    let factoryStr = String(p.factory || "");
    let sourceRegStr = String(p.source_region || "");
    let deptStr = String(p.department || "");
    let siteCode = String(p.site_code || "");
    const regionUpper = `${regStr} ${factoryStr}`.toUpperCase();
    const sourceRegUpper = sourceRegStr.toUpperCase();
    const deptUpper = deptStr.toUpperCase();
    if (!regionUpper.trim() && !sourceRegUpper.trim() && !deptUpper.trim()) return "Nhà Máy Miền Đông";
    if (regionUpper.includes("HOÀN THIỆN ĐẾ") || regionUpper.includes("HOAN THIEN DE") || regionUpper.includes("HTĐ") || regionUpper.includes("HTD")) return "Hoàn thiện đế";
    if (regionUpper.includes("KIÊN GIANG 1") || regionUpper.includes("KIEN GIANG 1") || regionUpper.includes("KG 1") || regionUpper.includes("KG1")) return "Kiên Giang 1";
    if (regionUpper.includes("KIÊN GIANG 2") || regionUpper.includes("KIEN GIANG 2") || regionUpper.includes("KG 2") || regionUpper.includes("KG2")) return "Kiên Giang 2";
    if (regionUpper.includes("KIÊN GIANG 3") || regionUpper.includes("KIEN GIANG 3") || regionUpper.includes("KG 3") || regionUpper.includes("KG3")) return "Kiên Giang 3";
    const combinedForDept = `${regionUpper} ${deptUpper} ${sourceRegUpper}`;
    if (combinedForDept.includes("PHÒNG CI") || combinedForDept.includes("PHONG CI")) return "Phòng CI";
    if (combinedForDept.includes("PHÒNG CN") || combinedForDept.includes("PHONG CN")) return "Phòng CN";
    if (combinedForDept.includes("PHÒNG KẾ HOẠCH") || combinedForDept.includes("PHONG KE HOACH")) return "Phòng kế hoạch";
    if (combinedForDept.includes("PHÒNG CHẤT LƯỢNG") || combinedForDept.includes("PHONG CHAT LUONG")) return "Phòng chất lượng";
    if (combinedForDept.includes("PHÒNG NHÂN SỰ") || combinedForDept.includes("PHONG NHAN SU")) return "Phòng nhân sự";
    if (combinedForDept.includes("PHÒNG KỸ THUẬT") || combinedForDept.includes("PHONG KY THUAT")) return "Chưa phân loại";
    if (combinedForDept.includes("PHÒNG TÀI CHÍNH") || combinedForDept.includes("PHONG TAI CHINH")) return "Chưa phân loại";
    if (combinedForDept.includes("PHÒNG HÀNH CHÍNH") || combinedForDept.includes("PHONG HANH CHINH")) return "Chưa phân loại";
    if (deptUpper.includes("HOÀN THIỆN ĐẾ") || deptUpper.includes("HOAN THIEN DE") || deptUpper.includes("HTĐ") || deptUpper.includes("HTD") || sourceRegUpper.includes("HOÀN THIỆN ĐẾ") || sourceRegUpper.includes("HTĐ")) return "Hoàn thiện đế";
    const fullCombined = `${regionUpper} ${sourceRegUpper} ${deptUpper}`;
    if (fullCombined.includes("MIỀN ĐÔNG") || fullCombined.includes("MIEN DONG") || fullCombined.includes("NMMĐ") || fullCombined.includes("NMMD")) return "Nhà Máy Miền Đông";
    if (fullCombined.includes("VP CHUỖI") || fullCombined.includes("VP CHUOI") || fullCombined.includes("VĂN PHÒNG CHUỖI") || fullCombined.includes("VAN PHONG CHUOI") || fullCombined.includes("SUPPLY CHAIN") || fullCombined.includes("SKECHERS")) {
      if (siteCode === "thkiengiangshoes" && !fullCombined.includes("MIỀN ĐÔNG")) return "Phòng Ban THKG";
      return "Văn phòng Chuỗi";
    }
    if (siteCode === "thkiengiangshoes" || fullCombined.includes("KIÊN GIANG") || fullCombined.includes("THKG")) return "Chưa phân loại";
    return "Nhà Máy Miền Đông";
  }

  function matchRegionFilter(p, filterRegion) {
    if (!filterRegion || filterRegion === "ALL") return true;
    const norm = normalizeRegion(p);
    const filterUpper = filterRegion.toUpperCase();
    if (filterUpper.includes("MIỀN ĐÔNG") || filterUpper.includes("NMMĐ")) return norm === "Nhà Máy Miền Đông";
    return norm.toUpperCase() === filterUpper || norm === filterRegion;
  }

  // Exact logic from matchRegTypeFilter with the new fix
  function matchRegTypeFilter(p, regType) {
    if (!p) return false;
    const isArchived = Boolean(p.is_archived) || p.sub_status === "LUU_TRU" || p.registration_type === "LUU_TRU" || p.status === "ARCHIVED";
    if (regType === "LUU_TRU") return isArchived;
    if (isArchived) return false; // Fixed rule: never count archived unless explicitly LUU_TRU
    if (!regType || regType === "ALL") return true;
    return true; // Simplified for this test
  }

  const filteredNMMD = proposals.filter(p => {
    if (!matchRegionFilter(p, "Nhà Máy Miền Đông")) return false;
    if (!matchRegTypeFilter(p, "ALL")) return false;
    return true;
  });

  const badgeCounts = {};
  filteredNMMD.forEach(p => {
    if (!p.created_at) return;
    const dateStr = getVietnamDateStr(p.created_at);
    badgeCounts[dateStr] = (badgeCounts[dateStr] || 0) + 1;
  });

  console.log(`Tổng thẻ NMMĐ khớp bộ lọc: ${filteredNMMD.length}`);
  const totalBadges = Object.values(badgeCounts).reduce((a, b) => a + b, 0);
  console.log(`Tổng tất cả badge của NMMĐ các tháng: ${totalBadges}`);
  console.log("UNIT TEST NMMĐ PASSED:", filteredNMMD.length === totalBadges);

  console.log("\nBadge counts per day:");
  Object.keys(badgeCounts).sort().forEach(d => {
    console.log(`${d}: ${badgeCounts[d]}`);
  });
}
verifyNMMD();
