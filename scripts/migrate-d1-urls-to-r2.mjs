import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const isDryRun = !args.includes('--apply'); // Default to dry-run unless --apply is passed
const targetDb = args.find((a) => a.startsWith('--db='))?.replace('--db=', '') || 'vpchuoiskechers-db';

const mappingPath = path.resolve(process.cwd(), 'migration/url_mapping.json');
const manifestPath = path.resolve(process.cwd(), 'migration/cloudinary_manifest.json');

if (!fs.existsSync(mappingPath)) {
  console.error('❌ Không tìm thấy migration/url_mapping.json');
  process.exit(1);
}

const rawMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const mappingList = Array.isArray(rawMapping) ? rawMapping : Object.values(rawMapping);

// Create mapping lookup table
// Key: public_id or filename -> new R2 url
const R2_PUBLIC_BASE = 'https://pub-4f6913e79588469588d95eecea9146ea.r2.dev';
const urlMap = new Map();

for (const m of mappingList) {
  if (m.public_id && m.new_url) {
    urlMap.set(m.public_id.toLowerCase(), m.new_url);
    const basename = m.public_id.split('/').pop().toLowerCase();
    urlMap.set(basename, m.new_url);
  }
  if (m.old_url && m.new_url) {
    urlMap.set(m.old_url, m.new_url);
  }
}

/**
 * Convert any Cloudinary URL to R2 URL
 */
function replaceCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim().replace(/^["']|["']$/g, '');
  if (!trimmed.includes('res.cloudinary.com')) return trimmed;

  // Exact match
  if (urlMap.has(trimmed)) return urlMap.get(trimmed);

  // Extract public ID from Cloudinary URL:
  // e.g. https://res.cloudinary.com/dwl2xtbqa/image/upload/v1789618174/cfmuoonrr6588qpuxpjj.jpg
  // or https://res.cloudinary.com/dwl2xtbqa/image/upload/f_auto,q_auto/v1789618174/folder/name.jpg
  const uploadIdx = trimmed.indexOf('/upload/');
  if (uploadIdx === -1) return trimmed;

  let pathAfterUpload = trimmed.substring(uploadIdx + 8);
  // Strip transformations (e.g. f_auto,q_auto/ or c_fill,w_480/ or v123456/)
  pathAfterUpload = pathAfterUpload.replace(/^[a-z0-9_.,:]+\//i, '');
  if (pathAfterUpload.startsWith('v') && /^v\d+\//.test(pathAfterUpload)) {
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
  }

  // Check lookup
  const cleanKey = pathAfterUpload.toLowerCase();
  const keyNoExt = cleanKey.replace(/\.[^/.]+$/, '');
  const basename = keyNoExt.split('/').pop();

  if (urlMap.has(cleanKey)) return urlMap.get(cleanKey);
  if (urlMap.has(keyNoExt)) return urlMap.get(keyNoExt);
  if (urlMap.has(basename)) return urlMap.get(basename);

  // Fallback: construct R2 URL directly preserving pathAfterUpload
  return `${R2_PUBLIC_BASE}/${pathAfterUpload}`;
}

function processValue(val) {
  if (!val || typeof val !== 'string') return val;
  const trimmed = val.trim();

  // 1. JSON Array (attachments_json)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const arr = JSON.parse(trimmed);
      let changed = false;
      const updated = arr.map((item) => {
        if (typeof item === 'string') {
          const replaced = replaceCloudinaryUrl(item);
          if (replaced !== item) changed = true;
          return replaced;
        } else if (item && typeof item === 'object' && item.url) {
          const replaced = replaceCloudinaryUrl(item.url);
          if (replaced !== item.url) {
            changed = true;
            return { ...item, url: replaced };
          }
        }
        return item;
      });
      return changed ? JSON.stringify(updated) : val;
    } catch {
      // Fall through to comma check
    }
  }

  // 2. Comma separated URLs
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    let changed = false;
    const updated = parts.map((part) => {
      const replaced = replaceCloudinaryUrl(part);
      if (replaced !== part) changed = true;
      return replaced;
    });
    return changed ? updated.join(',') : val;
  }

  // 3. Single URL
  return replaceCloudinaryUrl(trimmed);
}

