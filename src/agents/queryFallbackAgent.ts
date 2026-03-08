/**
 * Query Fallback Agent — Structured response when question cannot be answered.
 * Used when capability is unknown or out_of_scope.
 */

import { SUPPORTED_CAPABILITIES } from './queryCapabilityRegistry';

export interface FallbackResponse {
  answer: string;
  capability: 'unknown' | 'out_of_scope';
  suggestedCapabilities: string[];
}

/**
 * Return a structured fallback message explaining what the system can answer.
 */
export function getFallbackResponse(capability: 'unknown' | 'out_of_scope'): FallbackResponse {
  const intro =
    capability === 'out_of_scope'
      ? 'That question is outside the scope of the audit copilot.'
      : 'This question cannot be answered from the uploaded reports.';

  const bulletList = SUPPORTED_CAPABILITIES.map((c) => `• ${c}`).join('\n');
  const answer = `${intro}\n\nI can answer questions about:\n\n${bulletList}\n\nPlease ask about your advertising performance, metrics, campaigns, keywords, or waste analysis.`;

  return {
    answer,
    capability,
    suggestedCapabilities: SUPPORTED_CAPABILITIES,
  };
}
