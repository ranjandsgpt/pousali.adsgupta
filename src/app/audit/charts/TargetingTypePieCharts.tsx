'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';
import { buildTargetingTypeSummary } from '../utils/targetingTypeAggregates';

const COLOR_AUTO = '#1A3FAA';
const COLOR_MANUAL = '#0D9488';
const MANUAL_COLORS = ['#0D9488', '#0F766E', '#115E59', '#134E4A'];

export default function TargetingTypePieCharts() {
  const { state } = useAuditStore();
  const [drillChart, setDrillChart] = useState<'spend' | 'sales' | null>(null);

  const { rootData, manualData } = useMemo(() => {
    const summary = buildTargetingTypeSummary(state.store.keywordMetrics);
    const rootData = [
      { name: 'Auto', value: Math.round(summary.auto.spend * 100) / 100, key: 'auto' },
      { name: 'Manual', value: Math.round(summary.manual.spend * 100) / 100, key: 'manual' },
    ].filter((d) => d.value > 0);

    const rootDataSales = [
      { name: 'Auto', value: Math.round(summary.auto.sales * 100) / 100, key: 'auto' },
      { name: 'Manual', value: Math.round(summary.manual.sales * 100) / 100, key: 'manual' },
    ].filter((d) => d.value > 0);

    const m = summary.manualBreakdown;
    const manualData = [
      { name: 'Broad', value: m.broad.spend, key: 'broad' },
      { name: 'Phrase', value: m.phrase.spend, key: 'phrase' },
      { name: 'Exact', value: m.exact.spend, key: 'exact' },
      { name: 'Product Targeting', value: m.productTargeting.spend, key: 'productTargeting' },
    ].filter((d) => d.value > 0);

    const manualDataSales = [
      { name: 'Broad', value: m.broad.sales, key: 'broad' },
      { name: 'Phrase', value: m.phrase.sales, key: 'phrase' },
      { name: 'Exact', value: m.exact.sales, key: 'exact' },
      { name: 'Product Targeting', value: m.productTargeting.sales, key: 'productTargeting' },
    ].filter((d) => d.value > 0);

    return {
      rootData: { spend: rootData, sales: rootDataSales },
      manualData: { spend: manualData, sales: manualDataSales },
    };
  }, [state.store.keywordMetrics]);

  const showDrill = drillChart !== null;
  const spendData = showDrill ? (drillChart === 'spend' ? manualData.spend : manualData.sales) : [];
  const total = spendData.reduce((s, d) => s + d.value, 0);

  if (rootData.spend.length === 0 && rootData.sales.length === 0) {
    return (
      <div className="h-[240px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No targeting type data. Upload SP Targeting / keyword data to enable this.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">
        {showDrill ? 'Manual — ' + (drillChart === 'spend' ? 'Ad Spend' : 'Ad Sales') : 'Targeting Type'}
      </h3>
      {showDrill ? (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={spendData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {spendData.map((_, i) => (
                  <Cell key={i} fill={MANUAL_COLORS[i % MANUAL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v.toFixed(2), total > 0 ? `${((v / total) * 100).toFixed(1)}%` : '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <button
            type="button"
            onClick={() => setDrillChart(null)}
            className="mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            ← Back to Auto / Manual
          </button>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Ad Spend</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={rootData.spend}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  onClick={(entry) => entry?.key === 'manual' && rootData.spend.some((d) => d.key === 'manual') && setDrillChart('spend')}
                >
                  {rootData.spend.map((d, i) => (
                    <Cell key={d.key} fill={d.key === 'auto' ? COLOR_AUTO : COLOR_MANUAL} style={{ cursor: d.key === 'manual' ? 'pointer' : undefined }} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Ad Sales</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={rootData.sales}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  onClick={(entry) => entry?.key === 'manual' && rootData.sales.some((d) => d.key === 'manual') && setDrillChart('sales')}
                >
                  {rootData.sales.map((d, i) => (
                    <Cell key={d.key} fill={d.key === 'auto' ? COLOR_AUTO : COLOR_MANUAL} style={{ cursor: d.key === 'manual' ? 'pointer' : undefined }} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
