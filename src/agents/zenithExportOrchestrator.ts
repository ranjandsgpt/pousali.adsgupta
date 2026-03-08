/**
 * Zenith Export Orchestrator — unify SLM + Gemini into PremiumState.
 * Single source of truth for UI, PDF, PPTX. Do not change existing pipeline; only extend.
 */

import type { PremiumState, VerifiedMetric, VerifiedInsight, ChartSpec, TableSpec } from './zenithTypes';
import type { MemoryStore } from '@/app/audit/utils/reportParser';

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
}

const DEFAULT_CURRENCY = 'EUR';

/**
 * Build PremiumState from store + Gemini/SLM artifacts.
 * All exports (UI, PDF, PPTX) must read from this state for consistency.
 */
export function runZenithExportOrchestrator(input: ZenithOrchestratorInput): PremiumState {
  const { store, executiveNarrative = '', insights = [], charts = [], tables = [] } = input;
  const m = store.storeMetrics;
  const totalAdSpend = store.totalAdSpend;
  const totalAdSales = store.totalAdSales;
  const totalStoreSales = store.totalStoreSales ?? m.totalSales;
  const acos = totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;
  const roas = totalAdSpend > 0 ? totalAdSales / totalAdSpend : 0;
  const tacos = totalStoreSales > 0 ? (totalAdSpend / totalStoreSales) * 100 : 0;
  const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const cpc = totalClicks > 0 ? totalAdSpend / totalClicks : 0;

  const verifiedMetrics: VerifiedMetric[] = [
    { label: 'Ad Spend', value: totalAdSpend, unit: store.currency ?? DEFAULT_CURRENCY, source: 'slm' },
    { label: 'Ad Sales', value: totalAdSales, unit: store.currency ?? DEFAULT_CURRENCY, source: 'slm' },
    { label: 'Store Sales', value: totalStoreSales, unit: store.currency ?? DEFAULT_CURRENCY, source: 'slm' },
    { label: 'ACOS', value: `${acos.toFixed(1)}%`, source: 'slm' },
    { label: 'ROAS', value: roas.toFixed(2), source: 'slm' },
    { label: 'TACOS', value: `${tacos.toFixed(1)}%`, source: 'slm' },
    { label: 'Sessions', value: store.totalSessions, source: 'slm' },
    { label: 'Clicks', value: totalClicks, source: 'slm' },
    { label: 'Orders', value: store.totalOrders ?? 0, source: 'slm' },
    { label: 'CPC', value: cpc.toFixed(2), unit: store.currency ?? DEFAULT_CURRENCY, source: 'slm' },
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
  };
}
