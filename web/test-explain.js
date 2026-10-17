const Database = require('better-sqlite3');
// Assuming the db is local for testing. If it's D1, we can't run it locally unless we use miniflare or mock.
// Actually, I can just write the EXPLAIN QUERY PLAN and output it.
const path = require('path');
const fs = require('fs');

async function run() {
  // Try to find local sqlite DB in .wrangler/state/v3/d1
  const d1Dir = path.join(__dirname, '.wrangler', 'state', 'v3', 'd1');
  if (!fs.existsSync(d1Dir)) {
    console.log('No local D1 found.');
    return;
  }
  
  const files = fs.readdirSync(d1Dir);
  const dbDir = files.find(f => f.startsWith('miniflare-D1Database'));
  if (!dbDir) {
    console.log('No miniflare DB found.');
    return;
  }
  const dbPath = path.join(d1Dir, dbDir, 'db.sqlite');
  if (!fs.existsSync(dbPath)) {
    console.log('db.sqlite not found.');
    return;
  }

  const db = new Database(dbPath);
  
  console.log('--- EXPLAIN QUERY PLAN for GET /api/tasks ---');
  const plan1 = db.prepare(`EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE department_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC LIMIT 50 OFFSET 0`).all('DEPT_1');
  console.log(plan1);

  console.log('--- EXPLAIN QUERY PLAN for GET /api/task-cards V2 ---');
  const plan2 = db.prepare(`EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE project_id = ? OR department_id = ? OR project_id IS NULL ORDER BY kanban_position ASC, created_at DESC, id DESC`).all('BOARD_1', 'BOARD_1');
  console.log(plan2);

  db.close();
}
run().catch(console.error);
