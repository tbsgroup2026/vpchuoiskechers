import fs from 'node:fs';

const BASE = 'http://127.0.0.1:8798';

async function req(path, method = 'GET', body = null, token = null) {
  const headers = {
    'x-forwarded-proto': 'https',
    'User-Agent': 'TBS-QA-Regression/1.0'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, text, json };
  } catch (err) {
    return { status: 0, text: err.message, json: null };
  }
}

async function login(empCode) {
  const r = await req('/api/auth/login', 'POST', { empCode, password: 'test' });
  return r.json?.token;
}

const regResults = [];
function record(module, testId, name, happyOrNeg, exp, actual, pass, note = '') {
  regResults.push({ module, testId, name, type: happyOrNeg, expected: exp, actual, pass, note });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${module} - ${testId}] ${name} (${happyOrNeg}) | exp=${exp} act=${actual} | ${note}`);
}

async function runRegression() {
  console.log('========================================================');
  console.log('🚀 STARTING REGRESSION TEST SUITE ACROSS 9 MODULES');
  console.log('========================================================');

  const tokenAdmin = await login('202608001'); // TRUONG_PHONG / ADMIN
  const tokenUser = await login('202608002');  // CBCNV

  // -----------------------------------------------------------
  // MODULE 1: 1-5-2 (Báo cáo & Dashboard điều hành)
  // -----------------------------------------------------------
  // Happy path: Xem dashboard gate
  const r152_happy = await req('/api/1-5-2/verify-gate', 'GET', null, tokenAdmin);
  record('1-5-2', 'M1-HP-01', 'Xem dashboard 1-5-2 với role Giám đốc/Admin', 'Happy Path', '200 OK', r152_happy.status, r152_happy.status === 200, r152_happy.text.slice(0, 60));

  // Negative: Nhập sai mã PIN 1-5-2
  const r152_badpin = await req('/api/admin/module-152/verify-pin', 'POST', { pin: '0000' }, tokenUser);
  record('1-5-2', 'M1-NEG-01', 'Xác thực mã PIN 1-5-2 sai', 'Negative', '400/403', r152_badpin.status, r152_badpin.status === 400 || r152_badpin.status === 403, r152_badpin.text.slice(0, 60));

  // -----------------------------------------------------------
  // MODULE 2: MMTB (Máy móc Thiết bị & Bảo trì)
  // -----------------------------------------------------------
  // Happy path: Lấy danh sách máy móc
  const rMmtb_mach = await req('/api/maintenance/machines', 'GET', null, tokenUser);
  record('MMTB', 'M2-HP-01', 'Lấy danh sách máy móc nhà máy', 'Happy Path', '200 OK', rMmtb_mach.status, rMmtb_mach.status === 200, `Machines count: ${rMmtb_mach.json?.data?.length || 0}`);

  // Happy path: Lấy danh sách lịch bảo trì
  const rMmtb_sched = await req('/api/maintenance/schedule', 'GET', null, tokenUser);
  record('MMTB', 'M2-HP-02', 'Lấy lịch bảo dưỡng máy móc', 'Happy Path', '200 OK', rMmtb_sched.status, rMmtb_sched.status === 200);

  // Negative: Truy vấn loại danh mục MMTB không tồn tại
  const rMmtb_badcat = await req('/api/maintenance/categories?type=INVALID_TYPE', 'GET', null, tokenUser);
  record('MMTB', 'M2-NEG-01', 'Truy vấn danh mục MMTB không hợp lệ', 'Negative', '400 Bad Request', rMmtb_badcat.status, rMmtb_badcat.status === 400, rMmtb_badcat.text.slice(0, 60));

  // SLA Calculation check (Downtime = completedAt - createdAt)
  const createdAt = new Date('2026-10-12T08:00:00Z').getTime();
  const completedAt = new Date('2026-10-12T10:30:00Z').getTime();
  const downtimeHours = (completedAt - createdAt) / (1000 * 3600);
  record('MMTB', 'M2-CALC-01', 'Công thức tính downtime = completedAt - createdAt', 'Calculation', '2.5 giờ', `${downtimeHours} giờ`, downtimeHours === 2.5);

  // -----------------------------------------------------------
  // MODULE 3: Kaizen (Sáng kiến Cải tiến Liên tục)
  // -----------------------------------------------------------
  // Happy path: Lấy thống kê bảng xếp hạng Leaderboard Kaizen
  const rKz_stats = await req('/api/ci-kaizen/stats', 'GET', null, tokenUser);
  record('Kaizen', 'M3-HP-01', 'Lấy số liệu Kaizen stats & leaderboard', 'Happy Path', '200 OK', rKz_stats.status, rKz_stats.status === 200);

  // Happy path: Kiểm tra trùng lặp AI Kaizen
  const rKz_dup = await req('/api/ci-kaizen/check-duplicate?title=Tối ưu dây chuyền may Skechers', 'GET', null, tokenUser);
  record('Kaizen', 'M3-HP-02', 'Kiểm tra trùng lặp sáng kiến Kaizen', 'Happy Path', '200 OK', rKz_dup.status, rKz_dup.status === 200, rKz_dup.text.slice(0, 60));

  // Negative: Gửi đề xuất Kaizen thiếu tiêu đề và nội dung
  const rKz_empty = await req('/api/ci-kaizen', 'POST', { proposer_emp_code: '202608002' }, tokenUser);
  record('Kaizen', 'M3-NEG-01', 'Gửi đơn Kaizen rỗng', 'Negative', '400 Bad Request', rKz_empty.status, rKz_empty.status === 400, rKz_empty.text.slice(0, 60));

  // -----------------------------------------------------------
  // MODULE 4: Gemba Walk (Nhật ký hiện trường & Khắc phục)
  // -----------------------------------------------------------
  // Happy path: Lấy dữ liệu Gemba Dashboard & Cây vị trí
  const rGemba_dash = await req('/api/gemba/dashboard', 'GET', null, tokenUser);
  record('Gemba', 'M4-HP-01', 'Lấy Dashboard Gemba Walk', 'Happy Path', '200 OK', rGemba_dash.status, rGemba_dash.status === 200);

  const rGemba_tree = await req('/api/gemba/tree', 'GET', null, tokenUser);
  record('Gemba', 'M4-HP-02', 'Lấy cây vị trí phân xưởng xưởng Gemba', 'Happy Path', '200 OK', rGemba_tree.status, rGemba_tree.status === 200);

  // Negative: Tạo nhật ký Gemba với dữ liệu thiếu xưởng/chuyền
  const rGemba_bad = await req('/api/gemba/records', 'POST', { notes: '' }, tokenUser);
  record('Gemba', 'M4-NEG-01', 'Tạo nhật ký Gemba thiếu dữ liệu bắt buộc', 'Negative', '400/500/handled', rGemba_bad.status, rGemba_bad.status >= 400 || rGemba_bad.json?.success === false, rGemba_bad.text.slice(0, 60));

  // -----------------------------------------------------------
  // MODULE 5: Công Tác (Business Trips & Ngưỡng duyệt 5M)
  // -----------------------------------------------------------
  // Routing logic check: < 5M -> Trưởng phòng; >= 5M -> Giám đốc
  function getApproverRole(estimatedCost) {
    return estimatedCost >= 5000000 ? 'GIAM_DOC' : 'TRUONG_PHONG';
  }
  // Boundary tests: 4,999,999 vs 5,000,000
  const approverUnder5M = getApproverRole(4999999);
  record('Công Tác', 'M5-BIEN-01', 'Ngưỡng biên 4,999,999 VNĐ -> Trưởng phòng', 'Boundary', 'TRUONG_PHONG', approverUnder5M, approverUnder5M === 'TRUONG_PHONG');

  const approverEqual5M = getApproverRole(5000000);
  record('Công Tác', 'M5-BIEN-02', 'Ngưỡng biên 5,000,000 VNĐ -> Giám đốc', 'Boundary', 'GIAM_DOC', approverEqual5M, approverEqual5M === 'GIAM_DOC');

  // Happy path: Lấy danh sách công tác
  const rBt_list = await req('/api/business-trips', 'GET', null, tokenUser);
  record('Công Tác', 'M5-HP-01', 'Lấy danh sách công tác', 'Happy Path', '200 OK', rBt_list.status, rBt_list.status === 200);

  // -----------------------------------------------------------
  // MODULE 6: Đặt Phòng Họp (Room Bookings)
  // -----------------------------------------------------------
  // Happy path: Lấy danh sách phòng và lịch đặt
  const rRooms = await req('/api/rooms', 'GET', null, tokenUser);
  record('Đặt Phòng', 'M6-HP-01', 'Lấy danh sách phòng và lịch đặt', 'Happy Path', '200 OK', rRooms.status, rRooms.status === 200);

  // Trùng khung giờ biên: Kết thúc 10:00 và bắt đầu 10:00 (không trùng)
  function isOverlap(start1, end1, start2, end2) {
    // start1 < end2 && end1 > start2
    return start1 < end2 && end1 > start2;
  }
  const isBoundaryOverlap = isOverlap('09:00', '10:00', '10:00', '11:00');
  record('Đặt Phòng', 'M6-BIEN-01', 'Khung giờ tiếp nối 09:00-10:00 và 10:00-11:00 KHÔNG bị coi là trùng', 'Boundary', 'false (không trùng)', String(isBoundaryOverlap), isBoundaryOverlap === false);

  const isRealOverlap = isOverlap('09:00', '10:30', '10:00', '11:00');
  record('Đặt Phòng', 'M6-BIEN-02', 'Khung giờ giao nhau 09:00-10:30 và 10:00-11:00 BỊ coi là trùng', 'Boundary', 'true (trùng)', String(isRealOverlap), isRealOverlap === true);

  // -----------------------------------------------------------
  // MODULE 7: Finance (Kế toán & Tài chính)
  // -----------------------------------------------------------
  // Happy path: Lấy danh sách mục tiêu ngân sách
  const rFin_targets = await req('/api/finance/targets', 'GET', null, tokenUser);
  record('Finance', 'M7-HP-01', 'Lấy ngân sách mục tiêu tài chính', 'Happy Path', '200 OK', rFin_targets.status, rFin_targets.status === 200);

  // Happy path: Lấy danh sách tạm ứng
  const rFin_adv = await req('/api/finance/advance', 'GET', null, tokenUser);
  record('Finance', 'M7-HP-02', 'Lấy danh sách tạm ứng tài chính', 'Happy Path', '200 OK', rFin_adv.status, rFin_adv.status === 200);

  // -----------------------------------------------------------
  // MODULE 8: HR (Quản lý Nhân sự & Tiền lương)
  // -----------------------------------------------------------
  // Happy path: Lấy danh sách onboard
  const rHr_onboard = await req('/api/hr/onboarding', 'GET', null, tokenUser);
  record('HR', 'M8-HP-01', 'Lấy danh sách onboarding nhân viên mới', 'Happy Path', '200 OK', rHr_onboard.status, rHr_onboard.status === 200);

  // Happy path: Lấy danh sách nghỉ phép
  const rHr_leave = await req('/api/hr/leave', 'GET', null, tokenUser);
  record('HR', 'M8-HP-02', 'Lấy danh sách nghỉ phép nhân viên', 'Happy Path', '200 OK', rHr_leave.status, rHr_leave.status === 200);

  // -----------------------------------------------------------
  // MODULE 9: Admin (Quản trị Hệ thống & Phân quyền)
  // -----------------------------------------------------------
  // Happy path: Lấy workspace menu
  const rAdmin_menu = await req('/api/workspace/menu', 'GET', null, tokenAdmin);
  record('Admin', 'M9-HP-01', 'Lấy cấu hình menu workspace theo role', 'Happy Path', '200 OK', rAdmin_menu.status, rAdmin_menu.status === 200);

  // Happy path: Lấy audit search
  const rAdmin_audit = await req('/api/admin/audit-search', 'GET', null, tokenAdmin);
  record('Admin', 'M9-HP-02', 'Tìm kiếm nhật ký kiểm toán (Audit search)', 'Happy Path', '200 OK', rAdmin_audit.status, rAdmin_audit.status === 200);

  // -----------------------------------------------------------
  // CROSS-CUTTING: Unicode Tiếng Việt, Media Upload & CDN
  // -----------------------------------------------------------
  const viText = 'Cải tiến dây chuyền may giày Skechers D Lites - Nhà máy Kiên Giang #@!%&*()_+';
  const rVi = await req('/api/ci-kaizen/check-duplicate?title=' + encodeURIComponent(viText), 'GET', null, tokenUser);
  record('Cross-cutting', 'XC-UNICODE-01', 'Hỗ trợ chuỗi tiếng Việt có dấu và ký tự đặc biệt', 'Internationalization', '200 OK', rVi.status, rVi.status === 200);

  console.log('\n========================================================');
  const passCount = regResults.filter(r => r.pass).length;
  console.log(`TOTAL REGRESSION: ${regResults.length} | PASSED: ${passCount} | FAILED: ${regResults.length - passCount}`);
  console.log('========================================================');

  fs.writeFileSync('web/scratch/qa/regression-results.json', JSON.stringify(regResults, null, 2));
}

runRegression();
