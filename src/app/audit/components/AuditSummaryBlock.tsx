'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { useDualEngine } from '../dualEngine/dualEngineContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import { FileDown, FileText, RotateCcw } from 'lucide-react';
import { exportAuditPdf } from '../utils/exportPdf';
import { exportAuditDocx } from '../utils/exportDocx';
import { computeHealthScore } from '../utils/healthScoreEngine';
import { runReportVerification } from '../utils/reportVerification';
import { validateMetrics } from '../utils/statisticalValidator';

const DISPLAY_NAMES: Record<string, string> = {
  spend: 'Spend', sales: 'Sales', clicks: 'Clicks', impressions: 'Impressions', orders: 'Orders',
  campaignName: 'Campaign', adGroup: 'Ad Group', matchType: 'Match Type', asin: 'ASIN', sessions: 'Sessions',
  date: 'Date', budget: 'Daily Budget', pageViews: 'Page Views', acos: 'ACOS', roas: 'ROAS',
  tacos: 'TACOS', ctr: 'CTR', cvr: 'CVR', conversion: 'Conversion', buybox: 'Buy Box %', currency: 'Currency',
  other: 'Other',
};

interface AuditSummaryBlockProps {
  onRerunAnalysis: () => void;
  onFocusCriticalIssues?: () => void;
}

type SummaryStatus = 'red' | 'orange' | 'green' | 'blue';

interface SummaryCard {
  label: string;
  value: string;
  sub?: string;
  status: SummaryStatus;
}

