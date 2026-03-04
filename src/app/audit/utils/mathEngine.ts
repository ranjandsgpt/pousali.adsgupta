/**
 * Section 3 & 18: Mathematical logic and safe math wrappers.
 * All financial calculations use these to avoid division by zero / NaN.
 */

/** Section 18: safeDivide(a, b) → a/b or 0 if b === 0 */
export function safeDivide(a: number, b: number): number {
  if (b === 0 || !Number.isFinite(b)) return 0;
  const q = a / b;
  return Number.isFinite(q) ? q : 0;
}

/** Section 18: safePercent(a, b) → (a/b)*100 or 0 if b === 0 */
export function safePercent(a: number, b: number): number {
  if (b === 0 || !Number.isFinite(b)) return 0;
  const p = (a / b) * 100;
  return Number.isFinite(p) ? p : 0;
}

/** Section 18: safeCurrency(value) — ensure finite number for display */
export function safeCurrency(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/** Section 3 & 18: TACOS = (Total Ad Spend / Total Store Sales) * 100 */
export function computeTACOS(adSpend: number, totalStoreSales: number): number {
  return safePercent(adSpend, totalStoreSales);
}

/** Section 3 & 18: ROAS = Ad Sales / Ad Spend */
export function computeROAS(adSales: number, adSpend: number): number {
  return safeDivide(adSales, adSpend);
}

/** Section 3 & 18: ACOS = (Ad Spend / Ad Sales) * 100 */
export function computeACOS(adSpend: number, adSales: number): number {
  return safePercent(adSpend, adSales);
}

/** Section 18: Organic Sales = Total Store Sales - Ad Sales */
export function computeOrganicSales(totalStoreSales: number, adSales: number): number {
  return safeCurrency(totalStoreSales - adSales);
}
