'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6'];

/** Infer SP / SB / SD from campaign name; else "Other". */
function inferAdProduct(campaignName: string): 'SP' | 'SB' | 'SD' | 'Other' {
  const c = (campaignName || '').toLowerCase();
  if (c.includes('sponsored products') || c.includes('sp ') || c === 'sp') return 'SP';
  if (c.includes('sponsored brands') || c.includes('sb ') || c === 'sb') return 'SB';
  if (c.includes('sponsored display') || c.includes('sd ') || c === 'sd') return 'SD';
  return 'Other';
}

export default function AdProductSalesPie() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    const byProduct: Record<string, number> = { SP: 0, SB: 0, SD: 0, Other: 0 };
    for (const kw of Object.values(state.store.keywordMetrics)) {
      const p = inferAdProduct(kw.campaign);
      byProduct[p] = (byProduct[p] ?? 0) + kw.sales;
    }
    return Object.entries(byProduct)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [state.store.keywordMetrics]);

  if (data.length === 0) {
    return (
      <div className="h-[240px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No ad product sales data
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Ad Product Sales (SP / SB / SD)</h3>
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
