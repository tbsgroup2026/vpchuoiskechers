const { execSync } = require('child_process');
const cmdKg = `npx wrangler d1 execute thkiengiangshoes --remote --command="SELECT id, code, is_archived FROM ci_kaizen_proposals"`;
const outKg = execSync(cmdKg, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
const jsonStartKg = outKg.indexOf('[');
const jsonEndKg = outKg.lastIndexOf(']');
const rowsKg = JSON.parse(outKg.substring(jsonStartKg, jsonEndKg + 1))[0].results;

function getDedupeKey(p) {
  const code = String(p.code || '').trim().toUpperCase();
  if (code && code.startsWith('KZ-2026-')) return code;
  const rawId = String(p.id || '').trim().toUpperCase();
  return rawId.replace(/^TKG_/, '');
}

console.log('Total DB_KG rows:', rowsKg.length);
const keySet = new Set();
rowsKg.forEach(p => {
  const k = getDedupeKey(p);
  if (keySet.has(k)) console.log('Duplicate key in DB_KG:', k, p.id, p.code);
  keySet.add(k);
});
console.log('Unique dedupe keys in DB_KG:', keySet.size);
