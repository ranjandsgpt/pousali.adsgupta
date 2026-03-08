/**
 * Semantic Query Parser — Extract metrics, filters, aggregations, sorting, limits from natural language.
 */


export interface ParsedQuery {
  dataset: string;
  metric?: string;
  sort?: 'asc' | 'desc';
  limit?: number;
  filters?: Array<{ field: string; op: string; value: number | string }>;
}

const DATASET_PATTERNS: Array<{ re: RegExp; dataset: string }> = [
  { re: /\bcampaigns?\b/i, dataset: 'campaigns' },
  { re: /\bkeywords?|search\s*terms?\b/i, dataset: 'searchTerms' },
  { re: /\basins?\b/i, dataset: 'asins' },
  { re: /\bcharts?\b/i, dataset: 'charts' },
  { re: /\binsights?\b/i, dataset: 'insights' },
];

export function parseSemanticQuery(question: string): ParsedQuery {
  const q = (question || '').trim();
  const parsed: ParsedQuery = { dataset: 'campaigns' };

  for (const { re, dataset } of DATASET_PATTERNS) {
    if (re.test(q)) {
      parsed.dataset = dataset;
      break;
    }
  }

  const topMatch = q.match(/\btop\s*(\d+)\b/i);
  if (topMatch) parsed.limit = Math.min(parseInt(topMatch[1], 10) || 5, 50);

  if (/\bby\s+roas\b/i.test(q)) {
    parsed.metric = 'ROAS';
    parsed.sort = 'desc';
  }
  if (/\bby\s+acos\b/i.test(q)) {
    parsed.metric = 'ACOS';
    parsed.sort = 'asc';
  }
  if (/\bby\s+spend\b/i.test(q)) {
    parsed.metric = 'spend';
    parsed.sort = 'desc';
  }
  if (/\bby\s+sales\b/i.test(q)) {
    parsed.metric = 'sales';
    parsed.sort = 'desc';
  }
  if (/\bhighest\s+roas|\broas\s+desc\b/i.test(q)) {
    parsed.metric = 'ROAS';
    parsed.sort = 'desc';
  }
  if (/\bacos\s*>\s*(\d+)\s*%?/i.test(q)) {
    const m = q.match(/acos\s*>\s*(\d+)/i);
    if (m) parsed.filters = [...(parsed.filters ?? []), { field: 'acos', op: '>', value: parseInt(m[1], 10) }];
  }
  if (/\bzero\s*sales|sales\s*=\s*0\b/i.test(q)) {
    parsed.filters = [...(parsed.filters ?? []), { field: 'sales', op: '=', value: 0 }];
  }
  if (/\bclicks.*zero\s*sales|keywords?.*zero\s*sales/i.test(q)) {
    parsed.dataset = 'searchTerms';
    parsed.filters = [...(parsed.filters ?? []), { field: 'sales', op: '=', value: 0 }];
  }

  if (!parsed.limit && (/\btop\b|\bfirst\b|\bbest\b/i.test(q))) parsed.limit = 5;
  if (!parsed.metric && parsed.dataset === 'campaigns') parsed.metric = 'ROAS';

  return parsed;
}
