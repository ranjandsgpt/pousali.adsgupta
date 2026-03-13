'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';
import { classifyKeyword } from '../utils/keywordClassifier';

const COLOR_BRANDED = '#1A3FAA';
const COLOR_GENERIC = '#2563EB';
const COLOR_COMPETITOR = '#EA580C';

export default function KeywordIntentPieCharts() {
  const { state } = useAuditStore();
  const brandNames = useMemo(() => (state.store as unknown as { brandNames?: string[] }).brandNames ?? [], [state.store]);
  const competitorTerms = useMemo(() => (state.store as unknown as { competitorBrands?: string[] }).competitorBrands ?? [], [state.store]);
  const hasBrandConfig = brandNames.length > 0 || competitorTerms.length > 0;

  const { spendData, salesData } = useMemo(() => {
    const byIntent: Record<string, { spend: number; sales: number }> = {
      Branded: { spend: 0, sales: 0 },
      Generic: { spend: 0, sales: 0 },
      Competitor: { spend: 0, sales: 0 },
    };
    const opts = { brandNames, competitorTerms };
    for (const kw of Object.values(state.store.keywordMetrics)) {
      const tag = classifyKeyword(kw.searchTerm, opts);
      byIntent[tag].spend += kw.spend;
      byIntent[tag].sales += kw.sales;
    }
    const spendData = ['Branded', 'Generic', 'Competitor']
      .map((name) => ({ name, value: Math.round(byIntent[name].spend * 100) / 100 }))
      .filter((d) => d.value > 0);
    const salesData = ['Branded', 'Generic', 'Competitor']
      .map((name) => ({ name, value: Math.round(byIntent[name].sales * 100) / 100 }))
      .filter((d) => d.value > 0);
    return { spendData, salesData };
  }, [state.store.keywordMetrics, brandNames, competitorTerms]);

  const colorMap: Record<string, string> = { Branded: COLOR_BRANDED, Generic: COLOR_GENERIC, Competitor: COLOR_COMPETITOR };

  if (spendData.length === 0 && salesData.length === 0) {
    return (
      <div className="h-[240px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No keyword data. Upload reports to enable keyword intent analysis.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Keyword Intent</h3>
      {!hasBrandConfig && (
        <p className="text-xs text-amber-500/90 mb-2 rounded bg-amber-500/10 px-2 py-1">
          Configure brand terms to enable Branded vs Competitor classification. Showing all as Generic.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Ad Spend</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={spendData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value" nameKey="name">
                {spendData.map((d, i) => (
                  <Cell key={d.name} fill={colorMap[d.name] ?? COLOR_GENERIC} />
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
              <Pie data={salesData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value" nameKey="name">
                {salesData.map((d, i) => (
                  <Cell key={d.name} fill={colorMap[d.name] ?? COLOR_GENERIC} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toFixed(2)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
