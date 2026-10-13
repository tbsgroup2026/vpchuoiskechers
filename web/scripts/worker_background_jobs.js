// Inserted by patch
async function handleNotificationQueue(env) {
  if (!env.DB) return;
  const lockTime = new Date();
  lockTime.setMinutes(lockTime.getMinutes() + 5);
  const lockIso = lockTime.toISOString();
  
  // Claim phase (Lease pattern)
  // Using SQLite's RETURNING is perfect here. But if D1 doesn't fully support RETURNING in UPDATE,
  // we first SELECT pending, then UPDATE with condition, then SELECT again or just use batch.
  try {
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // We only process URGENT ones immediately or NORMAL ones that are past their scheduled time.
    // Assuming we just process PENDING ones for now
    const { results: claimed } = await env.DB.prepare(`
      UPDATE notifications
      SET status = 'PROCESSING', claim_id = ?, locked_until = ?
      WHERE status = 'PENDING' AND (locked_until IS NULL OR locked_until < CURRENT_TIMESTAMP)
      LIMIT 10
      RETURNING *
    `).bind(claimId, lockIso).all();

    if (!claimed || claimed.length === 0) return;

    for (const notif of claimed) {
      try {
        // CALL API here (e.g., Zalo, WebPush)
        let success = true;
        // Mock Zalo ZNS API Call
        console.log(`[Notification Dispatcher] Sending ${notif.id} to ${notif.user_id}`);
        
        if (success) {
          await env.DB.prepare(`
            UPDATE notifications SET status = 'SENT' WHERE id = ? AND claim_id = ?
          `).bind(notif.id, claimId).run();
        } else {
          throw new Error("API call failed");
        }
      } catch (e) {
        await env.DB.prepare(`
          UPDATE notifications SET status = 'FAILED', attempts = attempts + 1, locked_until = NULL WHERE id = ? AND claim_id = ?
        `).bind(notif.id, claimId).run();
      }
    }
  } catch (err) {
    console.error("[Notification Dispatcher] Error in queue:", err);
  }
}

async function handleNotificationDigest(env) {
  if (!env.DB) return;
  console.log('[Notification Dispatcher] Sending Hourly Digest');
  // Logic to group DELAYED_DIGEST notifications per user and send a summary
}

async function handleAutoReleaseRooms(env) {
  if (!env.DB) return;
  console.log('[Auto-Release] Checking overdue room check-ins');
  // Logic to auto-release rooms
}
