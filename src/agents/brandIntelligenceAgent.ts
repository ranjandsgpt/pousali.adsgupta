/**
 * Brand Intelligence Agent — classify search terms into branded, competitor, or generic.
 * Inputs: searchTerms[], brandNames[], competitorBrands[].
 * Output: per-term classification + aggregate brandedSales, genericSales, competitorSales.
 */

export type KeywordType = 'branded' | 'competitor' | 'generic';

export interface SearchTermInput {
  searchTerm: string;
  sales: number;
  spend: number;
  orders?: number;
}

export interface BrandAnalysisItem {
  searchTerm: string;
  keywordType: KeywordType;
  sales: number;
  spend: number;
  orders: number;
}

export interface BrandAnalysisResult {
  terms: BrandAnalysisItem[];
  brandedSales: number;
  genericSales: number;
  competitorSales: number;
}

function normalizeForMatch(s: string): string {
  return (s || '').toLowerCase().trim();
}

function containsAny(term: string, list: string[]): boolean {
  const t = normalizeForMatch(term);
  if (!t) return false;
  for (const b of list) {
    const token = normalizeForMatch(b);
    if (token && t.includes(token)) return true;
  }
  return false;
}

/**
 * Classify each search term:
 * - contains brandNames → branded
 * - contains competitorBrands → competitor
 * - else → generic
 * Returns per-term items and aggregate sales by type.
 */
export function runBrandIntelligence(
  searchTerms: SearchTermInput[],
  brandNames: string[] = [],
  competitorBrands: string[] = []
): BrandAnalysisResult {
  const terms: BrandAnalysisItem[] = [];
  let brandedSales = 0;
  let genericSales = 0;
  let competitorSales = 0;

  for (const st of searchTerms) {
    const term = (st.searchTerm || '').trim();
    const sales = Number(st.sales) || 0;
    const spend = Number(st.spend) || 0;
    const orders = Number(st.orders) ?? 0;

    let keywordType: KeywordType = 'generic';
    if (containsAny(term, brandNames)) {
      keywordType = 'branded';
      brandedSales += sales;
    } else if (containsAny(term, competitorBrands)) {
      keywordType = 'competitor';
      competitorSales += sales;
    } else {
      genericSales += sales;
    }

    terms.push({
      searchTerm: term,
      keywordType,
      sales,
      spend,
      orders,
    });
  }

  return {
    terms,
    brandedSales,
    genericSales,
    competitorSales,
  };
}
