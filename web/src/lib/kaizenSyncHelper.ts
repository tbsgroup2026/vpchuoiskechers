/**
 * Helper to trigger real-time background sync from branch site (thkiengiangshoes)
 * to main web hub (vpchuoiskechers).
 */

export async function triggerRealtimeSyncToWebTong(proposalData: any) {
  try {
    const currentSite = (process.env.SITE_ID || '').toLowerCase();
    
    // Only trigger if we are running on a branch site (e.g. thkiengiangshoes)
    if (currentSite === 'vpchuoiskechers') {
      return;
    }

    const syncUrl = process.env.VPCHUOISKECHERS_SYNC_URL || 'https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen/sync';
    const secret = process.env.INTERNAL_SYNC_SECRET || 'tbs_ii_secure_jwt_secret_key_2026';
    const siteCode = currentSite || 'thkiengiangshoes';

    // Non-blocking asynchronous push
    fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': secret,
      },
      body: JSON.stringify({
        site_code: siteCode,
        proposal: proposalData,
      }),
    }).catch((err) => {
      console.warn('[REALTIME_SYNC] Non-blocking push failed:', err);
    });
  } catch (err) {
    console.warn('[REALTIME_SYNC] Helper error:', err);
  }
}
