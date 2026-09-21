/**
 * Email Notifier Helper for Cloudflare Workers & Next.js
 * Uses Resend REST API (https://api.resend.com/emails) with zero Node.js legacy dependencies.
 */

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendSecurityEmailAlert(env: any, payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const apiKey = env?.RESEND_API_KEY || (process.env as any)?.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[EMAIL ALERT] RESEND_API_KEY not configured. Skipping email send and logging fallback.');
      return { success: false, error: 'RESEND_API_KEY_MISSING' };
    }

    const sender = payload.from || env?.ALERT_SENDER_EMAIL || 'TBS Security Alert <onboarding@resend.dev>';
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: recipients,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[EMAIL ALERT] Resend API error ${resp.status}:`, errText);
      return { success: false, error: errText };
    }

    const data = await resp.json() as { id: string };
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('[EMAIL ALERT] Send failed:', err);
    return { success: false, error: err.message };
  }
}
