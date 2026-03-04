'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

export default function SpendByCampaignBar() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    return Object.values(state.store.campaignMetrics)
      .filter((m) => m.campaignName)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)
      .map((m) => ({ name: m.campaignName.length > 12 ? m.campaignName.slice(0, 12) + '…' : m.campaignName, spend: m.spend }));
  }, [state.store.campaignMetrics]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Spend by Campaign (Top 10)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} />
          <YAxis type="category" dataKey="name" width={80} stroke="var(--color-text-muted)" fontSize={10} />
          <Tooltip formatter={(v: number) => v.toFixed(2)} />
          <Bar dataKey="spend" fill="#22d3ee" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
