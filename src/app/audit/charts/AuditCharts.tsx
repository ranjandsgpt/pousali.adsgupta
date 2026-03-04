'use client';

import MatchTypeSpendPie from './MatchTypeSpendPie';
import AdProductSalesPie from './AdProductSalesPie';
import DailyTrendLine from './DailyTrendLine';
import OrganicVsAdDonut from './OrganicVsAdDonut';
import ACOSHeatmap from './ACOSHeatmap';
import BudgetPacingGauges from './BudgetPacingGauges';
import SpendByCampaignBar from './SpendByCampaignBar';
import ROASByCampaignBar from './ROASByCampaignBar';
import ParetoSpendChart from './ParetoSpendChart';
import SpendVsConversionScatter from './SpendVsConversionScatter';
import WastedSpendBarChart from './WastedSpendBarChart';

/** Section 5 & 34: Chart suite – Pareto, scatter, wasted bar, match type pie, ad type pie, trend, etc. */
export default function AuditCharts() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-muted)]">
        Pareto spend, spend vs ROAS, wasted spend bar, match type, ad type sales, trend, organic vs ad, ACOS, budget pacing.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ParetoSpendChart />
        <SpendVsConversionScatter />
        <WastedSpendBarChart />
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
