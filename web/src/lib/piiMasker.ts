/**
 * PII Masking Utility
 * Masks sensitive personal identifiable information (PII) before sending context to Cloud LLM.
 */

// Regex patterns for Vietnamese PII
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+84|84|0)[3|5|7|8|9][0-9]{8}\b/g;
const CCCD_REGEX = /\b[0-9]{12}\b/g;
const MSNV_REGEX = /\b(AM\d{4,6}|\d{9}|\d{6})\b/gi;

export function maskPII(text: string): string {
  if (!text) return "";

  let sanitized = text;

  // Mask Emails
  sanitized = sanitized.replace(EMAIL_REGEX, "[EMAIL_DA_CHE]");

  // Mask Phone numbers
  sanitized = sanitized.replace(PHONE_REGEX, "[SDT_DA_CHE]");

  // Mask CCCD / ID Card numbers (12 digits)
  sanitized = sanitized.replace(CCCD_REGEX, "[CCCD_DA_CHE]");

  // Mask Employee Codes (MSNV: e.g. AM1234 or 9-digit / 6-digit numeric IDs when standalone)
  sanitized = sanitized.replace(MSNV_REGEX, (match) => {
    // Exclude years like 2026 or common numbers unless formatted as MSNV
    if (match.length === 4 && Number(match) >= 2000 && Number(match) <= 2100) {
      return match;
    }
    return "[MSNV_DA_CHE]";
  });

  return sanitized;
}

export function maskObjectPII(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return maskPII(obj);
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObjectPII(item));
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Redact direct token/credential keys
    if (['access_token', 'token', 'secret', 'password', 'authorization'].includes(key.toLowerCase())) {
      result[key] = '[REDACTED_CREDENTIAL]';
    } else {
      result[key] = maskObjectPII(value);
    }
  }
  return result;
}

