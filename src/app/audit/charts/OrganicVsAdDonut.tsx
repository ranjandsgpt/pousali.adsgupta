'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

const COLORS = ['#34d399', '#22d3ee'];

export default function OrganicVsAdDonut() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    const m = state.store.storeMetrics;
    const organic = m.organicSales >= 0 ? m.organicSales : 0;
    const ad = m.totalAdSales ?? 0;
    if (organic === 0 && ad === 0) return [];
    return [
      { name: 'Organic Sales', value: Math.round(organic * 100) / 100 },
      { name: 'Ad Sales', value: Math.round(ad * 100) / 100 },
    ].filter((d) => d.value > 0);
  }, [state.store.storeMetrics]);

  if (data.length === 0) {
    return (
      <div className="h-[240px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No organic vs ad data
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Organic vs Ad Sales (Halo Effect)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toFixed(2)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
