'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

const BLEEDER_CLICKS_MIN = 10;

/** Section 34: Wasted spend bar chart (bleeding keywords). */
export default function WastedSpendBarChart() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    return Object.values(state.store.keywordMetrics)
      .filter((m) => m.clicks >= BLEEDER_CLICKS_MIN && m.sales === 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)
      .map((m) => ({
        name: (m.searchTerm || '—').length > 10 ? (m.searchTerm || '—').slice(0, 10) + '…' : (m.searchTerm || '—'),
        spend: Math.round(m.spend * 100) / 100,
      }));
  }, [state.store.keywordMetrics]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Wasted Spend (Top Bleeders)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} />
          <YAxis type="category" dataKey="name" width={90} stroke="var(--color-text-muted)" fontSize={10} />
          <Tooltip formatter={(v: number) => v.toFixed(2)} />
          <Bar dataKey="spend" fill="#f87171" radius={[0, 4, 4, 0]} name="Wasted Spend" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
