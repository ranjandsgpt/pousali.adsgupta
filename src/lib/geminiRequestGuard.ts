/**
 * Safety: ensure no raw file references are sent to Gemini.
 * Architecture: Gemini receives only structured audit context (text), never CSV/XLSX/PDF.
 */

export class GeminiFileReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiFileReferenceError';
  }
}

const FORBIDDEN = ['fileUri', 'files/', 'fileData', 'inlineData', 'fileReference'];

/**
 * Sanitizes text so that file-URI-like substrings never reach the Gemini API.
 * Use on every string that goes into contents[].parts[].text.
 * Prevents "Unsupported file URI type: files/<id>" errors when context contains IDs that look like file refs.
 */
export function sanitizeTextForGemini(text: string): string {
  if (typeof text !== 'string' || !text) return text;
  let out = text;
  // Redact any "files/<id>" pattern so Gemini never receives it
  out = out.replace(/files\/[a-z0-9]+/gi, '[file-ref-redacted]');
  if (out.includes('fileUri') || out.includes('fileData') || out.includes('inlineData') || out.includes('fileReference')) {
    out = out.replace(/\bfileUri\b/gi, '[redacted]').replace(/\bfileData\b/gi, '[redacted]').replace(/\binlineData\b/gi, '[redacted]').replace(/\bfileReference\b/gi, '[redacted]');
  }
  return out;
}

/**
 * Validates that the payload does not contain file references.
 * Call before sending to ai.models.generateContent().
 * @throws GeminiFileReferenceError if payload contains file references
 */
export function assertNoFileReferences(payload: unknown): void {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload ?? '');
  for (const token of FORBIDDEN) {
    if (str.includes(token)) {
      throw new GeminiFileReferenceError(
        'Raw files must not be sent to Gemini. Request must use only structured audit context (text).'
      );
    }
  }
}
