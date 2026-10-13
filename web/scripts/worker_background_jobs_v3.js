// --- NOTIFICATION QUEUE DISPATCHER ---
// Runs on cron "*/5 * * * *"
async function handleNotificationQueue(env, isDryRun = false) {
  if (!env.DB) return;
  const now = new Date();
  const lockTime = new Date(now.getTime() + 5 * 60000); // 5 mins lease
  const lockIso = lockTime.toISOString();
  const nowIso = now.toISOString();
  const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  try {
    // 1. Determine Quiet Hours (Asia/Ho_Chi_Minh UTC+7)
    // We use Date.UTC to get current ms, then add 7 hours for HCM
    const nowMs = Date.now();
    const hcmDate = new Date(nowMs + 7 * 3600 * 1000);
    const hoursHCM = hcmDate.getUTCHours();
    const inQuietHours = hoursHCM >= 22 || hoursHCM < 7;
    
    // We delay non-URGENT/HOT if in quiet hours.
    // Quiet hours boundary calculation: 7 AM HCM time today or tomorrow
    let next7AMMs = Date.UTC(hcmDate.getUTCFullYear(), hcmDate.getUTCMonth(), hcmDate.getUTCDate(), 7, 0, 0, 0);
    if (hoursHCM >= 22) {
      next7AMMs += 24 * 3600 * 1000;
    }
    // Subtract 7 hours to convert back to UTC ISO string
    const next7AMIso = new Date(next7AMMs - 7 * 3600 * 1000).toISOString();

    // 2. Pick up PENDING, or PROCESSING that expired their lease.
    // Note: We only pick up items where deliver_after is NULL or deliver_after <= nowIso
    // ORDER BY priority (URGENT first), then attempts, then created_at
    const { results: pending } = await env.DB.prepare(`
      SELECT id, user_id, title, message, priority, delivery_status, delivery_mode, attempts, max_attempts
      FROM notifications 
      WHERE (delivery_status = 'PENDING' OR (delivery_status = 'PROCESSING' AND locked_until < ?))
        AND (deliver_after IS NULL OR deliver_after <= ?)
      ORDER BY 
        CASE WHEN priority IN ('URGENT', 'HOT') THEN 1 ELSE 2 END ASC,
        attempts ASC,
        id ASC
      LIMIT 20
    `).bind(nowIso, nowIso).all();

    if (!pending || pending.length === 0) return;
    
    const ids = pending.map(n => n.id);
    const placeholders = ids.map(() => '?').join(',');

    // 3. Claim (Lease) with batch update.
    // We MUST check if they are STILL PENDING/PROCESSING before claiming to avoid concurrent worker race conditions.
    const claimRes = await env.DB.prepare(`
      UPDATE notifications 
      SET delivery_status = 'PROCESSING', claim_id = ?, locked_until = ? 
      WHERE id IN (${placeholders}) 
        AND (delivery_status = 'PENDING' OR (delivery_status = 'PROCESSING' AND locked_until < ?))
    `).bind(claimId, lockIso, ...ids, nowIso).run();

    if (isDryRun) {
      console.log(`[DRY-RUN] Claimed ${claimRes.meta?.changes} notifications.`);
      return;
    }

    if (claimRes.meta?.changes === 0) {
      // Another worker claimed them
      return;
    }

    // Since SQLite UPDATE IN (...) might update fewer rows if another worker claimed them,
    // we only process rows that actually have our claim_id.
    const { results: claimed } = await env.DB.prepare(`
      SELECT id, user_id, title, message, priority, delivery_status, delivery_mode, attempts, max_attempts
      FROM notifications 
      WHERE claim_id = ?
    `).bind(claimId).all();

    // 4. PRE-FETCH DATA (Subrequest Optimization)
    const uniqueUserIds = [...new Set(claimed.map(n => n.user_id).filter(Boolean))];
    
    let userPrefs = {};
    let userRateLimits = {};

    if (uniqueUserIds.length > 0) {
      const placeholders = uniqueUserIds.map(() => '?').join(',');
      // Fetch preferences
      const prefRes = await env.DB.prepare(`SELECT emp_code, digest_enabled FROM notification_preferences WHERE emp_code IN (${placeholders})`).bind(...uniqueUserIds).all().catch(() => ({ results: [] }));
      for (const p of (prefRes.results || [])) {
        userPrefs[p.emp_code] = p.digest_enabled;
      }
      
      // Fetch rate limits
      const rateRes = await env.DB.prepare(`
        SELECT user_id, COUNT(*) as cnt 
        FROM notifications 
        WHERE user_id IN (${placeholders}) AND delivery_status = 'SENT' AND updated_at > datetime('now', '-1 minute')
        GROUP BY user_id
      `).bind(...uniqueUserIds).all();
      for (const r of (rateRes.results || [])) {
        userRateLimits[r.user_id] = r.cnt;
      }
    }
    console.log('DEBUG USER RATE LIMITS:', userRateLimits);

    const batchUpdates = [];

    // 5. Process each
    for (const notif of claimed) {
      try {
        if (!notif.user_id) {
           batchUpdates.push(env.DB.prepare(`UPDATE notifications SET delivery_status = 'FAILED', error_log = 'Missing user_id', claim_id = NULL, locked_until = NULL WHERE id = ?`).bind(notif.id));
           continue;
        }

        let finalDeliverMode = notif.delivery_mode || 'IMMEDIATE';
        
        // Quiet hours
        if (notif.priority !== 'URGENT' && notif.priority !== 'HOT' && inQuietHours) {
           batchUpdates.push(env.DB.prepare(`UPDATE notifications SET delivery_status = 'PENDING', deliver_after = ?, claim_id = NULL, locked_until = NULL WHERE id = ? AND claim_id = ?`).bind(next7AMIso, notif.id, claimId));
           continue;
        }

        // Digest
        if (finalDeliverMode === 'IMMEDIATE' && notif.priority !== 'URGENT' && notif.priority !== 'HOT') {
          if (userPrefs[notif.user_id]) {
            batchUpdates.push(env.DB.prepare(`UPDATE notifications SET delivery_status = 'PENDING', delivery_mode = 'DIGEST', claim_id = NULL, locked_until = NULL WHERE id = ? AND claim_id = ?`).bind(notif.id, claimId));
            continue;
          }
        }

        if (finalDeliverMode === 'DIGEST') continue;

        // Rate limit
        const cnt = userRateLimits[notif.user_id] || 0;
        if (cnt >= 5) {
           const backoffSeconds = Math.min(Math.pow(2, notif.attempts) * 60, 86400);
           const newDeliverAfter = new Date(Date.now() + backoffSeconds * 1000).toISOString();
           batchUpdates.push(env.DB.prepare(`UPDATE notifications SET delivery_status = 'PENDING', deliver_after = ?, attempts = attempts + 1, claim_id = NULL, locked_until = NULL, error_log = ? WHERE id = ?`).bind(newDeliverAfter, 'Rate limit exceeded, backing off', notif.id));
           continue;
        }

        // Send logic
        console.log(`[Notification Dispatcher] Sent IMMEDIATE notif \${notif.id} to \${notif.user_id}`);
        userRateLimits[notif.user_id] = cnt + 1; // Increment in memory for next items in same batch
        batchUpdates.push(env.DB.prepare(`UPDATE notifications SET delivery_status = 'SENT', claim_id = NULL, locked_until = NULL WHERE id = ? AND claim_id = ?`).bind(notif.id, claimId));

      } catch (e) {
        const nextAttempt = notif.attempts + 1;
        if (nextAttempt >= (notif.max_attempts || 3)) {
          batchUpdates.push(env.DB.prepare(`UPDATE notifications SET delivery_status = 'FAILED', attempts = ?, error_log = ?, claim_id = NULL, locked_until = NULL WHERE id = ? AND claim_id = ?`).bind(nextAttempt, String(e.message), notif.id, claimId));
        } else {
          const backoffSeconds = Math.pow(2, nextAttempt) * 60;
          const newDeliverAfter = new Date(Date.now() + backoffSeconds * 1000).toISOString();
          batchUpdates.push(env.DB.prepare(`UPDATE notifications SET delivery_status = 'PENDING', attempts = ?, error_log = ?, deliver_after = ?, claim_id = NULL, locked_until = NULL WHERE id = ? AND claim_id = ?`).bind(nextAttempt, String(e.message), newDeliverAfter, notif.id, claimId));
        }
      }
    }
    
    if (batchUpdates.length > 0) {
       await env.DB.batch(batchUpdates);
    }

  } catch (err) {
    console.error("[Notification Dispatcher] Error in queue:", err);
  }
}

