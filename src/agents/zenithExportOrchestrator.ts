/**
 * Zenith Export Orchestrator — unify SLM + Gemini into PremiumState.
 * Single source of truth for UI, PDF, PPTX. Do not change existing pipeline; only extend.
 */

import type { PremiumState, VerifiedMetric, VerifiedInsight, ChartSpec, TableSpec } from './zenithTypes';
import type { MemoryStore } from '@/app/audit/utils/reportParser';
import { runBrandIntelligence } from './brandIntelligenceAgent';
import { aggregateReports } from '@/lib/aggregateReports';

export interface ZenithOrchestratorInput {
  store: MemoryStore;
  /** Gemini executive narrative */
  executiveNarrative?: string;
  /** Validated insights (from dual-engine / blackboard) */
  insights?: Array<{ id?: string; title: string; description: string; recommendedAction?: string; verificationScore?: number; sourceEngine?: 'slm' | 'gemini' }>;
  /** Chart metadata from UI or modelSyncController */
  charts?: ChartSpec[];
  /** Table datasets from UI or SLM */
  tables?: TableSpec[];
  /** Brand names for Brand Intelligence (branded classification) */
  brandNames?: string[];
  /** Competitor brand names for Brand Intelligence */
  competitorBrands?: string[];
}

const DEFAULT_CURRENCY = 'EUR';

/**
 * Build PremiumState from store + Gemini/SLM artifacts.
 * All exports (UI, PDF, PPTX) must read from this state for consistency.
 */
export function runZenithExportOrchestrator(input: ZenithOrchestratorInput): PremiumState {
  const { store, executiveNarrative = '', insights = [], charts = [], tables = [], brandNames = [], competitorBrands = [] } = input;
  const agg =
    store.aggregatedMetrics ??
    aggregateReports(
      store.rawSpAdvertisedRows,
      store.rawSpTargetingRows,
      store.rawSpSearchTermRows,
      store.rawBusinessRows
    );

  const totalAdSpend = agg.adSpend;
  const totalAdSales = agg.adSales;
  const totalStoreSales = agg.totalStoreSales;
  const acosPct = agg.acos != null ? agg.acos * 100 : 0;
  const roasVal = agg.roas ?? 0;
  const tacosPct = agg.tacos != null ? agg.tacos * 100 : 0;
  const totalClicks = agg.adClicks;
  const cpcVal = agg.cpc ?? (agg.adClicks > 0 ? agg.adSpend / agg.adClicks : 0);

  const verifiedMetrics: VerifiedMetric[] = [
    {
      label: 'Ad Spend',
      value: totalAdSpend,
      unit: agg.currency || store.currency || DEFAULT_CURRENCY,
      source: 'slm',
    },
    {
      label: 'Ad Sales',
      value: totalAdSales,
      unit: agg.currency || store.currency || DEFAULT_CURRENCY,
      source: 'slm',
    },
    {
      label: 'Store Sales',
      value: totalStoreSales,
      unit: agg.currency || store.currency || DEFAULT_CURRENCY,
      source: 'slm',
    },
    {
      label: 'ACOS',
      value: `${acosPct.toFixed(1)}%`,
      source: 'slm',
    },
    {
      label: 'ROAS',
      value: roasVal.toFixed(2),
      source: 'slm',
    },
    {
      label: 'TACOS',
      value: `${tacosPct.toFixed(1)}%`,
      source: 'slm',
    },
    {
      label: 'Sessions',
      value: agg.sessions,
      source: 'slm',
    },
    {
      label: 'Clicks',
      value: totalClicks,
      source: 'slm',
    },
    {
      label: 'Orders',
      value: agg.storeOrders,
      source: 'slm',
    },
    {
      label: 'CPC',
      value: cpcVal.toFixed(2),
      unit: agg.currency || store.currency || DEFAULT_CURRENCY,
      source: 'slm',
    },
  ];

  const verifiedInsights: VerifiedInsight[] = insights.map((i, idx) => ({
    id: i.id ?? `insight-${idx}`,
    title: i.title,
    description: i.description,
    recommendedAction: i.recommendedAction,
    verificationScore: i.verificationScore ?? 0.9,
    sourceEngine: i.sourceEngine ?? 'slm',
  }));

  const campaignAnalysis = Object.values(store.campaignMetrics)
    .filter((c) => c.campaignName)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 100)
    .map((c) => ({
      campaignName: c.campaignName || '',
      spend: c.spend,
      sales: c.sales,
      acos: c.acos,
      roas: c.sales / (c.spend || 1),
      budget: c.budget,
    }));

  const keywordAnalysis = Object.values(store.keywordMetrics)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 200)
    .map((k) => ({
      searchTerm: k.searchTerm,
      campaign: k.campaign || '',
      spend: k.spend,
      sales: k.sales,
      clicks: k.clicks,
      acos: k.acos,
      roas: k.roas,
    }));

  const wasteAnalysis = Object.values(store.keywordMetrics)
    .filter((k) => k.clicks >= 10 && k.sales === 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 100)
    .map((k) => ({
      searchTerm: k.searchTerm,
      campaign: k.campaign || '',
      spend: k.spend,
      clicks: k.clicks,
      suggestedAction: 'Consider pausing or negating.',
    }));

  const breakEvenAcos = 30; // placeholder; use ProfitabilityAgent in pipeline
  const profitability = {
    breakEvenACOS: breakEvenAcos,
    targetROAS: 3,
    lossCampaignCount: campaignAnalysis.filter((c) => c.spend > 0 && c.sales / c.spend < 1 / (breakEvenAcos / 100)).length,
  };

  const searchTermsForBrand = Object.values(store.keywordMetrics)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 500)
    .map((k) => ({ searchTerm: k.searchTerm, sales: k.sales, spend: k.spend, orders: 0 }));
  const brandAnalysis = runBrandIntelligence(searchTermsForBrand, brandNames, competitorBrands);

  return {
    verifiedMetrics,
    verifiedInsights,
    charts,
    tables,
    campaignAnalysis,
    keywordAnalysis,
    wasteAnalysis,
    profitability,
    executiveNarrative,
    recommendations: verifiedInsights.flatMap((i) => (i.recommendedAction ? [i.recommendedAction] : [])),
    generatedAt: new Date().toISOString(),
    confidenceScore: undefined,
    modelVerificationStatus: 'Zenith Export Orchestrator',
    currency: store.currency ?? DEFAULT_CURRENCY,
    brandAnalysis,
  };
}
