'use client';

import { useState } from 'react';
import type { KPIMetric, PatternDetection, OpportunityDetection, TabTableConfig, RowActionType } from './types';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import type { DetectedCurrency } from '../utils/currencyDetector';
import { MetricFeedbackButtons } from '../components/MetricFeedbackButtons';
import type { FeedbackSnapshot, OverrideSuggestion } from '@/services/feedbackLearningEngine';

export interface VerificationMeta {
  confidencePercent: number;
  source: 'slm' | 'gemini';
}

const actionLabels: Record<RowActionType, string> = {
  negative: 'Add as Negative',
  optimize: 'Optimize',
  deactivate: 'Deactivate',
  scale: 'Scale',
  monitor: 'Monitor',
  view: 'View',
};

function actionButtonClass(type: RowActionType): string {
  switch (type) {
    case 'negative': return 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30';
    case 'optimize': return 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30';
    case 'deactivate': return 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30';
    case 'scale': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30';
    case 'monitor': return 'bg-sky-500/20 text-sky-400 border-sky-500/40 hover:bg-sky-500/30';
    case 'view': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30';
    default: return 'bg-white/10 text-[var(--color-text)] border-white/20';
  }
}

export function TabKPISummary({
  metrics,
  currency,
  verificationMeta,
  showFeedback = false,
  feedbackSnapshot,
  onOverrideSuggestion,
}: {
  metrics: KPIMetric[];
  currency: DetectedCurrency;
  verificationMeta?: VerificationMeta;
  showFeedback?: boolean;
  feedbackSnapshot?: FeedbackSnapshot;
  onOverrideSuggestion?: (suggestion: OverrideSuggestion) => void;
}) {
  if (metrics.length === 0) return null;
  return (
    <section className="border border-[#1f2937] rounded-xl p-3 sm:p-4 bg-[#111827]">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">KPI Summary</h3>
      {verificationMeta && (
        <p className="text-xs text-[var(--color-text-muted)] mb-2">
          Confidence: {verificationMeta.confidencePercent}% · Source: {verificationMeta.source.toUpperCase()} · Validated
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {metrics.map((k, i) => {
          const statusCls =
            k.status === 'good'
              ? 'text-emerald-400'
              : k.status === 'warn'
                ? 'text-amber-400'
                : k.status === 'bad'
                  ? 'text-red-400'
                  : 'text-[var(--color-text)]';
          const metricId = `kpi-${String(k.label).replace(/\s+/g, '-').toLowerCase()}-${i}`;
          return (
            <div key={i} className="rounded-lg border border-[#1f2937] p-2 bg-[#020617]">
              <p className="text-xs text-[var(--color-text-muted)]">{k.label}</p>
              <p className={`text-sm font-semibold tabular-nums ${statusCls}`}>{k.value}</p>
              {k.sub && <p className="text-xs text-[var(--color-text-muted)]">{k.sub}</p>}
              {(showFeedback || verificationMeta) && (
                <MetricFeedbackButtons
                  metricId={metricId}
                  value={k.value}
                  artifactType="metrics"
                  feedbackSnapshot={feedbackSnapshot}
                  onOverrideSuggestion={onOverrideSuggestion}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TabPatternDetection({ patterns }: { patterns: PatternDetection[] }) {
  if (patterns.length === 0) return null;
  return (
    <section className="border border-[#1f2937] rounded-xl p-3 sm:p-4 bg-[#111827]">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Diagnostic patterns</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {patterns.map((p, i) => (
          <div
            key={i}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs shadow-sm"
          >
            <p className="font-medium text-[var(--color-text)]">{p.problemTitle}</p>
            <p className="text-[var(--color-text-muted)]">
              {p.entityType}: {p.entityName}
            </p>
            {Object.keys(p.metricValues).length > 0 && (
              <p className="text-[var(--color-text-muted)] mt-1">
                {Object.entries(p.metricValues)
                  .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
                  .join(' · ')}
              </p>
            )}
            {p.estimatedImpact && (
              <p className="text-amber-400 mt-1">Estimated impact: {p.estimatedImpact}</p>
            )}
            <p className="text-cyan-400 mt-1">Action: {p.recommendedAction}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TabOpportunityDetection({ opportunities }: { opportunities: OpportunityDetection[] }) {
  if (opportunities.length === 0) return null;
  return (
    <section className="border border-[#1f2937] rounded-xl p-3 sm:p-4 bg-[#111827]">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Growth opportunities</h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {opportunities.map((o, i) => (
          <div
            key={i}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs shadow-sm"
          >
            <p className="font-medium text-[var(--color-text)]">{o.title}</p>
            <p className="text-[var(--color-text-muted)]">
              {o.entityType}: {o.entityName}
            </p>
            {o.potentialGain && (
              <p className="text-emerald-400 mt-1">Potential: {o.potentialGain}</p>
            )}
            <p className="text-cyan-400 mt-1">Action: {o.recommendedAction}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TabDataTablesSection({
  tables,
  currency,
  onAction,
}: {
  tables: TabTableConfig[];
  currency: DetectedCurrency;
  onAction?: (tableTitle: string, row: Record<string, unknown>, actionType: RowActionType) => void;
}) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  if (tables.length === 0) return null;

  return (
    <section className="border border-[#1f2937] rounded-xl p-3 sm:p-4 bg-[#111827]">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Data tables</h3>
      <div className="space-y-3">
        {tables.map((t, idx) => {
          const isExpanded = expanded[idx] === true;
          const visibleRows = isExpanded ? t.rows : t.rows.slice(0, 10);
          return (
          <div key={idx}>
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">{t.title}</p>
            <div className="overflow-x-auto rounded-lg border border-[#1f2937] bg-[#020617]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1f2937] bg-[#020617]">
                    {t.columns.map((c) => (
                      <th
                        key={c.key}
                        className={`px-2 py-2 text-left font-medium text-[var(--color-text)] ${c.align === 'right' ? 'text-right' : ''}`}
                      >
                        {c.label}
                      </th>
                    ))}
                    {t.actionColumn && (
                      <th className="px-2 py-2 text-right font-medium text-[var(--color-text)]">{t.actionColumn.label}</th>
                    )}
                  </tr>
                </thead>
                  <tbody>
                    {visibleRows.map((row, ri) => (
                      <tr key={ri} className="border-b border-[#020617]">
                        {t.columns.map((c) => {
                          const raw = row[c.key];
                          const statusKey = c.key + 'Status';
                          const rowStatus = row[statusKey] as 'good' | 'warn' | 'bad' | undefined;
                          let cell: string | number = raw != null ? String(raw) : '—';
                          if (c.format === 'currency' && typeof raw === 'number')
                            cell = formatCurrency(raw, currency);
                          if (c.format === 'percent' && typeof raw === 'number')
                            cell = formatPercent(raw);
                          if (c.format === 'percentWithStatus') {
                            cell = raw != null && typeof raw === 'number' ? formatPercent(raw) : '—';
                          }
                          if (c.format === 'number' && typeof raw === 'number') cell = raw.toFixed(2);
                          const isStatus = c.key === 'status' && typeof raw === 'string';
                          const statusClass = isStatus
                            ? raw === 'Negative'
                              ? 'bg-red-500/20 text-red-400'
                              : raw === 'Scale'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : raw === 'Optimize'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-sky-500/20 text-sky-400'
                            : c.format === 'percentWithStatus' && rowStatus
                              ? rowStatus === 'good'
                                ? 'text-emerald-400'
                                : rowStatus === 'warn'
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                              : '';
                          const titleAttr = c.format === 'percentWithStatus' && raw == null ? 'Upload Business Report for TACoS' : undefined;
                          return (
                            <td
                              key={c.key}
                              title={titleAttr}
                              className={`px-2 py-1.5 text-[var(--color-text)] ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${statusClass}`}
                            >
                              {isStatus ? (
                                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusClass}`}>{cell}</span>
                              ) : (
                                cell
                              )}
                            </td>
                          );
                        })}
                        {t.actionColumn && (
                          <td className="px-2 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => onAction?.(t.title, row, t.actionColumn!.type)}
                              className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${actionButtonClass(t.actionColumn!.type)}`}
                            >
                              {actionLabels[t.actionColumn!.type]}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {t.rows.length > visibleRows.length && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [idx]: !isExpanded }))
                    }
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  );
}

export function TabVisualization({ children }: { children: React.ReactNode }) {
  return (
    <section className="border border-[#1f2937] rounded-xl p-3 sm:p-4 bg-[#111827]">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Charts Lab</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>
    </section>
  );
}
