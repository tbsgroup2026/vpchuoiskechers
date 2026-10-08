const Database = require('better-sqlite3');
const crypto = require('crypto');

// Create in-memory DB and mock Cloudflare D1 db.batch API
const sqliteDb = new Database(':memory:');

sqliteDb.exec(`
  CREATE TABLE task_cards (
    id TEXT PRIMARY KEY,
    status TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    write_token TEXT
  );
  CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    status TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    write_token TEXT
  );
`);

const dbMock = {
  prepare: (sql) => {
    const stmt = sqliteDb.prepare(sql);
    return {
      bind: (...params) => ({
        first: async () => stmt.get(...params),
        all: async () => ({ results: stmt.all(...params) }),
        run: async () => {
          const info = stmt.run(...params);
          return { meta: { changes: info.changes } };
        },
        _sql: sql,
        _params: params,
        _stmt: stmt
      })
    };
  },
  batch: async (queries) => {
    return sqliteDb.transaction(() => {
      const results = [];
      for (const q of queries) {
        const info = q._stmt.run(...q._params);
        results.push({ meta: { changes: info.changes } });
      }
      return results;
    })();
  }
};

// Mock dependencies
const user = { empCode: 'TEST_USER' };
const getCardPermissions = async () => ({ hasAccess: true, permissions: { canView: true, canDelete: true } });
global.crypto = { randomUUID: () => crypto.randomUUID() };

// Import the logic (simulate updateTaskAtomically)
async function updateTaskAtomically(db, user, cardId, providedVersion, updates, masterTable = 'task_cards') {
  const writeToken = crypto.randomUUID();
  const newVersion = providedVersion + 1;

  const tcRow = await db.prepare('SELECT id FROM task_cards WHERE id = ?').bind(cardId).first();
  const tRow = await db.prepare('SELECT id FROM tasks WHERE id = ?').bind(cardId).first();

  if (!tcRow && !tRow) return { type: 'NOT_FOUND', error: 'Not found' };

  const batchQueries = [];
  let masterIndex = -1;

  if (tcRow && tRow) {
    if (masterTable === 'task_cards') {
      batchQueries.push(db.prepare(`UPDATE task_cards SET ${updates.taskCardsSet}, version=?, write_token=? WHERE id=? AND version=?`).bind(...updates.taskCardsParams, newVersion, writeToken, cardId, providedVersion));
      masterIndex = 0;
      batchQueries.push(db.prepare(`UPDATE tasks SET ${updates.tasksSet}, version=version+1, write_token=? WHERE id=? AND EXISTS (SELECT 1 FROM task_cards WHERE id=? AND write_token=?)`).bind(...updates.tasksParams, writeToken, cardId, cardId, writeToken));
    } else {
      batchQueries.push(db.prepare(`UPDATE tasks SET ${updates.tasksSet}, version=?, write_token=? WHERE id=? AND version=?`).bind(...updates.tasksParams, newVersion, writeToken, cardId, providedVersion));
      masterIndex = 0;
      batchQueries.push(db.prepare(`UPDATE task_cards SET ${updates.taskCardsSet}, version=version+1, write_token=? WHERE id=? AND EXISTS (SELECT 1 FROM tasks WHERE id=? AND write_token=?)`).bind(...updates.taskCardsParams, writeToken, cardId, cardId, writeToken));
    }
  } else if (tcRow) {
    batchQueries.push(db.prepare(`UPDATE task_cards SET ${updates.taskCardsSet}, version=?, write_token=? WHERE id=? AND version=?`).bind(...updates.taskCardsParams, newVersion, writeToken, cardId, providedVersion));
    masterIndex = 0;
  } else if (tRow) {
    batchQueries.push(db.prepare(`UPDATE tasks SET ${updates.tasksSet}, version=?, write_token=? WHERE id=? AND version=?`).bind(...updates.tasksParams, newVersion, writeToken, cardId, providedVersion));
    masterIndex = 0;
  }

  const batchResults = await db.batch(batchQueries);
  if (batchResults[masterIndex].meta.changes === 0) return { type: 'CONFLICT', error: 'Conflict' };

  return { type: 'SUCCESS', newVersion, writeToken };
}

async function runTests() {
  console.log("=== STARTING TESTS ===");

  // 1. Race condition test (Promise.all)
  sqliteDb.exec("INSERT INTO task_cards (id, status, version) VALUES ('tc_1', 'in_progress', 1)");
  sqliteDb.exec("INSERT INTO tasks (id, status, version) VALUES ('tc_1', 'in_progress', 1)");

  const req1 = updateTaskAtomically(dbMock, user, 'tc_1', 1, { taskCardsSet: "status='done'", taskCardsParams: [], tasksSet: "status='DONE'", tasksParams: [] }, 'task_cards');
  const req2 = updateTaskAtomically(dbMock, user, 'tc_1', 1, { taskCardsSet: "status='pending_review'", taskCardsParams: [], tasksSet: "status='REVIEW'", tasksParams: [] }, 'task_cards');

  const results = await Promise.all([req1, req2]);
  console.log("Test 1 (Promise.all Race):", results.map(r => r.type)); // Should be 1 SUCCESS, 1 CONFLICT
  const finalDb1 = sqliteDb.prepare("SELECT * FROM task_cards WHERE id='tc_1'").get();
  const finalDb1t = sqliteDb.prepare("SELECT * FROM tasks WHERE id='tc_1'").get();
  console.log("Final DB task_cards:", finalDb1);
  console.log("Final DB tasks:", finalDb1t);
  console.log("Tokens match:", finalDb1.write_token === finalDb1t.write_token);

  // 2. Cross-UI Conflict
  sqliteDb.exec("INSERT INTO task_cards (id, status, version) VALUES ('tc_2', 'in_progress', 1)");
  sqliteDb.exec("INSERT INTO tasks (id, status, version) VALUES ('tc_2', 'in_progress', 1)");
  
  // Request A from Project UI (master = tasks), Request B from Kanban UI (master = task_cards)
  const reqA = updateTaskAtomically(dbMock, user, 'tc_2', 1, { taskCardsSet: "status='done'", taskCardsParams: [], tasksSet: "status='DONE'", tasksParams: [] }, 'tasks');
  const reqB = updateTaskAtomically(dbMock, user, 'tc_2', 1, { taskCardsSet: "status='pending'", taskCardsParams: [], tasksSet: "status='PENDING'", tasksParams: [] }, 'task_cards');
  
  const resultsCross = await Promise.all([reqA, reqB]);
  console.log("Test 2 (Cross-UI):", resultsCross.map(r => r.type));
  const finalDb2 = sqliteDb.prepare("SELECT * FROM task_cards WHERE id='tc_2'").get();
  const finalDb2t = sqliteDb.prepare("SELECT * FROM tasks WHERE id='tc_2'").get();
  console.log("Final DB task_cards:", finalDb2);
  console.log("Final DB tasks:", finalDb2t);
  console.log("Tokens match:", finalDb2.write_token === finalDb2t.write_token);

  // 3. One Table Only
  sqliteDb.exec("INSERT INTO task_cards (id, status, version) VALUES ('tc_3', 'in_progress', 1)"); // No tasks row
  const req3 = await updateTaskAtomically(dbMock, user, 'tc_3', 1, { taskCardsSet: "status='done'", taskCardsParams: [] }, 'task_cards');
  console.log("Test 3 (One table only):", req3.type);
  console.log("Final DB task_cards:", sqliteDb.prepare("SELECT * FROM task_cards WHERE id='tc_3'").get());

  console.log("=== TESTS COMPLETE ===");
}
runTests();
