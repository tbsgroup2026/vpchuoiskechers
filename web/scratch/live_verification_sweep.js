(async () => {
  console.log('=== REQUIREMENT 8: LIVE VERIFICATION AFTER DEPLOY ===\n');

  // 1. Check version endpoint
  const verRes = await fetch('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/kaizen/version?region=THKG');
  console.log('Version Endpoint Status:', verRes.status, verRes.status === 200 ? 'OK 200' : 'FAIL');
  const verJson = await verRes.json();
  console.log('Version Data:', verJson);

  // 2. Fetch live Site B API
  const resB = await fetch('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen?t=' + Date.now());
  const jsonB = await resB.json();
  const allDataB = jsonB.data || [];
  console.log('\nTotal Proposals Returned from Site B Live API:', allDataB.length);

  // Helper functions
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

  // 3. THKG Proposals Calculation
  const thkgPropsAll = allDataB.filter(isTHKG);
  console.log('\n--- LIVE THKG REGION MEASUREMENT ---');
  console.log('Total THKG Proposals (Active + Archived):', thkgPropsAll.length, '(Expected: 75)');

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

  console.log('LIVE Panel "Loại đăng ký" Count Badges:');
  console.log('  🏆 Thi đua (Active Total):', thiDua, '(Kỳ vọng: 74)');
  console.log('  👤 Chờ phê duyệt (countChoReview):', choReview, '(Kỳ vọng: 30)');
  console.log('  ✅ Đã duyệt / Chờ đánh giá (countDaDanhGia):', choDanhGia, '(Kỳ vọng: 44)');
  console.log('  📦 Lưu trữ (countLuuTru):', luuTru, '(Kỳ vọng: 1)');

  // 4. NMMĐ Proposals Calculation
  const nmmdProps = allDataB.filter(p => normalizeRegion(p) === 'Nhà Máy Miền Đông');
  console.log('\n--- LIVE NMMĐ REGION MEASUREMENT ---');
  console.log('Total NMMĐ Proposals:', nmmdProps.length, '(Kỳ vọng: 19)');

})();
