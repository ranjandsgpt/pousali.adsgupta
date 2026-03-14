/**
 * Phase 1 Prompt 8 — Query ambiguity detection.
 * When the user query is too vague or could mean multiple things, suggest clarification.
 */

export interface AmbiguityResult {
  ambiguous: boolean;
  suggestion?: string;
}

const VAGUE_PATTERNS = [
  /\b(it|that|this|they|them)\s*(\?|$)/i,
  /^(\s*(what|how|why|which)\s*)\??\s*$/i,
  /^(explain|tell me more|elaborate|clarify)\s*\.?\s*$/i,
  /^(what about|how about)\s*\.?\s*$/i,
];

/** Multiple metric keywords in one short query can be ambiguous (e.g. "spend and sales and acos"). */
const METRIC_KEYWORDS = ['spend', 'sales', 'acos', 'roas', 'tacos', 'cpc', 'clicks', 'impressions', 'orders', 'sessions', 'conversion'];

function countMetricKeywords(q: string): number {
  const lower = q.toLowerCase();
  return METRIC_KEYWORDS.filter((k) => lower.includes(k)).length;
}

/**
 * Returns { ambiguous: true, suggestion } when the query is too vague or ambiguous;
 * otherwise { ambiguous: false }.
 */
export function detectQueryAmbiguity(question: string): AmbiguityResult {
  const q = (question || '').trim();
  if (q.length < 3) {
    return { ambiguous: true, suggestion: 'Your question is very short. Try asking something specific, e.g. "What is my total ad spend?" or "Which keywords have the highest ACOS?"' };
  }
  if (VAGUE_PATTERNS.some((re) => re.test(q))) {
    return {
      ambiguous: true,
      suggestion: 'Could you be more specific? For example: "What is my ROAS?" or "Which campaigns have the highest spend?" Refer to a specific metric or dimension (campaign, keyword, ASIN) when possible.',
    };
  }
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length <= 2 && countMetricKeywords(q) >= 2) {
    return {
      ambiguous: true,
      suggestion: 'Your question mentions multiple metrics. Try asking about one at a time, e.g. "What is my total ad spend?" or "What is my ACOS by campaign?"',
    };
  }
  return { ambiguous: false };
}
