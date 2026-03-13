'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6'];

/** Infer SP / SB / SD from campaign name. Unclassified rows are pro-rated into SP/SB/SD. */
function inferAdProduct(campaignName: string): 'SP' | 'SB' | 'SD' | 'unclassified' {
  const c = (campaignName || '').toLowerCase();
  if (c.includes('sponsored products') || c.includes('sp ')) return 'SP';
  if (c.includes('sponsored brands') || c.includes('sb ') || c.includes('hsa') || c.includes('headline')) return 'SB';
  if (c.includes('sponsored display') || c.includes('sd ')) return 'SD';
  return 'unclassified';
}

export default function AdProductSalesPie() {
  const { state } = useAuditStore();
  const data = useMemo(() => {
    let sp = 0;
    let sb = 0;
    let sd = 0;
    let unclassified = 0;
    const unclassifiedSamples: string[] = [];

    for (const kw of Object.values(state.store.keywordMetrics)) {
      const cls = inferAdProduct(kw.campaign);
      const sales = kw.sales;
      if (!sales || sales <= 0) continue;
      if (cls === 'SP') sp += sales;
      else if (cls === 'SB') sb += sales;
      else if (cls === 'SD') sd += sales;
      else {
        unclassified += sales;
        if (unclassifiedSamples.length < 20) {
          unclassifiedSamples.push(kw.campaign || '');
        }
      }
    }

    const baseTotal = sp + sb + sd;
    if (unclassified > 0 && baseTotal > 0) {
      const ratioSp = sp / baseTotal;
      const ratioSb = sb / baseTotal;
      const ratioSd = sd / baseTotal;
      sp += unclassified * ratioSp;
      sb += unclassified * ratioSb;
      sd += unclassified * ratioSd;
      // eslint-disable-next-line no-console
      console.warn('[AdProductSalesPie] Unclassified campaigns prorated into SP/SB/SD', {
        unclassifiedSales: unclassified,
        sample: unclassifiedSamples,
      });
    } else if (unclassified > 0 && baseTotal === 0) {
      // eslint-disable-next-line no-console
      console.warn('[AdProductSalesPie] All campaigns unclassified for SP/SB/SD inference', {
        unclassifiedSales: unclassified,
        sample: unclassifiedSamples,
      });
    }

    const byProduct: Record<string, number> = { SP: sp, SB: sb, SD: sd };

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
      <p className="text-[10px] text-[var(--color-text-muted)] mb-1">
        SP = Sponsored Products · SB = Sponsored Brands (incl. video) · SD = Sponsored Display
      </p>
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
