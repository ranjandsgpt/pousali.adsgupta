/**
 * Step 9 — Forecasting Engine.
 * Forecasted sales, predicted ROAS, required clicks for revenue, break-even CPC, inventory reorder point.
 */

import { movingAverage, trendSlope } from './statisticalEngine';

/** Simple linear forecast: next value = last + slope (using last N points for slope). */
export function forecastNext(values: number[], window = 7): number {
  if (values.length < 2) return values[values.length - 1] ?? 0;
  const slice = values.slice(-Math.min(window, values.length));
  const slope = trendSlope(slice);
  const last = slice[slice.length - 1] ?? 0;
  return Math.max(0, last + slope);
}

/** Forecast next N periods (linear extrapolation). */
export function forecastPeriods(values: number[], periods: number, window = 7): number[] {
  const out: number[] = [];
  let arr = [...values];
  for (let i = 0; i < periods; i++) {
    const next = forecastNext(arr, window);
    out.push(next);
    arr = [...arr, next];
  }
  return out;
}

/** Predicted ROAS from trend (e.g. average ROAS last 7 days + trend). */
export function predictedRoas(roasHistory: number[], window = 7): number {
  if (roasHistory.length === 0) return 0;
  const ma = movingAverage(roasHistory, Math.min(window, roasHistory.length));
  if (ma.length === 0) return roasHistory[roasHistory.length - 1] ?? 0;
  const slope = trendSlope(ma);
  const last = ma[ma.length - 1] ?? 0;
  return Math.max(0, last + slope);
}

/** Required clicks to achieve target revenue given CVR and AOV (revenue per order). */
export function requiredClicksForRevenue(targetRevenue: number, cvrPct: number, revenuePerOrder: number): number {
  if (cvrPct <= 0 || revenuePerOrder <= 0) return 0;
  const ordersNeeded = targetRevenue / revenuePerOrder;
  return Math.ceil(ordersNeeded / (cvrPct / 100));
}

/** Break-even CPC: max CPC such that ROAS = 1 (or target). CPC = revenue per click = (sales/clicks) = (sales/spend)*spend/clicks = ROAS * CPC => CPC_breakeven = 1/ROAS * (sales/clicks). So CPC_breakeven = (Revenue per click) at target ROAS. For ROAS=1: CPC_breakeven = sales/clicks = revenue per click. */
export function breakEvenCpc(avgRevenuePerClick: number, targetRoas = 1): number {
  if (targetRoas <= 0) return 0;
  return avgRevenuePerClick / targetRoas;
}

/** Inventory reorder point: reorder when stock <= dailySales * leadTimeDays + safetyStock. */
export function reorderPoint(dailySales: number, leadTimeDays: number, safetyStock: number): number {
  return Math.ceil(dailySales * leadTimeDays + safetyStock);
}
