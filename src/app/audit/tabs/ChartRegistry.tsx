'use client';

import { useAuditStore } from '../context/AuditStoreContext';
import ParetoSpendChart from '../charts/ParetoSpendChart';
import SpendVsConversionScatter from '../charts/SpendVsConversionScatter';
import WastedSpendBarChart from '../charts/WastedSpendBarChart';
import MatchTypeSpendPie from '../charts/MatchTypeSpendPie';
import AdProductSalesPie from '../charts/AdProductSalesPie';
import DailyTrendLine from '../charts/DailyTrendLine';
import OrganicVsAdDonut from '../charts/OrganicVsAdDonut';
import ACOSHeatmap from '../charts/ACOSHeatmap';
import BudgetPacingGauges from '../charts/BudgetPacingGauges';
import SpendByCampaignBar from '../charts/SpendByCampaignBar';
import ROASByCampaignBar from '../charts/ROASByCampaignBar';
import FunnelOverviewChart from '../charts/FunnelOverviewChart';
import TargetingTypePieCharts from '../charts/TargetingTypePieCharts';
import KeywordIntentPieCharts from '../charts/KeywordIntentPieCharts';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_MAP: Record<string, React.ComponentType> = {
  'pareto-spend': ParetoSpendChart,
  'spend-vs-conversion': SpendVsConversionScatter,
  'wasted-spend': WastedSpendBarChart,
  'match-type-spend': MatchTypeSpendPie,
  'ad-product-sales': AdProductSalesPie,
  'daily-trend': DailyTrendLine,
  'organic-vs-ad': OrganicVsAdDonut,
  'acos-heatmap': ACOSHeatmap,
  'budget-pacing': BudgetPacingGauges,
  'spend-by-campaign': SpendByCampaignBar,
  'roas-by-campaign': ROASByCampaignBar,
  'funnel-overview': FunnelOverviewChart,
  'targeting-type-spend-sales': TargetingTypePieCharts,
  'keyword-intent-spend-sales': KeywordIntentPieCharts,
};

export function ChartRegistry({ chartIds }: { chartIds: string[] }) {
  return (
    <>
      {chartIds.map((id) => {
        const Chart = CHART_MAP[id];
        if (!Chart) return null;
        return (
          <div key={id} className="rounded border border-white/10 bg-white/5 p-3 min-h-[200px]">
            <Chart />
          </div>
        );
      })}
    </>
  );
}

/** Charts Lab: render many charts by category. Reuses registry + inline mini charts for scale. */
export function ChartsLabGrid() {
  const { state } = useAuditStore();
  const store = state.store;
  const charts = useMemo(() => {
    const kws = Object.values(store.keywordMetrics);
    const campaigns = Object.values(store.campaignMetrics).filter((c) => c.campaignName);
    const spendByCampaign = campaigns.sort((a, b) => b.spend - a.spend).slice(0, 15).map((c) => ({ name: (c.campaignName || '').slice(0, 12), value: c.spend }));
    const salesByCampaign = [...campaigns].sort((a, b) => b.sales - a.sales).slice(0, 15).map((c) => ({ name: (c.campaignName || '').slice(0, 12), value: c.sales }));
    const acosDist = campaigns.filter((c) => c.spend > 0).map((c) => ({ name: (c.campaignName || '').slice(0, 8), acos: c.acos }));
    const roasDist = campaigns.filter((c) => c.spend > 0).map((c) => ({ name: (c.campaignName || '').slice(0, 8), roas: c.sales / c.spend }));
    const kwScatter = kws.filter((k) => k.spend > 0).slice(0, 50).map((k) => ({ x: k.spend, y: k.sales, z: k.clicks }));
    const matchSpend = (() => {
      const byMatch: Record<string, number> = {};
      kws.forEach((k) => {
        const m = (k.matchType || 'other').toLowerCase();
        byMatch[m] = (byMatch[m] || 0) + k.spend;
      });
      return Object.entries(byMatch).map(([name, value]) => ({ name: name.slice(0, 8), value }));
    })();
    const cpcDist = kws.filter((k) => k.clicks > 0).slice(0, 20).map((k) => ({ name: k.searchTerm.slice(0, 8), cpc: k.spend / k.clicks }));
    return {
      spendByCampaign,
      salesByCampaign,
      acosDist: acosDist.slice(0, 15),
      roasDist: roasDist.slice(0, 15),
      kwScatter,
      matchSpend,
      cpcDist,
    };
  }, [store]);

  const allChartIds = [
    'spend-by-campaign', 'roas-by-campaign', 'acos-heatmap', 'pareto-spend', 'spend-vs-conversion', 'wasted-spend',
    'match-type-spend', 'ad-product-sales', 'organic-vs-ad', 'budget-pacing', 'daily-trend',
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-muted)]">Analytical charts from uploaded data. Spend distribution, sales distribution, efficiency analysis, keyword and search term analysis.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ChartRegistry chartIds={allChartIds} />
        {charts.spendByCampaign.length > 0 && (
          <div className="rounded border border-white/10 bg-white/5 p-3">
            <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2">Spend by Campaign (Top 15)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts.spendByCampaign} margin={{ left: 0, right: 8 }}>
                <XAxis dataKey="name" fontSize={9} tick={{ fontSize: 8 }} />
                <YAxis fontSize={9} />
                <Tooltip />
                <Bar dataKey="value" fill="#22d3ee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {charts.salesByCampaign.length > 0 && (
          <div className="rounded border border-white/10 bg-white/5 p-3">
            <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2">Sales by Campaign (Top 15)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts.salesByCampaign} margin={{ left: 0, right: 8 }}>
                <XAxis dataKey="name" fontSize={9} tick={{ fontSize: 8 }} />
                <YAxis fontSize={9} />
                <Tooltip />
                <Bar dataKey="value" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {charts.acosDist.length > 0 && (
          <div className="rounded border border-white/10 bg-white/5 p-3">
            <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2">ACOS by Campaign</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts.acosDist} margin={{ left: 0, right: 8 }}>
                <XAxis dataKey="name" fontSize={9} tick={{ fontSize: 8 }} />
                <YAxis fontSize={9} tickFormatter={(v) => v + '%'} />
                <Tooltip formatter={(v: number) => v.toFixed(1) + '%'} />
                <Bar dataKey="acos" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {charts.roasDist.length > 0 && (
          <div className="rounded border border-white/10 bg-white/5 p-3">
            <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2">ROAS by Campaign</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts.roasDist} margin={{ left: 0, right: 8 }}>
                <XAxis dataKey="name" fontSize={9} tick={{ fontSize: 8 }} />
                <YAxis fontSize={9} />
                <Tooltip formatter={(v: number) => v.toFixed(2) + '×'} />
                <Bar dataKey="roas" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {charts.kwScatter.length > 0 && (
          <div className="rounded border border-white/10 bg-white/5 p-3">
            <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2">Keyword Spend vs Sales</h4>
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" dataKey="x" name="Spend" fontSize={9} />
                <YAxis type="number" dataKey="y" name="Sales" fontSize={9} />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Clicks" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={charts.kwScatter} fill="#22d3ee" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
        {charts.matchSpend.length > 0 && (
          <div className="rounded border border-white/10 bg-white/5 p-3">
            <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2">Spend by Match Type</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={charts.matchSpend} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {charts.cpcDist.length > 0 && (
          <div className="rounded border border-white/10 bg-white/5 p-3">
            <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2">CPC by Keyword (sample)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts.cpcDist} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" fontSize={9} />
                <YAxis type="category" dataKey="name" width={60} fontSize={8} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Bar dataKey="cpc" fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
