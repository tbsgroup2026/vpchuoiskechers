import { getAuthUser, isAdminUser } from '../web/src/lib/auth.ts';
import * as personalRoute from '../web/src/app/api/personal/route.ts';
import * as tasksRoute from '../web/src/app/api/tasks/route.ts';
import * as handoverTriggerRoute from '../web/src/app/api/tasks/handover/route.ts';
import * as handoverConfirmRoute from '../web/src/app/api/tasks/[id]/handover-confirm/route.ts';
import * as tripRoute from '../web/src/app/api/business-trips/route.ts';
import * as roomBookingRoute from '../web/src/app/api/rooms/booking/route.ts';
import * as notificationsRoute from '../web/src/app/api/notifications/route.ts';
import * as unreadCountRoute from '../web/src/app/api/notifications/unread-count/route.ts';
import * as profileRoute from '../web/src/app/api/profile/route.ts';

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

async function runRealVerification() {
  console.log('================================================================');
  console.log('🧪 EMPIRICAL ACCEPTANCE VERIFICATION — BACKEND FIXES & SECURITY');
  console.log('================================================================\n');

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

  const staffToken = `tbs_token_202608003_${Date.now()}`; // Ngô Hà Thanh An (Staff)
  const tpToken = `tbs_token_202608001_${Date.now()}`;    // Phạm Nguyễn Anh Huy (Trưởng phòng)
  const bgdToken = `tbs_token_200405004_${Date.now()}`;   // Trần Văn Quản Trị (Ban Giám Đốc)

  try {
    // ----------------------------------------------------------------------
    // 1. IDOR PROTECTION ON /api/personal
    // ----------------------------------------------------------------------
    console.log('--- 1. IDOR PROTECTION ON /api/personal ---');

    // 1a. Missing token -> 401 Unauthorized
    const req1a = createMockRequest('http://localhost:3000/api/personal', 'GET');
    const res1a = await personalRoute.GET(req1a);
    assert(res1a.status === 401, 'Request missing token returns 401 Unauthorized', `Got: ${res1a.status}`);

    // 1b. Staff requesting other user salary -> 403 Forbidden
    const req1b = createMockRequest('http://localhost:3000/api/personal?empCode=200405004', 'GET', null, staffToken);
    const res1b = await personalRoute.GET(req1b);
    assert(res1b.status === 403, 'Staff requesting BOD salary returns 403 Forbidden', `Got: ${res1b.status}`);

    // 1c. Staff requesting own salary -> 200 OK
    const req1c = createMockRequest('http://localhost:3000/api/personal?empCode=202608003', 'GET', null, staffToken);
    const res1c = await personalRoute.GET(req1c);
    const json1c = await res1c.json();
    assert(res1c.status === 200 && json1c.success === true, 'Staff requesting own salary succeeds 200 OK');

    // ----------------------------------------------------------------------
    // 2. /api/tasks AUTH & DYNAMIC REPORTER & VALIDATION
    // ----------------------------------------------------------------------
    console.log('\n--- 2. /api/tasks AUTH, DYNAMIC REPORTER & VALIDATIONS ---');

    // 2a. POST /api/tasks missing token -> 401 Unauthorized
    const req2a = createMockRequest('http://localhost:3000/api/tasks', 'POST', { title: 'Test Task' });
    const res2a = await tasksRoute.POST(req2a);
    const json2a = await res2a.json();
    assert(res2a.status === 401, 'POST /api/tasks missing token returns 401 Unauthorized', `Got: ${res2a.status}`, json2a);

    // 2b. POST /api/tasks with staff token -> dynamic reporter matches staff empCode (202608003)
    const req2b = createMockRequest('http://localhost:3000/api/tasks', 'POST', { title: 'Công việc kiểm thử tự động QA' }, staffToken);
    const res2b = await tasksRoute.POST(req2b);
    const json2b = await res2b.json();
    assert(
      res2b.status === 200 && json2b.task && json2b.task.reporter_emp_code === '202608003',
      'POST /api/tasks sets reporter_emp_code to session empCode (202608003)',
      `Reporter was: ${json2b.task ? json2b.task.reporter_emp_code : 'undefined'}`
    );

    const taskId = json2b.task ? json2b.task.id : 'tsk_test_1';

    // 2c. PATCH status DONE without result_description -> 400 Bad Request
    const req2c = createMockRequest('http://localhost:3000/api/tasks', 'PATCH', { taskId, status: 'DONE', resultDescription: '' }, staffToken);
    const res2c = await tasksRoute.PATCH(req2c);
    assert(res2c.status === 400, 'Transition to DONE without result_description returns 400 Bad Request', `Got: ${res2c.status}`);

    // 2d. PATCH status DONE with valid result_description -> 200 OK
    const req2d = createMockRequest('http://localhost:3000/api/tasks', 'PATCH', { taskId, status: 'DONE', resultDescription: 'Đã hoàn thành nghiệm thu 100%' }, staffToken);
    const res2d = await tasksRoute.PATCH(req2d);
    assert(res2d.status === 200, 'Transition to DONE with valid result_description returns 200 OK');

    // ----------------------------------------------------------------------
    // 3. BUSINESS TRIP 2-LEVEL SEQUENTIAL APPROVAL GUARD
    // ----------------------------------------------------------------------
    console.log('\n--- 3. BUSINESS TRIP 2-LEVEL SEQUENTIAL APPROVAL GUARD ---');

    // 3a. Submit new business trip
    const req3a = createMockRequest(
      'http://localhost:3000/api/business-trips',
      'POST',
      { title: 'Công tác Kiên Giang', creator: 'Ngô Hà Thanh An', location: 'Nhà máy Kiên Giang' },
      staffToken
    );
    const res3a = await tripRoute.POST(req3a);
    const json3a = await res3a.json();
    const tripId = json3a.id || 'rec_test_1';
    assert(res3a.status === 200, 'POST business trip succeeds 200 OK');

    // 3b. Direct APPROVE_L2 on unapproved L1 trip -> 400 Bad Request
    const req3b = createMockRequest('http://localhost:3000/api/business-trips', 'PUT', { id: tripId, actionLevel: 'APPROVE_L2' }, bgdToken);
    const res3b = await tripRoute.PUT(req3b);
    assert(res3b.status === 400, 'Direct APPROVE_L2 on unapproved L1 trip returns 400 Bad Request', `Got: ${res3b.status}`);

    // 3c. APPROVE_L1 by Department Head -> 200 OK
    const req3c = createMockRequest('http://localhost:3000/api/business-trips', 'PUT', { id: tripId, actionLevel: 'APPROVE_L1' }, tpToken);
    const res3c = await tripRoute.PUT(req3c);
    assert(res3c.status === 200, 'APPROVE_L1 by Department Head succeeds 200 OK');

    // 3d. APPROVE_L2 by BGĐ on PENDING_L2 trip -> 200 OK
    const req3d = createMockRequest('http://localhost:3000/api/business-trips', 'PUT', { id: tripId, actionLevel: 'APPROVE_L2' }, bgdToken);
    const res3d = await tripRoute.PUT(req3d);
    assert(res3d.status === 200, 'APPROVE_L2 by BGĐ after L1 approval succeeds 200 OK');

    // ----------------------------------------------------------------------
    // 4. ROOM BOOKING CONFLICT LOCK (409 CONFLICT)
    // ----------------------------------------------------------------------
    console.log('\n--- 4. ROOM BOOKING CONFLICT LOCK (409 CONFLICT) ---');
    const bookingDate = '2026-09-30';
    const bookingSlot = '10:00 - 11:00';

    // 4a. First booking -> 200 OK
    const req4a = createMockRequest(
      'http://localhost:3000/api/rooms/booking',
      'POST',
      { roomId: 'room_1', roomName: 'Phòng Executive', date: bookingDate, timeSlot: bookingSlot },
      staffToken
    );
    const res4a = await roomBookingRoute.POST(req4a);
    assert(res4a.status === 200, 'First room booking succeeds 200 OK');

    // 4b. Overlapping booking -> 409 Conflict
    const req4b = createMockRequest(
      'http://localhost:3000/api/rooms/booking',
      'POST',
      { roomId: 'room_1', roomName: 'Phòng Executive', date: bookingDate, timeSlot: bookingSlot },
      tpToken
    );
    const res4b = await roomBookingRoute.POST(req4b);
    assert(res4b.status === 409, 'Overlapping room booking returns 409 Conflict', `Got: ${res4b.status}`);

    // ----------------------------------------------------------------------
    // 5. SYSTEM NOTIFICATIONS BACKEND API
    // ----------------------------------------------------------------------
    console.log('\n--- 5. SYSTEM NOTIFICATIONS BACKEND API ---');

    const req5a = createMockRequest('http://localhost:3000/api/notifications', 'GET', null, staffToken);
    const res5a = await notificationsRoute.GET(req5a);
    const json5a = await res5a.json();
    assert(res5a.status === 200 && Array.isArray(json5a.notifications), 'GET /api/notifications returns notification list');

    const req5b = createMockRequest('http://localhost:3000/api/notifications/unread-count', 'GET', null, staffToken);
    const res5b = await unreadCountRoute.GET(req5b);
    const json5b = await res5b.json();
    assert(res5b.status === 200 && typeof json5b.count === 'number', 'GET /api/notifications/unread-count returns unread count');

    // ----------------------------------------------------------------------
    // 6. TASK HANDOVER WORKFLOW ON DEPARTMENT CHANGE (FIX #11)
    // ----------------------------------------------------------------------
    console.log('\n--- 6. TASK HANDOVER WORKFLOW ON DEPARTMENT CHANGE (FIX #11) ---');

    // 6a. Trigger handover for open tasks when employee changes department
    const req6a = createMockRequest(
      'http://localhost:3000/api/tasks/handover',
      'POST',
      { empCode: '202608003', previousDepartmentId: 'NHAN_SU', newDepartmentId: 'KE_TOAN', handoverNote: 'Bàn giao khi chuyển phòng' },
      staffToken
    );
    const res6a = await handoverTriggerRoute.POST(req6a);
    const json6a = await res6a.json();
    assert(res6a.status === 200 && json6a.newDepartmentId === 'KE_TOAN', 'Trigger task handover sets PENDING_HANDOVER flow');

    // 6b. Department Head confirms task handover -> 200 OK
    const req6b = createMockRequest(
      'http://localhost:3000/api/tasks/sample/handover-confirm',
      'POST',
      { action: 'CONFIRM', targetDepartmentId: 'KE_TOAN' },
      tpToken
    );
    const res6b = await handoverConfirmRoute.POST(req6b, { params: { id: taskId } });
    const json6b = await res6b.json();
    assert(res6b.status === 200, 'Department Head confirms task handover 200 OK');

    // ----------------------------------------------------------------------
    // 7. PROFILE UPDATE PROTECTION (/api/profile)
    // ----------------------------------------------------------------------
    console.log('\n--- 7. PROFILE UPDATE PROTECTION (/api/profile) ---');

    const req7a = createMockRequest('http://localhost:3000/api/profile', 'POST', { empCode: '200405004', name: 'Hacked' }, staffToken);
    const res7a = await profileRoute.POST(req7a);
    assert(res7a.status === 403, 'Staff attempting to modify another profile returns 403 Forbidden', `Got: ${res7a.status}`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL BACKEND VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRealVerification();
