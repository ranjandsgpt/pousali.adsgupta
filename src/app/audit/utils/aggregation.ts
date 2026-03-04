/**
 * Section 16: Data aggregation architecture.
 * Internal data structures for store, keyword, ASIN, campaign metrics.
 */

import { safePercent, safeDivide } from './mathEngine';

/** Store level */
export interface StoreMetrics {
  totalSales: number;
  totalAdSpend: number;
  totalAdSales: number;
  tacos: number;
  roas: number;
  organicSales: number;
}

/** Keyword level */
export interface KeywordMetrics {
  searchTerm: string;
  campaign: string;
  matchType: string;
  spend: number;
  sales: number;
  clicks: number;
  acos: number;
  roas: number;
}

/** ASIN level */
export interface AsinMetrics {
  asin: string;
  sessions: number;
  pageViews: number;
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
  };
}

export function computeStoreMetrics(
  totalStoreSales: number,
  totalAdSpend: number,
  totalAdSales: number
): StoreMetrics {
  return {
    totalSales: totalStoreSales,
    totalAdSpend,
    totalAdSales,
    tacos: safePercent(totalAdSpend, totalStoreSales),
    roas: safeDivide(totalAdSales, totalAdSpend),
    organicSales: totalStoreSales - totalAdSales,
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
