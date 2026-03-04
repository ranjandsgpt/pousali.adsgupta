'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatPercent } from '../utils/formatNumber';

function acosColor(acos: number): string {
  if (acos <= 15) return 'bg-emerald-500/30 text-emerald-400';
  if (acos <= 30) return 'bg-cyan-500/20 text-cyan-400';
  if (acos <= 50) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
}

export default function ACOSHeatmap() {
  const { state } = useAuditStore();
  const rows = useMemo(() => {
    return Object.values(state.store.campaignMetrics)
      .filter((m) => m.campaignName)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 15)
      .map((m) => ({
        campaign: m.campaignName,
        acos: m.acos,
        spend: m.spend,
        sales: m.sales,
      }));
  }, [state.store.campaignMetrics]);

  if (rows.length === 0) {
    return (
      <div className="h-[200px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No campaign ACOS data
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">ACOS by Campaign (Heatmap)</h3>
      <div className="overflow-x-auto pr-2">
        <table className="w-full text-sm min-w-0">
          <thead>
            <tr className="text-left text-[var(--color-text-muted)] border-b border-white/10">
              <th className="pb-2 font-medium">Campaign</th>
              <th className="pb-2 font-medium text-right min-w-[4.5rem]">ACOS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-2 text-[var(--color-text)] max-w-[180px] truncate" title={r.campaign}>
                  {r.campaign}
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded ${acosColor(r.acos)}`}>
                    {formatPercent(r.acos)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
