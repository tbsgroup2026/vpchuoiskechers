const { signToken } = require('../web/src/lib/auth');

// Dynamic mock request builder for testing Next.js API route handlers in Node environment
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

async function runBackendVerification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING ALL 11 QA BACKEND FIXES & SYSTEMIC SECURITY GUARDS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, errorDetail = '') {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${message} ${errorDetail ? '(' + errorDetail + ')' : ''}`);
      failed++;
    }
  }

  // Create JWT tokens for testing
  const staffToken = `tbs_token_202608003_${Date.now()}`; // Ngô Hà Thanh An (CBCNV / Staff)
  const tpToken = `tbs_token_202608001_${Date.now()}`;    // Phạm Nguyễn Anh Huy (Trưởng phòng)
  const bgdToken = `tbs_token_200405004_${Date.now()}`;   // Trần Văn Quản Trị (Ban Giám Đốc)

  try {
    // ----------------------------------------------------------------------
    // TEST 1: IDOR Protection on /api/personal
    // ----------------------------------------------------------------------
    console.log('\n--- TEST 1: IDOR Protection on /api/personal ---');
    const personalRoute = require('../web/src/app/api/personal/route');

    // 1a. Missing token -> 401 Unauthorized
    const req1a = createMockRequest('http://localhost:3000/api/personal', 'GET');
    const res1a = await personalRoute.GET(req1a);
    const json1a = await res1a.json();
    assert(res1a.status === 401, 'Request missing token returns 401 Unauthorized', `Got status ${res1a.status}`);

    // 1b. Staff requesting other user's salary -> 403 Forbidden
    const req1b = createMockRequest('http://localhost:3000/api/personal?empCode=200405004', 'GET', null, staffToken);
    const res1b = await personalRoute.GET(req1b);
    const json1b = await res1b.json();
    assert(res1b.status === 403, 'Staff requesting BOD salary returns 403 Forbidden', `Got status ${res1b.status}`);

    // 1c. Staff requesting own salary -> 200 OK
    const req1c = createMockRequest('http://localhost:3000/api/personal?empCode=202608003', 'GET', null, staffToken);
    const res1c = await personalRoute.GET(req1c);
    const json1c = await res1c.json();
    assert(res1c.status === 200 && json1c.success === true, 'Staff requesting own salary succeeds 200 OK');

    // ----------------------------------------------------------------------
    // TEST 2: /api/tasks Authentication & Dynamic Reporter Fix
    // ----------------------------------------------------------------------
    console.log('\n--- TEST 2: /api/tasks Auth & Dynamic Reporter Fix ---');
    const tasksRoute = require('../web/src/app/api/tasks/route');

    // 2a. POST /api/tasks missing token -> 401 Unauthorized
    const req2a = createMockRequest('http://localhost:3000/api/tasks', 'POST', { title: 'Test Task' });
    const res2a = await tasksRoute.POST(req2a);
    assert(res2a.status === 401, 'POST /api/tasks missing token returns 401 Unauthorized', `Got status ${res2a.status}`);

    // 2b. POST /api/tasks with staff token -> reporter_emp_code matches staff (NOT hardcoded)
    const req2b = createMockRequest('http://localhost:3000/api/tasks', 'POST', { title: 'Công việc kiểm thử tự động QA' }, staffToken);
    const res2b = await tasksRoute.POST(req2b);
    const json2b = await res2b.json();
    assert(
      res2b.status === 200 && json2b.task && json2b.task.reporter_emp_code === '202608003',
      'POST /api/tasks dynamically sets reporter_emp_code to session empCode (202608003)',
      `Reporter was: ${json2b.task ? json2b.task.reporter_emp_code : 'undefined'}`
    );

    // ----------------------------------------------------------------------
    // TEST 3: /api/tasks Validation & NEED_HELP Notification
    // ----------------------------------------------------------------------
    console.log('\n--- TEST 3: /api/tasks Validation & NEED_HELP Notifications ---');
    const taskId = json2b.task ? json2b.task.id : 'tsk_test_1';

    // 3a. PATCH status DONE without result_description -> 400 Bad Request
    const req3a = createMockRequest('http://localhost:3000/api/tasks', 'PATCH', { taskId, status: 'DONE', resultDescription: '' }, staffToken);
    const res3a = await tasksRoute.PATCH(req3a);
    const json3a = await res3a.json();
    assert(res3a.status === 400, 'Transition to DONE without result_description returns 400 Bad Request', `Got status ${res3a.status}`);

    // 3b. PATCH status DONE with valid result_description (>=10 chars) -> 200 OK
    const req3b = createMockRequest(
      'http://localhost:3000/api/tasks',
      'PATCH',
      { taskId, status: 'DONE', resultDescription: 'Đã hoàn thành nghiệm thu đầy đủ 100%' },
      staffToken
    );
    const res3b = await tasksRoute.PATCH(req3b);
    assert(res3b.status === 200, 'Transition to DONE with valid result_description returns 200 OK', `Got status ${res3b.status}`);

    // 3c. PATCH status NEED_HELP -> triggers manager notification
    const req3c = createMockRequest(
      'http://localhost:3000/api/tasks',
      'PATCH',
      { taskId, status: 'NEED_HELP', helpReason: 'Vướng mắc phần cứng dây chuyền may' },
      staffToken
    );
    const res3c = await tasksRoute.PATCH(req3c);
    const json3c = await res3c.json();
    assert(res3c.status === 200 && json3c.help_notified_to !== '', 'Status NEED_HELP returns notified manager info');

    // ----------------------------------------------------------------------
    // TEST 4: Business Trip 2-Level Approval Sequential Guard
    // ----------------------------------------------------------------------
    console.log('\n--- TEST 4: Business Trip 2-Level Approval Sequential Guard ---');
    const tripRoute = require('../web/src/app/api/business-trips/route');

    // 4a. POST business trip with staff token
    const req4a = createMockRequest(
      'http://localhost:3000/api/business-trips',
      'POST',
      {
        title: 'Công tác khảo sát nhà máy Kiên Giang',
        creator: 'Ngô Hà Thanh An',
        location: 'Nhà máy Kiên Giang',
        startDate: '2026-09-20',
        endDate: '2026-09-22',
      },
      staffToken
    );
    const res4a = await tripRoute.POST(req4a);
    const json4a = await res4a.json();
    const tripId = json4a.id || 'rec_test_1';
    assert(res4a.status === 200, 'POST business trip succeeds 200 OK');

    // 4b. Direct APPROVE_L2 without prior L1 approval -> 400 Bad Request (Sequential Guard)
    const req4b = createMockRequest(
      'http://localhost:3000/api/business-trips',
      'PUT',
      { id: tripId, actionLevel: 'APPROVE_L2' },
      bgdToken
    );
    const res4b = await tripRoute.PUT(req4b);
    assert(res4b.status === 400, 'Direct APPROVE_L2 without L1 approval returns 400 Bad Request', `Got status ${res4b.status}`);

    // 4c. APPROVE_L1 by Department Head -> 200 OK (Status transitions to PENDING_L2)
    const req4c = createMockRequest(
      'http://localhost:3000/api/business-trips',
      'PUT',
      { id: tripId, actionLevel: 'APPROVE_L1' },
      tpToken
    );
    const res4c = await tripRoute.PUT(req4c);
    assert(res4c.status === 200, 'APPROVE_L1 by Department Head succeeds 200 OK');

    // 4d. APPROVE_L2 by BGĐ on PENDING_L2 trip -> 200 OK (Status transitions to APPROVED)
    const req4d = createMockRequest(
      'http://localhost:3000/api/business-trips',
      'PUT',
      { id: tripId, actionLevel: 'APPROVE_L2' },
      bgdToken
    );
    const res4d = await tripRoute.PUT(req4d);
    assert(res4d.status === 200, 'APPROVE_L2 by BGĐ after L1 approval succeeds 200 OK');

    // ----------------------------------------------------------------------
    // TEST 5: Meeting Room Booking Conflict Lock (409 Conflict)
    // ----------------------------------------------------------------------
    console.log('\n--- TEST 5: Meeting Room Booking Conflict Lock (409 Conflict) ---');
    const roomBookingRoute = require('../web/src/app/api/rooms/booking/route');
    const bookingDate = '2026-09-25';
    const bookingSlot = '09:00 - 10:00';

    // 5a. First room booking -> 200 OK
    const req5a = createMockRequest(
      'http://localhost:3000/api/rooms/booking',
      'POST',
      { roomId: 'room_1', roomName: 'Phòng Họp Executive', date: bookingDate, timeSlot: bookingSlot, purpose: 'Họp chiến lược QA' },
      staffToken
    );
    const res5a = await roomBookingRoute.POST(req5a);
    assert(res5a.status === 200, 'First room booking request succeeds 200 OK');

    // 5b. Second room booking for SAME room & SAME slot -> 409 Conflict
    const req5b = createMockRequest(
      'http://localhost:3000/api/rooms/booking',
      'POST',
      { roomId: 'room_1', roomName: 'Phòng Họp Executive', date: bookingDate, timeSlot: bookingSlot, purpose: 'Họp QC trùng giờ' },
      tpToken
    );
    const res5b = await roomBookingRoute.POST(req5b);
    assert(res5b.status === 409, 'Overlapping room booking request returns 409 Conflict', `Got status ${res5b.status}`);

    // ----------------------------------------------------------------------
    // TEST 6: System Notifications API Endpoints
    // ----------------------------------------------------------------------
    console.log('\n--- TEST 6: System Notifications API Endpoints ---');
    const notificationsRoute = require('../web/src/app/api/notifications/route');
    const unreadCountRoute = require('../web/src/app/api/notifications/unread-count/route');

    // 6a. GET /api/notifications -> 200 OK
    const req6a = createMockRequest('http://localhost:3000/api/notifications', 'GET', null, staffToken);
    const res6a = await notificationsRoute.GET(req6a);
    const json6a = await res6a.json();
    assert(res6a.status === 200 && Array.isArray(json6a.notifications), 'GET /api/notifications returns notification list');

    // 6b. GET /api/notifications/unread-count -> 200 OK
    const req6b = createMockRequest('http://localhost:3000/api/notifications/unread-count', 'GET', null, staffToken);
    const res6b = await unreadCountRoute.GET(req6b);
    const json6b = await res6b.json();
    assert(res6b.status === 200 && typeof json6b.count === 'number', 'GET /api/notifications/unread-count returns unread count');

    // ----------------------------------------------------------------------
    // TEST 7: Profile Protection (/api/profile)
    // ----------------------------------------------------------------------
    console.log('\n--- TEST 7: Profile Protection (/api/profile) ---');
    const profileRoute = require('../web/src/app/api/profile/route');

    // 7a. Staff attempting to modify another employee profile -> 403 Forbidden
    const req7a = createMockRequest(
      'http://localhost:3000/api/profile',
      'POST',
      { empCode: '200405004', name: 'Hacked Name' },
      staffToken
    );
    const res7a = await profileRoute.POST(req7a);
    assert(res7a.status === 403, 'Staff attempting to modify another profile returns 403 Forbidden', `Got status ${res7a.status}`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL BACKEND VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
}

runBackendVerification();
