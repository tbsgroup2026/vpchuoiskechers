const fs = require('fs');
let code = fs.readFileSync('src/modules/ci/CIModule.tsx', 'utf8');

const targetStr = `  const regionCounts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const subItem of REGION_SUB_ITEMS) {
      result[subItem] = 0;
    }`;

const repStr = `  const regionCounts = useMemo(() => {
    const result: Record<string, number> = {
      "Nhà Máy Miền Đông": 0,
      "Văn phòng Chuỗi": 0,
    };
    for (const subItem of REGION_SUB_ITEMS) {
      result[subItem] = 0;
    }`;

let codeNormalized = code.replace(/\r\n/g, '\n');
let tNormalized = targetStr.replace(/\r\n/g, '\n');

if (codeNormalized.includes(tNormalized)) {
  codeNormalized = codeNormalized.replace(tNormalized, repStr.replace(/\r\n/g, '\n'));
  fs.writeFileSync('src/modules/ci/CIModule.tsx', codeNormalized);
  console.log('Successfully patched CIModule.tsx');
} else {
  console.log('Could not find target in CIModule.tsx');
}
