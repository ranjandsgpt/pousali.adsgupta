/**
 * Response validation for Gemini outputs by mode.
 * - Mode 2 (narrative): expect plain text; if JSON or code, extract or retry.
 */

/** Detect if text looks like JSON (starts with { or [). */
export function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith('{') || t.startsWith('[');
}

/** Detect if text looks like code (``` or import/def). */
export function looksLikeCode(text: string): boolean {
  const t = text.trim();
  if (t.includes('```')) return true;
  if (/^\s*(import |from |def |class )/m.test(t)) return true;
  return false;
}

/** Extract a single JSON object from text (first { ... }). */
export function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * For Mode 2 (Insight Narrative): validate that response is plain text.
 * If response is JSON, try to extract a "narrative" or "report" or "text" field for UI.
 * If response looks like code, return null so caller can retry.
 */
export function validateNarrativeResponse(raw: string): {
  valid: boolean;
  narrative: string | null;
  shouldRetry: boolean;
  reason?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, narrative: null, shouldRetry: true, reason: 'empty' };
  }
  if (looksLikeCode(trimmed)) {
    return { valid: false, narrative: null, shouldRetry: true, reason: 'response_was_code' };
  }
  if (looksLikeJson(trimmed)) {
    const obj = extractJsonObject(trimmed) as Record<string, unknown> | null;
    if (obj && typeof obj === 'object') {
      const narrative =
        typeof obj.narrative === 'string'
          ? obj.narrative
          : typeof obj.report === 'string'
            ? obj.report
            : typeof obj.text === 'string'
              ? obj.text
              : typeof obj.content === 'string'
                ? obj.content
                : null;
      if (narrative && narrative.length > 50) {
        return { valid: true, narrative, shouldRetry: false };
      }
    }
    if (trimmed.length > 200) {
      return { valid: true, narrative: trimmed, shouldRetry: false, reason: 'response_was_json_used_raw' };
    }
    return { valid: false, narrative: null, shouldRetry: true, reason: 'response_was_json_no_narrative_field' };
  }
  return { valid: true, narrative: trimmed, shouldRetry: false };
}
