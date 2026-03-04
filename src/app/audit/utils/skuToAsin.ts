/**
 * Section 12: SKU → ASIN resolution.
 * Priority: Direct ASIN column → Advertised ASIN → Business Report mapping → SKU.
 * Build map from Business Report (SKU → ASIN); PPC rows inherit ASIN from map when missing.
 */

export type SkuToAsinMap = Record<string, string>;

/**
 * Resolve ASIN for a row using priority:
 * 1. Direct ASIN column / Advertised ASIN
 * 2. Business Report ASIN mapping (skuToAsinMap)
 * 3. SKU as fallback (no resolution)
 */
export function resolveAsin(
  row: Record<string, unknown>,
  asinRawKey: string | undefined,
  skuRawKey: string | undefined,
  skuToAsinMap: SkuToAsinMap
): string {
  if (asinRawKey && row[asinRawKey] != null) {
    const v = String(row[asinRawKey]).trim();
    if (v) return v;
  }
  if (skuRawKey && row[skuRawKey] != null) {
    const sku = String(row[skuRawKey]).trim();
    if (sku && skuToAsinMap[sku]) return skuToAsinMap[sku];
    if (sku) return sku; // fallback: use SKU as identifier when no ASIN mapped
  }
  return '';
}

/**
 * Build SKU → ASIN map from business report rows (has both SKU and ASIN columns).
 */
export function buildSkuToAsinMap(
  rows: Array<Record<string, unknown>>,
  skuRawKey: string | undefined,
  asinRawKey: string | undefined
): SkuToAsinMap {
  const map: SkuToAsinMap = {};
  if (!skuRawKey || !asinRawKey) return map;
  for (const row of rows) {
    const sku = row[skuRawKey] != null ? String(row[skuRawKey]).trim() : '';
    const asin = row[asinRawKey] != null ? String(row[asinRawKey]).trim() : '';
    if (sku && asin) map[sku] = asin;
  }
  return map;
}
