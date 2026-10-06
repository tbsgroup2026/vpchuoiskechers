async function fetchAndCount() {
  const res = await fetch("https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen");
  const data = await res.json();
  const proposals = data.proposals || [];
  
  console.log("Total records:", proposals.length);
  
  const thkgRecords = proposals.filter(p => {
    const regUpper = `${p.region || ''} ${p.factory || ''}`.toUpperCase();
    const sourceRegUpper = `${p.source_region || ''}`.toUpperCase();
    const siteCode = `${p.site_code || ''}`;
    return regUpper.includes('THKG') || regUpper.includes('KIÊN GIANG') || regUpper.includes('KIEN GIANG') || siteCode === 'thkiengiangshoes';
  });
  
  console.log("THKG roughly matches:", thkgRecords.length);
  
  const countMap = {};
  for(let p of proposals) {
    const factory = p.factory || '';
    const region = p.region || '';
    const dept = p.department || '';
    const source_reg = p.source_region || '';
    const site = p.site_code || '';
    
    // exact logic from KaizenRegionHelper
    const regionUpper = `${region} ${factory}`.toUpperCase();
    const sourceRegUpper = source_reg.toUpperCase();
    const deptUpper = dept.toUpperCase();
    const combinedForDept = `${regionUpper} ${deptUpper} ${sourceRegUpper}`;
    const fullCombined = `${regionUpper} ${sourceRegUpper} ${deptUpper}`;
    
    let norm = "Nhà Máy Miền Đông";
    
    if (regionUpper.includes("HOÀN THIỆN ĐẾ") || regionUpper.includes("HOAN THIEN DE") || regionUpper.includes("HTĐ") || regionUpper.includes("HTD")) norm = "Hoàn thiện đế";
    else if (regionUpper.includes("KIÊN GIANG 1") || regionUpper.includes("KIEN GIANG 1") || regionUpper.includes("KG 1") || regionUpper.includes("KG1")) norm = "Kiên Giang 1";
    else if (regionUpper.includes("KIÊN GIANG 2") || regionUpper.includes("KIEN GIANG 2") || regionUpper.includes("KG 2") || regionUpper.includes("KG2")) norm = "Kiên Giang 2";
    else if (regionUpper.includes("KIÊN GIANG 3") || regionUpper.includes("KIEN GIANG 3") || regionUpper.includes("KG 3") || regionUpper.includes("KG3")) norm = "Kiên Giang 3";
    else if (combinedForDept.includes("PHÒNG CI") || combinedForDept.includes("PHONG CI")) norm = "Phòng CI";
    else if (combinedForDept.includes("PHÒNG CN") || combinedForDept.includes("PHONG CN")) norm = "Phòng CN";
    else if (combinedForDept.includes("PHÒNG KẾ HOẠCH") || combinedForDept.includes("PHONG KE HOACH")) norm = "Phòng kế hoạch";
    else if (combinedForDept.includes("PHÒNG CHẤT LƯỢNG") || combinedForDept.includes("PHONG CHAT LUONG")) norm = "Phòng chất lượng";
    else if (combinedForDept.includes("PHÒNG NHÂN SỰ") || combinedForDept.includes("PHONG NHAN SU")) norm = "Phòng nhân sự";
    else if (combinedForDept.includes("PHÒNG KỸ THUẬT") || combinedForDept.includes("PHONG KY THUAT")) norm = "Chưa phân loại";
    else if (combinedForDept.includes("PHÒNG TÀI CHÍNH") || combinedForDept.includes("PHONG TAI CHINH")) norm = "Chưa phân loại";
    else if (combinedForDept.includes("PHÒNG HÀNH CHÍNH") || combinedForDept.includes("PHONG HANH CHINH")) norm = "Chưa phân loại";
    else if (deptUpper.includes("HOÀN THIỆN ĐẾ") || deptUpper.includes("HOAN THIEN DE") || deptUpper.includes("HTĐ") || deptUpper.includes("HTD") || sourceRegUpper.includes("HOÀN THIỆN ĐẾ") || sourceRegUpper.includes("HTĐ")) norm = "Hoàn thiện đế";
    else if (fullCombined.includes("MIỀN ĐÔNG") || fullCombined.includes("MIEN DONG") || fullCombined.includes("NMMĐ") || fullCombined.includes("NMMD")) norm = "Nhà Máy Miền Đông";
    else if (fullCombined.includes("VP CHUỖI") || fullCombined.includes("VP CHUOI") || fullCombined.includes("VĂN PHÒNG CHUỖI") || fullCombined.includes("VAN PHONG CHUOI") || fullCombined.includes("SUPPLY CHAIN") || fullCombined.includes("SKECHERS")) {
      if (site === "thkiengiangshoes" && !fullCombined.includes("MIỀN ĐÔNG")) norm = "Phòng Ban THKG";
      else norm = "Văn phòng Chuỗi";
    }
    else if (site === "thkiengiangshoes" || fullCombined.includes("KIÊN GIANG") || fullCombined.includes("THKG")) norm = "Chưa phân loại";
    
    if (['Kiên Giang 1', 'Kiên Giang 2', 'Kiên Giang 3', 'Hoàn thiện đế', 'Phòng kế hoạch', 'Phòng CI', 'Phòng CN', 'Phòng chất lượng', 'Phòng nhân sự', 'Chưa phân loại', 'Phòng Ban THKG'].includes(norm)) {
      countMap[norm] = (countMap[norm] || 0) + 1;
      
      if (norm === 'Chưa phân loại' || norm === 'Phòng Ban THKG') {
        console.log(`Missing/Unclassified: id=${p.id}, factory=${factory}, region=${region}, dept=${dept}, site=${site}`);
      }
    }
  }
  
  console.log(countMap);
  const sum = Object.values(countMap).reduce((a,b)=>a+b, 0);
  console.log("Total THKG grouped:", sum);
}
fetchAndCount();
