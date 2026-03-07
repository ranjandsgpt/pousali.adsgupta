/**
 * Extract text from @google/genai GenerateContent response.
 * The SDK exposes a .text accessor; raw candidates[0].content.parts may use different shapes.
 */
export function extractTextFromGenerateContentResponse(result: unknown): string {
  const r = result as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  if (typeof r.text === 'string' && r.text.trim().length > 0) return r.text.trim();
  const fromParts = r.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim();
  return fromParts && fromParts.length > 0 ? fromParts : '';
}
