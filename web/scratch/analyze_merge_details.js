const { execSync } = require('child_process');

// 1. Fetch DB_KG (thkiengiangshoes) all 75 rows
const cmdKg = `npx wrangler d1 execute thkiengiangshoes --remote --command="SELECT id, code, title, status, sub_status, review_status, approval_status, is_archived, created_at FROM ci_kaizen_proposals"`;
const outKg = execSync(cmdKg, { encoding: 'utf8' });
const jsonStartKg = outKg.indexOf('[');
const jsonEndKg = outKg.lastIndexOf(']');
const rowsKg = JSON.parse(outKg.substring(jsonStartKg, jsonEndKg + 1))[0].results;

// 2. Fetch local DB (vpchuoiskechers-db) all rows
const cmdLocal = `npx wrangler d1 execute vpchuoiskechers-db --remote --command="SELECT id, code, title, status, sub_status, review_status, approval_status, is_archived, region, site_code, created_at FROM ci_kaizen_proposals"`;
const outLocal = execSync(cmdLocal, { encoding: 'utf8' });
const jsonStartLocal = outLocal.indexOf('[');
const jsonEndLocal = outLocal.lastIndexOf(']');
const rowsLocal = JSON.parse(outLocal.substring(jsonStartLocal, jsonEndLocal + 1))[0].results;

console.log(`DB_KG Total Rows: ${rowsKg.length}`);
console.log(`Local DB Total Rows: ${rowsLocal.length}\n`);

// Helper to normalize key for deduplication
function getNormalizedKey(p) {
  const code = String(p.code || '').trim().toUpperCase();
  if (code && code.startsWith('KZ-2026-')) return code;
  const rawId = String(p.id || '').trim();
  const cleanId = rawId.replace(/^tkg_/, '').trim().toUpperCase();
  return cleanId;
}

// Map DB_KG items by normalized key
const kgMap = new Map();
rowsKg.forEach(r => {
  const key = getNormalizedKey(r);
  kgMap.set(key, r);
});

// Identify Local THKG items (not NMMD / VP Chuoi)
function isLocalThkg(p) {
  if (p.site_code === 'thkiengiangshoes') return true;
  const code = String(p.code || '').trim().toUpperCase();
  if (code.startsWith('KZ-2026-')) return true;
  const reg = String(p.region || '').toUpperCase();
  if (reg.includes('MIỀN ĐÔNG') || reg.includes('NMMĐ') || reg.includes('CHUỖI')) return false;
  return reg.includes('KIÊN GIANG') || reg.includes('KG') || reg.includes('HOÀN THIỆN') || reg.includes('HTD') || reg.includes('PHÒNG');
}

const localThkgRows = rowsLocal.filter(isLocalThkg);
console.log(`Local THKG Rows in env.DB: ${localThkgRows.length}`);

// Check overlap vs local-only
const overlappingLocal = [];
const localOnlyRows = [];

localThkgRows.forEach(r => {
  const key = getNormalizedKey(r);
  if (kgMap.has(key)) {
    overlappingLocal.push({ local: r, kg: kgMap.get(key) });
  } else {
    localOnlyRows.push(r);
  }
});

console.log(`Overlapping Local THKG Rows (exist in DB_KG): ${overlappingLocal.length}`);
console.log(`Local-ONLY THKG Rows (exist ONLY in env.DB): ${localOnlyRows.length}\n`);

console.log('=== LIST OF LOCAL-ONLY THKG ROWS ===');
localOnlyRows.forEach((r, i) => {
  console.log(`${i + 1}. ID: ${r.id} | Code: ${r.code || 'N/A'} | Title: "${r.title}" | Status: ${r.status}/${r.sub_status} | Created: ${r.created_at}`);
});

console.log('\n=== MAPPING ANALYSIS FOR DB_KG ROWS (Check if any DB_KG row was modified or dropped) ===');
let activeKgCount = 0;
let archivedKgCount = 0;

rowsKg.forEach((kgRow, idx) => {
  const isArch = Boolean(kgRow.is_archived);
  if (isArch) archivedKgCount++;
  else activeKgCount++;
});

console.log(`DB_KG Active Rows: ${activeKgCount} | Archived Rows: ${archivedKgCount}`);
