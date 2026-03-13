'use client';

import { useMemo, useCallback } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';
import { MetricFeedbackButtons } from './MetricFeedbackButtons';
import type { OverrideSuggestion } from '@/services/feedbackLearningEngine';

/** KPI Summary: 10 key metrics in order, with green / orange / red coding. */
const METRIC_ORDER: Array<{
  id: string;
  label: string;
  status: (store: ReturnType<typeof useAuditStore>['state'], derived: DerivedMetrics) => 'green' | 'orange' | 'red' | 'blue';
  value: (store: ReturnType<typeof useAuditStore>['state'], derived: DerivedMetrics) => string;
}> = [
  {
    id: 'spend',
    label: 'Total Ad Spend',
    status: (s, d) => (d.totalAdSpend > 0 ? 'blue' : 'blue'),
    value: (s, d) => (d.totalAdSpend > 0 ? formatCurrency(d.totalAdSpend, s.store.currency) : '—'),
  },
  {
    id: 'sales',
    label: 'Total Ad Sales',
    status: () => 'blue',
    value: (s, d) => (d.totalAdSales > 0 ? formatCurrency(d.totalAdSales, s.store.currency) : '—'),
  },
  {
    id: 'roas',
    label: 'ROAS',
    status: (s, d) => (d.roas >= 4 ? 'green' : d.roas >= 2 ? 'orange' : d.roas > 0 ? 'red' : 'blue'),
    value: (s, d) => (d.roas > 0 ? `${d.roas.toFixed(2)}×` : '—'),
  },
  {
    id: 'acos',
    label: 'ACOS',
    status: (s, d) =>
      d.acos == null ? 'blue' : d.acos > 60 ? 'red' : d.acos > 30 ? 'orange' : 'green',
    value: (s, d) => (d.acos != null ? formatPercent(d.acos) : '—'),
  },
  {
    id: 'tacos',
    label: 'TACOS',
    status: (s, d) => (d.tacos > 0 ? (d.tacos <= 10 ? 'green' : d.tacos <= 25 ? 'orange' : 'red') : 'blue'),
    value: (s, d) => (d.tacos > 0 ? formatPercent(d.tacos) : '—'),
  },
  {
    id: 'ctr',
    label: 'CTR',
    status: (s, d) => (d.ctr != null ? (d.ctr >= 0.5 ? 'green' : d.ctr >= 0.2 ? 'orange' : 'blue') : 'blue'),
    value: (s, d) => (d.ctr != null ? formatPercent(d.ctr) : '—'),
  },
  {
    id: 'cvr',
    label: 'CVR',
    status: (s, d) =>
      d.cvr != null ? (d.cvr >= 10 ? 'green' : d.cvr >= 4 ? 'orange' : 'red') : 'blue',
    value: (s, d) => (d.cvr != null ? formatPercent(d.cvr) : '—'),
  },
  {
    id: 'orders',
    label: 'Orders',
    status: () => 'blue',
    value: (s, d) => (d.totalOrders > 0 ? d.totalOrders.toLocaleString() : '—'),
  },
  {
    id: 'cpc',
    label: 'CPC',
    status: () => 'blue',
    value: (s, d) => (d.cpc != null && d.cpc > 0 ? formatCurrency(d.cpc, s.store.currency) : '—'),
  },
  {
    id: 'impressions',
    label: 'Impressions',
    status: () => 'blue',
    value: (s, d) => (d.totalImpressions > 0 ? d.totalImpressions.toLocaleString() : '—'),
  },
];

type DerivedMetrics = {
  totalAdSpend: number;
  totalAdSales: number;
  totalOrders: number;
  totalImpressions: number;
  totalClicks: number;
  acos: number | null;
  roas: number;
  tacos: number; // as percentage 0–100
  ctr: number | null;
  cvr: number | null;
  cpc: number | null;
};

