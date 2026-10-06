const { execSync } = require('child_process');

const cmdKg = `npx wrangler d1 execute thkiengiangshoes --remote --command="SELECT id, code, legacy_code, title, status, sub_status, review_status, approval_status, is_archived, region, factory, department, created_at FROM ci_kaizen_proposals"`;
const outKg = execSync(cmdKg, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
const jsonStartKg = outKg.indexOf('[');
const jsonEndKg = outKg.lastIndexOf(']');
const rowsKg = JSON.parse(outKg.substring(jsonStartKg, jsonEndKg + 1))[0].results;

const cmdLocal = `npx wrangler d1 execute vpchuoiskechers-db --remote --command="SELECT id, code, legacy_code, title, status, sub_status, review_status, approval_status, is_archived, region, factory, department, created_at FROM ci_kaizen_proposals"`;
const outLocal = execSync(cmdLocal, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
const jsonStartLocal = outLocal.indexOf('[');
const jsonEndLocal = outLocal.lastIndexOf(']');
const rowsLocal = JSON.parse(outLocal.substring(jsonStartLocal, jsonEndLocal + 1))[0].results;

function mapSourceToProposal(sourceItem) {
  function fixUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return 'https://thkiengiangshoes.tbsgroup2026.workers.dev' + (url.startsWith('/') ? '' : '/') + url;
  }

  return {
    ...sourceItem,
    id: sourceItem.id || `src_${Date.now()}`,
    code: sourceItem.code || sourceItem.legacy_code || '',
    before_image_url: fixUrl(sourceItem.before_image_url),
    after_image_url: fixUrl(sourceItem.after_image_url),
    before_video_url: fixUrl(sourceItem.before_video_url),
    after_video_url: fixUrl(sourceItem.after_video_url),
    is_archived: sourceItem.is_archived ? 1 : 0,
    site_code: 'thkiengiangshoes',
    _source: 'thkiengiangshoes'
  };
}

function getDedupeKey(p) {
  const code = String(p.code || p.legacy_code || '').trim().toUpperCase();
  if (code && code.startsWith('KZ-2026-')) return code;
  const rawId = String(p.id || '').trim().toUpperCase();
  return rawId.replace(/^TKG_/, '');
}

const thkgResults = rowsKg.map(mapSourceToProposal);
const localResults = rowsLocal;

const resultMap = new Map();

for (const p of thkgResults) {
  const key = getDedupeKey(p);
  resultMap.set(key, p);
}

for (const p of localResults) {
  const key = getDedupeKey(p);
  if (resultMap.has(key)) continue;
  const reg = String(p.region || '').toUpperCase();
  if (p.site_code === 'thkiengiangshoes' || key.startsWith('KZ-2026-') || reg.includes('KIÊN GIANG') || reg.includes('KG') || reg.includes('HOÀN THIỆN') || reg.includes('HTD') || reg.includes('PHÒNG')) {
    if (!reg.includes('MIỀN ĐÔNG') && !reg.includes('NMMĐ') && !reg.includes('CHUỖI')) {
      continue;
    }
  }
  resultMap.set(key, p);
}

const safeParseDate = (d) => {
  if (!d) return 0;
  if (typeof d === 'number') return d;
  let str = String(d).trim().replace(' ', 'T');
  if (!str.endsWith('Z') && !str.includes('+')) {
    str += 'Z';
  }
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
};

const mergedResults = Array.from(resultMap.values()).sort((a, b) => safeParseDate(b.created_at) - safeParseDate(a.created_at));

function normalizeRegion(p) {
  if (!p) return 'Nhà Máy Miền Đông';
  const regStr = String(p.region || '');
  const factoryStr = String(p.factory || '');
  const sourceRegStr = String(p.source_region || '');
  const deptStr = String(p.department || '');
  const siteCode = String(p.site_code || p._source || '');

  const regionUpper = (regStr + ' ' + factoryStr).toUpperCase();
  const sourceRegUpper = sourceRegStr.toUpperCase();
  const deptUpper = deptStr.toUpperCase();

  if (regionUpper.includes('HOÀN THIỆN ĐẾ') || regionUpper.includes('HTD')) return 'Hoàn thiện đế';
  if (regionUpper.includes('KIÊN GIANG 1') || regionUpper.includes('KG 1') || regionUpper.includes('KG1')) return 'Kiên Giang 1';
  if (regionUpper.includes('KIÊN GIANG 2') || regionUpper.includes('KG 2') || regionUpper.includes('KG2')) return 'Kiên Giang 2';
  if (regionUpper.includes('KIÊN GIANG 3') || regionUpper.includes('KG 3') || regionUpper.includes('KG3')) return 'Kiên Giang 3';

  const combined = regionUpper + ' ' + deptUpper + ' ' + sourceRegUpper;
  if (combined.includes('PHÒNG CI')) return 'Phòng CI';
  if (combined.includes('PHÒNG CN')) return 'Phòng CN';
  if (combined.includes('PHÒNG KẾ HOẠCH')) return 'Phòng kế hoạch';
  if (combined.includes('PHÒNG CHẤT LƯỢNG')) return 'Phòng chất lượng';
  if (combined.includes('PHÒNG NHÂN SỰ')) return 'Phòng nhân sự';

  if (siteCode === 'thkiengiangshoes' || combined.includes('KIÊN GIANG') || combined.includes('THKG')) {
    return 'Chưa phân loại';
  }
  return 'Nhà Máy Miền Đông';
}

function isTHKG(p) {
  const norm = normalizeRegion(p);
  return norm !== 'Nhà Máy Miền Đông' && norm !== 'Văn phòng Chuỗi';
}

function isApprovedProposal(p) {
  if (!p) return false;
  const appStatus = String(p.approval_status || '').toUpperCase();
  const subStatus = String(p.sub_status || p.review_status || '').toUpperCase();
  const status = String(p.status || '').toUpperCase();

  if (appStatus === 'TU_CHOI' || subStatus === 'TU_CHOI_TRIEN_KHAI' || status === 'REJECTED') return false;
  if (subStatus === 'CHO_REVIEW' || subStatus === 'SO_BO' || subStatus === 'SO_DUYET' || subStatus === 'CHO_DUYET' || appStatus === 'PENDING' || status === 'SUBMITTED' || status === 'CHO_DUYET' || status === 'DRAFT') return false;

  return (
    appStatus === 'PHE_DUYET' ||
    subStatus === 'CHO_DANH_GIA' ||
    subStatus === 'DA_DANH_GIA' ||
    subStatus === 'DA_DUYET' ||
    status === 'APPROVED' ||
    status === 'COMPLETED' ||
    Number(p.avg_rating || p.average_score || 0) > 0
  );
}

function isPendingApprovalProposal(p) {
  if (!p) return false;
  if (isApprovedProposal(p)) return false;
  const appStatus = String(p.approval_status || '').toUpperCase();
  const subStatus = String(p.sub_status || p.review_status || '').toUpperCase();
  const status = String(p.status || '').toUpperCase();
  if (appStatus === 'TU_CHOI' || subStatus === 'TU_CHOI_TRIEN_KHAI' || status === 'REJECTED') return false;
  return true;
}

const thkgPropsAll = mergedResults.filter(isTHKG);

let thiDua = 0, choReview = 0, choDanhGia = 0, daDanhGia = 0, luuTru = 0;
thkgPropsAll.forEach(p => {
  const isArch = Boolean(p.is_archived) || p.sub_status === 'LUU_TRU' || p.registration_type === 'LUU_TRU' || p.status === 'ARCHIVED';
  if (isArch) {
    luuTru++;
    return;
  }
  thiDua++;
  if (isPendingApprovalProposal(p)) choReview++;
  if (isApprovedProposal(p)) choDanhGia++;
});

const nmmdProps = mergedResults.filter(p => normalizeRegion(p) === 'Nhà Máy Miền Đông');

console.log('=== UPDATED SIMULATION SUMMARY ===');
console.log(`Total Merged Output Count: ${mergedResults.length} (Expected: 94 = 75 THKG + 19 NMMĐ)`);
console.log(`THKG Total (Active + Archived): ${thkgPropsAll.length} (Expected: 75)`);
console.log(`  - Thi đua (Active Total): ${thiDua} (Expected: 74)`);
console.log(`  - Chờ phê duyệt: ${choReview} (Expected: 30)`);
console.log(`  - Đã duyệt / Chờ đánh giá: ${choDanhGia} (Expected: 44)`);
console.log(`  - Lưu trữ: ${luuTru} (Expected: 1)`);
console.log(`NMMĐ Total Proposals: ${nmmdProps.length} (Expected: 19)`);
