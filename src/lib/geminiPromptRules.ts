/**
 * Shared Gemini prompt rules (Section 4).
 * - Prepend/append for analyst prompts.
 * - Token caps for insight vs narrative.
 */

export const GEMINI_ANALYST_PREPEND =
  'You are an Amazon Advertising analyst. Use ONLY the data provided. Do not invent numbers.';

export const GEMINI_ANALYST_APPEND =
  'If you are uncertain about any number, say so explicitly rather than estimating.';

/** Max output tokens for insight cards / short answers. */
export const MAX_TOKENS_INSIGHT_CARD = 500;

/** Max output tokens for full report narratives. */
export const MAX_TOKENS_NARRATIVE = 1500;

export function wrapAnalystPrompt(systemOrUser: string, kind: 'system' | 'user'): string {
  if (kind === 'system') {
    return `${GEMINI_ANALYST_PREPEND}\n\n${systemOrUser}\n\n${GEMINI_ANALYST_APPEND}`;
  }
  return `${systemOrUser}\n\n${GEMINI_ANALYST_APPEND}`;
}
