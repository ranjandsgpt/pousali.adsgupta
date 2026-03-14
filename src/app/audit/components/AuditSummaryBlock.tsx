'use client';

import { useMemo, useState } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { useDualEngine } from '../dualEngine/dualEngineContext';
import { useValidatedArtifacts } from '../store/ValidatedArtifactsContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import { FileDown, Presentation, RotateCcw, ThumbsUp, ThumbsDown, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { recordAuditEvent } from '@/lib/behavioralObserver';
import { exportAuditPdf } from '../utils/exportPdf';
import { computeHealthScore } from '../utils/healthScoreEngine';
import { runReportVerification } from '../utils/reportVerification';
import { validateMetrics } from '../utils/statisticalValidator';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';

const DISPLAY_NAMES: Record<string, string> = {
  spend: 'Spend', sales: 'Sales', clicks: 'Clicks', impressions: 'Impressions', orders: 'Orders',
  campaignName: 'Campaign', adGroup: 'Ad Group', matchType: 'Match Type', asin: 'ASIN', sessions: 'Sessions',
  date: 'Date', budget: 'Daily Budget', pageViews: 'Page Views', acos: 'ACOS', roas: 'ROAS',
  tacos: 'TACOS', ctr: 'CTR', cvr: 'CVR', conversion: 'Conversion', buybox: 'Buy Box %', currency: 'Currency',
  other: 'Other',
};

interface AuditSummaryBlockProps {
  onRerunAnalysis: () => void;
  /** When provided, "Continue anyway" runs dual engine with forceComplete using current store (e.g. from page). */
  onContinueAnyway?: () => void;
  onFocusCriticalIssues?: () => void;
  onDownloadPdf?: () => void;
  onDownloadPptx?: () => void;
  onRefreshExports?: () => void;
  exportGenerating?: boolean;
}

type SummaryStatus = 'red' | 'orange' | 'green' | 'blue';

interface SummaryCard {
  label: string;
  value: string;
  sub?: string;
  status: SummaryStatus;
}

