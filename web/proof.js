const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
let dbFiles = [];
try {
  dbFiles = fs.readdirSync(dir).filter(f => f.endsWith('.sqlite')).map(f => path.join(dir, f));
} catch(e) {}

if (dbFiles.length === 0) {
  console.error("No SQLite DB found in Miniflare state");
  process.exit(1);
}

const db = new Database(dbFiles[0]);

const q1 = db.prepare('SELECT COUNT(*) as c FROM task_cards').get();
console.log('Total task_cards:', q1.c);

const q2 = db.prepare('SELECT COUNT(*) as c FROM tasks').get();
console.log('Total tasks:', q2.c);

const q3 = db.prepare('SELECT COUNT(*) as c FROM task_cards tc JOIN tasks t ON tc.id = t.id').get();
console.log('Matching IDs:', q3.c);

const q4 = db.prepare('SELECT COUNT(*) as c FROM task_cards tc WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.id = tc.id)').get();
console.log('Only in task_cards:', q4.c);

const q5 = db.prepare('SELECT COUNT(*) as c FROM tasks t WHERE NOT EXISTS (SELECT 1 FROM task_cards tc WHERE tc.id = t.id)').get();
console.log('Only in tasks:', q5.c);
