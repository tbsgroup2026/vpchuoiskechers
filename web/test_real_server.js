const { SignJWT } = require('jose');

const JWT_SECRET = process.env.JWT_SECRET || 'tbs_ii_secure_jwt_secret_key_2026';

async function generateToken() {
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({ empCode: '202608001', name: 'Admin', roleLevel: 1 })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(secretKey);
}

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  const token = await generateToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('=== PREPARING DATA ===');
  // 1. Create a task via API (both tables)
  const createRes = await fetch(`${BASE_URL}/api/task-cards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Test Task for Race', board_id: 'b1', list_id: 'col_1', sort_order: 1 })
  });
  const created = await createRes.json();
  if (!created.success) {
    console.error('Failed to create test task', created);
    return;
  }
  const cardId = created.card.id;
  console.log(`Created Task: ${cardId}`);

  // Fetch initial version
  const fetchRes = await fetch(`${BASE_URL}/api/task-cards?board_id=b1`, { headers });
  const fetched = await fetchRes.json();
  const task = fetched.cards.find(c => c.id === cardId);
  const version = task.version;
  console.log(`Initial version: ${version}`);

  console.log('\n=== TEST 1: RACE KANBAN PATCH vs TASKS MOVE ===');
  // 1. PATCH Kanban (move to col_2)
  const req1 = fetch(`${BASE_URL}/api/task-cards`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      cards: [{ id: cardId, list_id: 'col_2', sort_order: 2, version }]
    })
  }).then(r => r.json());

  // 2. PATCH V2 Move (move to col_3)
  const req2 = fetch(`${BASE_URL}/api/tasks/${cardId}/move`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ targetColumnId: 'col_3', targetPosition: 3, version })
  }).then(r => r.json());

  const [res1, res2] = await Promise.all([req1, req2]);
  console.log('Kanban PATCH result:', res1.success ? 'SUCCESS' : `FAILED (${res1.error || res1.message})`);
  console.log('V2 MOVE result:', res2.success ? 'SUCCESS' : `FAILED (${res2.error || res2.message})`);
  
  if (res1.success && res2.success) {
    console.error('FAIL: Both succeeded!');
  } else if (!res1.success && !res2.success) {
    console.error('FAIL: Both failed!');
  } else {
    console.log('PASS: Exactly 1 succeeded and 1 failed with conflict.');
  }

  console.log('\n=== TEST 2: CHECK DB STATE ===');
  // I will just use wrangler d1 execute to dump the state
  console.log(`Please run: npx wrangler d1 execute kaizen-db --local --command "SELECT id, status, version, write_token FROM task_cards WHERE id = '${cardId}';"`);
  console.log(`Please run: npx wrangler d1 execute kaizen-db --local --command "SELECT id, status, version, write_token FROM tasks WHERE id = '${cardId}';"`);

  console.log('\n=== TEST 3: DELETE 2 CHIỀU THIẾU VERSION (428) ===');
  const delMissingVersion = await fetch(`${BASE_URL}/api/tasks?taskId=${cardId}`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete missing version status:', delMissingVersion.status);

  console.log('\n=== TEST 4: DELETE 2 CHIỀU ĐÚNG VERSION ===');
  // Must fetch new version first
  const newFetchRes = await fetch(`${BASE_URL}/api/task-cards?board_id=b1`, { headers });
  const newFetched = await newFetchRes.json();
  const newTask = newFetched.cards.find(c => c.id === cardId);
  const newVersion = newTask.version;
  
  const delCorrect = await fetch(`${BASE_URL}/api/tasks?taskId=${cardId}&version=${newVersion}`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete correct version status:', delCorrect.status);
}

runTests();