import { execSync } from 'child_process';

const CF_ENV = {
  ...process.env,
  CLOUDFLARE_ACCOUNT_ID: 'd8fed64e5a98e31c99d967d9ff521dd6',
};

function queryD1(sql) {
  const stdout = execSync(`npx wrangler d1 execute ${targetDb} --remote --json --command="${sql}"`, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    env: CF_ENV,
  });

  const jsonStart = stdout.indexOf('[');
  const jsonEnd = stdout.lastIndexOf(']');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return JSON.parse(stdout.substring(jsonStart, jsonEnd + 1));
  }
  return JSON.parse(stdout);
}

function executeSqlFile(filePath) {
  const stdout = execSync(`npx wrangler d1 execute ${targetDb} --remote --file="${filePath}"`, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    env: CF_ENV,
  });
  return stdout;
}

async function main() {
  console.log('======================================================');
  console.log('🚀 D1 DATABASE CLOUDINARY -> R2 URL MIGRATION');
  console.log(`📌 Cơ sở dữ liệu mục tiêu: ${targetDb}`);
  console.log(`📌 Chế độ: ${isDryRun ? 'DRY-RUN (CHỈ XEM TRƯỚC, KHÔNG THAY ĐỔI DB)' : 'LIVE APPLY (CẬP NHẬT TRỰC TIẾP)'}`);
  console.log('======================================================\n');

  // Step 1: Backup current rows
  console.log('📥 1. Đang truy vấn và sao lưu các bản ghi chứa Cloudinary...');
  const selectSql = `SELECT id, code, before_image_url, after_image_url, attachments_json FROM ci_kaizen_proposals WHERE before_image_url LIKE '%cloudinary%' OR after_image_url LIKE '%cloudinary%' OR attachments_json LIKE '%cloudinary%';`;
  const selectRes = queryD1(selectSql);
  const rows = selectRes[0]?.results || [];

  console.log(`📊 Tìm thấy ${rows.length} bản ghi proposals cần xử lý.\n`);

  if (rows.length === 0) {
    console.log('✅ Không còn bản ghi nào chứa Cloudinary trong bảng ci_kaizen_proposals!');
    return;
  }

  // Save backup
  const backupDir = path.resolve(process.cwd(), 'migration/backup');
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupJsonPath = path.join(backupDir, `d1_${targetDb}_backup_${timestamp}.json`);
  const rollbackSqlPath = path.join(backupDir, `rollback_${targetDb}_${timestamp}.sql`);

  fs.writeFileSync(backupJsonPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`💾 Đã sao lưu dữ liệu gốc vào: ${backupJsonPath}`);

  // Generate rollback SQL
  let rollbackSql = `-- ROLLBACK SCRIPT FOR ${targetDb} AT ${new Date().toISOString()}\n`;
  for (const row of rows) {
    const escBefore = (row.before_image_url || '').replace(/'/g, "''");
    const escAfter = (row.after_image_url || '').replace(/'/g, "''");
    const escAtt = (row.attachments_json || '').replace(/'/g, "''");
    rollbackSql += `UPDATE ci_kaizen_proposals SET before_image_url = '${escBefore}', after_image_url = '${escAfter}', attachments_json = '${escAtt}' WHERE id = '${row.id}';\n`;
  }
  fs.writeFileSync(rollbackSqlPath, rollbackSql, 'utf8');
  console.log(`💾 Đã tạo script rollback an toàn: ${rollbackSqlPath}\n`);

  // Step 2: Calculate new values
  const updates = [];
  for (const row of rows) {
    const newBefore = processValue(row.before_image_url);
    const newAfter = processValue(row.after_image_url);
    const newAtt = processValue(row.attachments_json);

    const changedBefore = newBefore !== row.before_image_url;
    const changedAfter = newAfter !== row.after_image_url;
    const changedAtt = newAtt !== row.attachments_json;

    if (changedBefore || changedAfter || changedAtt) {
      updates.push({
        id: row.id,
        code: row.code,
        oldBefore: row.before_image_url,
        newBefore,
        oldAfter: row.after_image_url,
        newAfter,
        oldAtt: row.attachments_json,
        newAtt,
      });
    }
  }

  console.log(`📋 2. Kế hoạch biến đổi (${updates.length} bản ghi):`);
  console.log('------------------------------------------------------');
  updates.slice(0, 3).forEach((u, i) => {
    console.log(`[Ví dụ ${i + 1}] Mã: ${u.code || u.id}`);
    if (u.oldBefore !== u.newBefore) {
      console.log(`  - before_image_url CŨ:  ${u.oldBefore?.slice(0, 90)}...`);
      console.log(`  - before_image_url MỚI: ${u.newBefore?.slice(0, 90)}...`);
    }
    if (u.oldAfter !== u.newAfter) {
      console.log(`  - after_image_url CŨ:   ${u.oldAfter?.slice(0, 90)}...`);
      console.log(`  - after_image_url MỚI:  ${u.newAfter?.slice(0, 90)}...`);
    }
    if (u.oldAtt !== u.newAtt) {
      console.log(`  - attachments CŨ:       ${u.oldAtt?.slice(0, 90)}...`);
      console.log(`  - attachments MỚI:      ${u.newAtt?.slice(0, 90)}...`);
    }
    console.log('');
  });

  if (isDryRun) {
    console.log('======================================================');
    console.log('⚠️ CHẾ ĐỘ DRY-RUN: KHÔNG CÓ THAY ĐỔI NÀO ĐƯỢC GHI VÀO DB.');
    console.log(`👉 Để áp dụng thật, chạy lệnh với tham số: --apply --db=${targetDb}`);
    console.log('======================================================');
    return;
  }

  // Step 3: Apply updates
  console.log(`⚡ 3. Đang áp dụng ${updates.length} bản ghi cập nhật lên ${targetDb}...`);
  let appliedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updates.length; i++) {
    const u = updates[i];
    const setClauses = [];

    if (u.newBefore !== u.oldBefore) {
      const escBefore = (u.newBefore || '').replace(/'/g, "''");
      if (escBefore.length <= 15000) {
        setClauses.push(`before_image_url = '${escBefore}'`);
      } else {
        console.warn(`   ℹ️ Proposal ${u.id}: before_image_url chứa base64 lớn, bỏ qua ghi SQL.`);
      }
    }

    if (u.newAfter !== u.oldAfter) {
      const escAfter = (u.newAfter || '').replace(/'/g, "''");
      if (escAfter.length <= 15000) {
        setClauses.push(`after_image_url = '${escAfter}'`);
      } else {
        console.warn(`   ℹ️ Proposal ${u.id}: after_image_url chứa base64 lớn, bỏ qua ghi SQL.`);
      }
    }

    if (u.newAtt !== u.oldAtt) {
      const escAtt = (u.newAtt || '').replace(/'/g, "''");
      if (escAtt.length <= 15000) {
        setClauses.push(`attachments_json = '${escAtt}'`);
      } else {
        console.warn(`   ℹ️ Proposal ${u.id}: attachments_json chứa base64 lớn (${escAtt.length} ký tự), bỏ qua ghi SQL trực tiếp để tránh SQLITE_TOOBIG (frontend đã tự động route qua R2).`);
      }
    }

    if (setClauses.length === 0) {
      continue;
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE ci_kaizen_proposals SET ${setClauses.join(', ')} WHERE id = '${u.id}';\n`;

    const chunkFile = 'migration/chunk_update.sql';
    fs.writeFileSync(chunkFile, sql, 'utf8');

    try {
      executeSqlFile(chunkFile);
      appliedCount++;
      if (appliedCount % 10 === 0 || appliedCount === updates.length) {
        console.log(`   Đã cập nhật ${appliedCount}/${updates.length} bản ghi...`);
      }
    } catch (err) {
      console.error(`⚠️ Lỗi cập nhật proposal ${u.id}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 HOÀN TẤT CẬP NHẬT ${updates.length} BẢN GHI LÊN ${targetDb}!`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('❌ Lỗi runtime:', err);
  process.exit(1);
});
