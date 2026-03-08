/**
 * Query Intelligence Agent — Orchestrates intent, capability, metric discovery, routing,
 * response validation, fallback, and feedback for the AI Audit Copilot.
 * Sits between Copilot UI and SLM/Gemini engines; extends existing architecture.
 */

import type { StoreSummarySnapshot } from '@/lib/copilot/contextBuilder';
import { detectCapability, type CapabilityResult, type QueryIntent, type QueryCapability } from './queryCapabilityRegistry';
import { decomposeQuery } from './queryDecomposer';
import { getFallbackResponse } from './queryFallbackAgent';
import { routeToAgent, type AgentRouteResult } from './queryRouter';
import { recordQueryGap } from './queryGapRegistry';
import { getFormulaForMetric } from './formulaRegistry';
import { validateCopilotResponse } from '@/lib/copilot/validateResponse';

export type QueryIntelligenceResult =
  | { kind: 'answer'; answer: string; intent: QueryIntent; capability: QueryCapability; validated: boolean; source: 'slm' | 'formula' | 'dataset' | 'fallback' }
  | { kind: 'need_gemini'; normalizedQuery: string; intent: QueryIntent; capability: QueryCapability; decomposedInterpretation?: string };

export interface QueryIntelligenceInput {
  question: string;
  storeSummary: StoreSummarySnapshot | null;
  /** Provide SLM answer function from the route to avoid duplication */
  slmAnswerFn: (question: string, storeSummary: StoreSummarySnapshot) => string | null;
}

/**
 * Run the full Query Intelligence pipeline:
 * Intent → Capability → (optional) Decompose → Route → Execute or need Gemini → Validate.
 */
export function runQueryIntelligenceAgent(input: QueryIntelligenceInput): QueryIntelligenceResult {
  const { question, storeSummary, slmAnswerFn } = input;
  const q = (question || '').trim();
  if (!q) {
    const fallback = getFallbackResponse('out_of_scope');
    recordQueryGap(question, 'out_of_scope', 'out_of_scope');
    return { kind: 'answer', answer: fallback.answer, intent: 'out_of_scope', capability: 'out_of_scope', validated: true, source: 'fallback' };
  }

  const capabilityResult = detectCapability(question, storeSummary);
  const { capability, intent } = capabilityResult;

  if (capability === 'out_of_scope' || capability === 'unknown') {
    recordQueryGap(question, intent, capability);
    const fallback = getFallbackResponse(capability);
    return { kind: 'answer', answer: fallback.answer, intent, capability, validated: true, source: 'fallback' };
  }

  const decomposed = decomposeQuery(question);
  const routeResult = routeToAgent(question, capabilityResult);

  switch (routeResult.target) {
    case 'slm': {
      if (!storeSummary) {
        const fallback = getFallbackResponse('unknown');
        return { kind: 'answer', answer: fallback.answer, intent, capability: 'unknown', validated: true, source: 'fallback' };
      }
      const slmAnswer = slmAnswerFn(routeResult.normalizedQuery, storeSummary);
      if (slmAnswer) {
        const validation = validateCopilotResponse(slmAnswer, storeSummary);
        const answer = validation.valid ? slmAnswer : (validation.fallbackMessage ?? slmAnswer);
        return { kind: 'answer', answer, intent, capability, validated: validation.valid, source: 'slm' };
      }
      return { kind: 'need_gemini', normalizedQuery: routeResult.normalizedQuery, intent, capability, decomposedInterpretation: decomposed.interpretation };
    }

    case 'metrics_library': {
      const formulaAnswer = getFormulaForMetric(question);
      if (formulaAnswer) {
        return { kind: 'answer', answer: formulaAnswer, intent: 'formula', capability: 'available', validated: true, source: 'formula' };
      }
      return { kind: 'need_gemini', normalizedQuery: routeResult.normalizedQuery, intent: 'formula', capability, decomposedInterpretation: decomposed.interpretation };
    }

    case 'tables': {
      if (storeSummary && /negative|bleeding|waste|zero sales|count.*keyword/i.test(question)) {
        const keywords = storeSummary.keywords ?? [];
        const zeroSales = keywords.filter((k) => (k.sales ?? 0) === 0);
        const count = zeroSales.length;
        const answer = `Count of keywords with zero attributed sales (waste/bleeding): ${count}. Total keywords in report: ${keywords.length}.`;
        return { kind: 'answer', answer, intent: 'dataset', capability, validated: true, source: 'dataset' };
      }
      return { kind: 'need_gemini', normalizedQuery: routeResult.normalizedQuery, intent: 'dataset', capability, decomposedInterpretation: decomposed.interpretation };
    }

    case 'insights':
    case 'charts':
    case 'gemini':
    default:
      return { kind: 'need_gemini', normalizedQuery: routeResult.normalizedQuery, intent, capability, decomposedInterpretation: decomposed.interpretation };
  }
}

/**
 * Validate a numeric/claim response against audit data (storeSummary).
 * Used when we want to double-check before returning.
 */
export function validateResponseAgainstAudit(
  answer: string,
  storeSummary: StoreSummarySnapshot
): { valid: boolean; fallbackMessage?: string } {
  const result = validateCopilotResponse(answer, storeSummary);
  return { valid: result.valid, fallbackMessage: result.fallbackMessage };
}
