import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const mappingPath = path.resolve(process.cwd(), 'migration/url_mapping.json');
if (!fs.existsSync(mappingPath)) {
  console.error('❌ Không tìm thấy migration/url_mapping.json');
  process.exit(1);
}

const rawMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const mappingList = Array.isArray(rawMapping) ? rawMapping : Object.values(rawMapping);

// Build quick lookup dictionary by public_id and by old_url
const mapByPublicId = new Map();
const mapByOldUrl = new Map();

for (const item of mappingList) {
  if (item.status === 'success' || item.status?.startsWith('skipped')) {
    if (item.public_id) {
      mapByPublicId.set(item.public_id, item.new_url);
      // Also stripped public_id without prefix
      const strippedId = item.public_id.split('/').pop();
      if (strippedId) mapByPublicId.set(strippedId, item.new_url);
    }
    if (item.old_url) {
      mapByOldUrl.set(item.old_url, item.new_url);
      // Without protocol
      mapByOldUrl.set(item.old_url.replace(/^https?:\/\//, ''), item.new_url);
    }
  }
}

console.log('======================================================');
console.log('🔎 D1 CLOUDINARY -> R2 URL SCAN & DRY-RUN PLANNER');
console.log(`📦 Số lượng URL R2 đã map: ${mapByPublicId.size}`);
console.log('======================================================\n');

// List candidate tables and columns
const targets = [
  { table: 'ci_kaizen_proposals', columns: ['before_image_url', 'after_image_url', 'attachments_json'] },
  { table: 'hr_employees', columns: ['avatar'] },
  { table: 'pph_org', columns: ['image_url'] },
  { table: 'pph_shoe_models', columns: ['image_url'] },
  { table: 'pph_tv_media_slots', columns: ['media_url'] },
  { table: 'user_profile', columns: ['avatar_url'] },
  { table: 'task_card_attachments', columns: ['file_url'] },
  { table: 'task_attachments', columns: ['file_url'] },
];

const dryRunUpdates = [];

for (const target of targets) {
  for (const col of target.columns) {
    try {
      const sql = `SELECT id, ${col} FROM ${target.table} WHERE ${col} LIKE '%cloudinary%' LIMIT 200;`;
      const cmd = `npx wrangler d1 execute vpchuoiskechers-db --remote --json --command="${sql}"`;
      const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      
      const parsed = JSON.parse(stdout);
      const rows = parsed[0]?.results || [];
      
      if (rows.length > 0) {
        console.log(`📌 Tìm thấy ${rows.length} dòng chứa Cloudinary trong [${target.table}.${col}]`);
        for (const row of rows) {
          const val = row[col];
          dryRunUpdates.push({
            table: target.table,
            column: col,
            id: row.id,
            oldValue: val,
          });
        }
      }
    } catch (e) {
      // Table or column might not exist or be empty
    }
  }
}

console.log(`\n📊 Tổng số trường cần cập nhật: ${dryRunUpdates.length}`);

// Preview first 5
console.log('\n--- VÍ DỤ 5 TRƯỜNG BIẾN ĐỔI ---');
dryRunUpdates.slice(0, 5).forEach((u, i) => {
  console.log(`[${i + 1}] Bảng: ${u.table}.${u.column} (ID: ${u.id})`);
  console.log(`    Cũ: ${u.oldValue.slice(0, 100)}...`);
});

// Save dry-run report
fs.writeFileSync(
  path.resolve(process.cwd(), 'migration/d1_dry_run_report.json'),
  JSON.stringify(dryRunUpdates, null, 2),
  'utf8'
);
console.log('\n✅ Báo cáo chi tiết đã lưu vào migration/d1_dry_run_report.json');
