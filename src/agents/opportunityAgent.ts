/**
 * Phase 33 — Insight Opportunity Engine.
 * Predicts opportunities (e.g. increasing budget on Campaign A by 20% could increase sales by €1,200).
 */

import type { MemoryStore } from '@/app/audit/utils/reportParser';

export interface OpportunityPrediction {
  entityType: 'campaign' | 'keyword';
  entityName: string;
  currentSpend: number;
  suggestedChange: string;
  estimatedSalesLift: number;
  rationale: string;
}

export function runOpportunityAgent(store: MemoryStore): OpportunityPrediction[] {
  const results: OpportunityPrediction[] = [];
  const currency = store.currency ?? '€';
  const campaigns = Object.values(store.campaignMetrics)
    .filter((c) => c.spend > 20 && c.sales > 0)
    .sort((a, b) => (b.sales / (b.spend || 1)) - (a.sales / (a.spend || 1)))
    .slice(0, 5);

  for (const c of campaigns) {
    const roas = c.spend > 0 ? c.sales / c.spend : 0;
    if (roas < 1.5) continue;
    const liftPercent = 20;
    const extraSpend = c.spend * (liftPercent / 100);
    const estimatedLift = extraSpend * roas;
    results.push({
      entityType: 'campaign',
      entityName: c.campaignName,
      currentSpend: c.spend,
      suggestedChange: `Increase budget by ${liftPercent}%`,
      estimatedSalesLift: Math.round(estimatedLift * 100) / 100,
      rationale: `Current ROAS ${roas.toFixed(2)}; scaling could yield ~${currency}${estimatedLift.toFixed(0)} additional sales.`,
    });
  }
  return results;
}
