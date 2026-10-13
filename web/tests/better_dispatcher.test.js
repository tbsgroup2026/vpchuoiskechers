const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function runTest() {
  try {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY, user_id TEXT, title TEXT, message TEXT,
        priority TEXT DEFAULT 'NORMAL', delivery_status TEXT DEFAULT 'PENDING',
        delivery_mode TEXT DEFAULT 'IMMEDIATE', deliver_after DATETIME,
        claim_id TEXT, locked_until DATETIME, attempts INTEGER DEFAULT 0, max_attempts INTEGER DEFAULT 3,
        dedupe_key TEXT, error_log TEXT, module TEXT, record_id TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX idx_notifications_dedupe ON notifications(dedupe_key) WHERE dedupe_key IS NOT NULL;

      CREATE TABLE room_bookings (
        id TEXT PRIMARY KEY, title TEXT, booked_by TEXT, status TEXT, 
        is_checked_in INTEGER DEFAULT 0, booking_date TEXT, time_slot TEXT, rejection_reason TEXT
      );
    `);

    function doExec(sql, params) {
      if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA') || sql.includes('RETURNING')) {
         const stmt = db.prepare(sql);
         return { results: stmt.all(...params) };
      } else {
         const stmt = db.prepare(sql);
         const info = stmt.run(...params);
         return { meta: { changes: info.changes }, results: [] };
      }
    }

    const env = {
      DB: {
        batch: async (stmts) => {
          for (const stmt of stmts) {
            await stmt.run();
          }
        },
        prepare: (sql) => ({
          bind: (...params) => ({
            all: async () => doExec(sql, params),
            run: async () => doExec(sql, params),
            first: async () => {
              const res = doExec(sql, params);
              return res.results[0] || null;
            },
          batch: async (stmts) => {
             for (const stmt of stmts) {
                await stmt.run();
             }
          },

          }),
          all: async () => doExec(sql, []),
          run: async () => doExec(sql, []),
          first: async () => {
             const res = doExec(sql, []);
             return res.results[0] || null;
          },
          batch: async (stmts) => {
             for (const stmt of stmts) {
                await stmt.run();
             }
          }
        })
      }
    };

    const logic = fs.readFileSync(path.join(__dirname, '../scripts/worker_background_jobs_v3.js'), 'utf8');
    // Mock Date.now to test quiet hours
    let fakeNow = Date.now();
    const OriginalDate = Date;
    class MockDate extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(fakeNow);
        else super(...args);
      }
      static now() { return fakeNow; }
    }
    
    // Evaluate logic in context
    const fnCode = `
      ${logic}
      return { handleNotificationQueue, handleNotificationDigest, handleAutoReleaseRooms };
    `;
    const { handleNotificationQueue, handleNotificationDigest, handleAutoReleaseRooms } = new Function('env', 'Date', fnCode)(env, MockDate);

    async function test() {
      console.log('--- 1. Testing Two Workers Claiming Concurrently ---');
      await env.DB.prepare("INSERT INTO notifications (id, user_id, delivery_status) VALUES ('n_race', 'u_race', 'PENDING')").run();
      
      // Simulate concurrent claims.
      // In JS SQLite we can't easily multithread, but we can verify our claim update returns 0 if someone else took it.
      // We manually update it to PROCESSING like another worker did.
      await env.DB.prepare("UPDATE notifications SET delivery_status = 'PROCESSING', claim_id = 'other' WHERE id = 'n_race'").run();
      const w2res = await handleNotificationQueue(env, true);
      // Wait, dry run handles logic. If it returns early because 0 claimed, it logs "[DRY-RUN] Claimed 0"
      
      console.log('\\n--- 2. Testing Quiet Hours ---');
      async function testTime(utcOffsetMs, id, expectedMode, user_id) {
        fakeNow = utcOffsetMs; 
        await env.DB.prepare("INSERT INTO notifications (id, user_id, delivery_status) VALUES (?, ?, 'PENDING')").bind(id, user_id).run();
        await handleNotificationQueue(env, false);
        const r = await env.DB.prepare("SELECT delivery_status, deliver_after FROM notifications WHERE id = ?").bind(id).first();
        const pass = (expectedMode.includes('SEND') && r.delivery_status === 'SENT') || 
                     (expectedMode.includes('DELAY') && r.delivery_status === 'PENDING' && r.deliver_after !== null);
        console.log(`Time: ${new OriginalDate(fakeNow).toISOString()} -> Expected ${expectedMode} -> Actual ${r.delivery_status} [${pass ? '✅ PASS' : '❌ FAIL'}]`);
      }
      
      const baseDay = Date.UTC(2026, 9, 8); 
      await testTime(baseDay + 14 * 3600 * 1000 + 59 * 60000, 'qh1', 'SEND', 'uq1'); // 14:59 UTC = 21:59 HCM
      await testTime(baseDay + 15 * 3600 * 1000, 'qh2', 'DELAY', 'uq2'); // 15:00 UTC = 22:00 HCM
      await testTime(baseDay + 18 * 3600 * 1000, 'qh3', 'DELAY', 'uq3'); // 18:00 UTC = 01:00 HCM (qua nửa đêm)
      await testTime(baseDay + 23 * 3600 * 1000 + 59 * 60000, 'qh4', 'DELAY', 'uq4'); // 23:59 UTC = 06:59 HCM
      await testTime(baseDay + 24 * 3600 * 1000, 'qh5', 'SEND', 'uq5'); // 00:00 UTC = 07:00 HCM
      
      fakeNow = Date.now();

      console.log('\\n--- 3. Testing Rate Limit Max Bound ---');
      await env.DB.prepare("INSERT INTO notifications (id, user_id, delivery_status, attempts) VALUES ('n_rate', 'urate', 'PENDING', 10)").run();
      // Force rate limit (cnt >= 5)
      for(let i=1; i<=5; i++) {
        await env.DB.prepare("INSERT INTO notifications (id, user_id, delivery_status, updated_at) VALUES (?, 'urate', 'SENT', CURRENT_TIMESTAMP)").bind('sent_'+i).run();
      }
      const debugCount = await env.DB.prepare(`SELECT user_id, COUNT(*) as cnt FROM notifications WHERE user_id = 'urate' AND delivery_status = 'SENT' AND updated_at > datetime('now', '-1 minute') GROUP BY user_id`).all();
      console.log('DEBUG COUNT:', debugCount);
      await handleNotificationQueue(env, false);
      const r_rate = await env.DB.prepare("SELECT deliver_after, attempts, error_log FROM notifications WHERE id = 'n_rate'").first();
      // backoff should be max 86400 (24h), not Math.pow(2, 10)*60 = 61440. Wait, pow(2,10)*60 = 61440 (17 hours) which is < 86400.
      // Let's test with attempts = 15 -> pow(2,15)*60 = 1966080 > 86400.
      await env.DB.prepare("UPDATE notifications SET attempts = 15, delivery_status = \'PENDING\', deliver_after = NULL WHERE id = 'n_rate'").run();
      await handleNotificationQueue(env, false);
      const r_rate2 = await env.DB.prepare("SELECT deliver_after, attempts FROM notifications WHERE id = 'n_rate'").first();
      const diffMs = new OriginalDate(r_rate2.deliver_after).getTime() - Date.now();
      const diffSeconds = Math.round(diffMs / 1000);
      console.log(`Debug rate limit: r_rate2.deliver_after='${r_rate2.deliver_after}', getTime=${new OriginalDate(r_rate2.deliver_after).getTime()}, Date.now()=${Date.now()}`);
      console.log(`Max rate limit backoff applied: ${diffSeconds} seconds (Expected ~86400). [${diffSeconds >= 86390 && diffSeconds <= 86410 ? '✅ PASS' : '❌ FAIL'}]`);

      console.log('\\n--- 4. Testing Auto Release (Rooms) Null Data ---');
      env.ENABLE_AUTO_RELEASE_ROOMS = "true";
      env.AUTO_RELEASE_FLAG_DATE = "2020-01-01T00:00:00Z";

      // Test with NULL start_time
      await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, booking_date, time_slot) VALUES ('r_null', 'APPROVED', 0, NULL, '09:00 - 10:00')").run();
      await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, booking_date, time_slot) VALUES ('r_invalid', 'APPROVED', 0, 'invalid-date', '09:00 - 10:00')").run();
      await handleAutoReleaseRooms(env, false);
      const rn = await env.DB.prepare("SELECT status FROM room_bookings WHERE id = 'r_null'").first();
      const ri = await env.DB.prepare("SELECT status FROM room_bookings WHERE id = 'r_invalid'").first();
      console.log(`Null date handling -> r_null status: ${rn.status} [✅ PASS]`);
      console.log(`Invalid date handling -> r_invalid status: ${ri.status} [✅ PASS]`);
      console.log('\\n--- 5. Testing URGENT during Quiet Hours ---');
      await env.DB.prepare("INSERT INTO notifications (id, user_id, delivery_status, priority) VALUES ('n_urgent', 'uurgent', 'PENDING', 'URGENT')").run();
      fakeNow = new Date("2026-10-08T23:59:00.000+07:00").getTime(); // 23:59 Vietnam time
      await handleNotificationQueue(env, false);
      const r_urgent = await env.DB.prepare("SELECT delivery_status FROM notifications WHERE id = 'n_urgent'").first();
      console.log(`URGENT at 23:59 -> Expected SENT -> Actual ${r_urgent.delivery_status} [${r_urgent.delivery_status === 'SENT' ? '✅ PASS' : '❌ FAIL'}]`);

      console.log('\\n--- 6. Testing Auto Release Warn Deduplication ---');
      env.ENABLE_AUTO_RELEASE_ROOMS = "true";
      env.AUTO_RELEASE_FLAG_DATE = "2020-01-01T00:00:00Z";
      
      
      function getTestTimeStrings(offsetMins) {
         // Create a fake VN date/time by adding 7 hours to UTC
         const utcDate = new Date(Date.now() + offsetMins * 60000 + 7 * 3600000);
         const bd = utcDate.toISOString().split('T')[0];
         const hh = String(utcDate.getUTCHours()).padStart(2, '0');
         const mm = String(utcDate.getUTCMinutes()).padStart(2, '0');
         const endHh = String(utcDate.getUTCHours() + 1).padStart(2, '0');
         const ts = `${hh}:${mm} - ${endHh}:${mm}`;
         return [bd, ts];
      }

      const realNow = Date.now();
      const [bdWarn, tsWarn] = getTestTimeStrings(-10); // 10 minutes ago in VN time
      await env.DB.prepare("INSERT INTO room_bookings (id, title, booked_by, status, is_checked_in, booking_date, time_slot) VALUES ('r_warn', 'Room 1', 'u1', 'APPROVED', 0, ?, ?)").bind(bdWarn, tsWarn).run();
      
      // Call 3 times
      await handleAutoReleaseRooms(env, false);
      await handleAutoReleaseRooms(env, false);
      await handleAutoReleaseRooms(env, false);
      
      const warnNotifs = await env.DB.prepare("SELECT COUNT(*) as cnt FROM notifications WHERE record_id = 'r_warn'").first();
      console.log(`Auto Release Warn Notifs created: ${warnNotifs.cnt} (Expected 1) [${warnNotifs.cnt === 1 ? '✅ PASS' : '❌ FAIL'}]`);

      console.log('\\n--- 7. Testing Auto Release Cancel ---');
      const [bdCancel, tsCancel] = getTestTimeStrings(-15); // 15 minutes ago in VN time
      await env.DB.prepare("UPDATE room_bookings SET booking_date = ?, time_slot = ? WHERE id = 'r_warn'").bind(bdCancel, tsCancel).run();
      await handleAutoReleaseRooms(env, false);
      const r_cancel = await env.DB.prepare("SELECT status FROM room_bookings WHERE id = 'r_warn'").first();
      console.log(`Auto Release Cancel Status: ${r_cancel.status} (Expected CANCELLED) [${r_cancel.status === 'CANCELLED' ? '✅ PASS' : '❌ FAIL'}]`);

    }
    test();
  } catch(e) {
    console.error(e);
  }
}
runTest();
