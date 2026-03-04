'use client';

import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

/** Section 34: Spend vs ROAS (conversion efficiency) scatter. */
export default function SpendVsConversionScatter() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    return Object.values(state.store.keywordMetrics)
      .filter((m) => m.spend > 0 && m.sales >= 0)
      .map((m) => ({
        x: Math.round(m.spend * 100) / 100,
        y: m.sales > 0 ? Math.round((m.sales / m.spend) * 100) / 100 : 0,
        z: m.clicks,
        name: (m.searchTerm || '—').slice(0, 12),
      }))
      .slice(0, 100);
  }, [state.store.keywordMetrics]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Spend vs ROAS (efficiency)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" dataKey="x" name="Spend" stroke="var(--color-text-muted)" fontSize={10} />
          <YAxis type="number" dataKey="y" name="ROAS" stroke="var(--color-text-muted)" fontSize={10} />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Clicks" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number, name: string) => (name === 'ROAS' ? `${v}×` : v)} />
          <Scatter data={data} fill="#22d3ee" fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
