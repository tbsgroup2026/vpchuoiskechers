/**
 * Script migration / backfill dữ liệu video cho toàn bộ thẻ sáng kiến Kaizen
 * Hỗ trợ kiểm tra cả 2 cơ sở dữ liệu D1: 'thkiengiangshoes' và 'vpchuoiskechers-db'
 *
 * Chế độ chạy:
 *   node scripts/migrate_kaizen_videos.js --dry-run   (Chỉ quét, phân tích, tạo file backup và báo cáo số liệu, KHÔNG ghi vào DB)
 *   node scripts/migrate_kaizen_videos.js --apply     (Thực thi cập nhật trực tiếp vào DB sau khi được xác nhận)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VIDEO_EXT_REGEX = /\.(mp4|mov|webm|m4v|3gp|avi|mkv|flv|wmv|ts|ogv)$/i;

function isVideo(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (!clean || clean === 'null' || clean === 'undefined') return false;
  if (clean.startsWith('video/') || clean.startsWith('data:video/')) return true;
  const pathNoQuery = clean.split('?')[0].split('#')[0];
  return VIDEO_EXT_REGEX.test(pathNoQuery);
}

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/^["']|["']$/g, '');
}

/**
 * Phân loại media của 1 proposal để tìm before_video_url và after_video_url
 */
function extractProposalVideos(row) {
  const currentBeforeVid = normalizeUrl(row.before_video_url);
  const currentAfterVid = normalizeUrl(row.after_video_url);

  let newBeforeVid = currentBeforeVid;
  let newAfterVid = currentAfterVid;

  let attachments = [];
  if (row.attachments_json) {
    try {
      attachments = typeof row.attachments_json === 'string' ? JSON.parse(row.attachments_json) : row.attachments_json;
      if (!Array.isArray(attachments)) attachments = [];
    } catch (e) {
      attachments = [];
    }
  }

  const beforeVidsFromAtt = [];
  const afterVidsFromAtt = [];

  attachments.forEach((item, idx) => {
    const u = typeof item === 'string' ? item : item?.url;
    if (!u) return;

    const isVid =
      item?.type === 'video' ||
      item?.type === 'video_before' ||
      item?.type === 'video_after' ||
      isVideo(u);

    if (!isVid) return;

    let isBefore = false;
    let isAfter = false;

    if (typeof item === 'object' && item !== null) {
      const typeStr = String(item.type || '').toLowerCase();
      const tagStr = String(item.tag || '').toLowerCase();
      const catStr = String(item.category || '').toLowerCase();
      const titleStr = String(item.title || '').toLowerCase();
      const phaseStr = String(item.phase || '').toLowerCase();

      if (
        typeStr === 'video_before' ||
        tagStr === 'before' ||
        catStr === 'before' ||
        phaseStr === 'before' ||
        titleStr.includes('trước') ||
        titleStr.includes('truoc') ||
        titleStr.includes('before')
      ) {
        isBefore = true;
      } else if (
        typeStr === 'video_after' ||
        tagStr === 'after' ||
        catStr === 'after' ||
        phaseStr === 'after' ||
        titleStr.includes('sau') ||
        titleStr.includes('after')
      ) {
        isAfter = true;
      }
    }

    if (!isBefore && !isAfter) {
      if (attachments.length === 2 && idx === 0) isBefore = true;
      else if (attachments.length === 2 && idx === 1) isAfter = true;
      else {
        if (beforeVidsFromAtt.length === 0) isBefore = true;
        else isAfter = true;
      }
    }

    const normU = normalizeUrl(u);
    if (isBefore && !beforeVidsFromAtt.includes(normU)) {
      beforeVidsFromAtt.push(normU);
    } else if (isAfter && !afterVidsFromAtt.includes(normU)) {
      afterVidsFromAtt.push(normU);
    }
  });

  // Nếu trước đó before_video_url đang rỗng mà trong attachments có video trước
  if (!newBeforeVid && beforeVidsFromAtt.length > 0) {
    newBeforeVid = beforeVidsFromAtt[0];
  }

  // Nếu trước đó after_video_url đang rỗng mà trong attachments có video sau
  if (!newAfterVid && afterVidsFromAtt.length > 0) {
    newAfterVid = afterVidsFromAtt[0];
  }

  // Kiểm tra trường hợp đặc biệt: người dùng dán video vào before_image_url hoặc after_image_url
  if (!newBeforeVid && isVideo(row.before_image_url)) {
    newBeforeVid = normalizeUrl(row.before_image_url);
  }
  if (!newAfterVid && isVideo(row.after_image_url)) {
    newAfterVid = normalizeUrl(row.after_image_url);
  }

  const hasVideoTotal = Boolean(newBeforeVid || newAfterVid || beforeVidsFromAtt.length > 0 || afterVidsFromAtt.length > 0);
  const needsUpdate =
    (newBeforeVid && newBeforeVid !== currentBeforeVid) ||
    (newAfterVid && newAfterVid !== currentAfterVid);

  return {
    hasVideoTotal,
    needsUpdate,
    currentBeforeVid,
    currentAfterVid,
    newBeforeVid,
    newAfterVid,
    beforeVidsFromAtt,
    afterVidsFromAtt,
  };
}

