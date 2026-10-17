import { signToken } from '../web/src/lib/auth.ts';
import * as tripRoute from '../web/src/app/api/business-trips/route.ts';

function createMockRequest(url, method = 'GET', body = null, token = null) {
  const headers = new Map();
  headers.set('content-type', 'application/json');
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return {
    url,
    method,
    headers: {
      get: (name) => headers.get(name.toLowerCase()) || null,
    },
    json: async () => (body ? body : {}),
  };
}

async function runBusinessTripMultiRoleTests() {
  console.log('========================================================================');
  console.log('🛡️ MULTI-ROLE BUSINESS TRIP (ĐĂNG KÝ CÔNG TÁC) SECURITY & LOGIC TESTS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, errorDetail = '', json = null) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${message} ${errorDetail ? '(' + errorDetail + ')' : ''} ${json ? '-> JSON: ' + JSON.stringify(json) : ''}`);
      failed++;
    }
  }

  // 1. Generate JWT tokens for each role level
  const staffMaintenanceToken = await signToken({
    userId: 101,
    empCode: 'BT-001',
    name: 'Phạm Văn Bảo',
    roleId: 4,
    roleCode: 'CBCNV',
    roleLevel: 4,
    departmentId: 10,
    departmentCode: 'BAO_TRI'
  });

  const staffITToken = await signToken({
    userId: 102,
    empCode: '202608003',
    name: 'Ngô Hà Thanh An',
    roleId: 4,
    roleCode: 'CBCNV',
    roleLevel: 4,
    departmentId: 8,
    departmentCode: 'IT_CDS'
  });

  const headITToken = await signToken({
    userId: 103,
    empCode: '202608001',
    name: 'Phạm Nguyễn Anh Huy',
    roleId: 3,
    roleCode: 'TRUONG_PHONG',
    roleLevel: 3,
    departmentId: 8,
    departmentCode: 'IT_CDS'
  });

  const tgdToken = await signToken({
    userId: 104,
    empCode: 'TGĐ-001',
    name: 'Tổng Giám Đốc',
    roleId: 2,
    roleCode: 'TONG_GIAM_DOC',
    roleLevel: 2,
    departmentId: 1,
    departmentCode: 'BAN_GIAM_DOC'
  });

  // Test 1: Unauthenticated checks
  console.log('--- TEST 1: Unauthenticated Access Guard ---');
  const unauthGet = await tripRoute.GET(createMockRequest('http://localhost:3000/api/business-trips', 'GET'));
  assert(unauthGet.status === 401, 'Unauthenticated GET returns 401 Unauthorized', `Got ${unauthGet.status}`);

  const unauthPost = await tripRoute.POST(createMockRequest('http://localhost:3000/api/business-trips', 'POST', { title: 'Test' }));
  assert(unauthPost.status === 401, 'Unauthenticated POST returns 401 Unauthorized', `Got ${unauthPost.status}`);

  const unauthPut = await tripRoute.PUT(createMockRequest('http://localhost:3000/api/business-trips', 'PUT', { id: 'test' }));
  assert(unauthPut.status === 401, 'Unauthenticated PUT returns 401 Unauthorized', `Got ${unauthPut.status}`);

  const unauthDelete = await tripRoute.DELETE(createMockRequest('http://localhost:3000/api/business-trips?id=test', 'DELETE'));
  assert(unauthDelete.status === 401, 'Unauthenticated DELETE returns 401 Unauthorized', `Got ${unauthDelete.status}`);

  // Test 2: Staff BT-001 creates a business trip (Cost: 8,000,000 VND)
  console.log('\n--- TEST 2: Staff creates trip ---');
  const tripBTId = `bt_trip_${Date.now()}`;
  const createBTRes = await tripRoute.POST(createMockRequest('http://localhost:3000/api/business-trips', 'POST', {
    id: tripBTId,
    code: `CT-BT-${Date.now().toString().slice(-4)}`,
    title: 'Bảo trì dây chuyền cắt tự động Hà Nam',
    department: 'Bảo trì cơ điện',
    department_id: 'BAO_TRI',
    location: 'KCN Đồng Văn, Hà Nam',
    startDate: '2026-10-20',
    endDate: '2026-10-22',
    daysCount: 3,
    transport: 'Xe công ty',
    purpose: 'Bảo dưỡng định kỳ quý 4',
    estimatedCost: 8000000
  }, staffMaintenanceToken));
  const createBTJson = await createBTRes.json();
  assert(createBTRes.status === 200 && createBTJson.success, 'Staff BT-001 successfully creates business trip', '', createBTJson);

  // Test 3: Staff BT-001 attempts self-approval
  console.log('\n--- TEST 3: Segregation of Duties (Self-Approval Block) ---');
  const selfApproveRes = await tripRoute.PUT(createMockRequest('http://localhost:3000/api/business-trips', 'PUT', {
    id: tripBTId,
    actionLevel: 'APPROVE_L1',
    note: 'Tự duyệt đơn mình'
  }, staffMaintenanceToken));
  const selfApproveJson = await selfApproveRes.json();
  assert(selfApproveRes.status === 403, 'Staff BT-001 cannot approve Level 1 (returns 403 Forbidden)', `Got ${selfApproveRes.status}`, selfApproveJson);

  // Test 4: IT Staff creates IT trip (Cost: 12,000,000 VND)
  console.log('\n--- TEST 4: IT Staff creates trip > 5M VND ---');
  const tripITBigId = `it_big_${Date.now()}`;
  const createITBigRes = await tripRoute.POST(createMockRequest('http://localhost:3000/api/business-trips', 'POST', {
    id: tripITBigId,
    code: `CT-IT-${Date.now().toString().slice(-4)}`,
    title: 'Triển khai hệ thống mạng và máy chủ chi nhánh Đà Nẵng',
    department: 'Phòng CNTT & CĐS',
    department_id: 'IT_CDS',
    location: 'Chi nhánh TBS Đà Nẵng',
    startDate: '2026-10-25',
    endDate: '2026-10-28',
    daysCount: 4,
    transport: 'Máy bay',
    purpose: 'Cài đặt hạ tầng Cloud & ERP',
    estimatedCost: 12000000
  }, staffITToken));
  const createITBigJson = await createITBigRes.json();
  assert(createITBigRes.status === 200 && createITBigJson.success, 'IT Staff creates 12M VND trip', '', createITBigJson);

  // Test 5: IT Head 202608001 attempts cross-department approval on Maintenance trip
  console.log('\n--- TEST 5: Cross-Department Approval Guard ---');
  const crossDeptRes = await tripRoute.PUT(createMockRequest('http://localhost:3000/api/business-trips', 'PUT', {
    id: tripBTId,
    actionLevel: 'APPROVE_L1',
    note: 'Trưởng phòng IT duyệt đơn Bảo trì'
  }, headITToken));
  const crossDeptJson = await crossDeptRes.json();
  assert(crossDeptRes.status === 403, 'Dept Head cannot approve trip from different department (403 Forbidden)', `Got ${crossDeptRes.status}`, crossDeptJson);

  // Test 6: IT Head approves IT trip (> 5M) -> Should advance to PENDING_L2 (awaiting BGĐ)
  console.log('\n--- TEST 6: Dept Head approves own dept trip > 5M VND ---');
  const approveITBigRes = await tripRoute.PUT(createMockRequest('http://localhost:3000/api/business-trips', 'PUT', {
    id: tripITBigId,
    actionLevel: 'APPROVE_L1',
    note: 'Đồng ý duyệt Cấp 1, chuyển BGĐ phê duyệt chi phí > 5 triệu'
  }, headITToken));
  const approveITBigJson = await approveITBigRes.json();
  assert(approveITBigRes.status === 200 && approveITBigJson.success, 'IT Head successfully approves Level 1 for 12M trip', '', approveITBigJson);

  // Check state of tripITBigId
  const getITBigRes = await tripRoute.GET(createMockRequest('http://localhost:3000/api/business-trips', 'GET', null, headITToken));
  const getITBigJson = await getITBigRes.json();
  const tripITBigData = (getITBigJson.data || []).find(t => t.id === tripITBigId);
  assert(tripITBigData && tripITBigData.status === 'PENDING_L2', 'Trip > 5M transitions to PENDING_L2 after L1 approval', `Status is ${tripITBigData?.status}`);

  // Test 7: IT Staff creates IT trip < 5M VND (Cost: 3,500,000 VND)
  console.log('\n--- TEST 7: Dept Head approves own dept trip < 5M VND (Auto-approval) ---');
  const tripITSmallId = `it_small_${Date.now()}`;
  await tripRoute.POST(createMockRequest('http://localhost:3000/api/business-trips', 'POST', {
    id: tripITSmallId,
    code: `CT-IT-S-${Date.now().toString().slice(-4)}`,
    title: 'Hỗ trợ kỹ thuật phần cứng nhà máy Sông Bé',
    department: 'Phòng CNTT & CĐS',
    department_id: 'IT_CDS',
    location: 'Nhà máy Sông Bé',
    startDate: '2026-10-21',
    endDate: '2026-10-21',
    daysCount: 1,
    transport: 'Xe máy',
    purpose: 'Thay thế switch mạng hỏng',
    estimatedCost: 3500000
  }, staffITToken));

  const approveITSmallRes = await tripRoute.PUT(createMockRequest('http://localhost:3000/api/business-trips', 'PUT', {
    id: tripITSmallId,
    actionLevel: 'APPROVE_L1',
    note: 'Duyệt hoàn tất cho chuyến công tác nhỏ'
  }, headITToken));
  assert(approveITSmallRes.status === 200, 'IT Head approves small trip', `Got ${approveITSmallRes.status}`);

  const getITSmallRes = await tripRoute.GET(createMockRequest('http://localhost:3000/api/business-trips', 'GET', null, headITToken));
  const getITSmallJson = await getITSmallRes.json();
  const tripITSmallData = (getITSmallJson.data || []).find(t => t.id === tripITSmallId);
  assert(tripITSmallData && tripITSmallData.status === 'APPROVED', 'Trip < 5M auto-completes to APPROVED without needing L2', `Status is ${tripITSmallData?.status}`);

  // Test 8: Dept Head tries to approve Level 2 on 12M trip -> MUST be rejected with 403
  console.log('\n--- TEST 8: Dept Head cannot approve Level 2 ---');
  const headApproveL2Res = await tripRoute.PUT(createMockRequest('http://localhost:3000/api/business-trips', 'PUT', {
    id: tripITBigId,
    actionLevel: 'APPROVE_L2',
    note: 'Trưởng phòng thử duyệt Cấp 2'
  }, headITToken));
  const headApproveL2Json = await headApproveL2Res.json();
  assert(headApproveL2Res.status === 403, 'Dept Head blocked from Level 2 approval (403 Forbidden)', `Got ${headApproveL2Res.status}`, headApproveL2Json);

  // Test 9: Executive (TGĐ-001) approves Level 2 on 12M trip -> Should succeed
  console.log('\n--- TEST 9: Executive Level 2 Approval ---');
  const tgdApproveRes = await tripRoute.PUT(createMockRequest('http://localhost:3000/api/business-trips', 'PUT', {
    id: tripITBigId,
    actionLevel: 'APPROVE_L2',
    note: 'Tổng Giám Đốc phê duyệt ngân sách và lộ trình 12 triệu'
  }, tgdToken));
  const tgdApproveJson = await tgdApproveRes.json();
  assert(tgdApproveRes.status === 200 && tgdApproveJson.success, 'Executive TGĐ approves Level 2 successfully', '', tgdApproveJson);

  const getFinalRes = await tripRoute.GET(createMockRequest('http://localhost:3000/api/business-trips', 'GET', null, tgdToken));
  const getFinalJson = await getFinalRes.json();
  const tripFinalData = (getFinalJson.data || []).find(t => t.id === tripITBigId);
  assert(tripFinalData && tripFinalData.status === 'APPROVED', 'Trip > 5M is now fully APPROVED after Executive L2 approval', `Status is ${tripFinalData?.status}`);

  // Test 10: Multi-role DELETE enforcement
  console.log('\n--- TEST 10: Multi-role Deletion Guard ---');
  // 10a: Staff BT-001 tries to delete IT trip -> 403
  const staffDelOtherRes = await tripRoute.DELETE(createMockRequest(`http://localhost:3000/api/business-trips?id=${tripITBigId}`, 'DELETE', null, staffMaintenanceToken));
  const staffDelOtherJson = await staffDelOtherRes.json();
  assert(staffDelOtherRes.status === 403, 'Staff cannot delete other employees trip (403 Forbidden)', `Got ${staffDelOtherRes.status}`, staffDelOtherJson);

  // 10b: Staff tries to delete already APPROVED trip -> 400
  const staffDelApprovedRes = await tripRoute.DELETE(createMockRequest(`http://localhost:3000/api/business-trips?id=${tripITSmallId}`, 'DELETE', null, staffITToken));
  const staffDelApprovedJson = await staffDelApprovedRes.json();
  assert(staffDelApprovedRes.status === 400, 'Staff cannot delete APPROVED trip (400 Bad Request)', `Got ${staffDelApprovedRes.status}`, staffDelApprovedJson);

  // 10c: Staff deletes own PENDING trip -> 200 OK
  const staffDelOwnRes = await tripRoute.DELETE(createMockRequest(`http://localhost:3000/api/business-trips?id=${tripBTId}`, 'DELETE', null, staffMaintenanceToken));
  const staffDelOwnJson = await staffDelOwnRes.json();
  assert(staffDelOwnRes.status === 200 && staffDelOwnJson.success, 'Staff can delete own PENDING trip (200 OK)', '', staffDelOwnJson);

  console.log('\n========================================================================');
  console.log(`🎯 TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBusinessTripMultiRoleTests().catch(err => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
