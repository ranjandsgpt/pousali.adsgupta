'use client';

import { useState } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';

/** Aggregated payload for /api/generate-insights — no raw keywords or PII. */
interface GenerateInsightsBody {
  totalSales?: number;
  totalAdSpend?: number;
  tacos?: number;
  acos?: number;
  roas?: number;
  topBleedingKeywords?: Array<{ spend: number; sales: number }>;
  topOpportunities?: Array<{ roas?: number; acos?: number }>;
  summaryTables?: Record<string, unknown>;
}

const BLEEDER_CLICKS_MIN = 10;
const LOW_ACOS_THRESHOLD = 15;
const HIGH_ROAS_THRESHOLD = 5;

export default function GeminiInsightsPanel() {
  const { state } = useAuditStore();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = state.store;
  const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;

  const buildPayload = (): GenerateInsightsBody => {
    const m = store.storeMetrics;
    const keywords = Object.values(store.keywordMetrics);
    const bleeders = keywords
      .filter((k) => k.clicks >= BLEEDER_CLICKS_MIN && k.sales === 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 15)
      .map((k) => ({ spend: k.spend, sales: k.sales }));
    const opportunities = keywords
      .filter((k) => k.sales > 0 && k.acos > 0 && k.acos < LOW_ACOS_THRESHOLD)
      .sort((a, b) => a.acos - b.acos)
      .slice(0, 15)
      .map((k) => ({ roas: k.roas, acos: k.acos }));
    return {
      totalSales: store.totalStoreSales,
      totalAdSpend: store.totalAdSpend,
      tacos: m.tacos,
      acos: store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : undefined,
      roas: m.roas,
      topBleedingKeywords: bleeders,
      topOpportunities: opportunities,
      summaryTables: {
        keywordCount: keywords.length,
        bleederCount: bleeders.length,
        opportunityCount: opportunities.length,
      },
    };
  };

  const handleGenerate = async () => {
    setError(null);
    setInsight(null);
    setLoading(true);
    try {
      const res = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate insights');
        return;
      }
      setInsight(data.insight ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (!hasData) return null;

  return (
    <section
      aria-labelledby="gemini-insights-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="gemini-insights-heading" className="text-lg font-semibold text-[var(--color-text)] mb-3">
        AI audit narrative
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Uses aggregated metrics only (no raw keywords). Gemini generates strategy and recommendations.
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      >
        {loading ? 'Generating…' : 'Generate insights'}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {insight && (
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-[var(--color-text)] whitespace-pre-wrap">
          {insight}
        </div>
      )}
    </section>
  );
}
