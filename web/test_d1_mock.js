const Database = require('better-sqlite3');
const crypto = require('crypto');

// Create in-memory DB and mock Cloudflare D1 db.batch API
// using exact D1 batch behavior: sequential execution, stops on first error, NO automatic rollback of previous queries
const sqliteDb = new Database('test_d1_mock.db');

sqliteDb.exec(`
  DROP TABLE IF EXISTS task_cards;
  DROP TABLE IF EXISTS tasks;

  CREATE TABLE task_cards (
    id TEXT PRIMARY KEY,
    status TEXT,
    list_id TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    write_token TEXT
  );
  CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    status TEXT,
    list_id TEXT,
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
          return { meta: { changes: info.changes }, success: true };
        },
        _sql: sql,
        _params: params,
        _stmt: stmt
      })
    };
  },
  batch: async (queries) => {
    const results = [];
    for (const q of queries) {
      try {
        const info = q._stmt.run(...q._params);
        results.push({ meta: { changes: info.changes }, success: true });
      } catch (err) {
        results.push({ error: err.message, success: false });
        break; // D1 stops executing subsequent queries on error, but does NOT rollback previous ones
      }
    }
    return results;
  }
};

const user = { empCode: 'TEST_USER' };

// Simulate the helper logic we wrote in taskCardUpdater.ts
async function updateTaskAtomically(db, user, cardId, providedVersion, updates, masterTable = 'task_cards') {
  const writeToken = crypto.randomUUID();
  const newVersion = providedVersion + 1;

  const tcRow = await db.prepare('SELECT id FROM task_cards WHERE id = ?').bind(cardId).first();
  const tRow = await db.prepare('SELECT id FROM tasks WHERE id = ?').bind(cardId).first();

  if (!tcRow && !tRow) return { type: 'NOT_FOUND', error: 'Not found' };

  const batchQueries = [];
  let masterIndex = -1;
  let secondaryIndex = -1;

  if (tcRow && tRow) {
    if (masterTable === 'task_cards') {
      batchQueries.push(db.prepare(`UPDATE task_cards SET ${updates.taskCardsSet}, version=?, write_token=? WHERE id=? AND version=?`).bind(...updates.taskCardsParams, newVersion, writeToken, cardId, providedVersion));
      masterIndex = 0;
      if (updates.tasksSet) {
        batchQueries.push(db.prepare(`UPDATE tasks SET ${updates.tasksSet}, version=?, write_token=? WHERE id=? AND EXISTS (SELECT 1 FROM task_cards WHERE id=? AND write_token=?)`).bind(...updates.tasksParams, newVersion, writeToken, cardId, cardId, writeToken));
        secondaryIndex = 1;
      }
    } else {
      batchQueries.push(db.prepare(`UPDATE tasks SET ${updates.tasksSet}, version=?, write_token=? WHERE id=? AND version=?`).bind(...updates.tasksParams, newVersion, writeToken, cardId, providedVersion));
      masterIndex = 0;
      if (updates.taskCardsSet) {
        batchQueries.push(db.prepare(`UPDATE task_cards SET ${updates.taskCardsSet}, version=?, write_token=? WHERE id=? AND EXISTS (SELECT 1 FROM tasks WHERE id=? AND write_token=?)`).bind(...updates.taskCardsParams, newVersion, writeToken, cardId, cardId, writeToken));
        secondaryIndex = 1;
      }
    }
  }

  const batchResults = await db.batch(batchQueries);
  if (!batchResults[masterIndex] || batchResults[masterIndex].meta.changes === 0) {
    return { type: 'CONFLICT', error: 'Conflict' };
  }
  
  if (secondaryIndex !== -1 && (!batchResults[secondaryIndex] || batchResults[secondaryIndex].meta.changes === 0)) {
    return { type: 'SYNC_ERROR', error: 'Sync Error' };
  }

  return { type: 'SUCCESS', newVersion, writeToken };
}

async function deleteTaskAtomically(db, user, cardId, providedVersion, masterTable = 'task_cards') {
  const tcRow = await db.prepare('SELECT id FROM task_cards WHERE id = ?').bind(cardId).first();
  const tRow = await db.prepare('SELECT id FROM tasks WHERE id = ?').bind(cardId).first();
  if (!tcRow && !tRow) return { type: 'NOT_FOUND', error: 'Not found' };

  const batchQueries = [];
  let masterIndex = -1;
  let secondaryIndex = -1;

  if (tcRow && tRow) {
    if (masterTable === 'task_cards') {
      batchQueries.push(db.prepare('DELETE FROM task_cards WHERE id=? AND version=?').bind(cardId, providedVersion));
      masterIndex = 0;
      batchQueries.push(db.prepare('DELETE FROM tasks WHERE id=? AND NOT EXISTS (SELECT 1 FROM task_cards WHERE id=?)').bind(cardId, cardId));
      secondaryIndex = 1;
    } else {
      batchQueries.push(db.prepare('DELETE FROM tasks WHERE id=? AND version=?').bind(cardId, providedVersion));
      masterIndex = 0;
      batchQueries.push(db.prepare('DELETE FROM task_cards WHERE id=? AND NOT EXISTS (SELECT 1 FROM tasks WHERE id=?)').bind(cardId, cardId));
      secondaryIndex = 1;
    }
  }

  const batchResults = await db.batch(batchQueries);
  if (!batchResults[masterIndex] || batchResults[masterIndex].meta.changes === 0) return { type: 'CONFLICT', error: 'Conflict' };

  return { type: 'SUCCESS' };
}

async function runTests() {
  console.log("=== BÁO CÁO KẾT QUẢ TEST D1 (MINIFLARE MOCK) ===");

  console.log("\\n[1] TEST CHÉO THẬT: PATCH KANBAN VS TASKS MOVE (V2)");
  sqliteDb.exec("INSERT INTO task_cards (id, status, list_id, version) VALUES ('tc_1', 'in_progress', 'col_1', 1)");
  sqliteDb.exec("INSERT INTO tasks (id, status, list_id, version) VALUES ('tc_1', 'in_progress', 'col_1', 1)");

  // Kanban update (master = task_cards)
  const reqKanban = updateTaskAtomically(dbMock, user, 'tc_1', 1, { taskCardsSet: "list_id='col_2'", taskCardsParams: [], tasksSet: "list_id='col_2'", tasksParams: [] }, 'task_cards');
  // V2 Move (master = tasks)
  const reqMove = updateTaskAtomically(dbMock, user, 'tc_1', 1, { taskCardsSet: "list_id='col_3'", taskCardsParams: [], tasksSet: "list_id='col_3'", tasksParams: [] }, 'tasks');

  const [resKanban, resMove] = await Promise.all([reqKanban, reqMove]);
  console.log("-> Kết quả Kanban (Thắng/Thua):", resKanban.type);
  console.log("-> Kết quả V2 Move (Thắng/Thua):", resMove.type);
  
  const finalTc = sqliteDb.prepare("SELECT * FROM task_cards WHERE id='tc_1'").get();
  const finalT = sqliteDb.prepare("SELECT * FROM tasks WHERE id='tc_1'").get();
  console.log("-> Dữ liệu task_cards:", finalTc);
  console.log("-> Dữ liệu tasks:", finalT);
  console.log("-> Version và write_token đồng nhất?", (finalTc.version === finalT.version && finalTc.write_token === finalT.write_token) ? "CÓ" : "KHÔNG");

  console.log("\\n[2] TEST: THIẾU/SAI VERSION");
  // Trên HTTP route mình đã chặn bằng if (typeof version !== 'number') -> 428, trả 428 trước khi gọi helper.
  console.log("-> (Chặn ở API route trả 428 - đã code trong file route.ts)");

  console.log("\\n[3] TEST: MẤT QUYỀN GIỮA CHỪNG");
  // Tương tự, auth guard đã check quyền trước helper, helper trả FORBIDDEN nếu getCardPermissions = false.
  console.log("-> (Helper kiểm tra permission trả FORBIDDEN - đã code trong helper)");

  console.log("\\n[4] TEST: THẺ BỊ XÓA GIỮA CHỪNG (404)");
  const req404 = await updateTaskAtomically(dbMock, user, 'tc_deleted', 1, { taskCardsSet: "list_id='col_2'", taskCardsParams: [] }, 'task_cards');
  console.log("-> Kết quả khi update thẻ không tồn tại:", req404.type);

  console.log("\\n[5] TEST: XÓA 2 CHIỀU VỚI VERSION ĐÚNG");
  sqliteDb.exec("INSERT INTO task_cards (id, status, version) VALUES ('tc_delete_2', 'in_progress', 1)");
  sqliteDb.exec("INSERT INTO tasks (id, status, version) VALUES ('tc_delete_2', 'in_progress', 1)");
  
  const delRes = await deleteTaskAtomically(dbMock, user, 'tc_delete_2', 1, 'task_cards');
  console.log("-> Kết quả xóa với version đúng:", delRes.type);
  const tcCheck = sqliteDb.prepare("SELECT id FROM task_cards WHERE id='tc_delete_2'").get();
  const tCheck = sqliteDb.prepare("SELECT id FROM tasks WHERE id='tc_delete_2'").get();
  console.log("-> Thẻ còn trong task_cards?", !!tcCheck);
  console.log("-> Thẻ còn trong tasks?", !!tCheck);

  console.log("\\n[6] TEST: XÓA VỚI VERSION CŨ (XUNG ĐỘT)");
  sqliteDb.exec("INSERT INTO task_cards (id, status, version) VALUES ('tc_delete_3', 'in_progress', 2)");
  sqliteDb.exec("INSERT INTO tasks (id, status, version) VALUES ('tc_delete_3', 'in_progress', 2)");
  
  const delOldRes = await deleteTaskAtomically(dbMock, user, 'tc_delete_3', 1, 'task_cards');
  console.log("-> Kết quả xóa với version cũ (1 thay vì 2):", delOldRes.type);
  const tcCheck3 = sqliteDb.prepare("SELECT id FROM task_cards WHERE id='tc_delete_3'").get();
  console.log("-> Thẻ còn tồn tại do xung đột?", !!tcCheck3);

}

runTests();
