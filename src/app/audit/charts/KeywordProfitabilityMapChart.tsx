'use client';

import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';
import { keywordProfitabilityMap } from '../engines';

const QUADRANT_COLORS: Record<string, string> = {
  Scale: '#22c55e',
  Optimize: '#eab308',
  Monitor: '#22d3ee',
  Pause: '#ef4444',
};

/** Engine 12: Keyword Profitability Map — CPC (X) vs ROAS (Y), quadrants Scale / Optimize / Monitor / Pause. */
export default function KeywordProfitabilityMapChart() {
  const { state } = useAuditStore();
  const { points, avgCpc, avgRoas } = useMemo(() => keywordProfitabilityMap(state.store), [state.store]);

  const data = useMemo(() => points.slice(0, 150).map((p) => ({
    x: Math.round(p.cpc * 100) / 100,
    y: Math.round(p.roas * 100) / 100,
    name: (p.keyword || '—').slice(0, 14),
    quadrant: p.quadrant,
    fill: QUADRANT_COLORS[p.quadrant] ?? '#64748b',
  })), [points]);

  if (data.length === 0) return null;

  const scaleData = data.filter((d) => d.quadrant === 'Scale');
  const optimizeData = data.filter((d) => d.quadrant === 'Optimize');
  const monitorData = data.filter((d) => d.quadrant === 'Monitor');
  const pauseData = data.filter((d) => d.quadrant === 'Pause');

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Keyword Profitability Map (CPC × ROAS)</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">Quadrants: Scale (high ROAS, low CPC) · Optimize (high ROAS, high CPC) · Monitor · Pause (no sales)</p>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" dataKey="x" name="CPC" stroke="var(--color-text-muted)" fontSize={10} />
          <YAxis type="number" dataKey="y" name="ROAS" stroke="var(--color-text-muted)" fontSize={10} />
          <ZAxis type="number" dataKey="y" range={[60, 400]} name="ROAS" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(v: number, name: string) => (name === 'ROAS' ? `${v}×` : v)}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div className="rounded bg-[var(--color-bg-elevated)] border border-white/10 px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium">{p.name}</div>
                  <div>CPC: {Number(p.x).toFixed(2)} · ROAS: {Number(p.y).toFixed(2)}×</div>
                  <div className="text-[var(--color-text-muted)]">{p.quadrant}</div>
                </div>
              );
            }}
          />
          <Legend formatter={(value) => value} />
          {scaleData.length > 0 && <Scatter data={scaleData} fill={QUADRANT_COLORS.Scale} name="Scale" fillOpacity={0.85} />}
          {optimizeData.length > 0 && <Scatter data={optimizeData} fill={QUADRANT_COLORS.Optimize} name="Optimize" fillOpacity={0.85} />}
          {monitorData.length > 0 && <Scatter data={monitorData} fill={QUADRANT_COLORS.Monitor} name="Monitor" fillOpacity={0.85} />}
          {pauseData.length > 0 && <Scatter data={pauseData} fill={QUADRANT_COLORS.Pause} name="Pause" fillOpacity={0.85} />}
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">Avg CPC: {avgCpc.toFixed(2)} · Avg ROAS: {avgRoas.toFixed(2)}×</p>
    </div>
  );
}
