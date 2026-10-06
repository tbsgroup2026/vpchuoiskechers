const { execSync } = require('child_process');
const cmdKg = `npx wrangler d1 execute thkiengiangshoes --remote --command="SELECT id, code, status, sub_status, review_status, approval_status, is_archived FROM ci_kaizen_proposals"`;
const outKg = execSync(cmdKg, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
const jsonStartKg = outKg.indexOf('[');
const jsonEndKg = outKg.lastIndexOf(']');
const rowsKg = JSON.parse(outKg.substring(jsonStartKg, jsonEndKg + 1))[0].results;

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

let appCnt = 0, pendCnt = 0, archCnt = 0;
rowsKg.forEach(p => {
  if (p.is_archived) { archCnt++; return; }
  if (isApprovedProposal(p)) appCnt++;
  else if (isPendingApprovalProposal(p)) pendCnt++;
});

console.log('Site A DB_KG evaluation counts:');
console.log('  - Total active:', appCnt + pendCnt);
console.log('  - Approved (isApprovedProposal):', appCnt);
console.log('  - Pending (isPendingApprovalProposal):', pendCnt);
console.log('  - Archived:', archCnt);

rowsKg.forEach(p => {
  if (p.is_archived) return;
  const isApp = isApprovedProposal(p);
  const isPend = isPendingApprovalProposal(p);
  if (p.sub_status === 'CHO_REVIEW' && isApp) {
    console.log('CHO_REVIEW evaluated as APPROVED:', p.code, p.id, p.status, p.sub_status, p.review_status, p.approval_status);
  }
  if (p.sub_status === 'CHO_DANH_GIA' && isPend) {
    console.log('CHO_DANH_GIA evaluated as PENDING:', p.code, p.id, p.status, p.sub_status, p.review_status, p.approval_status);
  }
});
