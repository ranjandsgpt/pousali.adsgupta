/**
 * Phase 7 — Targeting Type Analysis: Auto vs Manual, Manual split (Broad, Phrase, Exact, Product Targeting).
 * Source: Targeting Report.
 */

import { getReportSourceForInsight } from '@/data/reportSourceRegistry';

export interface TargetingRow {
  targetingType?: string;
  matchType?: string;
  spend: number;
  sales: number;
  clicks: number;
  impressions: number;
}

export interface TargetingBreakdown {
  spend: number;
  sales: number;
  cpc: number;
  ctr: number;
  cvr: number;
  acos: number;
}

export interface TargetingAnalysisResult {
  auto: TargetingBreakdown;
  manual: {
    broad: TargetingBreakdown;
    phrase: TargetingBreakdown;
    exact: TargetingBreakdown;
    productTargeting: TargetingBreakdown;
  };
}

function emptyBreakdown(): TargetingBreakdown {
  return { spend: 0, sales: 0, cpc: 0, ctr: 0, cvr: 0, acos: 0 };
}

function aggregate(rows: TargetingRow[]): TargetingBreakdown {
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const sales = rows.reduce((s, r) => s + r.sales, 0);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  return {
    spend,
    sales,
    cpc: clicks > 0 ? spend / clicks : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cvr: 0,
    acos: sales > 0 ? (spend / sales) * 100 : 0,
  };
}

export function runTargetingAnalysisAgent(rows: TargetingRow[]): TargetingAnalysisResult {
  const source = getReportSourceForInsight('targetingTypeAnalysis');
  if (source !== 'targeting_report') {
    console.warn('[targetingAnalysisAgent] Expected source targeting_report, got', source);
  }

  const auto = rows.filter((r) => (r.targetingType || r.matchType || '').toLowerCase() === 'auto');
  const manual = rows.filter((r) => (r.targetingType || r.matchType || '').toLowerCase() !== 'auto');
  const broad = manual.filter((r) => (r.matchType || '').toLowerCase() === 'broad');
  const phrase = manual.filter((r) => (r.matchType || '').toLowerCase() === 'phrase');
  const exact = manual.filter((r) => (r.matchType || '').toLowerCase() === 'exact');
  const productTargeting = manual.filter((r) => (r.matchType || '').toLowerCase().includes('product') || (r.targetingType || '').toLowerCase().includes('product'));

  return {
    auto: auto.length ? aggregate(auto) : emptyBreakdown(),
    manual: {
      broad: broad.length ? aggregate(broad) : emptyBreakdown(),
      phrase: phrase.length ? aggregate(phrase) : emptyBreakdown(),
      exact: exact.length ? aggregate(exact) : emptyBreakdown(),
      productTargeting: productTargeting.length ? aggregate(productTargeting) : emptyBreakdown(),
    },
  };
}
