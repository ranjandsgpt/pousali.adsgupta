/**
 * Centralized Amazon Seller Central metrics formulas.
 * References:
 * - https://sellercentral.amazon.in/help/hub/reference/external/G9A4UJXQURELVGC2
 * - https://docs.supermetrics.com/docs/amazon-seller-central-fields
 */

import { safeDivide, safePercent } from './mathEngine';

/** ACOS = (Ad Spend / Ad Sales) × 100 */
export function acos(adSpend: number, adSales: number): number {
  return safePercent(adSpend, adSales);
}

/** ROAS = Ad Sales / Ad Spend */
export function roas(adSales: number, adSpend: number): number {
  return safeDivide(adSales, adSpend);
}

/** TACOS = (Ad Spend / Total Store Sales) × 100 */
export function tacos(adSpend: number, totalSales: number): number {
  return safePercent(adSpend, totalSales);
}

/** CTR = (Clicks / Impressions) × 100 */
export function ctr(clicks: number, impressions: number): number {
  return safePercent(clicks, impressions);
}

/** CPC = Ad Spend / Clicks */
export function cpc(adSpend: number, clicks: number): number {
  return safeDivide(adSpend, clicks);
}

/** CVR (Conversion Rate) = (Orders / Clicks) × 100 — orders attributed to ad clicks */
export function cvr(orders: number, clicks: number): number {
  return safePercent(orders, clicks);
}

/** Session conversion rate = (Orders / Sessions) × 100 — from Business Report */
export function sessionConversionRate(orders: number, sessions: number): number {
  return safePercent(orders, sessions);
}

/** Ad Sales % = (Ad Sales / Total Sales) × 100 */
export function adSalesPercent(adSales: number, totalSales: number): number {
  return safePercent(adSales, totalSales);
}

/** Organic Sales = Total Sales − Ad Sales */
export function organicSales(totalSales: number, adSales: number): number {
  return Math.max(0, totalSales - adSales);
}

/** Wasted Spend = sum of spend where sales === 0 (e.g. keywords with 0 attributed sales) */
export function wastedSpend(rows: { spend: number; sales: number }[]): number {
  return rows
    .filter((r) => r.sales === 0)
    .reduce((sum, r) => sum + r.spend, 0);
}

/**
 * Lost Revenue Estimate = (wastedSpend / targetACOS) − wastedSpend.
 * targetACOS as decimal (e.g. 0.15 for 15%).
 */
export function lostRevenueEstimate(wastedSpend: number, targetACOS: number): number {
  if (wastedSpend <= 0 || targetACOS <= 0 || !Number.isFinite(targetACOS)) return 0;
  const impliedSales = wastedSpend / targetACOS;
  return Math.max(0, impliedSales - wastedSpend);
}

/**
 * Contribution Margin (ratio) = (Ad Sales − Ad Spend) / Ad Sales.
 * As percentage: * 100.
 */
export function contributionMarginRatio(adSales: number, adSpend: number): number {
  return safePercent(adSales - adSpend, adSales);
}

/**
 * Account Health Score: weighted index (0–100) from profitability, waste, structure, efficiency.
 * Simplified: profitability weight 40%, waste penalty 30%, efficiency 30%.
 */
export function accountHealthScore(opts: {
  contributionMarginPct: number;
  wastePctOfSpend: number;
  roas: number;
  tacosPct: number;
}): number {
  const { contributionMarginPct, wastePctOfSpend, roas, tacosPct } = opts;
  let profitScore = Math.min(100, Math.max(0, contributionMarginPct * 2)); // 0–50% margin → 0–100
  let wasteScore = Math.max(0, 100 - wastePctOfSpend); // 0% waste → 100, 100% waste → 0
  let roasScore = Math.min(100, roas * 25); // 4 ROAS → 100
  let tacosScore = tacosPct <= 0 ? 100 : Math.max(0, 100 - tacosPct); // low TACOS better
  return Math.round(0.4 * profitScore + 0.3 * wasteScore + 0.15 * roasScore + 0.15 * tacosScore);
}
