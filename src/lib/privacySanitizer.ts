/**
 * Phase 1 Prompt 4 — Privacy sanitizer for data sent to Gemini.
 * Redacts or generalizes PII and identifying details so only aggregate/sanitized context is used for AI.
 */

/** Email-like pattern (simple). */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
/** Phone-like (digits with common separators). */
const PHONE_RE = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

function redactEmailsAndPhones(s: string): string {
  if (typeof s !== 'string') return s;
  return s
    .replace(EMAIL_RE, '[email-redacted]')
    .replace(PHONE_RE, '[phone-redacted]');
}

/**
 * Sanitize a string for privacy: redact emails/phones, optionally truncate long free text.
 */
export function sanitizeStringForPrivacy(value: string, maxLength = 500): string {
  const redacted = redactEmailsAndPhones(value);
  return redacted.length > maxLength ? redacted.slice(0, maxLength) + '…' : redacted;
}

/**
 * Recursively redact emails and phones in any string values in an object or array.
 */
function redactInObject(obj: unknown): unknown {
  if (typeof obj === 'string') return redactEmailsAndPhones(obj);
  if (Array.isArray(obj)) return obj.map(redactInObject);
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = redactInObject(v);
    return out;
  }
  return obj;
}

/**
 * Sanitize structured payload for dual-engine: redact emails and phone numbers in all string fields.
 * Structure and numerics unchanged; only PII-like substrings are redacted.
 */
export function sanitizeStructuredPayloadForGemini<T extends Record<string, unknown>>(payload: T): T {
  return redactInObject(payload) as T;
}

/**
 * Sanitize headers list for infer_schema: redact emails/phones in header names.
 */
export function sanitizeHeadersForPrivacy(headers: string[]): string[] {
  return headers.map((h) => redactEmailsAndPhones(String(h)));
}
