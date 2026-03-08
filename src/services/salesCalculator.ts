/**
 * Phase 3 — Fix Total Sales Calculation.
 * Total Sales = Ad Sales + Organic Sales. Single place for sales math.
 */

/**
 * Total Sales = Ad Sales + Organic Sales (canonical).
 */
export function calculateTotalSales(adSales: number, organicSales: number): number {
  return adSales + organicSales;
}

/**
 * When organic is not directly available: Organic Sales = Total Sales − Ad Sales.
 */
export function calculateOrganicSales(totalSales: number, adSales: number): number {
  return Math.max(0, totalSales - adSales);
}
