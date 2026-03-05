'use client';

import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useAuditStore } from '../context/AuditStoreContext';
import { runDiagnosticEngines } from '../engines';

const QUAD_COLORS: Record<string, string> = {
  Scale: '#22c55e',
  Optimize: '#eab308',
  Monitor: '#3b82f6',
  Pause: '#ef4444',
};

/** Engine 12: Keyword Profitability Map – CPC vs ROAS quadrants (Scale, Optimize, Monitor, Pause). */
export default function KeywordProfitabilityMapChart() {
  const { state } = useAuditStore();
  const { points, avgCpc, avgRoas } = useMemo(() => {
    const result = runDiagnosticEngines(state.store);
    return result.keywordProfitabilityMap;
  }, [state.store]);

  const dataByQuad = useMemo(() => {
    const byQuad: Record<string, { name: string; cpc: number; roas: number; keyword: string }[]> = { Scale: [], Optimize: [], Monitor: [], Pause: [] };
    points.forEach((p) => {
      byQuad[p.quadrant] = byQuad[p.quadrant] || [];
      byQuad[p.quadrant].push({
        name: p.keyword.slice(0, 12) + (p.keyword.length > 12 ? '…' : ''),
        cpc: p.cpc,
        roas: p.roas,
        keyword: p.keyword,
      });
    });
    return byQuad;
  }, [points]);

  const scatterData = useMemo(() => {
    return [
      ...dataByQuad.Scale.map((d) => ({ ...d, quadrant: 'Scale' })),
      ...dataByQuad.Optimize.map((d) => ({ ...d, quadrant: 'Optimize' })),
      ...dataByQuad.Monitor.map((d) => ({ ...d, quadrant: 'Monitor' })),
      ...dataByQuad.Pause.map((d) => ({ ...d, quadrant: 'Pause' })),
    ].slice(0, 150);
  }, [dataByQuad]);

  if (scatterData.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Keyword Profitability Map (CPC × ROAS)</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">Quadrants: Scale (high ROAS, low CPC) · Optimize · Monitor · Pause</p>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" dataKey="cpc" name="CPC" stroke="var(--color-text-muted)" fontSize={10} />
          <YAxis type="number" dataKey="roas" name="ROAS" stroke="var(--color-text-muted)" fontSize={10} />
          <ReferenceLine x={avgCpc} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />
          <ReferenceLine y={avgRoas} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number, name: string) => (name === 'ROAS' ? `${Number(v).toFixed(2)}×` : v)} />
          {(['Scale', 'Optimize', 'Monitor', 'Pause'] as const).map((q) => (
            <Scatter key={q} name={q} data={scatterData.filter((d) => d.quadrant === q)} fill={QUAD_COLORS[q]} fillOpacity={0.7} />
          ))}
          <Legend />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
