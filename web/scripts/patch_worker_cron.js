const fs = require('fs');
let code = fs.readFileSync('public/_worker.js', 'utf8');

const scheduledStr = 'async scheduled(event, env, ctx) {';
const replacement = `async scheduled(event, env, ctx) {
    const cron = event.cron || '0 19 * * *';
    console.log('[CRON SCHEDULE] Triggered cron: ' + cron);

    if (cron === '*/5 * * * *') {
      // 1. Auto-release rooms
      if (typeof handleAutoReleaseRooms === 'function' && ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(handleAutoReleaseRooms(env));
      }
      // 2. Notification Queue Processing (Frequent)
      if (typeof handleNotificationQueue === 'function' && ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(handleNotificationQueue(env));
      }
      return;
    }

    if (cron === '0 * * * *') {
      // Notification Digest
      if (typeof handleNotificationDigest === 'function' && ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(handleNotificationDigest(env));
      }
      return;
    }`;

code = code.replace(scheduledStr, replacement);
fs.writeFileSync('public/_worker.js', code);
console.log('Patched scheduled handler');
