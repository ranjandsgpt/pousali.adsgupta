'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { useLearning } from '../learning/LearningContext';
import { runDiagnosticEngines } from '../engines';
import { runSanityChecks } from '../utils/sanityChecks';
import type { DualIntelligenceRequest, GeminiAuditResponse } from '../../api/generate-insights/route';

const BLEEDER_CLICKS_MIN = 10;
const LOW_ACOS_THRESHOLD = 15;

export default function GeminiInsightsPanel() {
  const { state } = useAuditStore();
  const { recordGeminiFeedback } = useLearning();
  const [result, setResult] = useState<GeminiAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = state.store;
  const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;

  // Phase 9/15: clear cached AI output when store is replaced (e.g. Rerun Analysis).
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [store]);

  const slmSummary = useMemo(() => {
    const m = store.storeMetrics;
    const totalAdSpend = store.totalAdSpend;
    const totalAdSales = store.totalAdSales;
    const totalStoreSales = store.totalStoreSales || m.totalSales;
    const acos = totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;
    const orders = store.totalOrders;
    const clicks =
      store.totalClicks ||
      Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
    const avgCpc = clicks > 0 ? totalAdSpend / clicks : 0;
    const conversionRate =
      clicks > 0 && orders > 0 ? (orders / clicks) * 100 : m.conversionRate;
    const organicSales = totalStoreSales - totalAdSales;
    const adSalesPercent = m.adSalesPercent;

    const keywords = Object.values(store.keywordMetrics);
    const wasted = keywords
      .filter((k) => k.clicks >= BLEEDER_CLICKS_MIN && k.sales === 0)
      .reduce((sum, k) => sum + k.spend, 0);

    return {
      totalStoreSales,
      totalAdSales,
      totalAdSpend,
      acos,
      tacos: m.tacos,
      roas: m.roas,
      orders,
      avgCpc,
      conversionRate,
      organicSales,
      adSalesPercent,
      wastedSpendEstimate: wasted,
      wastedKeywordCount: keywords.filter(
        (k) => k.clicks >= BLEEDER_CLICKS_MIN && k.sales === 0
      ).length,
    };
  }, [store]);

  const buildPayload = (): DualIntelligenceRequest => {
    const diagnostics = runDiagnosticEngines(store);
    const sanity = runSanityChecks(store);

    const campaigns = Object.values(store.campaignMetrics)
      .filter((c) => c.campaignName)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 80)
      .map((c) => ({
        campaignName: c.campaignName,
        spend: c.spend,
        sales: c.sales,
        acos: c.acos,
        budget: c.budget,
      }));

    const searchTerms = Object.values(store.keywordMetrics)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 200)
      .map((k) => ({
        searchTerm: k.searchTerm,
        campaign: k.campaign,
        spend: k.spend,
        sales: k.sales,
        clicks: k.clicks,
        acos: k.acos,
        roas: k.roas,
      }));

    const asins = Object.values(store.asinMetrics)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 120)
      .map((a) => ({
        asin: a.asin,
        adSpend: a.adSpend,
        adSales: a.adSales,
        totalSales: a.totalSales,
        sessions: a.sessions,
        buyBoxPercent: a.buyBoxPercent,
      }));

    const patterns: DualIntelligenceRequest['patterns'] = [];

    if (diagnostics.waste.totalWasteSpend > 0) {
      patterns.push({
        type: 'wasted_spend_summary',
        severity: 'critical',
        summary: `Estimated wasted ad spend of ${diagnostics.waste.totalWasteSpend.toFixed(
          2
        )} with ${diagnostics.waste.bleedingKeywords.length} bleeding keywords.`,
        details: {
          totalWasteSpend: diagnostics.waste.totalWasteSpend,
          wastePctOfTotalAdSpend: diagnostics.waste.wastePctOfTotalAdSpend,
          bleedingKeywordCount: diagnostics.waste.bleedingKeywords.length,
          bleedingCampaignCount: diagnostics.waste.bleedingCampaigns.length,
        },
      });
    }

    if (
      diagnostics.opportunity.scalingKeywords.length > 0 ||
      diagnostics.opportunity.scalingCampaigns.length > 0
    ) {
      patterns.push({
        type: 'scaling_opportunities',
        severity: 'opportunity',
        summary:
          'High ROAS, low spend keywords and campaigns that are candidates for safe scaling.',
        details: {
          scalingKeywordCount: diagnostics.opportunity.scalingKeywords.length,
          scalingCampaignCount: diagnostics.opportunity.scalingCampaigns.length,
        },
      });
    }

    if (diagnostics.campaignStructure.duplicateTargeting.length > 0) {
      patterns.push({
        type: 'duplicate_targeting',
        severity: 'warning',
        summary:
          'Keywords duplicated across multiple campaigns (potential cannibalization).',
        details: {
          duplicateGroups: diagnostics.campaignStructure.duplicateTargeting.length,
        },
      });
    }

    if (diagnostics.budgetThrottling.budgetCappedOpportunities.length > 0) {
      patterns.push({
        type: 'budget_capped_campaigns',
        severity: 'opportunity',
        summary:
          'Campaigns that are frequently budget capped while maintaining strong ROAS.',
        details: {
          budgetCappedCount:
            diagnostics.budgetThrottling.budgetCappedOpportunities.length,
        },
      });
    }

    const sanityPayload: DualIntelligenceRequest['sanity'] = {
      wastedKeywords: sanity.wastedKeywords.slice(0, 100).map((k) => ({
        keyword: k.searchTerm,
        campaign: k.campaign,
        spend: k.spend,
        clicks: k.clicks,
      })),
      scalingKeywords: sanity.scalingKeywords.slice(0, 100).map((k) => ({
        keyword: k.searchTerm,
        campaign: k.campaign,
        spend: k.spend,
        sales: k.sales,
        roas: k.roas,
      })),
      highACOSCampaigns: sanity.highACOSCampaigns.slice(0, 60).map((c) => ({
        campaignName: c.campaignName,
        spend: c.spend,
        sales: c.sales,
        acos: c.acos,
      })),
      budgetCappedCampaigns: sanity.budgetCappedCampaigns
        .slice(0, 60)
        .map((c) => ({
          campaignName: c.campaignName,
          spend: c.spend,
          sales: c.sales,
          budget: c.budget,
        })),
    };

    const payload: DualIntelligenceRequest = {
      accountSummary: {
        totalStoreSales: slmSummary.totalStoreSales,
        totalAdSales: slmSummary.totalAdSales,
        totalAdSpend: slmSummary.totalAdSpend,
        tacos: slmSummary.tacos,
        roas: slmSummary.roas,
        acos: slmSummary.acos,
        orders: slmSummary.orders,
        avgCpc: slmSummary.avgCpc,
        conversionRate: slmSummary.conversionRate,
        organicSales: slmSummary.organicSales,
        adSalesPercent: slmSummary.adSalesPercent,
        wastedSpendEstimate: slmSummary.wastedSpendEstimate,
      },
      campaigns,
      searchTerms,
      asins,
      patterns,
      sanity: sanityPayload,
    };

    return payload;
  };

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = (await res.json()) as GeminiAuditResponse | { error?: string };
      if (!res.ok || 'error' in data) {
        setError('AI insights temporarily unavailable. Please rerun analysis.');
        return;
      }
      const typed = data as GeminiAuditResponse;
      setResult(typed);

      // When Gemini flags disagreements with the deterministic engine,
      // feed those messages into the Learning Intelligence layer so they
      // can influence cross-account insights on subsequent analyses.
      if (
        typed.verification &&
        typed.verification.disagreements &&
        typed.verification.disagreements.length > 0
      ) {
        recordGeminiFeedback(typed.verification.disagreements);
      }
    } catch {
      setError('AI insights temporarily unavailable. Please rerun analysis.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasData) return null;

  const verification = result?.verification;
  const showWarning =
    verification &&
    verification.verificationResult &&
    verification.verificationResult !== 'agree';

  return (
    <section
      aria-labelledby="gemini-insights-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6 space-y-4"
    >
      <header className="space-y-1">
        <h2
          id="gemini-insights-heading"
          className="text-lg font-semibold text-[var(--color-text)]"
        >
          AI Audit Narrative — Gemini
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Gemini analyzes the normalized Amazon reports independently and compares its
          findings with the deterministic analytics engine to validate and extend the
          audit.
        </p>
      </header>

      {/* Layer 1 — Deterministic SLM summary */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
        <h3 className="text-xs font-semibold text-[var(--color-text)] mb-2">
          Layer 1: Deterministic analytics (SLM)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[var(--color-text-muted)]">
          <div>
            <p className="uppercase tracking-wide">Ad Spend</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {slmSummary.totalAdSpend.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Ad Sales</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {slmSummary.totalAdSales.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">ACOS</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {slmSummary.acos.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">ROAS</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {slmSummary.roas.toFixed(2)}×
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">TACOS</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {slmSummary.tacos.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Estimated wasted spend</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {slmSummary.wastedSpendEstimate.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          {loading ? 'Running Gemini analysis…' : 'Run Gemini analysis'}
        </button>
        {showWarning && (
          <div className="flex-1 min-w-[200px] rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
            <p className="text-xs font-semibold text-amber-300">
              AI verification flagged a potential inconsistency.
            </p>
            {verification?.disagreements?.length > 0 && (
              <p className="text-[11px] text-amber-200 mt-1 line-clamp-3">
                {verification.disagreements[0]}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div
          className="mt-1 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          role="alert"
        >
          <p className="text-sm font-medium text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Layer 2 — Gemini narrative and strategic insights */}
      {result && (
        <section className="space-y-4 mt-2">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-xs font-semibold text-[var(--color-text)] mb-2">
              Executive narrative
            </h3>
            <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">
              {result.narrative}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {result.topRisks?.length > 0 && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 space-y-1">
                <h4 className="text-xs font-semibold text-red-300">Top risks</h4>
                <ul className="list-disc list-inside text-[var(--color-text)] text-xs space-y-1">
                  {result.topRisks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.topOpportunities?.length > 0 && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 space-y-1">
                <h4 className="text-xs font-semibold text-emerald-300">
                  Top opportunities
                </h4>
                <ul className="list-disc list-inside text-[var(--color-text)] text-xs space-y-1">
                  {result.topOpportunities.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.actionRoadmap?.length > 0 && (
              <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 p-3 space-y-1">
                <h4 className="text-xs font-semibold text-sky-300">Action roadmap</h4>
                <ul className="list-disc list-inside text-[var(--color-text)] text-xs space-y-1">
                  {result.actionRoadmap.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </section>
  );
}
