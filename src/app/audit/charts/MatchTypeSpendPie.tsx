'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

const MATCH_COLORS = { exact: '#22d3ee', phrase: '#a78bfa', broad: '#f472b6', auto: '#94a3b8' };
const MATCH_ORDER = ['exact', 'phrase', 'broad', 'auto'];

export default function MatchTypeSpendPie() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    const byMatch: Record<string, number> = {};
    for (const kw of Object.values(state.store.keywordMetrics)) {
      const m = (kw.matchType || 'other').toLowerCase();
      const key = MATCH_ORDER.includes(m) ? m : 'broad';
      byMatch[key] = (byMatch[key] ?? 0) + kw.spend;
    }
    return MATCH_ORDER.map((name) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round((byMatch[name] ?? 0) * 100) / 100,
    })).filter((d) => d.value > 0);
  }, [state.store.keywordMetrics]);

  if (data.length === 0) {
    return (
      <div className="h-[240px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No match type spend data
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Match Type Spend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={MATCH_COLORS[data[i].name.toLowerCase() as keyof typeof MATCH_COLORS] ?? '#64748b'} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toFixed(2)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
