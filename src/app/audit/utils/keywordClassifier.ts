/**
 * Section 6: Classifier Agent – tags keywords as Branded, Competitor, or Generic.
 * LLM can be plugged in later; this is a rule-based fallback.
 */

export type KeywordTag = 'Branded' | 'Competitor' | 'Generic';

export interface ClassifierOptions {
  /** Brand name(s) – if search term contains any, tag Branded */
  brandNames?: string[];
  /** Competitor brand/ASIN terms – if search term contains any, tag Competitor */
  competitorTerms?: string[];
}

/**
 * Tag a search term. Default: Generic.
 * Branded: contains brand name. Competitor: contains competitor term. Else Generic.
 */
export function classifyKeyword(
  searchTerm: string,
  options: ClassifierOptions = {}
): KeywordTag {
  const term = (searchTerm ?? '').trim().toLowerCase();
  if (!term) return 'Generic';

  const { brandNames = [], competitorTerms = [] } = options;

  for (const b of brandNames) {
    if (b && term.includes(b.trim().toLowerCase())) return 'Branded';
  }
  for (const c of competitorTerms) {
    if (c && term.includes(c.trim().toLowerCase())) return 'Competitor';
  }

  return 'Generic';
}

/**
 * Tag all keyword metrics. Pass optional brandNames/competitorTerms from store or config.
 */
export function tagKeywordMetrics(
  items: Array<{ searchTerm: string }>,
  options: ClassifierOptions
): Map<string, KeywordTag> {
  const map = new Map<string, KeywordTag>();
  for (const item of items) {
    map.set(item.searchTerm, classifyKeyword(item.searchTerm, options));
  }
  return map;
}
