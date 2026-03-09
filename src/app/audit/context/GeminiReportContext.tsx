'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { MemoryStore } from '../utils/reportParser';
import { runDiagnosticEngines } from '../engines';
import { runSanityChecks } from '../utils/sanityChecks';
import { getMetricDefinitionsContext } from '@/lib/amazonMetricsReference';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';
import { runInsightRuleEngine } from '@/services/insightRuleEngine';
import { computeAccountHealthScore } from '@/services/accountHealthScore';

export interface GeminiReportState {
  report: string | null;
  loading: boolean;
  error: string | null;
}

const defaultState: GeminiReportState = {
  report: null,
  loading: false,
  error: null,
};

interface GeminiReportContextValue extends GeminiReportState {
  runGemini: (
    store: MemoryStore,
    opts?: { onComplete?: (success: boolean) => void; rawFiles?: File[] }
  ) => Promise<void>;
}

const GeminiReportContext = createContext<GeminiReportContextValue>({
  ...defaultState,
  runGemini: async () => {},
});

export function useGeminiReport() {
  const ctx = useContext(GeminiReportContext);
  if (!ctx) throw new Error('useGeminiReport must be used within GeminiReportProvider');
  return ctx;
}

function buildPayload(store: MemoryStore): Record<string, unknown> {
  const diagnostics = runDiagnosticEngines(store);
  const sanity = runSanityChecks(store);
  const canonical = executeMetricEngineForStore(store);
  const m = store.storeMetrics;

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

  const patterns: Array<{ type: string; severity: string; summary: string; details?: Record<string, unknown> }> = [];
  if (diagnostics.waste.totalWasteSpend > 0) {
    patterns.push({
      type: 'wasted_spend_summary',
      severity: 'critical',
      summary: `Estimated wasted ad spend: ${diagnostics.waste.totalWasteSpend.toFixed(2)}; ${diagnostics.waste.bleedingKeywords.length} bleeding keywords.`,
      details: {
        totalWasteSpend: diagnostics.waste.totalWasteSpend,
        wastePctOfTotalAdSpend: diagnostics.waste.wastePctOfTotalAdSpend,
        bleedingKeywordCount: diagnostics.waste.bleedingKeywords.length,
      },
    });
  }
  if (diagnostics.opportunity.scalingKeywords.length > 0 || diagnostics.opportunity.scalingCampaigns.length > 0) {
    patterns.push({
      type: 'scaling_opportunities',
      severity: 'opportunity',
      summary: 'High ROAS, low spend keywords and campaigns.',
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
      summary: 'Keywords duplicated across multiple campaigns.',
      details: { duplicateGroups: diagnostics.campaignStructure.duplicateTargeting.length },
    });
  }
  if (diagnostics.budgetThrottling.budgetCappedOpportunities.length > 0) {
    patterns.push({
      type: 'budget_capped_campaigns',
      severity: 'opportunity',
      summary: 'Campaigns frequently budget capped with strong ROAS.',
      details: { budgetCappedCount: diagnostics.budgetThrottling.budgetCappedOpportunities.length },
    });
  }

  const totalAdSpend = store.totalAdSpend;
  const totalAdSales = store.totalAdSales;
  const totalStoreSales = store.totalStoreSales || m.totalSales;
  const acos = totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;
  const clicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const avgCpc = clicks > 0 ? totalAdSpend / clicks : 0;
  const orders = store.totalOrders || 0;
  const conversionRate = clicks > 0 && orders > 0 ? (orders / clicks) * 100 : m.conversionRate;
  const wasted = Object.values(store.keywordMetrics)
    .filter((k) => k.clicks >= 10 && k.sales === 0)
    .reduce((s, k) => s + k.spend, 0);

  const metricsReferenceContext = getMetricDefinitionsContext([
    'ACOS', 'ROAS', 'CTR', 'CVR', 'CPC', 'TACOS',
  ]);

  const insightSummary = runInsightRuleEngine(store, canonical);
  const accountHealth = computeAccountHealthScore(store, sanity);

  return {
    metricsReferenceContext: metricsReferenceContext || undefined,
    accountSummary: {
      totalStoreSales,
      totalAdSales,
      totalAdSpend,
      tacos: m.tacos,
      roas: m.roas,
      acos,
      orders,
      avgCpc,
      conversionRate,
      organicSales: totalStoreSales - totalAdSales,
      adSalesPercent: m.adSalesPercent,
      wastedSpendEstimate: wasted,
    },
    insightsSummary: insightSummary.insights,
    accountHealth,
    campaigns,
    searchTerms,
    asins,
    patterns,
    sanity: {
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
      budgetCappedCampaigns: sanity.budgetCappedCampaigns.slice(0, 60).map((c) => ({
        campaignName: c.campaignName,
        spend: c.spend,
        sales: c.sales,
        budget: c.budget,
      })),
    },
  };
}

export function GeminiReportProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGemini = useCallback(
    async (
      store: MemoryStore,
      opts?: { onComplete?: (success: boolean) => void; rawFiles?: File[] }
    ) => {
      setLoading(true);
      setReport(null);
      setError(null);
      let success = false;
      try {
        const payload = buildPayload(store);
        const res = await fetch('/api/generate-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as { report?: string; narrative?: string; error?: string; errorCode?: string; errorDetail?: string };
        if (!res.ok) {
          const msg = data.error || 'AI analysis temporarily unavailable. Please rerun analysis.';
          setError(data.errorDetail ? `${msg} (${data.errorDetail})` : msg);
          opts?.onComplete?.(false);
          return;
        }
        const text = typeof data.report === 'string' ? data.report : (data.narrative ?? '');
        if (text && !text.includes('temporarily unavailable')) {
          setReport(text);
          setError(null);
          success = true;
        } else {
          const base = 'AI analysis temporarily unavailable. Please rerun analysis.';
          setError(data.errorDetail ? `${base} ${data.errorDetail}` : base);
        }
        opts?.onComplete?.(success);
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        setError(`AI analysis temporarily unavailable. ${detail.slice(0, 100)}`);
        opts?.onComplete?.(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <GeminiReportContext.Provider
      value={{ report, loading, error, runGemini }}
    >
      {children}
    </GeminiReportContext.Provider>
  );
}
