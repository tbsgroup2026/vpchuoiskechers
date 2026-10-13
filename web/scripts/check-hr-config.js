// Cảnh báo (không fail) khi build nếu còn hằng số pháp lý verified:false. GO_LIVE=1 → exit 1.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../src/lib/hrConfig.ts'), 'utf-8');
const entries = [...src.matchAll(/^  ([A-Z_0-9]+): \{\s*$/gm)].map((m) => m[1]);
const unverified = [];
for (const key of entries) {
  const start = src.indexOf(`  ${key}: {`);
  const block = src.slice(start, src.indexOf('} as ConfigEntry', start));
  // chỉ xét verified ở mức entry (không phải trong candidate)
  const top = block.split('candidate:')[0];
  if (/verified:\s*false/.test(top)) unverified.push(key);
}
if (unverified.length) {
  console.warn(`\n⚠️  [check-hr-config] ${unverified.length} hằng số CHƯA XÁC MINH: ${unverified.join(', ')}`);
  if (process.env.GO_LIVE === '1') {
    console.error('[check-hr-config] GO_LIVE=1: chặn build.');
    process.exit(1);
  }
} else {
  console.log('[check-hr-config] Tất cả hằng số verified:true');
}
