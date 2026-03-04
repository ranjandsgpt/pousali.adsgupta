'use client';

import MatchTypeSpendPie from './MatchTypeSpendPie';
import AdProductSalesPie from './AdProductSalesPie';
import DailyTrendLine from './DailyTrendLine';
import OrganicVsAdDonut from './OrganicVsAdDonut';
import ACOSHeatmap from './ACOSHeatmap';
import BudgetPacingGauges from './BudgetPacingGauges';
import SpendByCampaignBar from './SpendByCampaignBar';
import ROASByCampaignBar from './ROASByCampaignBar';

/** Section 5: Dedicated tab with 10+ high-fidelity charts. */
export default function AuditCharts() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-muted)]">
        Data visualisations: match type spend, ad product sales, trend, organic vs ad, ACOS heatmap, budget pacing.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MatchTypeSpendPie />
        <AdProductSalesPie />
        <DailyTrendLine />
        <OrganicVsAdDonut />
        <ACOSHeatmap />
        <BudgetPacingGauges />
        <SpendByCampaignBar />
        <ROASByCampaignBar />
      </div>
    </div>
  );
}
