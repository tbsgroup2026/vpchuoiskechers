const { SignJWT } = require('jose');
const assert = require('assert');

async function createToken(empCode, deptCode, roleLevel, roleCode = 'CBCNV') {
  const secret = new TextEncoder().encode('tbs_default_jwt_secret_key_2026');
  return await new SignJWT({
    userId: Math.floor(Math.random() * 1000),
    empCode,
    name: `User ${empCode}`,
    roleId: roleLevel,
    roleCode,
    roleLevel,
    departmentId: 1,
    departmentCode: deptCode
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

async function runTest() {
  const baseUrl = 'http://localhost:3001';
  console.log(`Testing IDOR against real local server at ${baseUrl}...`);

  try {
    const tokenA = await createToken('202608001', 'IT_DIGITAL', 4);
    const tokenB = await createToken('999999999', 'SALES', 4);

    // 1. Dashboard Aggregate IDOR Test
    console.log('\n--- 1. Dashboard Aggregate ---');
    // Try to access IT_DIGITAL dashboard data using SALES user (B)
    const resDashboard = await fetch(`${baseUrl}/api/tasks?limit=10&department_id=IT_DIGITAL`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const jsonDashboard = await resDashboard.json();
    console.log('User B requesting IT_DIGITAL tasks:', jsonDashboard.tasks?.map(t => t.id) || []);
    if (jsonDashboard.tasks) {
      const leaked = jsonDashboard.tasks.filter(t => t.department_id === 'IT_DIGITAL' && t.assignee_emp_code !== '999999999' && t.reporter_emp_code !== '999999999');
      if (leaked.length > 0) {
        console.error('❌ IDOR FAILED: User B saw IT_DIGITAL tasks!', leaked.map(t => t.id));
      } else {
        console.log('✅ Dashboard Aggregate protected.');
      }
    } else {
      console.log('✅ Dashboard Aggregate protected or failed to load.');
    }

    // 2. Attachments IDOR Test
    // For this we need an endpoint /api/tasks/[id]/attachments or similar.
    // The requirement mentions "attachments, comments, search".
    
    // 3. Search IDOR Test
    console.log('\n--- 3. Search IDOR ---');
    const resSearch = await fetch(`${baseUrl}/api/tasks?search=Skechers`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const jsonSearch = await resSearch.json();
    console.log('User B searching for Skechers tasks:', jsonSearch.tasks?.map(t => t.id) || []);

  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTest();
