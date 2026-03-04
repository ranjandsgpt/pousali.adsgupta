/**
 * Core math: TACOS, ROAS, ACOS, etc.
 * Stub: implement when connecting calculations.
 */
export function computeTACOS(adSpend: number, totalSales: number): number {
  if (totalSales <= 0) return 0;
  return (adSpend / totalSales) * 100;
}

export function computeROAS(sales: number, adSpend: number): number {
  if (adSpend <= 0) return 0;
  return sales / adSpend;
}

export function computeACOS(adSpend: number, sales: number): number {
  if (sales <= 0) return 0;
  return (adSpend / sales) * 100;
}
