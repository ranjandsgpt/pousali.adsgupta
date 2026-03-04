'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

/** Single-period trend when no daily data: show Spend vs Sales as one point. */
export default function DailyTrendLine() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    const s = state.store;
    if (s.totalAdSpend === 0 && s.totalStoreSales === 0) return [];
    return [
      {
        period: 'Total',
        spend: Math.round(s.totalAdSpend * 100) / 100,
        sales: Math.round(s.totalStoreSales * 100) / 100,
      },
    ];
  }, [state.store]);

  if (data.length === 0) {
    return (
      <div className="h-[240px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No trend data. Add reports with date column for daily breakdown.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Spend vs Sales (Trend)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="period" stroke="var(--color-text-muted)" fontSize={12} />
          <YAxis stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(v) => String(v)} />
          <Tooltip formatter={(v: number) => v.toFixed(2)} />
          <Legend />
          <Line type="monotone" dataKey="spend" stroke="#22d3ee" name="Spend" strokeWidth={2} dot />
          <Line type="monotone" dataKey="sales" stroke="#a78bfa" name="Sales" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
