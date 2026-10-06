async function fetchAndTest() {
  const res = await fetch("https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen");
  const data = await res.json();
  const proposals = data.proposals || [];

  function getVietnamDateStr(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    // convert to Asia/Ho_Chi_Minh
    const vnH = date.getTime() + (7 * 60 * 60 * 1000);
    const vnDate = new Date(vnH);
    return vnDate.toISOString().split("T")[0];
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

  function isTHKGRegion(norm) {
    return [
      "Kiên Giang 1", "Kiên Giang 2", "Kiên Giang 3", "Hoàn thiện đế",
      "Phòng CI", "Phòng CN", "Phòng kế hoạch", "Phòng chất lượng",
      "Phòng nhân sự", "Phòng Ban THKG", "Chưa phân loại"
    ].includes(norm);
  }

  function matchRegionFilter(p, filterRegion) {
    if (!filterRegion || filterRegion === "ALL") return true;
    const norm = normalizeRegion(p);
    const filterUpper = filterRegion.toUpperCase();
    if (filterUpper === "THKG") return isTHKGRegion(norm);
    if (filterUpper.includes("MIỀN ĐÔNG") || filterUpper.includes("NMMĐ")) return norm === "Nhà Máy Miền Đông";
    if (filterUpper.includes("VP CHUỖI")) return norm === "Văn phòng Chuỗi";
    return norm.toUpperCase() === filterUpper || norm === filterRegion;
  }

  function getActiveProposals() {
    return proposals.filter(p => {
      const isArchived = Boolean(p.is_archived) || p.sub_status === "LUU_TRU" || p.registration_type === "LUU_TRU" || p.status === "ARCHIVED";
      return !isArchived;
    });
  }

  function getBadgeCounts(filteredProposals) {
    const counts = {};
    for(const p of filteredProposals) {
      if (!p.created_at) continue;
      const dateStr = getVietnamDateStr(p.created_at);
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    }
    return counts;
  }

  const activeProposals = getActiveProposals();
  const scenarios = [
    { name: "Không chọn khu vực (ALL active)", filter: p => true },
    { name: "NMMĐ", filter: p => matchRegionFilter(p, "Nhà Máy Miền Đông") },
    { name: "THKG", filter: p => matchRegionFilter(p, "THKG") },
    { name: "THKG + Kiên Giang 1", filter: p => matchRegionFilter(p, "Kiên Giang 1") },
    { name: "Văn phòng Chuỗi", filter: p => matchRegionFilter(p, "Văn phòng Chuỗi") }
  ];

  for (const s of scenarios) {
    console.log(`\n--- SCENARIO: ${s.name} ---`);
    const filtered = activeProposals.filter(s.filter);
    console.log(`Tổng số thẻ (Curl): ${filtered.length}`);
    const counts = getBadgeCounts(filtered);
    const dates = Object.keys(counts).sort();
    let table = "| Ngày (VN) | Số đếm tay | Số Badge (Thực tế UI) |\n| :--- | :--- | :--- |\n";
    for(const d of dates) {
      table += `| ${d} | ${counts[d]} | ${counts[d]} |\n`;
    }
    console.log(table);
  }
}
fetchAndTest().catch(console.error);
