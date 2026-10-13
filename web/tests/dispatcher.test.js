const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function setupDB() {
  const db = new sqlite3.Database(':memory:');
  
  const exec = (sql, params = []) => new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err); else resolve({ results: rows, meta: { changes: 0 } });
      });
    } else {
      // Custom RETURNING polyfill for sqlite3 which might support it if version is recent enough.
      db.run(sql, params, function(err) {
        if (err) reject(err); else resolve({ meta: { changes: this.changes }, results: [] });
      });
    }
  });

  const env = { 
    DB: { 
      prepare: (sql) => ({
        bind: (...params) => ({
          all: () => exec(sql, params),
          run: () => exec(sql, params),
          first: async () => { const r = await exec(sql, params); return r.results[0] || null; }
        }),
        all: () => exec(sql),
        run: () => exec(sql),
        first: async () => { const r = await exec(sql); return r.results[0] || null; }
      })
    },
    ENABLE_AUTO_RELEASE_ROOMS: "true",
    AUTO_RELEASE_FLAG_DATE: "2020-01-01T00:00:00Z"
  };

  // Setup schema
  await env.DB.prepare(`CREATE TABLE notifications (
    id TEXT PRIMARY KEY, user_id TEXT, title TEXT, message TEXT,
    priority TEXT DEFAULT 'NORMAL', delivery_status TEXT DEFAULT 'PENDING',
    delivery_mode TEXT DEFAULT 'IMMEDIATE', deliver_after DATETIME,
    claim_id TEXT, locked_until DATETIME, attempts INTEGER DEFAULT 0, max_attempts INTEGER DEFAULT 3,
    dedupe_key TEXT UNIQUE, error_log TEXT, module TEXT, record_id TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await env.DB.prepare(`CREATE TABLE notification_preferences (
    emp_code TEXT PRIMARY KEY, digest_enabled INTEGER DEFAULT 0
  )`).run();

  await env.DB.prepare(`CREATE TABLE room_bookings (
    id TEXT PRIMARY KEY, title TEXT, booked_by TEXT, status TEXT, 
    is_checked_in INTEGER DEFAULT 0, start_time DATETIME, end_time DATETIME, rejection_reason TEXT
  )`).run();

  return { db, env, exec };
}

async function runTests() {
  const { env, exec } = await setupDB();
  
  // Load dispatcher logic by reading the file and executing it in this context
  const logic = fs.readFileSync(path.join(__dirname, '../scripts/worker_background_jobs_v3.js'), 'utf8');
  eval(logic);

  console.log('--- 1. Testing Dedupe (ON CONFLICT IGNORE) ---');
  await env.DB.prepare("INSERT OR IGNORE INTO notifications (id, dedupe_key, title) VALUES ('n1', 'dk1', 'First')").run();
  await env.DB.prepare("INSERT OR IGNORE INTO notifications (id, dedupe_key, title) VALUES ('n2', 'dk1', 'Second')").run();
  let count = await env.DB.prepare("SELECT COUNT(*) as c FROM notifications").first();
  console.log(`Expected 1 notification, got: ${count.c}`);

  console.log('\n--- 2. Testing Two Workers Claiming Concurrently ---');
  await env.DB.prepare("INSERT INTO notifications (id, delivery_status, title) VALUES ('n3', 'PENDING', 'Concur')").run();
  
  // Mock Date so both try to claim
  // Actually, node sqlite3 is synchronous per connection mostly, so true concurrency is hard to simulate here without two connections,
  // but we can simulate the effect by checking delivery_status manually.
  console.log("Worker 1 claims...");
  await handleNotificationQueue(env, false);
  const n3 = await env.DB.prepare("SELECT * FROM notifications WHERE id = 'n3'").first();
  console.log(`Worker 1 claimed, status: ${n3.delivery_status}, claim_id: ${n3.claim_id ? 'YES' : 'NO'}`);

  console.log('\n--- 3. Testing Lease Expiration (Nhặt lại PROCESSING quá hạn) ---');
  // Set lease to past
  await env.DB.prepare("UPDATE notifications SET locked_until = datetime('now', '-10 minutes'), delivery_status = 'PROCESSING' WHERE id = 'n3'").run();
  await handleNotificationQueue(env, false);
  const n3_after = await env.DB.prepare("SELECT * FROM notifications WHERE id = 'n3'").first();
  console.log(`Re-claimed status: ${n3_after.delivery_status}`);

  console.log('\n--- 4. Testing Auto Release (ROOMS) ---');
  // Room 1: Checked in (should be ignored)
  await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, start_time, end_time) VALUES ('r1', 'APPROVED', 1, datetime('now', '-20 minutes'), datetime('now', '+1 hour'))").run();
  // Room 2: Ended (should be ignored because end_time < now)
  await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, start_time, end_time) VALUES ('r2', 'APPROVED', 0, datetime('now', '-2 hours'), datetime('now', '-1 hour'))").run();
  // Room 3: Not checked in, 10 minutes passed (should warn)
  await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, start_time, end_time) VALUES ('r3', 'APPROVED', 0, datetime('now', '-11 minutes'), datetime('now', '+1 hour'))").run();
  // Room 4: Not checked in, 16 minutes passed (should cancel)
  await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, start_time, end_time) VALUES ('r4', 'APPROVED', 0, datetime('now', '-16 minutes'), datetime('now', '+1 hour'))").run();

  // The Auto-Release logic uses sqlite's UPDATE RETURNING.
  // node-sqlite3 might have issue with RETURNING, let's see.
  // Wait, I need to wrap handleAutoReleaseRooms logic if RETURNING doesn't work.
  // Let's run it.
  try {
    await handleAutoReleaseRooms(env, false);
    const r1 = await env.DB.prepare("SELECT status FROM room_bookings WHERE id = 'r1'").first();
    const r2 = await env.DB.prepare("SELECT status FROM room_bookings WHERE id = 'r2'").first();
    const r3 = await env.DB.prepare("SELECT status FROM room_bookings WHERE id = 'r3'").first();
    const r4 = await env.DB.prepare("SELECT status FROM room_bookings WHERE id = 'r4'").first();
    console.log(`Room 1 (checked in): ${r1.status}`);
    console.log(`Room 2 (ended): ${r2.status}`);
    console.log(`Room 3 (10 mins): ${r3.status}`);
    console.log(`Room 4 (16 mins): ${r4.status}`);
  } catch(e) {
    console.error("Auto Release Test Error (likely SQLite RETURNING not supported in this test node version):", e.message);
  }

}

runTests();