/** Single block under page: title, health score, summary cards, detected (and missing) metrics. */
export default function AuditSummaryBlock({
  onRerunAnalysis,
  onContinueAnyway,
  onFocusCriticalIssues,
  onDownloadPdf,
  onDownloadPptx,
  onRefreshExports,
  exportGenerating = false,
}: AuditSummaryBlockProps) {
  const { state } = useAuditStore();
  const { store } = state;
  const dualEngine = useDualEngine();
  const { validated } = useValidatedArtifacts();
  const [warningsOpen, setWarningsOpen] = useState(false);

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

    const m = store.aggregatedMetrics;
    const overrides = state.learnedOverrides?.overrides;
    const canonical = m
      ? null
      : executeMetricEngineForStore(store, overrides);
    const totalSales = m
      ? m.totalStoreSales
      : (store.totalStoreSales > 0 ? store.totalStoreSales : store.storeMetrics.totalSales);
    const acos = m != null && m.acos != null ? m.acos * 100 : (canonical ? canonical.acos * 100 : 0);
    const roas = m?.roas ?? (canonical?.roas ?? 0);
    const tacos = m != null && m.tacos != null ? m.tacos * 100 : (canonical ? canonical.tacos * 100 : 0);

    const totalSessions = m
      ? m.sessions
      : (store.totalSessions > 0
          ? store.totalSessions
          : Object.values(store.asinMetrics).reduce((s, mm) => s + mm.sessions, 0));
    const totalOrders = m ? m.adOrders : (canonical?.totalAdOrders ?? store.totalOrders ?? 0);
    const buyBoxFromStore = store.buyBoxPercent;
    const buyBoxValues = Object.values(store.asinMetrics)
      .map((mm) => mm.buyBoxPercent)
      .filter((v): v is number => typeof v === 'number' && v >= 0);
    const buyBoxPct =
      m?.buyBoxPct != null && m.buyBoxPct > 0
        ? m.buyBoxPct * 100
        : (buyBoxFromStore != null && buyBoxFromStore > 0
            ? buyBoxFromStore
            : buyBoxValues.length > 0
              ? buyBoxValues.reduce((a, b) => a + b, 0) / buyBoxValues.length
              : null);
    const conversionRate =
      m?.adCvr != null ? m.adCvr * 100 : (canonical && canonical.cvr > 0 ? canonical.cvr * 100 : null);
    const totalClicks = m ? m.adClicks : (store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0));
    const cpc = m?.cpc ?? (totalClicks > 0 ? store.totalAdSpend / totalClicks : 0);
    const cvrPct = totalClicks > 0 && totalOrders > 0 ? (totalOrders / totalClicks) * 100 : undefined;
    const statisticalValidation = validateMetrics({
      acos: store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : undefined,
      roas: store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : undefined,
      cvrPct,
      cpc,
    });

    const cards: SummaryCard[] = [
      { label: 'Health Score', value: String(healthScore), sub: healthLabel, status: healthScore >= 90 ? 'green' : healthScore >= 60 ? 'orange' : 'red' },
      { label: 'Critical Issues', value: String(criticalCount), sub: wastedSpendEstimate > 0 ? `~${formatCurrency(wastedSpendEstimate, store.currency)} waste` : '', status: criticalCount > 0 ? 'red' : 'green' },
      { label: 'Total Store Sales', value: totalSales > 0 ? formatCurrency(totalSales, store.currency) : '—', sub: '', status: totalSales > 0 ? 'blue' : 'blue' },
      { label: 'Total Ad Spend', value: store.totalAdSpend > 0 ? formatCurrency(store.totalAdSpend, store.currency) : '—', sub: '', status: 'blue' },
      { label: 'Total Ad Sales', value: store.totalAdSales > 0 ? formatCurrency(store.totalAdSales, store.currency) : '—', sub: '', status: 'blue' },
      { label: 'ROAS', value: roas > 0 ? `${roas.toFixed(2)}×` : '—', sub: '', status: roas >= 3 ? 'green' : roas >= 1.5 ? 'orange' : roas > 0 ? 'red' : 'blue' },
      { label: 'ACOS', value: Number.isFinite(acos) ? formatPercent(acos) : '—', sub: '', status: Number.isFinite(acos) ? (acos > 60 ? 'red' : acos > 30 ? 'orange' : 'green') : 'blue' },
      { label: 'TACOS', value: tacos > 0 ? formatPercent(tacos) : '—', sub: '', status: tacos > 0 ? (tacos <= 10 ? 'green' : tacos <= 25 ? 'orange' : 'red') : 'blue' },
      { label: 'Sessions', value: totalSessions > 0 ? totalSessions.toLocaleString() : '—', sub: '', status: totalSessions > 0 ? 'blue' : 'blue' },
      { label: 'Conversion Rate', value: conversionRate != null ? formatPercent(conversionRate) : '—', sub: '', status: conversionRate != null ? (conversionRate >= 10 ? 'green' : conversionRate >= 4 ? 'orange' : 'red') : 'blue' },
      { label: 'Buy Box %', value: buyBoxPct != null ? `${Math.round(buyBoxPct)}%` : '—', sub: '', status: buyBoxPct != null ? (buyBoxPct >= 90 ? 'green' : buyBoxPct >= 70 ? 'orange' : 'red') : 'blue' },
      { label: 'Orders', value: totalOrders > 0 ? totalOrders.toLocaleString() : '—', sub: '', status: totalOrders > 0 ? 'blue' : 'blue' },
      { label: 'Clicks', value: totalClicks > 0 ? totalClicks.toLocaleString() : '—', sub: '', status: totalClicks > 0 ? 'blue' : 'blue' },
      { label: 'CPC', value: totalClicks > 0 ? formatCurrency(cpc, store.currency) : '—', sub: '', status: 'blue' },
    ];
    return { healthScore, healthLabel, criticalCount, summaryCards: cards, confidenceScore, wastedSpendEstimate, statisticalValidation };
  }, [store, state.learnedOverrides?.overrides]);

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
  const hasData = store.totalAdSpend > 0 || (store.totalStoreSales ?? store.storeMetrics?.totalSales ?? 0) > 0;
  const handlePdfExport = () => (onDownloadPdf ? onDownloadPdf() : exportAuditPdf(store));
  const lockExport = exportGenerating;

  const sendKpiFeedback = async (label: string, value: string, feedbackType: 'like' | 'dislike') => {
    try {
      await fetch('/api/audit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: 'metrics',
          artifactId: label,
          value,
          feedbackType,
        }),
      });
      if (feedbackType === 'dislike') {
        onRerunAnalysis?.();
      }
    } catch {
      // ignore
    }
  };

  const cardStatusClass: Record<SummaryStatus, string> = {
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    orange: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  };

  const showFinancial = dualEngine.multiAgentResult?.financialMetricsAllowed !== false;
  const confidenceBelow80 = dualEngine.ready && dualEngine.auditConfidenceScore < 80;

  const auditNotes: string[] = [];
  if (dualEngine.ready) {
    auditNotes.push(`Audit Confidence: ${dualEngine.auditConfidenceScore}% — ${validated.passed ? 'Validated' : 'AI verified'}`);
  }
  if (dualEngine.ready && dualEngine.multiAgentResult && !dualEngine.multiAgentResult.financialMetricsAllowed) {
    auditNotes.push('Financial reconciliation below 80% confidence threshold');
  }
  if (confidenceBelow80 && hasData) {
    auditNotes.push('Some financial metrics flagged — require verification');
  }
  if (confidenceBelow80 && hasData) {
    auditNotes.push('Metrics marked with * require verification');
  }
  if (dualEngine.error) {
    auditNotes.push(dualEngine.error);
  }

  const failedInvariants = (store.invariantResults ?? []).filter((r) => !r.passed && r.severity === 'error');
  const { pipelineAbort, pipelineWarnings, forceCompleteUsed, reset } = dualEngine;
  const hasWarnings = pipelineWarnings.length > 0;

  return (
    <section
      aria-label="Audit summary and detected metrics"
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 space-y-3"
    >
      {pipelineAbort && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/60 bg-red-500/15 px-3 py-3 text-sm text-red-200 space-y-2"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-semibold">Audit could not complete: {pipelineAbort.reason}</p>
              <p className="text-xs opacity-90 mt-1">
                Phase: {pipelineAbort.phase} · Agent: {pipelineAbort.agent}
                {Object.keys(pipelineAbort.failedMetrics).length > 0 && (
                  <> · Failed metrics: {Object.keys(pipelineAbort.failedMetrics).join(', ')}</>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    onRerunAnalysis?.();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/40 text-white font-medium text-sm hover:bg-red-600/50"
                >
                  <RotateCcw size={14} aria-hidden />
                  Retry with different files
                </button>
                {onContinueAnyway && (
                  <button
                    type="button"
                    onClick={onContinueAnyway}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/40 text-amber-100 font-medium text-sm hover:bg-amber-600/50"
                  >
                    Continue anyway (results may be inaccurate)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {forceCompleteUsed && (
        <div
          role="status"
          className="rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-sm text-amber-200"
        >
          These results bypassed validation checks and may contain errors.
        </div>
      )}

      {hasWarnings && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5">
          <button
            type="button"
            onClick={() => setWarningsOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-amber-200 hover:bg-amber-500/10 rounded-lg"
            aria-expanded={warningsOpen}
          >
            <span className="inline-flex items-center gap-2">
              Warnings
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-500/30 text-amber-200 text-xs">
                {pipelineWarnings.length}
              </span>
            </span>
            {warningsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {warningsOpen && (
            <ul className="px-3 pb-3 pt-0 space-y-1.5 text-xs text-amber-200/90 border-t border-amber-500/20 pt-2">
              {pipelineWarnings.map((w, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span>
                    [{w.phase}] {w.agent}: {w.message}
                  </span>
                  {w.affectedMetrics.length > 0 && (
                    <span className="opacity-80">Affected: {w.affectedMetrics.join(', ')} · {w.severity}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {failedInvariants.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
        >
          <span className="font-medium">⚠️ Data integrity issue detected</span>
          {' — '}
          {failedInvariants.map((r) => r.name).join(', ')}: results may be inaccurate. {failedInvariants[0]?.description}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)]">
          Amazon Advertising Performance Audit
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              recordAuditEvent('rerun_analysis', 'summary_block');
              onRerunAnalysis?.();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 font-medium text-sm hover:bg-blue-500/30"
            aria-label="Rerun analysis"
          >
            <RotateCcw size={16} aria-hidden />
            Rerun Analysis
          </button>
          {onRefreshExports && (
            <button
              type="button"
              onClick={onRefreshExports}
              disabled={!hasData || lockExport}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-500/20 text-slate-300 font-medium text-sm hover:bg-slate-500/30 disabled:opacity-50"
              aria-label="Refresh exports"
              title="Regenerate premium report"
            >
              <RefreshCw size={16} aria-hidden={lockExport ? undefined : true} className={lockExport ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
          <button
            type="button"
            onClick={handlePdfExport}
            disabled={!hasData || lockExport}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm disabled:opacity-50 ${lockExport ? 'opacity-40 pointer-events-none' : ''} bg-purple-500/20 text-purple-400 hover:bg-purple-500/30`}
            style={lockExport ? { filter: 'blur(2px)' } : undefined}
            aria-label="Download PDF"
          >
            <FileDown size={16} aria-hidden />
            Download PDF
          </button>
          <button
            type="button"
            onClick={onDownloadPptx}
            disabled={!hasData || lockExport}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm disabled:opacity-50 ${lockExport ? 'opacity-40 pointer-events-none' : ''} bg-amber-500/20 text-amber-400 hover:bg-amber-500/30`}
            style={lockExport ? { filter: 'blur(2px)' } : undefined}
            aria-label="Download PPTX"
          >
            <Presentation size={16} aria-hidden />
            Download PPTX
          </button>
        </div>
      </div>

      {/* KPI Summary — single grid */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">KPI Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {summaryCards.map((c) => {
            const isCritical = c.label === 'Critical Issues';
            const isLowConfidence = showFinancial === false && ['Total Store Sales', 'Total Ad Spend', 'Total Ad Sales', 'ROAS', 'ACOS', 'TACOS'].includes(c.label);
            const hideFinancialMetric = !showFinancial && ['Total Store Sales', 'Total Ad Spend', 'Total Ad Sales', 'ROAS', 'ACOS', 'TACOS'].includes(c.label);
            const content = (
              <>
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-0.5">
                    {c.label}
                    {isLowConfidence && confidenceBelow80 ? '*' : ''}
                  </p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); sendKpiFeedback(c.label, c.value, 'like'); }}
                      className="p-0.5 rounded hover:bg-white/10 opacity-70 hover:opacity-100"
                      aria-label="Like"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); sendKpiFeedback(c.label, c.value, 'dislike'); }}
                      className="p-0.5 rounded hover:bg-white/10 opacity-70 hover:opacity-100"
                      aria-label="Dislike"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-base font-bold tabular-nums">{hideFinancialMetric ? '—' : c.value}</p>
                {c.sub && <p className="text-xs mt-0.5 opacity-80">{c.sub}</p>}
              </>
            );
            if (isCritical) {
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={onFocusCriticalIssues}
                  className={`text-left rounded-xl border p-2.5 ${cardStatusClass[c.status]} hover:bg-white/10 transition-colors`}
                >
                  {content}
                </button>
              );
            }
            return (
              <div key={c.label} className={`rounded-xl border p-2.5 ${cardStatusClass[c.status]}`}>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detected metrics — compact pills, one row, right-aligned, scrollable */}
      <div className="flex flex-row items-center justify-end gap-2 border-t border-[var(--color-border)] pt-2 min-h-0">
        <span className="text-xs text-[var(--color-text-muted)] shrink-0">Detected metrics</span>
        <div className="flex gap-1.5 overflow-x-auto max-w-full scrollbar-thin py-0.5" style={{ scrollbarWidth: 'thin' }}>
          {detectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 shrink-0"
            >
              {DISPLAY_NAMES[tag] ?? tag}
            </span>
          ))}
        </div>
      </div>

      {/* Audit notes — footnotes bottom-right */}
      {auditNotes.length > 0 && (
        <div className="border-t border-[var(--color-border)] pt-2 flex justify-end">
          <ul className="text-xs text-[var(--color-text-muted)] text-right space-y-0.5 max-w-md">
            {auditNotes.map((note, i) => (
              <li key={i}>* {note}</li>
            ))}
          </ul>
        </div>
      )}

      {!statisticalValidation.passed && statisticalValidation.anomalies.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
          <p className="text-xs text-amber-400">Data anomaly: {statisticalValidation.anomalies.map((a) => `${a.metric}: ${a.reason}`).join('; ')}</p>
        </div>
      )}

      {missingTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span>Missing:</span>
          {missingTags.map((label) => (
            <span key={label} className="inline-flex px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
              {label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