/** Single block under page: title, health score, summary cards, detected (and missing) metrics. */
export default function AuditSummaryBlock({ onRerunAnalysis, onFocusCriticalIssues }: AuditSummaryBlockProps) {
  const { state } = useAuditStore();
  const { store } = state;
  const dualEngine = useDualEngine();

  const { healthScore, healthLabel, criticalCount, summaryCards, confidenceScore, wastedSpendEstimate, statisticalValidation } = useMemo<{
      healthScore: number;
      healthLabel: string;
      criticalCount: number;
      summaryCards: SummaryCard[];
      confidenceScore: number;
      wastedSpendEstimate: number;
      statisticalValidation: { passed: boolean; anomalies: { metric: string; value: number; reason: string }[] };
    }>(() => {
    const health = computeHealthScore(store);
    const verification = runReportVerification(store);
    const criticalCount = health.criticalIssuesCount;
    const healthScore = health.healthScore;
    const healthLabel = health.healthLabel;
    const confidenceScore = verification.confidenceScore;
    const wastedSpendEstimate = health.wastedSpendEstimate;

    const totalSales = store.totalStoreSales > 0 ? store.totalStoreSales : store.storeMetrics.totalSales;
    const acos = store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : null;
    const roas = state.blendedROAS;
    const tacos = state.globalTACOS;

    const totalSessions =
      store.totalSessions > 0
        ? store.totalSessions
        : Object.values(store.asinMetrics).reduce((s, m) => s + m.sessions, 0);
    const totalOrders = store.totalOrders ?? 0;
    const buyBoxFromStore = store.buyBoxPercent;
    const buyBoxValues = Object.values(store.asinMetrics)
      .map((m) => m.buyBoxPercent)
      .filter((v): v is number => typeof v === 'number' && v >= 0);
    const buyBoxPct =
      buyBoxFromStore != null && buyBoxFromStore > 0
        ? buyBoxFromStore
        : buyBoxValues.length > 0
          ? buyBoxValues.reduce((a, b) => a + b, 0) / buyBoxValues.length
          : null;
    const conversionRate =
      store.storeMetrics.conversionRate != null && store.storeMetrics.conversionRate > 0
        ? store.storeMetrics.conversionRate
        : totalSessions > 0 && totalOrders > 0
          ? (totalOrders / totalSessions) * 100
          : null;
    const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
    const cpc = totalClicks > 0 ? store.totalAdSpend / totalClicks : 0;
    const cvrPct = totalClicks > 0 && totalOrders > 0 ? (totalOrders / totalClicks) * 100 : undefined;
    const statisticalValidation = validateMetrics({
      acos: store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : undefined,
      roas: store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : undefined,
      cvrPct,
      cpc,
    });

    const cards: SummaryCard[] = [
      { label: 'Critical Issues', value: String(criticalCount), sub: wastedSpendEstimate > 0 ? `~${formatCurrency(wastedSpendEstimate, store.currency)} waste` : '', status: criticalCount > 0 ? 'red' : 'green' },
      { label: 'Total Sales', value: totalSales > 0 ? formatCurrency(totalSales, store.currency) : '—', sub: '', status: totalSales > 0 ? 'blue' : 'blue' },
      { label: 'Total Ad Spend', value: store.totalAdSpend > 0 ? formatCurrency(store.totalAdSpend, store.currency) : '—', sub: '', status: 'blue' },
      { label: 'Total Ad Sales', value: store.totalAdSales > 0 ? formatCurrency(store.totalAdSales, store.currency) : '—', sub: '', status: 'blue' },
      { label: 'ROAS', value: roas > 0 ? `${roas.toFixed(2)}×` : '—', sub: '', status: roas >= 3 ? 'green' : roas >= 1.5 ? 'orange' : 'red' },
      { label: 'ACOS', value: acos != null ? formatPercent(acos) : '—', sub: '', status: acos != null ? (acos > 60 ? 'red' : acos > 30 ? 'orange' : 'green') : 'blue' },
      { label: 'TACOS', value: tacos > 0 ? formatPercent(tacos) : '—', sub: '', status: tacos > 0 ? (tacos <= 10 ? 'green' : tacos <= 25 ? 'orange' : 'red') : 'blue' },
      { label: 'Sessions', value: totalSessions > 0 ? totalSessions.toLocaleString() : '—', sub: '', status: totalSessions > 0 ? 'blue' : 'blue' },
      { label: 'CVR', value: conversionRate != null ? formatPercent(conversionRate) : '—', sub: '', status: conversionRate != null ? (conversionRate >= 10 ? 'green' : conversionRate >= 4 ? 'orange' : 'red') : 'blue' },
      { label: 'Buy Box %', value: buyBoxPct != null ? `${Math.round(buyBoxPct)}%` : '—', sub: '', status: buyBoxPct != null ? (buyBoxPct >= 90 ? 'green' : buyBoxPct >= 70 ? 'orange' : 'red') : 'blue' },
    ];
    return { healthScore, healthLabel, criticalCount, summaryCards: cards, confidenceScore, wastedSpendEstimate, statisticalValidation };
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

  const cardStatusClass: Record<SummaryStatus, string> = {
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    orange: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  };

  const byLabels = (labels: string[]) => summaryCards.filter((c) => labels.includes(c.label));

  return (
    <section
      aria-label="Audit summary and detected metrics"
      className="rounded-2xl border border-[#1f2937] bg-[#020617] p-4 sm:p-5 space-y-4"
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

      {dualEngine.ready && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 mb-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-cyan-300">Audit Confidence</span>
          {dualEngine.geminiVerificationPending ? (
            <span className="text-sm text-cyan-200">AI verification in progress…</span>
          ) : (
            <>
              <span className="text-xl font-bold tabular-nums text-cyan-200">{dualEngine.auditConfidenceScore}%</span>
              <span className="text-xs text-[var(--color-text-muted)]">AI verified – confidence {dualEngine.auditConfidenceScore}%</span>
            </>
          )}
        </div>
      )}

      {dualEngine.ready && dualEngine.multiAgentResult && !dualEngine.multiAgentResult.financialMetricsAllowed && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 mb-4">
          <p className="text-sm font-semibold text-amber-400">Financial metrics withheld</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Reconciliation or consistency checks did not meet the 80% confidence threshold. Financial figures are hidden until validation passes.
          </p>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Health & Risk */}
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Health &amp; Risk</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className={`rounded-xl border p-3 ${
              healthScore >= 90 ? 'bg-emerald-500/20 border-emerald-500/40' :
              healthScore >= 75 ? 'bg-emerald-500/15 border-emerald-500/30' :
              healthScore >= 60 ? 'bg-amber-500/20 border-amber-500/40' :
              healthScore >= 40 ? 'bg-amber-500/25 border-amber-500/50' : 'bg-red-500/20 border-red-500/40'
            }`}>
              <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">Health Score</p>
              <p className="text-2xl font-bold tabular-nums">{healthScore}</p>
              <p className="text-xs mt-1 opacity-90">{healthLabel}</p>
            </div>
            {byLabels(['Critical Issues']).map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={onFocusCriticalIssues}
                className={`text-left rounded-xl border p-3 ${cardStatusClass[c.status]} hover:bg-white/10 transition-colors`}
              >
                <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">{c.label}</p>
                <p className="text-lg font-bold tabular-nums">{c.value}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Revenue & Spend — hidden until reconciliation/consistency confidence ≥ 80% */}
        {dualEngine.multiAgentResult?.financialMetricsAllowed !== false && (
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Revenue &amp; Spend</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {byLabels(['Total Sales', 'Total Ad Sales', 'Total Ad Spend']).map((c) => (
                <div key={c.label} className={`rounded-xl border p-3 ${cardStatusClass[c.status]}`}>
                  <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">{c.label}</p>
                  <p className="text-lg font-bold tabular-nums">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Efficiency — hidden until reconciliation/consistency confidence ≥ 80% */}
        {dualEngine.multiAgentResult?.financialMetricsAllowed !== false && (
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Efficiency</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {byLabels(['ROAS', 'ACOS', 'TACOS']).map((c) => (
                <div key={c.label} className={`rounded-xl border p-3 ${cardStatusClass[c.status]}`}>
                  <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">{c.label}</p>
                  <p className="text-lg font-bold tabular-nums">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traffic & Conversion */}
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Traffic &amp; Conversion</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {byLabels(['Sessions', 'CVR', 'Buy Box %']).map((c) => (
              <div key={c.label} className={`rounded-xl border p-3 ${cardStatusClass[c.status]}`}>
                <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">{c.label}</p>
                <p className="text-lg font-bold tabular-nums">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
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

      {!statisticalValidation.passed && statisticalValidation.anomalies.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Data anomaly detected</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            The following metrics may indicate corrupted or implausible values:
          </p>
          <ul className="text-xs text-[var(--color-text-muted)] list-disc list-inside">
            {statisticalValidation.anomalies.map((a, i) => (
              <li key={i}>{a.metric}: {a.value} — {a.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {confidenceScore < 80 && hasData && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Report ingestion warning</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Report ingestion may contain inconsistencies (confidence: {confidenceScore}%). Consider re-uploading reports.
          </p>
        </div>
      )}

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
