/**
 * Agent-layer Query Router — Route queries to SLM, Gemini, metrics library, or dataset handlers.
 * Complements lib/copilot/queryRouter (routeQuery) with intent-based routing for the Query Intelligence Agent.
 */

import type { QueryIntent, CapabilityResult } from './queryCapabilityRegistry';

export type AgentRouteTarget =
  | 'slm'           // metric calculation from storeSummary
  | 'gemini'        // explanation, diagnostic, strategy
  | 'metrics_library' // formula transparency
  | 'tables'        // dataset / search terms / negative keywords
  | 'charts'        // graph interrogation
  | 'insights';     // structuredInsights / waste explanation

export interface AgentRouteResult {
  target: AgentRouteTarget;
  intent: QueryIntent;
  normalizedQuery: string;
  /** For SLM: use normalized query; for Gemini: use full context + query */
  useSlmFirst?: boolean;
}

/**
 * Route based on intent and capability to the appropriate agent/engine.
 */
export function routeToAgent(
  question: string,
  capabilityResult: CapabilityResult
): AgentRouteResult {
  const q = (question || '').trim().slice(0, 500);
  const { intent, suggestedSource } = capabilityResult;

  if (intent === 'out_of_scope') {
    return { target: 'gemini', intent: 'out_of_scope', normalizedQuery: q };
  }

  switch (intent) {
    case 'metric':
      return { target: 'slm', intent: 'metric', normalizedQuery: q, useSlmFirst: true };
    case 'formula':
      return { target: 'metrics_library', intent: 'formula', normalizedQuery: q };
    case 'dataset':
      return { target: 'tables', intent: 'dataset', normalizedQuery: q, useSlmFirst: true };
    case 'diagnostic':
    case 'strategy':
      return { target: 'gemini', intent, normalizedQuery: q, useSlmFirst: false };
    case 'explanation':
      if (suggestedSource === 'structuredInsights') return { target: 'insights', intent: 'explanation', normalizedQuery: q };
      return { target: 'gemini', intent: 'explanation', normalizedQuery: q };
    case 'forecast':
      return { target: 'gemini', intent: 'forecast', normalizedQuery: q };
    default:
      return { target: 'gemini', intent: 'explanation', normalizedQuery: q };
  }
}
