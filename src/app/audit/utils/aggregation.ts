/**
 * Section 16: Data aggregation architecture.
 * Internal data structures for store, keyword, ASIN, campaign metrics.
 */

import { safePercent, safeDivide } from './mathEngine';

/** Store level (Section 2: core revenue KPIs) */
export interface StoreMetrics {
  totalSales: number;
  totalAdSpend: number;
  totalAdSales: number;
  tacos: number;
  roas: number;
  organicSales: number;
  /** Ad Sales / Total Store Sales */
  adSalesPercent: number;
  /** Organic / Ad Sales */
  organicVsPaidRatio: number;
  /** Top 10 ASIN share of revenue (0–1) */
  revenueConcentrationTop10Asin: number;
  /** Orders / Sessions from Business Report */
  conversionRate: number;
  /** Section 5: from Campaign Report */
  attributedSales7d: number;
  attributedSales14d: number;
  attributedUnitsOrdered: number;
  attributedConversionRate: number;
  /** Section 6: profitability (product cost = 0 if not provided) */
  breakEvenAcos: number;
  contributionMargin: number;
  profitabilityScore: number;
  adDependencyRatio: number;
}

/** Keyword level (Section 6: Search Term Performance) */
export interface KeywordMetrics {
  searchTerm: string;
  campaign: string;
  matchType: string;
  /** For Table 3 "Show Detail" – keywords targeting this ASIN */
  asin?: string;
  spend: number;
  sales: number;
  clicks: number;
  acos: number;
  roas: number;
}

/** ASIN level (Section 8: ASIN-Level Profitability) */
export interface AsinMetrics {
  asin: string;
  sessions: number;
  pageViews: number;
  buyBoxPercent?: number;
  adSpend: number;
  adSales: number;
  totalSales: number;
  acos: number;
}

/** Campaign level */
export interface CampaignMetrics {
  campaignName: string;
  spend: number;
  sales: number;
  acos: number;
  budget: number;
}

export function createEmptyStoreMetrics(): StoreMetrics {
  return {
    totalSales: 0,
    totalAdSpend: 0,
    totalAdSales: 0,
    tacos: 0,
    roas: 0,
    organicSales: 0,
    adSalesPercent: 0,
    organicVsPaidRatio: 0,
    revenueConcentrationTop10Asin: 0,
    conversionRate: 0,
    attributedSales7d: 0,
    attributedSales14d: 0,
    attributedUnitsOrdered: 0,
    attributedConversionRate: 0,
    breakEvenAcos: 0,
    contributionMargin: 0,
    profitabilityScore: 0,
    adDependencyRatio: 0,
  };
}

export function computeStoreMetrics(
  totalStoreSales: number,
  totalAdSpend: number,
  totalAdSales: number,
  opts?: {
    totalSessions?: number;
    totalOrders?: number;
    revenueConcentrationTop10Asin?: number;
    attributedSales7d?: number;
    attributedSales14d?: number;
    attributedUnitsOrdered?: number;
    totalClicks?: number;
    profitMarginPercent?: number;
    productCost?: number;
  }
): StoreMetrics {
  const organicSales = totalStoreSales - totalAdSales;
  const adSalesPercent = safePercent(totalAdSales, totalStoreSales);
  const organicVsPaidRatio = safeDivide(organicSales, totalAdSales);
  const conversionRate =
    opts?.totalSessions != null && opts.totalSessions > 0 && opts?.totalOrders != null
      ? safePercent(opts.totalOrders, opts.totalSessions)
      : 0;
  const totalClicks = opts?.totalClicks ?? 0;
  const attributedUnits = opts?.attributedUnitsOrdered ?? 0;
  const attributedConversionRate =
    totalClicks > 0 && attributedUnits > 0 ? safePercent(attributedUnits, totalClicks) : 0;
  const productCost = opts?.productCost ?? 0;
  const contributionMargin = totalAdSales - totalAdSpend - productCost;
  const breakEvenAcos = opts?.profitMarginPercent ?? 0;
  const profitabilityScore =
    totalAdSales > 0 ? safePercent(contributionMargin, totalAdSales) : 0;
  const adDependencyRatio = safePercent(totalAdSales, totalStoreSales);
  return {
    totalSales: totalStoreSales,
    totalAdSpend,
    totalAdSales,
    tacos: safePercent(totalAdSpend, totalStoreSales),
    roas: safeDivide(totalAdSales, totalAdSpend),
    organicSales,
    adSalesPercent,
    organicVsPaidRatio,
    revenueConcentrationTop10Asin: opts?.revenueConcentrationTop10Asin ?? 0,
    conversionRate,
    attributedSales7d: opts?.attributedSales7d ?? 0,
    attributedSales14d: opts?.attributedSales14d ?? 0,
    attributedUnitsOrdered: attributedUnits,
    attributedConversionRate,
    breakEvenAcos,
    contributionMargin,
    profitabilityScore,
    adDependencyRatio,
  };
}

export function computeKeywordMetrics(
  spend: number,
  sales: number,
  clicks: number
): { acos: number; roas: number } {
  return {
    acos: safePercent(spend, sales),
    roas: safeDivide(sales, spend),
  };
}

export function computeAsinMetrics(
  adSpend: number,
  adSales: number,
  totalSales: number
): { acos: number } {
  return { acos: safePercent(adSpend, adSales) };
}

export function computeCampaignMetrics(spend: number, sales: number): { acos: number } {
  return { acos: safePercent(spend, sales) };
}
