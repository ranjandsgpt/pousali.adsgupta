'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import { FileDown, FileText, RotateCcw } from 'lucide-react';
import { exportAuditPdf } from '../utils/exportPdf';
import { exportAuditDocx } from '../utils/exportDocx';

const DISPLAY_NAMES: Record<string, string> = {
  spend: 'Spend', sales: 'Sales', clicks: 'Clicks', impressions: 'Impressions', orders: 'Orders',
  campaignName: 'Campaign', adGroup: 'Ad Group', matchType: 'Match Type', asin: 'ASIN', sessions: 'Sessions',
  date: 'Date', budget: 'Daily Budget', pageViews: 'Page Views', acos: 'ACOS', roas: 'ROAS',
  tacos: 'TACOS', ctr: 'CTR', cvr: 'CVR', conversion: 'Conversion', buybox: 'Buy Box %', currency: 'Currency',
  other: 'Other',
};

interface AuditSummaryBlockProps {
  onRerunAnalysis: () => void;
}

/** Single block under page: title, health score, summary cards, detected (and missing) metrics. */
export default function AuditSummaryBlock({ onRerunAnalysis }: AuditSummaryBlockProps) {
  const { state } = useAuditStore();
  const { store } = state;

  const { healthScore, healthLabel, criticalCount, summaryCards } = useMemo(() => {
    const acos = store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : null;
    const roas = state.blendedROAS;
    const tacos = state.globalTACOS;
    const kws = Object.values(store.keywordMetrics);
    const bleeding = kws.filter((k) => k.spend > 0 && k.sales === 0).length;
    const campaigns = Object.values(store.campaignMetrics);
    const highAcosCamp = campaigns.filter((c) => c.acos > 30 && c.sales > 0).length;
    const criticalCount = bleeding + highAcosCamp;

    let score = 70;
    if (acos != null) {
      if (acos > 60) score -= 30;
      else if (acos > 30) score -= 15;
      else if (acos < 20) score += 10;
    }
    if (roas >= 4) score += 10;
    else if (roas < 1.5) score -= 20;
    if (tacos > 25) score -= 15;
    if (criticalCount > 10) score -= 15;
    else if (criticalCount > 0) score -= 5;
    const healthScore = Math.max(0, Math.min(100, score));
    const healthLabel = healthScore >= 70 ? 'Good' : healthScore >= 40 ? 'Caution' : 'Critical';

    const sym = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';
    const cards = [
      { label: 'Critical Issues', value: String(criticalCount), sub: '', status: criticalCount > 0 ? 'red' : 'green' },
      { label: 'Total Ad Spend', value: store.totalAdSpend > 0 ? formatCurrency(store.totalAdSpend, store.currency) : '—', sub: '', status: 'blue' as const },
      { label: 'Total Ad Sales', value: store.totalAdSales > 0 ? formatCurrency(store.totalAdSales, store.currency) : '—', sub: '', status: 'blue' as const },
      { label: 'ROAS', value: roas > 0 ? `${roas.toFixed(2)}×` : '—', sub: '', status: roas >= 3 ? 'green' : roas >= 1.5 ? 'orange' : 'red' },
      { label: 'ACOS', value: acos != null ? formatPercent(acos) : '—', sub: '', status: acos != null ? (acos > 60 ? 'red' : acos > 30 ? 'orange' : 'green') : 'blue' },
    ];
    return { healthScore, healthLabel, criticalCount, summaryCards: cards };
  }, [store, state.blendedROAS, state.globalTACOS]);

  const detectedTags = useMemo(() => {
    const columns = Array.from(store.uniqueColumns).filter((c) => c !== 'other');
    return columns.length > 0 ? columns : ['impressions', 'clicks', 'orders', 'spend', 'sales', 'sessions', 'roas', 'acos', 'pageViews'];
  }, [store.uniqueColumns]);

  const missingTags = useMemo(() => {
    const out: string[] = [];
    if (store.totalSessions <= 0 && Object.values(store.asinMetrics).every((a) => !a.sessions)) out.push('Sessions');
    if ((store.buyBoxPercent ?? 0) <= 0) out.push('Buy Box %');
    if (store.storeMetrics.breakEvenAcos === 0 && store.storeMetrics.contributionMargin === 0) out.push('Profit Margin');
    return out;
  }, [store]);

  const handlePdf = () => exportAuditPdf(store);
  const handleWord = async () => await exportAuditDocx(store);
  const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;

  const cardStatusClass = {
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    orange: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  };

  return (
    <section
      aria-label="Audit summary and detected metrics"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
          Amazon Advertising Performance Audit
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRerunAnalysis}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 font-medium text-sm hover:bg-blue-500/30"
            aria-label="Rerun analysis"
          >
            <RotateCcw size={18} aria-hidden />
            Rerun Analysis
          </button>
          <button
            type="button"
            onClick={handleWord}
            disabled={!hasData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 font-medium text-sm hover:bg-purple-500/30 disabled:opacity-50"
            aria-label="Download Word"
          >
            <FileText size={18} aria-hidden />
            Download Word
          </button>
          <button
            type="button"
            onClick={handlePdf}
            disabled={!hasData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 font-medium text-sm hover:bg-purple-500/30 disabled:opacity-50"
            aria-label="Download PDF"
          >
            <FileDown size={18} aria-hidden />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className={`rounded-xl border p-4 ${healthScore >= 70 ? 'bg-emerald-500/20 border-emerald-500/40' : healthScore >= 40 ? 'bg-amber-500/20 border-amber-500/40' : 'bg-red-500/20 border-red-500/40'}`}>
          <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">Health Score</p>
          <p className="text-2xl font-bold tabular-nums">{healthScore}</p>
          <p className="text-xs mt-1 opacity-90">{healthLabel}</p>
        </div>
        {summaryCards.map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 ${cardStatusClass[c.status]}`}>
            <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">{c.label}</p>
            <p className="text-lg font-bold tabular-nums">{c.value}</p>
            {c.sub && <p className="text-xs mt-1 opacity-75">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">
          Detected metrics ({detectedTags.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {detectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30"
            >
              {DISPLAY_NAMES[tag] ?? tag}
            </span>
          ))}
        </div>
      </div>

      {missingTags.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Missing for full analysis</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {missingTags.map((label) => (
              <span
                key={label}
                className="inline-flex px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/40"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Upload Business Report to unlock these insights.
          </p>
        </div>
      )}
    </section>
  );
}
