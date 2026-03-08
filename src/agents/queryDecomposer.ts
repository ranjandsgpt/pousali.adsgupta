/**
 * Query Decomposer — Break complex questions into smaller sub-queries.
 * Example: "Which campaigns have high spend but low ROAS" → spend > threshold, ROAS < threshold.
 */

export interface SubQuery {
  type: 'filter' | 'metric' | 'aggregate';
  metric?: string;
  condition?: string;
  threshold?: number;
  operator?: '>' | '<' | '>=' | '<=' | '=';
}

export interface DecomposedQuery {
  original: string;
  subQueries: SubQuery[];
  /** Combined interpretation for downstream */
  interpretation: string;
}

const HIGH_SPEND_PATTERN = /\bhigh spend\b|\bspend (is )?high\b/i;
const LOW_ROAS_PATTERN = /\blow roas\b|\broas (is )?low\b/i;
const HIGH_ACOS_PATTERN = /\bhigh acos\b|\bacos (is )?high\b/i;
const WASTE_PATTERN = /\bwaste|bleed(ing)?|zero sales\b/i;

/**
 * Decompose a complex question into sub-queries for SLM or Gemini.
 */
export function decomposeQuery(question: string): DecomposedQuery {
  const q = (question || '').trim();
  const subQueries: SubQuery[] = [];
  let interpretation = q;

  if (!q) {
    return { original: q, subQueries: [], interpretation: '' };
  }

  if (/which campaigns? (have |with )?(high spend|low roas)/i.test(q) || /campaigns?.*high spend.*low roas/i.test(q)) {
    subQueries.push({ type: 'metric', metric: 'campaign spend' });
    subQueries.push({ type: 'metric', metric: 'campaign ROAS' });
    subQueries.push({ type: 'filter', metric: 'spend', operator: '>', condition: 'above threshold' });
    subQueries.push({ type: 'filter', metric: 'ROAS', operator: '<', condition: 'below threshold' });
    interpretation = 'Filter campaigns by: spend above median or high, ROAS below target (e.g. < 2).';
  } else if (HIGH_SPEND_PATTERN.test(q)) {
    subQueries.push({ type: 'metric', metric: 'spend' });
    subQueries.push({ type: 'filter', metric: 'spend', operator: '>', condition: 'high' });
  } else if (LOW_ROAS_PATTERN.test(q)) {
    subQueries.push({ type: 'metric', metric: 'ROAS' });
    subQueries.push({ type: 'filter', metric: 'ROAS', operator: '<', condition: 'low' });
  } else if (HIGH_ACOS_PATTERN.test(q)) {
    subQueries.push({ type: 'metric', metric: 'ACOS' });
    subQueries.push({ type: 'filter', metric: 'ACOS', operator: '>', condition: 'high' });
  } else if (WASTE_PATTERN.test(q) && /keyword|campaign/i.test(q)) {
    subQueries.push({ type: 'filter', condition: 'sales === 0', metric: 'waste' });
    subQueries.push({ type: 'aggregate', metric: 'spend' });
  }

  return {
    original: q,
    subQueries,
    interpretation: subQueries.length > 0 ? interpretation : q,
  };
}
