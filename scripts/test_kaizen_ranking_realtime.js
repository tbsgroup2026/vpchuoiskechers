/**
 * Unit test for Kaizen Ranking Filtering & Realtime State Updates
 */
const assert = require('assert');

// Filter function mimicking KaizenDashboard thiDuaList filtering logic
function filterThiDuaRanking(proposals) {
  const getProposalValue = (p) => {
    return Number(p.total_savings_vnd || p.tong_tien_tiet_kiem || p.saved_seconds || p.so_giay_tiet_kiem || 0);
  };

  const thiDuaList = proposals.filter((p) => {
    if (p.is_archived === 1 || p.is_archived === true) return false;

    const appStatus = String(p.approval_status || '').toUpperCase();
    const subStatus = String(p.sub_status || p.review_status || '').toUpperCase();
    const mainStatus = String(p.status || '').toUpperCase();

    // Must NOT be rejected or edit-requested
    if (
      appStatus === 'TU_CHOI' ||
      appStatus === 'REJECTED' ||
      subStatus === 'TU_CHOI_TRIEN_KHAI' ||
      subStatus === 'TU_CHOI_DUYET' ||
      mainStatus === 'REJECTED' ||
      subStatus === 'CAN_CHINH_SUA'
    ) {
      return false;
    }

    // Must NOT be pending approval / submitted / waiting review
    if (
      subStatus === 'CHO_REVIEW' ||
      subStatus === 'SO_BO' ||
      subStatus === 'SO_DUYET' ||
      subStatus === 'CHO_DUYET' ||
      subStatus === 'CHO_DANH_GIA' ||
      appStatus === 'PENDING' ||
      appStatus === 'CHO_DUYET' ||
      mainStatus === 'SUBMITTED' ||
      mainStatus === 'CHO_DUYET' ||
      mainStatus === 'DRAFT'
    ) {
      return false;
    }

    // Must be officially approved
    const isApproved =
      appStatus === 'PHE_DUYET' ||
      appStatus === 'APPROVED' ||
      appStatus === 'DA_DANH_GIA' ||
      subStatus === 'DA_DANH_GIA' ||
      subStatus === 'DA_DUYET' ||
      mainStatus === 'APPROVED' ||
      mainStatus === 'COMPLETED' ||
      mainStatus === 'IMPLEMENTED';

    if (!isApproved) return false;

    // Savings value OR score points MUST BE > 0
    const savingsVal = getProposalValue(p);
    const scoreVal = Number(p.score_points || p.scorePoints || 0);
    if (savingsVal <= 0 && scoreVal <= 0) return false;

    return true;
  });

  const sorted = [...thiDuaList].sort((a, b) => {
    const valA = getProposalValue(a);
    const valB = getProposalValue(b);
    if (valB !== valA) return valB - valA;

    const scoreA = Number(a.score_points || 0);
    const scoreB = Number(b.score_points || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  return sorted.map((item, index) => {
    let rank = index + 1;
    let prizeValueTr = 0;
    if (index === 0) prizeValueTr = 1.0;
    else if (index >= 1 && index <= 2) prizeValueTr = 0.5;
    else if (index >= 3 && index <= 7) prizeValueTr = 0.3;
    else if (index >= 8 && index <= 17) prizeValueTr = 0.2;
    else if (index >= 18 && index <= 37) prizeValueTr = 0.1;

    return { item, rank, prizeValueTr };
  });
}

function runTests() {
  console.log('=== TEST 1: Filtering Pending/Unapproved & Zero-Savings Proposals ===');

  const sampleProposals = [
    // Target proposal: ci_1788953798328_7krhc
    {
      id: 'ci_1788953798328_7krhc',
      code: 'KZ-201607010',
      title: 'Tăng số đôi trên khuôn in lô gô chắn bùn ngoài mẫu 118433',
      approval_status: 'PENDING',
      sub_status: 'SO_DUYET',
      status: 'SUBMITTED',
      saved_seconds: 0,
      so_giay_tiet_kiem: 0,
      total_savings_vnd: 0,
      score_points: 0,
      created_at: '2026-09-11T09:00:00Z'
    },
    // Valid approved proposal 1
    {
      id: 'ci_approved_001',
      code: 'KZ-001',
      title: 'Cải tiến tự động hóa đóng gói sản phẩm',
      approval_status: 'PHE_DUYET',
      sub_status: 'DA_DANH_GIA',
      status: 'APPROVED',
      saved_seconds: 7200,
      total_savings_vnd: 150000000,
      score_points: 92,
      created_at: '2026-09-10T10:00:00Z'
    },
    // Valid approved proposal 2
    {
      id: 'ci_approved_002',
      code: 'KZ-002',
      title: 'Tối ưu hóa thời gian ép đế giày',
      approval_status: 'PHE_DUYET',
      sub_status: 'DA_DUYET',
      status: 'IMPLEMENTED',
      saved_seconds: 3600,
      total_savings_vnd: 80000000,
      score_points: 88,
      created_at: '2026-09-09T10:00:00Z'
    }
  ];

  const ranking1 = filterThiDuaRanking(sampleProposals);

  console.log('Ranking items count:', ranking1.length);
  assert.strictEqual(ranking1.length, 2, 'Only 2 approved proposals should be in ranking');

  const unapprovedFound = ranking1.find((r) => r.item.id === 'ci_1788953798328_7krhc');
  assert.strictEqual(unapprovedFound, undefined, 'Proposal ci_1788953798328_7krhc MUST NOT appear in ranking!');

  assert.strictEqual(ranking1[0].item.id, 'ci_approved_001');
  assert.strictEqual(ranking1[0].rank, 1);
  assert.strictEqual(ranking1[0].prizeValueTr, 1.0, 'Rank 1 prize should be 1.0 Tr');

  assert.strictEqual(ranking1[1].item.id, 'ci_approved_002');
  assert.strictEqual(ranking1[1].rank, 2);
  assert.strictEqual(ranking1[1].prizeValueTr, 0.5, 'Rank 2 prize should be 0.5 Tr');

  console.log('✅ TEST 1 PASSED: Unapproved/zero-savings proposal successfully excluded from ranking and reward calculation.');

  console.log('\n=== TEST 2: Realtime State Update Simulation ===');
  // Simulate backend update / approval of proposal ci_1788953798328_7krhc
  const updatedProposals = JSON.parse(JSON.stringify(sampleProposals));
  const targetProp = updatedProposals.find((p) => p.id === 'ci_1788953798328_7krhc');

  // Backend updates status and savings:
  targetProp.approval_status = 'PHE_DUYET';
  targetProp.sub_status = 'DA_DANH_GIA';
  targetProp.status = 'APPROVED';
  targetProp.total_savings_vnd = 250000000; // 250M VND -> Highest savings!
  targetProp.saved_seconds = 10000;
  targetProp.score_points = 95;

  const ranking2 = filterThiDuaRanking(updatedProposals);

  console.log('Updated Ranking items count:', ranking2.length);
  assert.strictEqual(ranking2.length, 3, 'All 3 proposals should now be in ranking');

  assert.strictEqual(ranking2[0].item.id, 'ci_1788953798328_7krhc', 'Approved proposal should now enter at Rank 1');
  assert.strictEqual(ranking2[0].rank, 1);
  assert.strictEqual(ranking2[0].prizeValueTr, 1.0, 'Approved Rank 1 gets 1.0 Tr reward');

  console.log('✅ TEST 2 PASSED: Realtime state update dynamically updates ranking and reward assignment.');
}

runTests();
