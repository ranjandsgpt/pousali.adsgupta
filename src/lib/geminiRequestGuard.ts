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
