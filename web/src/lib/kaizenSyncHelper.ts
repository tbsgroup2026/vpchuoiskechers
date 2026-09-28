/**
 * Helper to trigger real-time background sync from branch site (thkiengiangshoes)
 * to main web hub (vpchuoiskechers).
 */

export async function triggerRealtimeSyncToWebTong(proposalData: any) {
  try {
    const currentSite = (
      process.env.SITE_ID ||
      (globalThis as any).SITE_ID ||
      (globalThis as any).env?.SITE_ID ||
      ''
    ).toLowerCase();

    // Only trigger if we are running on a branch site (e.g. thkiengiangshoes)
    if (currentSite === 'vpchuoiskechers') {
      return;
    }

    const syncUrl =
      process.env.VPCHUOISKECHERS_SYNC_URL ||
      (globalThis as any).VPCHUOISKECHERS_SYNC_URL ||
      'https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen/sync';
    const secret =
      process.env.INTERNAL_SYNC_SECRET ||
      (globalThis as any).INTERNAL_SYNC_SECRET ||
      'tbs_ii_secure_jwt_secret_key_2026';
    const siteCode = currentSite || 'thkiengiangshoes';

    // Real-time synchronous push over HTTP
    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': secret,
      },
      body: JSON.stringify({
        site_code: siteCode,
        proposal: proposalData,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[REALTIME_SYNC] Push failed (HTTP ${res.status}):`, errText);
    } else {
      console.log(`[REALTIME_SYNC] Real-time push succeeded for proposal ${proposalData?.id || proposalData?.code}`);
    }
  } catch (err) {
    console.warn('[REALTIME_SYNC] Helper error:', err);
  }
}

