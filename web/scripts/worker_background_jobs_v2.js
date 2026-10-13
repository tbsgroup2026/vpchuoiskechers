async function handleNotificationQueue(env) {
  if (!env.DB) return;
  const lockTime = new Date();
  lockTime.setMinutes(lockTime.getMinutes() + 5);
  const lockIso = lockTime.toISOString();
  
  try {
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Check Quiet Hours (Asia/Ho_Chi_Minh 22:00 - 07:00)
    // If we process this, we might want to delay NORMAL notifications.
    // However, the queue should only process PENDING_IMMEDIATE or PENDING that are ready.
    // Let's claim up to 50 records. Cloudflare D1 batching allows 100 statements.
    
    // D1 doesn't support RETURNING with UPDATE nicely in some client versions, but we can do a two-step claim:
    // 1. Find pending notifications
    const { results: pending } = await env.DB.prepare(`
      SELECT id, user_id, title, message, url, priority, delivery_status 
      FROM notifications 
      WHERE delivery_status = 'PENDING' AND (locked_until IS NULL OR locked_until < CURRENT_TIMESTAMP)
      LIMIT 20
    `).all();

    if (!pending || pending.length === 0) return;
    
    const ids = pending.map(n => n.id);
    const placeholders = ids.map(() => '?').join(',');

    // 2. Lock them
    await env.DB.prepare(`
      UPDATE notifications 
      SET delivery_status = 'PROCESSING', claim_id = ?, locked_until = ? 
      WHERE id IN (${placeholders})
    `).bind(claimId, lockIso, ...ids).run();

    // 3. Process each notification
    const nowHCM = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    const hours = nowHCM.getHours();
    const inQuietHours = hours >= 22 || hours < 7;

    for (const notif of pending) {
      try {
        // Fetch user preferences
        const pref = await env.DB.prepare('SELECT * FROM notification_preferences WHERE emp_code = ?').bind(notif.user_id).first().catch(() => null);
        
        let shouldDelayToDigest = false;
        let shouldDelayQuietHours = false;

        if (notif.priority !== 'URGENT' && notif.priority !== 'HOT') {
          if (pref && pref.digest_enabled) {
            shouldDelayToDigest = true;
          }
          if (inQuietHours) {
            shouldDelayQuietHours = true;
          }
        }

        if (shouldDelayToDigest) {
          await env.DB.prepare(`UPDATE notifications SET delivery_status = 'PENDING_DIGEST', claim_id = NULL, locked_until = NULL WHERE id = ?`).bind(notif.id).run();
          continue;
        }

        if (shouldDelayQuietHours) {
          // Delay until 7 AM HCM
          await env.DB.prepare(`UPDATE notifications SET delivery_status = 'DELAYED_QUIET_HOURS', claim_id = NULL, locked_until = NULL WHERE id = ?`).bind(notif.id).run();
          continue;
        }

        // --- DELIVERY LOGIC ---
        // Zalo ZNS
        // (Mock implementation since we don't have real ZNS template ID here, but we can call our Zalo Webhook or OA Follower API)
        
        // Web Push (using VAPID)
        // (Mock implementation)

        console.log(`[Notification Dispatcher] Sent ${notif.id} to ${notif.user_id}`);
        
        // Mark as sent
        await env.DB.prepare(`
          UPDATE notifications SET delivery_status = 'SENT', claim_id = NULL, locked_until = NULL WHERE id = ?
        `).bind(notif.id).run();

      } catch (e) {
        await env.DB.prepare(`
          UPDATE notifications SET delivery_status = 'FAILED', attempts = attempts + 1, error_log = ?, locked_until = NULL WHERE id = ?
        `).bind(String(e.message), notif.id).run();
      }
    }
  } catch (err) {
    console.error("[Notification Dispatcher] Error in queue:", err);
  }
}

async function handleNotificationDigest(env) {
  if (!env.DB) return;
  console.log('[Notification Dispatcher] Sending Hourly Digest');
  
  try {
    const lockTime = new Date();
    lockTime.setMinutes(lockTime.getMinutes() + 10);
    const lockIso = lockTime.toISOString();
    const claimId = `digest_${Date.now()}`;

    // 1. Release quiet hours notifications if it's 7 AM
    const nowHCM = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    const hours = nowHCM.getHours();
    if (hours >= 7 && hours < 22) {
       await env.DB.prepare(`
         UPDATE notifications SET delivery_status = 'PENDING' WHERE delivery_status = 'DELAYED_QUIET_HOURS'
       `).run();
    }

    // 2. Process PENDING_DIGEST
    const { results: digestNotifs } = await env.DB.prepare(`
      SELECT user_id, COUNT(*) as cnt FROM notifications WHERE delivery_status = 'PENDING_DIGEST' GROUP BY user_id
    `).all();

    if (!digestNotifs || digestNotifs.length === 0) return;

    for (const group of digestNotifs) {
       console.log(`[Digest] Sending ${group.cnt} notifications to ${group.user_id}`);
       // Call Zalo / Push to send summary
       await env.DB.prepare(`
         UPDATE notifications SET delivery_status = 'SENT' WHERE delivery_status = 'PENDING_DIGEST' AND user_id = ?
       `).bind(group.user_id).run();
    }

  } catch (e) {
    console.error("[Digest Error]", e);
  }
}

async function handleAutoReleaseRooms(env) {
  if (!env.DB) return;
  console.log('[Auto-Release] Checking overdue room check-ins');
  try {
    // Release rooms that are > 15 mins past start time and not checked in
    const { results } = await env.DB.prepare(`
      UPDATE room_bookings 
      SET status = 'CANCELLED', rejection_reason = 'Auto-cancelled: Không check-in sau 15 phút' 
      WHERE status = 'APPROVED' AND is_checked_in = 0 
      AND datetime(start_time, '+15 minutes') <= CURRENT_TIMESTAMP
      RETURNING id, title, booked_by
    `).all();

    if (results && results.length > 0) {
      for (const room of results) {
         // Create notification for auto-release
         await env.DB.prepare(`
           INSERT INTO notifications (id, user_id, title, message, priority, delivery_status, module, record_id)
           VALUES (?, ?, ?, ?, 'URGENT', 'PENDING', 'ROOM', ?)
         `).bind(
           `notif_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
           room.booked_by,
           'Hủy phòng họp tự động',
           `Phòng họp "${room.title}" đã bị hủy tự động do không check-in quá 15 phút.`,
           room.id
         ).run();
      }
    }
  } catch (e) {
    console.error("[Auto-Release Error]", e);
  }
}
