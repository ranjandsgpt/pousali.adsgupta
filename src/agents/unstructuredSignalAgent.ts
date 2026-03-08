/**
 * Phase 24 — Unstructured Signal Intelligence Agent.
 * Analyzes text-heavy fields: search terms, campaign names, ad group names, product titles.
 * Extracts: purchase intent, brand intent, category clusters, duplicate targeting, semantic clusters.
 */

export type IntentSignal = 'purchase' | 'informational' | 'brand' | 'generic';
export type CategoryCluster = string;

export interface TermSignal {
  term: string;
  intent: IntentSignal;
  category: CategoryCluster;
  brand: 'branded' | 'competitor' | 'generic';
  cluster: string;
}

const PURCHASE_PATTERNS = /\b(buy|best|cheap|deal|discount|order|price|sale|shop)\b/i;
const BRAND_PATTERNS = /\b(brand|official|genuine)\b/i;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function inferIntent(term: string): IntentSignal {
  if (PURCHASE_PATTERNS.test(term)) return 'purchase';
  if (BRAND_PATTERNS.test(term)) return 'brand';
  return 'generic';
}

function inferCategory(term: string): CategoryCluster {
  const t = term.toLowerCase();
  if (/\b(glass|cup|bottle|drink|whiskey|wine)\b/.test(t)) return 'drinkware';
  if (/\b(shirt|dress|shoes|bag)\b/.test(t)) return 'apparel';
  if (/\b(phone|charger|cable|adapter)\b/.test(t)) return 'electronics';
  if (/\b(book|kindle)\b/.test(t)) return 'books';
  return 'generic';
}

export function runUnstructuredSignalAgent(terms: string[], brandNames: string[] = [], competitorBrands: string[] = []): TermSignal[] {
  const brandSet = new Set(brandNames.map((b) => b.toLowerCase()));
  const competitorSet = new Set(competitorBrands.map((c) => c.toLowerCase()));
  const seen = new Set<string>();
  const result: TermSignal[] = [];

  for (const term of terms) {
    const key = term.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const tokens = tokenize(term);
    const words = new Set(tokens);
    let brand: 'branded' | 'competitor' | 'generic' = 'generic';
    for (const b of Array.from(brandSet)) {
      if (key.includes(b)) {
        brand = 'branded';
        break;
      }
    }
    if (brand === 'generic') {
      for (const c of Array.from(competitorSet)) {
        if (key.includes(c)) {
          brand = 'competitor';
          break;
        }
      }
    }
    const cluster = inferCategory(term).replace(/\s+/g, '_');
    result.push({
      term,
      intent: inferIntent(term),
      category: inferCategory(term),
      brand,
      cluster: cluster || 'generic',
    });
  }
  return result;
}