export default function KPISummarySection() {
  const { state, setStore } = useAuditStore();
  const { store } = state;
  const overrides = state.learnedOverrides?.overrides;

  const { derived, canonical } = useMemo(() => {
    const m = store.aggregatedMetrics;
    if (m) {
      const derivedFromAgg: DerivedMetrics = {
        totalAdSpend: m.adSpend,
        totalAdSales: m.adSales,
        totalOrders: m.adOrders,
        totalImpressions: m.adImpressions,
        totalClicks: m.adClicks,
        acos: m.acos != null ? m.acos * 100 : null,
        roas: m.roas ?? 0,
        tacos: m.tacos != null ? m.tacos * 100 : 0,
        ctr: m.ctr != null ? m.ctr * 100 : null,
        cvr: m.adCvr != null ? m.adCvr * 100 : null,
        cpc: m.cpc ?? null,
      };
      const canonicalFromAgg = {
        totalSales: m.totalStoreSales,
        totalAdSpend: m.adSpend,
        totalAdSales: m.adSales,
        totalAdOrders: m.adOrders,
        totalClicks: m.adClicks,
        totalImpressions: m.adImpressions,
        acos: m.acos ?? 0,
        roas: m.roas ?? 0,
        tacos: m.tacos ?? 0,
        cvr: m.adCvr ?? 0,
        totalOrders: m.adOrders,
      };
      return { derived: derivedFromAgg, canonical: canonicalFromAgg };
    }
    const canonical = executeMetricEngineForStore(store, overrides);
    const totalClicks =
      canonical.totalClicks > 0
        ? canonical.totalClicks
        : store.totalClicks > 0
          ? store.totalClicks
          : Object.values(store.keywordMetrics).reduce((s, m) => s + m.clicks, 0);
    const cvr = canonical.cvr > 0 ? canonical.cvr * 100 : null;

    const derived: DerivedMetrics = {
      totalAdSpend: canonical.totalAdSpend,
      totalAdSales: canonical.totalAdSales,
      totalOrders: canonical.totalAdOrders ?? store.totalOrders ?? 0,
      totalImpressions: canonical.totalImpressions || (totalClicks > 0 ? totalClicks * 50 : 0),
      totalClicks,
      acos: canonical.acos * 100,
      roas: canonical.roas,
      tacos: canonical.tacos * 100,
      ctr: canonical.ctr > 0 ? canonical.ctr * 100 : null,
      cvr,
      cpc: canonical.cpc > 0 ? canonical.cpc : totalClicks > 0 ? store.totalAdSpend / totalClicks : null,
    };
    return { derived, canonical };
  }, [store, overrides]);

  const feedbackSnapshot = useMemo(
    () => ({
      fileHeaders: Array.from(store.uniqueColumns),
      currentMetrics: {
        totalSales: canonical.totalSales,
        acos: canonical.acos * 100,
        tacos: canonical.tacos * 100,
        totalAdSpend: canonical.totalAdSpend,
        totalAdSales: canonical.totalAdSales,
        totalOrders: canonical.totalOrders,
      },
      reportTypes: store.files.map((f) => f.type),
    }),
    [store, canonical]
  );

  const handleOverrideSuggestion = useCallback(
    (suggestion: OverrideSuggestion) => {
      setStore(store, {
        overrides: {
          sanitizeCurrency: suggestion.sanitizeCurrency,
          preferredReport: suggestion.preferredReport,
          overrideSalesColumn: suggestion.overrideSalesColumn,
        },
        reasoning: suggestion.reasoning,
      });
    },
    [store, setStore]
  );

  const statusClass = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    orange: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  };

  return (
    <section
      aria-labelledby="kpi-summary-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="kpi-summary-heading" className="text-sm font-semibold text-[var(--color-text)] mb-4">
        1. KPI Summary
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {METRIC_ORDER.map((m) => {
          const status = m.status(state, derived);
          const value = m.value(state, derived);
          return (
            <div
              key={m.id}
              className={`rounded-xl border p-4 ${statusClass[status]}`}
            >
              <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">{m.label}</p>
              <p className="text-lg font-bold tabular-nums">{value}</p>
            </div>
          );
        })}
      </div>
      {(store.totalAdSpend > 0 || store.totalStoreSales > 0) && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Are these metrics correct?</span>
          <MetricFeedbackButtons
            metricId="kpi-summary-section"
            value="KPI Summary"
            artifactType="metrics"
            feedbackSnapshot={feedbackSnapshot}
            onOverrideSuggestion={handleOverrideSuggestion}
          />
        </div>
      )}
    </section>
  );
}
