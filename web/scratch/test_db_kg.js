const { execSync } = require('child_process');
const cmd = `npx wrangler d1 execute thkiengiangshoes --remote --command="SELECT id, code, is_archived, sub_status, region, department FROM ci_kaizen_proposals WHERE is_archived = 0 OR is_archived IS NULL ORDER BY rowid DESC LIMIT 500"`;
const out = execSync(cmd, { encoding: 'utf8' });
const jsonStart = out.indexOf('[');
const jsonEnd = out.lastIndexOf(']');
const jsonStr = out.substring(jsonStart, jsonEnd + 1);
const parsed = JSON.parse(jsonStr);
const rows = parsed[0].results;
console.log('Query result count:', rows.length);

const resultMap = new Map();
rows.forEach(p => {
  const key = String(p.code || p.id).trim().toUpperCase();
  resultMap.set(key, p);
});
console.log('Map size:', resultMap.size);