// --- HOURLY DIGEST ---
// Runs on cron "0 * * * *"
async function handleNotificationDigest(env) {
  if (!env.DB) return;
  console.log('[Notification Dispatcher] Sending Hourly Digest');
  
  try {
    const lockTime = new Date(Date.now() + 10 * 60000);
    const lockIso = lockTime.toISOString();
    const claimId = `digest_${Date.now()}`;
    const nowIso = new Date().toISOString();

    // 1. Claim PENDING notifications that are DIGEST
    const claimRes = await env.DB.prepare(`
      UPDATE notifications 
      SET delivery_status = 'PROCESSING', claim_id = ?, locked_until = ?
      WHERE delivery_status = 'PENDING' AND delivery_mode = 'DIGEST' 
      AND (deliver_after IS NULL OR deliver_after <= ?)
      AND (locked_until IS NULL OR locked_until < ?)
    `).bind(claimId, lockIso, nowIso, nowIso).run();

    if (claimRes.meta?.changes === 0) return;

    // 2. Fetch grouped by user
    const { results: digestNotifs } = await env.DB.prepare(`
      SELECT user_id, COUNT(*) as cnt FROM notifications 
      WHERE claim_id = ? GROUP BY user_id
    `).bind(claimId).all();

    for (const group of digestNotifs) {
       console.log(`[Digest] Sending ${group.cnt} notifications to ${group.user_id}`);
       // TODO: Check user digest time preference if needed (e.g. they only want digest at 17:00).
       
       await env.DB.prepare(`
         UPDATE notifications 
         SET delivery_status = 'SENT', claim_id = NULL, locked_until = NULL 
         WHERE claim_id = ? AND user_id = ?
       `).bind(claimId, group.user_id).run();
    }
  } catch (e) {
    console.error("[Digest Error]", e);
  }
}

