'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

export default function ROASByCampaignBar() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    return Object.values(state.store.campaignMetrics)
      .filter((m) => m.campaignName && m.spend > 0)
      .map((m) => ({ name: m.campaignName!.length > 10 ? m.campaignName!.slice(0, 10) + '…' : m.campaignName!, roas: m.sales / m.spend }))
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 10);
  }, [state.store.campaignMetrics]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">ROAS by Campaign (Top 10)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 4, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tick={{ fontSize: 9 }} />
          <YAxis stroke="var(--color-text-muted)" fontSize={11} tickFormatter={(v) => v.toFixed(1) + '×'} />
          <Tooltip formatter={(v: number) => v.toFixed(2) + '×'} />
          <Bar dataKey="roas" fill="#a78bfa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
