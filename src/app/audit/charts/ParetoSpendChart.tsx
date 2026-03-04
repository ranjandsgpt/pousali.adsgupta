'use client';

import { useMemo } from 'react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

/** Section 34: Pareto (80/20) spend distribution – cumulative % of spend. */
export default function ParetoSpendChart() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    const list = Object.values(state.store.keywordMetrics)
      .filter((m) => m.spend > 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 15);
    const total = list.reduce((s, m) => s + m.spend, 0);
    let cum = 0;
    return list.map((m, i) => {
      cum += m.spend;
      return {
        name: (m.searchTerm || '—').slice(0, 10) + (m.searchTerm && m.searchTerm.length > 10 ? '…' : ''),
        spend: Math.round(m.spend * 100) / 100,
        cumulativePct: total > 0 ? Math.round((cum / total) * 1000) / 10 : 0,
      };
    });
  }, [state.store.keywordMetrics]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Pareto Spend (80/20)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ left: 4, right: 30, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tick={{ fontSize: 9 }} />
          <YAxis yAxisId="left" stroke="var(--color-text-muted)" fontSize={10} />
          <YAxis yAxisId="right" orientation="right" stroke="var(--color-text-muted)" fontSize={10} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v: number, name: string) => (name === 'cumulativePct' ? `${String(v)}%` : Number(v).toFixed(2))} />
          <Bar yAxisId="left" dataKey="spend" fill="#22d3ee" radius={[2, 2, 0, 0]} name="Spend" />
          <Line yAxisId="right" type="monotone" dataKey="cumulativePct" stroke="#a78bfa" strokeWidth={2} dot={false} name="Cumulative %" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
