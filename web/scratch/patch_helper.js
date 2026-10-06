const fs = require('fs');
let code = fs.readFileSync('src/lib/kaizenRegionHelper.ts', 'utf8');

let target1 = `export function isTHKGRegion(region: string): boolean {
  const norm = typeof region === "string" ? region : normalizeRegion(region);
  return (
    false ||
    norm === "Kiên Giang 1" ||
    norm === "Kiên Giang 2" ||
    norm === "Kiên Giang 3" ||
    norm === "Hoàn thiện đế"
  );
}`;

let rep1 = `export function isTHKGRegion(region: string): boolean {
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
}`;

let target2 = `  if (filterUpper.includes("PHÒNG BAN THKG") || filterUpper.includes("PHONG BAN THKG")) {
    return false;
  }`;

let rep2 = `  if (filterUpper.includes("PHÒNG BAN THKG") || filterUpper.includes("PHONG BAN THKG")) {
    return (
      norm === "Phòng CI" ||
      norm === "Phòng CN" ||
      norm === "Phòng kế hoạch" ||
      norm === "Phòng chất lượng" ||
      norm === "Phòng nhân sự" ||
      norm === "Phòng Ban THKG" ||
      norm === "Chưa phân loại"
    );
  }`;

let codeNormalized = code.replace(/\r\n/g, '\n');
let t1 = target1.replace(/\r\n/g, '\n');
let t2 = target2.replace(/\r\n/g, '\n');

if (codeNormalized.includes(t1)) {
  codeNormalized = codeNormalized.replace(t1, rep1.replace(/\r\n/g, '\n'));
  console.log('Replaced chunk 1');
}

if (codeNormalized.includes(t2)) {
  codeNormalized = codeNormalized.replace(t2, rep2.replace(/\r\n/g, '\n'));
  console.log('Replaced chunk 2');
}

fs.writeFileSync('src/lib/kaizenRegionHelper.ts', codeNormalized);
