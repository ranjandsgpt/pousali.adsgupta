/**
 * Targeting type aggregates from keyword metrics (SP Targeting / keyword data).
 * Auto vs Manual; Manual split: Broad, Phrase, Exact, Product Targeting.
 */

export interface TargetingTypeSummary {
  auto: { spend: number; sales: number };
  manual: { spend: number; sales: number };
  manualBreakdown: {
    broad: { spend: number; sales: number };
    phrase: { spend: number; sales: number };
    exact: { spend: number; sales: number };
    productTargeting: { spend: number; sales: number };
  };
}

function normalizeMatchType(mt: string): 'auto' | 'broad' | 'phrase' | 'exact' | 'productTargeting' {
  const m = (mt || '').toLowerCase();
  if (m.includes('auto')) return 'auto';
  if (m.includes('broad')) return 'broad';
  if (m.includes('phrase')) return 'phrase';
  if (m.includes('exact')) return 'exact';
  if (m.includes('product') || m.includes('targeting')) return 'productTargeting';
  return 'broad';
}

export function buildTargetingTypeSummary(
  keywordMetrics: Record<string, { matchType?: string; spend: number; sales: number }>
): TargetingTypeSummary {
  const auto = { spend: 0, sales: 0 };
  const manual = { spend: 0, sales: 0 };
  const manualBreakdown = {
    broad: { spend: 0, sales: 0 },
    phrase: { spend: 0, sales: 0 },
    exact: { spend: 0, sales: 0 },
    productTargeting: { spend: 0, sales: 0 },
  };

  for (const kw of Object.values(keywordMetrics)) {
    const mt = normalizeMatchType(kw.matchType ?? '');
    if (mt === 'auto') {
      auto.spend += kw.spend;
      auto.sales += kw.sales;
    } else {
      manual.spend += kw.spend;
      manual.sales += kw.sales;
      if (mt in manualBreakdown) {
        manualBreakdown[mt].spend += kw.spend;
        manualBreakdown[mt].sales += kw.sales;
      } else {
        manualBreakdown.broad.spend += kw.spend;
        manualBreakdown.broad.sales += kw.sales;
      }
    }
  }

  return { auto, manual, manualBreakdown };
}
