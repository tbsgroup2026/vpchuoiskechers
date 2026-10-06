const { execSync } = require('child_process');
const cmdKg = `npx wrangler d1 execute thkiengiangshoes --remote --command="SELECT id, code, legacy_code, title FROM ci_kaizen_proposals WHERE code LIKE '%2026-PHNG-BPHN-0023%' OR legacy_code LIKE '%2026-PHNG-BPHN-0023%' OR id LIKE '%1789381483636%'"`;
const outKg = execSync(cmdKg, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
const jsonStartKg = outKg.indexOf('[');
const jsonEndKg = outKg.lastIndexOf(']');
const rowsKg = JSON.parse(outKg.substring(jsonStartKg, jsonEndKg + 1))[0].results;
console.log('DB_KG matching row:', rowsKg);
