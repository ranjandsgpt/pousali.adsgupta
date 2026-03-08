/**
 * Query Capability Registry — Determine if the system can answer a question.
 * Categories: available (direct from data), derivable (compute from data), unknown, out_of_scope.
 */

import type { StoreSummarySnapshot } from '@/lib/copilot/contextBuilder';

export type QueryCapability = 'available' | 'derivable' | 'unknown' | 'out_of_scope';

export type QueryIntent =
  | 'metric'
  | 'formula'
  | 'dataset'
  | 'diagnostic'
  | 'strategy'
  | 'explanation'
  | 'forecast'
  | 'out_of_scope';

export interface CapabilityResult {
  capability: QueryCapability;
  intent: QueryIntent;
  /** Suggested source: metrics | tables | charts | structuredInsights | brandAnalysis | metricsLibrary */
  suggestedSource?: string;
  /** Metric or dataset hint for discovery */
  metricHint?: string;
  datasetHint?: string;
}

const OUT_OF_SCOPE_PATTERNS = [
  /\bwhat('s| is) your name\b/i,
  /\bwho are you\b/i,
  /\bhello\b/i,
  /\bhi\b/i,
  /\bthanks\b/i,
  /\bthank you\b/i,
  /\bbye\b/i,
  /^how are you/i,
];

const METRIC_PATTERNS = [
  /\btotal (ad )?spend|ad spend|spend\b/i,
  /\btotal (ad )?sales|ad sales\b/i,
  /\bstore sales|total store sales\b/i,
  /\broas\b/i,
  /\bacos\b/i,
  /\btacos\b/i,
  /\bcpc\b|cost per click/i,
  /\bclicks\b/i,
  /\borders\b/i,
  /\bsessions\b/i,
  /\bconversions?\b/i,
  /\bimpressions?\b/i,
  /\bnegative keyword (count)?\b/i,
  /\bbranded (sales|spend)\b/i,
  /\bgeneric (sales|spend)\b/i,
  /\bcompetitor (sales|spend)\b/i,
];

const FORMULA_PATTERNS = [
  /\bhow (did you |do you )?calculat(e|ion)\b/i,
  /\bformula (for|of)\b/i,
  /\bhow (is|are) (acos|roas|tacos|cpc) (calculated|computed)\b/i,
  /\bwhat (is|are) the (formula|calculation)\b/i,
];

const DATASET_PATTERNS = [
  /\bshow (me )?(the )?(negative |bleeding )?keyword (count|list)\b/i,
  /\bcount (of )?(negative |bleeding )?keywords?\b/i,
  /\b(which|list) (campaigns?|keywords?)\b/i,
  /\bdataset\b/i,
  /\btable (of|for)\b/i,
];

const DIAGNOSTIC_PATTERNS = [
  /\bwhy is (roas|acos|tacos) (low|high)\b/i,
  /\brisk\b/i,
  /\bissue\b/i,
  /\bworst (campaigns?|keywords?)\b/i,
  /\bwasting\b/i,
  /\bperformance (problem|issue)\b/i,
];

const STRATEGY_PATTERNS = [
  /\bwhich campaigns? (should I )?pause\b/i,
  /\bwhich keywords? (should I )?(scale|pause)\b/i,
  /\bshould I (pause|scale)\b/i,
  /\brecommend\b/i,
  /\boptimize\b/i,
  /\baction plan\b/i,
];

const CHART_PATTERNS = [
  /\b(chart|graph)\s+(x|about|shows?)\b/i,
  /\b(in|from) the (campaign efficiency|spend|roas) chart\b/i,
  /\bwhy is .* (low|high) in (the )?chart\b/i,
  /\bwhich campaign dominates\b/i,
];

const INSIGHT_PATTERNS = [
  /\bwhy did you flag (waste|bleed)\b/i,
  /\bexplain (the )?(waste|insight)\b/i,
  /\b(insight|recommendation) (for|about)\b/i,
];

/**
 * Detect intent from the user question.
 */
export function detectIntent(question: string): QueryIntent {
  const q = (question || '').trim().toLowerCase();
  if (!q) return 'out_of_scope';
  if (OUT_OF_SCOPE_PATTERNS.some((r) => r.test(question))) return 'out_of_scope';
  if (FORMULA_PATTERNS.some((r) => r.test(question))) return 'formula';
  if (DATASET_PATTERNS.some((r) => r.test(question))) return 'dataset';
  if (CHART_PATTERNS.some((r) => r.test(question))) return 'explanation';
  if (INSIGHT_PATTERNS.some((r) => r.test(question))) return 'explanation';
  if (DIAGNOSTIC_PATTERNS.some((r) => r.test(question))) return 'diagnostic';
  if (STRATEGY_PATTERNS.some((r) => r.test(question))) return 'strategy';
  if (METRIC_PATTERNS.some((r) => r.test(question))) return 'metric';
  if (/\bforecast\b|\bwhat happens if\b/i.test(question)) return 'forecast';
  return 'explanation';
}

/**
 * Determine capability: can we answer from audit data?
 */
export function detectCapability(
  question: string,
  storeSummary: StoreSummarySnapshot | null
): CapabilityResult {
  const intent = detectIntent(question);
  const hasData = storeSummary != null && storeSummary.metrics != null;

  if (intent === 'out_of_scope') {
    return { capability: 'out_of_scope', intent: 'out_of_scope' };
  }
  if (!hasData) {
    return { capability: 'unknown', intent, suggestedSource: 'metrics' };
  }

  switch (intent) {
    case 'metric':
      return { capability: 'available', intent, suggestedSource: 'metrics', metricHint: 'storeSummary.metrics' };
    case 'formula':
      return { capability: 'available', intent, suggestedSource: 'metricsLibrary' };
    case 'dataset':
      return { capability: 'derivable', intent, suggestedSource: 'tables', datasetHint: 'keywords' };
    case 'diagnostic':
    case 'strategy':
      return { capability: 'derivable', intent, suggestedSource: 'structuredInsights' };
    case 'explanation':
      return { capability: 'derivable', intent, suggestedSource: 'structuredInsights' };
    case 'forecast':
      return { capability: 'derivable', intent, suggestedSource: 'metrics' };
    default:
      return { capability: 'available', intent, suggestedSource: 'metrics' };
  }
}

/** Supported capability summary for fallback message. */
export const SUPPORTED_CAPABILITIES = [
  'Sales performance',
  'Campaign efficiency',
  'Keyword opportunities',
  'Waste analysis',
  'Profitability',
  'Brand performance',
  'Search term analysis',
  'Formula transparency (ACOS, ROAS, TACOS, CPC)',
];
