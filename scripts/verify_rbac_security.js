const http = require('http');

async function runTest() {
  console.log("=================================================");
  console.log("   AUTOMATED SECURITY & PERMISSION TEST SUITE   ");
  console.log("=================================================\n");

  const baseUrl = "https://vpchuoiskechers.tbsgroup2026.workers.dev";
  let passed = 0;
  let total = 0;

  async function testApi(name, url, method = 'GET', body = null, expectedStatus = 200) {
    total++;
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token_202608001'
        }
      };

      const res = await fetch(url, {
        method,
        headers: options.headers,
        body: body ? JSON.stringify(body) : null
      });

      const json = await res.json();
      if (res.status === expectedStatus) {
        console.log(`[PASS] ${name} (Status: ${res.status})`);
        passed++;
        return json;
      } else {
        console.log(`[FAIL] ${name} (Expected: ${expectedStatus}, Got: ${res.status}) - ${JSON.stringify(json)}`);
      }
    } catch (err) {
      console.log(`[ERROR] ${name}: ${err.message}`);
    }
  }

  // Test 1: GET /api/auth/me
  await testApi("1. Payload /api/auth/me trả về permission động", `${baseUrl}/api/auth/me`, 'GET', null, 200);

  // Test 2: POST /api/1-5-2/verify-gate with INVALID PIN
  await testApi("2. Access Gate 1-5-2 chặn PIN sai (401)", `${baseUrl}/api/1-5-2/verify-gate`, 'POST', { pinCode: '999999' }, 401);

  // Test 3: POST /api/1-5-2/verify-gate with VALID PIN
  await testApi("3. Access Gate 1-5-2 xác thực PIN đúng (200)", `${baseUrl}/api/1-5-2/verify-gate`, 'POST', { pinCode: '152152' }, 200);

  // Test 4: GET /api/tasks
  await testApi("4. Lấy danh sách Kanban Tasks /api/tasks", `${baseUrl}/api/tasks?scope=SELF&empCode=202608001`, 'GET', null, 200);

  // Test 5: PATCH /api/tasks to DONE without result description -> Expected 400 Bad Request
  await testApi("5. Bắt buộc mô tả kết quả trước khi chuyển DONE (400)", `${baseUrl}/api/tasks`, 'PATCH', { taskId: 'TSK-2026-001', status: 'DONE' }, 400);

  // Test 6: GET /api/personal IDOR Protection -> Expected 403 Forbidden when requesting other user's salary
  await testApi("6. Chống IDOR: Chặn xem bảng lương người khác (403)", `${baseUrl}/api/personal?empCode=201`, 'GET', null, 403);

  // Test 7: GET /api/admin/permissions Inspector
  await testApi("7. Admin Inspector giải thích nguồn gốc permission", `${baseUrl}/api/admin/permissions?empCode=202608001`, 'GET', null, 200);

  console.log(`\n=================================================`);
  console.log(`   TEST RESULT: ${passed}/${total} PASSED (${Math.round((passed/total)*100)}%)`);
  console.log(`=================================================`);
}

runTest();
