/**
 * Helper to trigger real-time background sync from branch site (e.g. thkiengiangshoes)
 * to main web hub (vpchuoiskechers).
 */

export async function triggerRealtimeSyncToWebTong(
  proposalData: any,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'ARCHIVE' = 'UPDATE'
) {
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

    // Sanitize proposal data to strip raw Base64 images/videos exceeding size limit before sending payload
    let sanitizedProposal = proposalData ? { ...proposalData } : {};
    for (const key of Object.keys(sanitizedProposal)) {
      const val = sanitizedProposal[key];
      if (typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('data:video/')) && val.length > 10000) {
        // Strip large Base64 payload, preserve URL fields only
        sanitizedProposal[key] = '';
      }
    }

    // Real-time synchronous push over HTTP
    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': secret,
      },
      body: JSON.stringify({
        site_code: siteCode,
        action,
        proposal: sanitizedProposal,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[REALTIME_SYNC] Push failed (HTTP ${res.status}):`, errText);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    } else {
      console.log(`[REALTIME_SYNC] Real-time push (${action}) succeeded for proposal ${proposalData?.id || proposalData?.code}`);
      return { success: true };
    }
  } catch (err: any) {
    console.warn('[REALTIME_SYNC] Helper error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}