// --- AUTO RELEASE ROOMS ---
// Runs on cron "*/5 * * * *"
async function handleAutoReleaseRooms(env, isDryRun = false) {
  if (!env.DB) return;
  // FEATURE FLAG & SCOPE CONFIG
  // Must check if API /check-in and /extend exist on UI before turning this on fully.
  const ENABLE_AUTO_RELEASE = env.ENABLE_AUTO_RELEASE_ROOMS === "true"; // Must be strictly turned on
  const FLAG_ENABLED_DATE = env.AUTO_RELEASE_FLAG_DATE || "2026-10-08T00:00:00Z";
  
  if (!ENABLE_AUTO_RELEASE && !isDryRun) return;
  
  console.log('[Auto-Release] Checking overdue room check-ins');
  try {
    const nowIso = new Date().toISOString();
    
    // Warn at minute 10
    const { results: warnRooms } = await env.DB.prepare(`
      SELECT id, title, booked_by FROM room_bookings 
      WHERE status = 'APPROVED' AND is_checked_in = 0 
      AND datetime(booking_date || ' ' || substr(time_slot, 1, 5) || ':00', '-7 hours') >= ?
      AND datetime(booking_date || ' ' || substr(time_slot, 9, 5) || ':00', '-7 hours') > CURRENT_TIMESTAMP
      AND datetime(booking_date || ' ' || substr(time_slot, 1, 5) || ':00', '-7 hours', '+10 minutes') <= CURRENT_TIMESTAMP
      AND datetime(booking_date || ' ' || substr(time_slot, 1, 5) || ':00', '-7 hours', '+15 minutes') > CURRENT_TIMESTAMP
    `).bind(FLAG_ENABLED_DATE).all();
    
    for (const room of warnRooms || []) {
      const dedupeKey = `warn_room_${room.id}`;
      if (isDryRun) {
         console.log(`[DRY-RUN] Would warn room ${room.id} (at 10 mins).`);
      } else {
         await env.DB.prepare(`
           INSERT OR IGNORE INTO notifications (id, user_id, title, message, priority, dedupe_key, module, record_id)
           VALUES (?, ?, ?, ?, 'URGENT', ?, 'ROOM', ?)
         `).bind(
           `notif_warn_${Date.now()}_${room.id}`, room.booked_by, 'Cảnh báo Check-in phòng họp',
           `Phòng "${room.title}" sẽ bị tự động hủy sau 5 phút nếu không check-in.`, dedupeKey, room.id
         ).run();
      }
    }

    // Cancel at minute 15
    const cancelRes = await env.DB.prepare(`
      UPDATE room_bookings 
      SET status = 'CANCELLED', rejection_reason = 'Auto-cancelled: Không check-in sau 15 phút' 
      WHERE status = 'APPROVED' AND is_checked_in = 0 
      AND datetime(booking_date || ' ' || substr(time_slot, 1, 5) || ':00', '-7 hours') >= ?
      AND datetime(booking_date || ' ' || substr(time_slot, 9, 5) || ':00', '-7 hours') > CURRENT_TIMESTAMP
      AND datetime(booking_date || ' ' || substr(time_slot, 1, 5) || ':00', '-7 hours', '+15 minutes') <= CURRENT_TIMESTAMP
      RETURNING id, title, booked_by
    `).bind(FLAG_ENABLED_DATE).all();
    
    // In D1, UPDATE RETURNING returns the rows
    const releasedRooms = cancelRes.results || [];

    if (releasedRooms.length > 0) {
      if (isDryRun) {
         console.log(`[DRY-RUN] Would release ${releasedRooms.length} rooms.`);
         return;
      }
      for (const room of releasedRooms) {
         console.log(`[Auto-Release] Released room ${room.id}`);
         await env.DB.prepare(`
           INSERT INTO notifications (id, user_id, title, message, priority, module, record_id)
           VALUES (?, ?, ?, ?, 'URGENT', 'ROOM', ?)
         `).bind(
           `notif_cancel_${Date.now()}_${room.id}`, room.booked_by, 'Hủy phòng họp tự động',
           `Phòng họp "${room.title}" đã bị hủy tự động do không check-in.`, room.id
         ).run();
      }
    }
  } catch (e) {
    console.error("[Auto-Release Error]", e);
  }
}
