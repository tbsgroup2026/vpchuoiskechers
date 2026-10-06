const { execSync } = require('child_process');
const cmdKg = `npx wrangler d1 execute thkiengiangshoes --remote --command="SELECT id, code, site_code, _source, status, sub_status FROM ci_kaizen_proposals WHERE id = 'ci_1789381483636_wtuhf'"`;
const outKg = execSync(cmdKg, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
const jsonStartKg = outKg.indexOf('[');
const jsonEndKg = outKg.lastIndexOf(']');
const rowsKg = JSON.parse(outKg.substring(jsonStartKg, jsonEndKg + 1))[0].results;
console.log('Site A DB row for item 53:', rowsKg);
