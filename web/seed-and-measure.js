const Database = require('better-sqlite3');
const db = new Database('test_d1_mock.db');

// Seed 1000 tasks
console.log('Seeding 1000 tasks...');
const stmt = db.prepare(`
  INSERT INTO tasks (id, title, description, department_id, assignee_emp_code, status, kanban_position, due_date, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const startTimeSeed = Date.now();
db.transaction(() => {
  for (let i = 0; i < 1000; i++) {
    stmt.run(
      `TEST_TASK_${i}`,
      `Task ${i}`,
      `Description for ${i}`,
      `DEPT_${i % 5}`,
      `EMP_${i % 10}`,
      ['TO_DO', 'DOING', 'DONE'][i % 3],
      i % 100,
      `2026-11-${(i % 28) + 1}`
    );
  }
})();
console.log(`Seeded in ${Date.now() - startTimeSeed}ms`);

// Test GET /api/tasks (using raw db query equivalent to route)
console.log('Testing GET /api/tasks equivalent query...');
let startQuery = Date.now();
const res1 = db.prepare('SELECT * FROM tasks WHERE department_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC LIMIT 50 OFFSET 0').all('DEPT_1');
let endQuery = Date.now();
console.log(`GET /api/tasks query took ${endQuery - startQuery}ms (Returned ${res1.length} rows)`);

// Test GET /api/task-cards V2 (Kanban board)
console.log('Testing GET /api/task-cards V2 equivalent query...');
startQuery = Date.now();
const res2 = db.prepare('SELECT * FROM tasks WHERE department_id = ? ORDER BY kanban_position ASC, created_at DESC, id DESC').all('DEPT_1');
endQuery = Date.now();
console.log(`GET /api/task-cards query took ${endQuery - startQuery}ms (Returned ${res2.length} rows)`);

// EXPLAIN QUERY PLAN
console.log('--- EXPLAIN QUERY PLAN for GET /api/tasks ---');
console.log(db.prepare('EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE department_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC LIMIT 50 OFFSET 0').all('DEPT_1'));

db.close();
