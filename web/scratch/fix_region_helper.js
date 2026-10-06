const fs = require('fs');
let helper = fs.readFileSync('src/lib/kaizenRegionHelper.ts', 'utf8');

helper = helper.replace(
  /export const STANDARD_DASHBOARD_REGIONS = \[\s*"Văn phòng Chuỗi",\s*"Nhà Máy Miền Đông",\s*"Phòng Ban THKG",\s*"Kiên Giang 1",\s*"Kiên Giang 2",\s*"Kiên Giang 3",\s*"Hoàn Thiện Đế",\s*\] as const;/,
  `export const STANDARD_DASHBOARD_REGIONS = [
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
  "Chưa phân loại"
] as const;`
);

helper = helper.replace(
  /\/\/ 3\. Check Phòng Ban THKG — match on region OR department[\s\S]*?return "Phòng Ban THKG";\s*}/,
  `// 3. Flat mapping for THKG units
  if (combinedForDept.includes("PHÒNG CI") || combinedForDept.includes("PHONG CI")) return "Phòng CI";
  if (combinedForDept.includes("PHÒNG CN") || combinedForDept.includes("PHONG CN")) return "Phòng CN";
  if (combinedForDept.includes("PHÒNG KẾ HOẠCH") || combinedForDept.includes("PHONG KE HOACH")) return "Phòng kế hoạch";
  if (combinedForDept.includes("PHÒNG CHẤT LƯỢNG") || combinedForDept.includes("PHONG CHAT LUONG")) return "Phòng chất lượng";
  if (combinedForDept.includes("PHÒNG NHÂN SỰ") || combinedForDept.includes("PHONG NHAN SU")) return "Phòng nhân sự";
  if (combinedForDept.includes("PHÒNG KỸ THUẬT") || combinedForDept.includes("PHONG KY THUAT")) return "Chưa phân loại";
  if (combinedForDept.includes("PHÒNG TÀI CHÍNH") || combinedForDept.includes("PHONG TAI CHINH")) return "Chưa phân loại";
  if (combinedForDept.includes("PHÒNG HÀNH CHÍNH") || combinedForDept.includes("PHONG HANH CHINH")) return "Chưa phân loại";`
);

helper = helper.replace(/return "Hoàn Thiện Đế";/g, 'return "Hoàn thiện đế";');
helper = helper.replace(/norm === "Hoàn Thiện Đế"/g, 'norm === "Hoàn thiện đế"');
helper = helper.replace(/norm === "Phòng Ban THKG"/g, 'false');

helper = helper.replace(
  /if \(siteCode === "thkiengiangshoes" \|\| fullCombined\.includes\("KIÊN GIANG"\) \|\| fullCombined\.includes\("THKG"\)\) {\s*return "Phòng Ban THKG";\s*}/,
  `if (siteCode === "thkiengiangshoes" || fullCombined.includes("KIÊN GIANG") || fullCombined.includes("THKG")) {
    return "Chưa phân loại";
  }`
);

fs.writeFileSync('src/lib/kaizenRegionHelper.ts', helper);
console.log('Fixed kaizenRegionHelper.ts');
