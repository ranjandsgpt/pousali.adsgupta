/**
 * Phase 23 — Insight Relationship Graph.
 * Links root causes behind insights (e.g. High ACOS → High CPC, Low CVR, Wasted Keywords).
 */

import type { VerifiedInsight, InsightGraphNode } from './zenithTypes';

const CAUSE_MAP: Record<string, { causes: string[]; impact: string[] }> = {
  'high acos': { causes: ['High CPC', 'Low Conversion Rate', 'Keyword Waste'], impact: ['Low Profitability'] },
  'acos high': { causes: ['High CPC', 'Low Conversion Rate', 'Wasted Keywords'], impact: ['Low Profitability'] },
  'low roas': { causes: ['High CPC', 'Low CVR', 'Wasted Spend'], impact: ['Low Profitability'] },
  'wasted spend': { causes: ['Zero-sales keywords', 'High ACOS campaigns'], impact: ['Budget Waste'] },
  'bleeding keywords': { causes: ['Zero conversion', 'Poor targeting'], impact: ['Budget Waste'] },
  'conversion drop': { causes: ['Landing page', 'Keyword relevance', 'Bid strategy'], impact: ['Revenue Loss'] },
  'spend inefficient': { causes: ['High CPC', 'Low CVR', 'Keyword Waste'], impact: ['Low Profitability'] },
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim();
}

export function runInsightGraphAgent(insights: VerifiedInsight[]): InsightGraphNode[] {
  const nodes: InsightGraphNode[] = [];
  const seen = new Set<string>();

  for (const i of insights) {
    const title = normalizeTitle(i.title);
    if (seen.has(title)) continue;
    seen.add(title);

    let causes: string[] = [];
    let impact: string[] = ['Performance impact'];

    for (const [key, val] of Object.entries(CAUSE_MAP)) {
      if (title.includes(key)) {
        causes = val.causes;
        impact = val.impact;
        break;
      }
    }
    if (causes.length === 0 && (title.includes('keyword') || title.includes('campaign'))) {
      causes = ['Check metric breakdown'];
    }

    nodes.push({
      rootInsight: i.title,
      causes,
      impact,
    });
  }
  return nodes;
}