async function runMigrationForDb(dbName, isDryRun) {
  console.log(`\n======================================================`);
  console.log(`🔍 Đang quét cơ sở dữ liệu: [${dbName}]...`);
  console.log(`Chế độ: ${isDryRun ? 'DRY-RUN (CHỈ ĐỌC, KHÔNG GHI)' : 'APPLY (GHI VÀO DB)'}`);
  console.log(`======================================================`);

  const selectCmd = `npx wrangler d1 execute ${dbName} --remote --json --command "SELECT id, code, title, proposer_name, proposer_emp_code, before_video_url, after_video_url, before_image_url, after_image_url, attachments_json FROM ci_kaizen_proposals ORDER BY created_at DESC;"`;
  
  let rawOutput = '';
  try {
    rawOutput = execSync(selectCmd, { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  } catch (err) {
    console.error(`❌ Lỗi khi truy vấn D1 [${dbName}]:`, err.message);
    return { dbName, error: err.message };
  }

  // Trích xuất JSON từ output của wrangler
  let parsed = null;
  try {
    const jsonStart = rawOutput.indexOf('[');
    if (jsonStart !== -1) {
      parsed = JSON.parse(rawOutput.substring(jsonStart));
    }
  } catch (e) {
    console.error(`❌ Không thể parse output JSON của D1 [${dbName}]:`, e.message);
    return { dbName, error: e.message };
  }

  const rows = (parsed && parsed[0] && Array.isArray(parsed[0].results)) ? parsed[0].results : [];
  console.log(`📊 Tổng số thẻ sáng kiến quét được: ${rows.length}`);

  let totalWithVideo = 0;
  let totalNeedsUpdate = 0;
  let totalAlreadyCorrect = 0;
  const affectedList = [];
  const sqlStatements = [];

  for (const row of rows) {
    const analysis = extractProposalVideos(row);
    if (analysis.hasVideoTotal) {
      totalWithVideo++;
      if (analysis.needsUpdate) {
        totalNeedsUpdate++;
        affectedList.push({
          id: row.id,
          code: row.code,
          title: row.title,
          proposer_name: row.proposer_name,
          proposer_emp_code: row.proposer_emp_code,
          currentBeforeVid: analysis.currentBeforeVid,
          currentAfterVid: analysis.currentAfterVid,
          newBeforeVid: analysis.newBeforeVid,
          newAfterVid: analysis.newAfterVid,
        });

        const safeBefore = analysis.newBeforeVid ? `'${analysis.newBeforeVid.replace(/'/g, "''")}'` : 'NULL';
        const safeAfter = analysis.newAfterVid ? `'${analysis.newAfterVid.replace(/'/g, "''")}'` : 'NULL';
        const updateSql = `UPDATE ci_kaizen_proposals SET before_video_url = COALESCE(before_video_url, ${safeBefore}), after_video_url = COALESCE(after_video_url, ${safeAfter}) WHERE id = '${row.id.replace(/'/g, "''")}';`;
        sqlStatements.push(updateSql);
      } else {
        totalAlreadyCorrect++;
      }
    }
  }

  console.log(`🎥 Số thẻ CÓ video: ${totalWithVideo}`);
  console.log(`✅ Số thẻ video ĐÃ đúng sẵn: ${totalAlreadyCorrect}`);
  console.log(`⚠️ Số thẻ CẦN migration/backfill: ${totalNeedsUpdate}`);

  if (affectedList.length > 0) {
    console.log(`\n📋 Danh sách chi tiết các thẻ cần cập nhật [${dbName}]:`);
    affectedList.forEach((item, idx) => {
      console.log(`  [${idx + 1}] Mã: ${item.code} | ID: ${item.id}`);
      console.log(`      NLĐ: ${item.proposer_name} (MSNV: ${item.proposer_emp_code})`);
      console.log(`      Tiêu đề: ${item.title}`);
      console.log(`      Trước cải tiến: [Hiện tại: ${item.currentBeforeVid || 'NULL'}] -> [Mới: ${item.newBeforeVid || 'NULL'}]`);
      console.log(`      Sau cải tiến:   [Hiện tại: ${item.currentAfterVid || 'NULL'}] -> [Mới: ${item.newAfterVid || 'NULL'}]`);
    });

    // Xuất file backup và migration SQL
    const timestamp = Date.now();
    const backupDir = path.resolve(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const backupJsonPath = path.join(backupDir, `video_migration_${dbName}_${timestamp}.json`);
    fs.writeFileSync(backupJsonPath, JSON.stringify(affectedList, null, 2), 'utf8');
    console.log(`💾 Đã xuất backup danh sách thẻ bị ảnh hưởng: ${backupJsonPath}`);

    const sqlFilePath = path.join(backupDir, `video_migration_${dbName}_${timestamp}.sql`);
    fs.writeFileSync(sqlFilePath, sqlStatements.join('\n'), 'utf8');
    console.log(`📝 Đã tạo file SQL migration: ${sqlFilePath}`);

    if (!isDryRun) {
      console.log(`\n🚀 Đang thực thi migration vào database [${dbName}]...`);
      try {
        const applyCmd = `npx wrangler d1 execute ${dbName} --remote --file="${sqlFilePath}"`;
        const applyOut = execSync(applyCmd, { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
        console.log(`✅ Cập nhật thành công cho DB [${dbName}]!\nOutput:`, applyOut);
      } catch (applyErr) {
        console.error(`❌ Lỗi khi thực thi SQL vào [${dbName}]:`, applyErr.message);
      }
    } else {
      console.log(`\n🔒 Chế độ DRY-RUN: KHÔNG thực hiện thay đổi nào trên DB [${dbName}].`);
    }
  } else {
    console.log(`✨ Không có thẻ nào cần cập nhật trên DB [${dbName}].`);
  }

  return {
    dbName,
    totalScanned: rows.length,
    totalWithVideo,
    totalAlreadyCorrect,
    totalNeedsUpdate,
    affectedList,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const isDryRun = !isApply;

  console.log(`======================================================`);
  console.log(`🚀 BẮT ĐẦU CHƯƠNG TRÌNH SCAN & MIGRATION VIDEO KAIZEN`);
  console.log(`======================================================`);

  const databases = ['thkiengiangshoes', 'vpchuoiskechers-db'];
  const summary = [];

  for (const db of databases) {
    const res = await runMigrationForDb(db, isDryRun);
    summary.push(res);
  }

  console.log(`\n======================================================`);
  console.log(`📊 TỔNG KẾT KẾT QUẢ QUÉT (SUMMARY):`);
  console.log(`======================================================`);
  summary.forEach((s) => {
    if (s.error) {
      console.log(`- DB [${s.dbName}]: LỖI - ${s.error}`);
    } else {
      console.log(`- DB [${s.dbName}]: Quét ${s.totalScanned} thẻ | ${s.totalWithVideo} có video | ${s.totalAlreadyCorrect} đã đúng | ${s.totalNeedsUpdate} cần cập nhật`);
    }
  });

  if (isDryRun) {
    console.log(`\n💡 ĐÂY LÀ KẾT QUẢ DRY-RUN. Cơ sở dữ liệu CHƯA bị thay đổi.`);
    console.log(`Vui lòng xác nhận để chạy: node scripts/migrate_kaizen_videos.js --apply`);
  }
}

main().catch(console.error);
