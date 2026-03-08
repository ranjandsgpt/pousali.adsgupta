/**
 * Schema Grounding Agent — Map natural language queries to dataset schema.
 * Improves Query Intelligence accuracy by resolving terms to canonical fields.
 */

export type SchemaField = string;

const NL_TO_SCHEMA: Record<string, SchemaField> = {
  sales: 'totalStoreSales',
  'ad sales': 'totalAdSales',
  'total sales': 'totalStoreSales',
  'store sales': 'totalStoreSales',
  spend: 'totalAdSpend',
  'ad spend': 'totalAdSpend',
  'total spend': 'totalAdSpend',
  budget: 'totalAdSpend',
  keywords: 'searchTerms',
  'search terms': 'searchTerms',
  terms: 'searchTerms',
  campaigns: 'campaigns',
  campaign: 'campaigns',
  roas: 'roas',
  acos: 'acos',
  tacos: 'tacos',
  cpc: 'cpc',
  ctr: 'ctr',
  cvr: 'cvr',
  clicks: 'totalClicks',
  orders: 'totalOrders',
  conversions: 'totalOrders',
  sessions: 'totalSessions',
  impressions: 'impressions',
  waste: 'wasteSpend',
  'wasted spend': 'wasteSpend',
  'waste spend': 'wasteSpend',
  profitability: 'contributionMarginPct',
  'break-even': 'breakEvenACOS',
  'break even': 'breakEvenACOS',
};

export interface GroundingResult {
  canonicalField: SchemaField;
  sourceTerm: string;
  confidence: number;
}

/**
 * Map a natural language term to the dataset schema field.
 */
export function groundToSchema(naturalTerm: string): GroundingResult | null {
  const normalized = (naturalTerm || '').trim().toLowerCase();
  if (!normalized) return null;
  for (const [nl, field] of Object.entries(NL_TO_SCHEMA)) {
    if (normalized === nl || normalized.includes(nl)) {
      return { canonicalField: field, sourceTerm: naturalTerm, confidence: 0.95 };
    }
  }
  if (/sales|revenue/.test(normalized)) return { canonicalField: 'totalAdSales', sourceTerm: naturalTerm, confidence: 0.7 };
  if (/spend|cost/.test(normalized)) return { canonicalField: 'totalAdSpend', sourceTerm: naturalTerm, confidence: 0.7 };
  return null;
}

/**
 * Resolve multiple terms from a question to schema fields.
 */
export function groundQueryToSchema(question: string): GroundingResult[] {
  const words = (question || '').toLowerCase().split(/\s+/);
  const seen = new Set<string>();
  const out: GroundingResult[] = [];
  for (let i = 0; i < words.length; i++) {
    const unigram = words[i];
    const bigram = i < words.length - 1 ? `${words[i]} ${words[i + 1]}` : '';
    for (const term of [bigram, unigram]) {
      if (!term || seen.has(term)) continue;
      const r = groundToSchema(term);
      if (r) {
        seen.add(term);
        out.push(r);
      }
    }
  }
  return out;
}
