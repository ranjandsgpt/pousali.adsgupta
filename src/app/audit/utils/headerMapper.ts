/**
 * Section 11: Dynamic column detection.
 * Map possible Amazon column name variations to canonical keys.
 * Tool must still run with available columns (e.g. show ACOS but hide TACOS if Business Report missing).
 */

export type CanonicalColumn =
  | 'spend'
  | 'sales'
  | 'clicks'
  | 'impressions'
  | 'orders'
  | 'units'
  | 'searchTerm'
  | 'campaignName'
  | 'asin'
  | 'sku'
  | 'sessions'
  | 'orderedProductSales'
  | 'date'
  | 'other';

export interface HeaderMap {
  /** Canonical column -> raw header name as it appears in CSV */
  [canonical: string]: string;
}

/** Possible header names per canonical column (case-insensitive match) */
const COLUMN_VARIATIONS: Record<CanonicalColumn, string[]> = {
  spend: [
    'Spend',
    'Total Cost',
    'Cost',
    'Ad Spend',
    'Advertising Cost',
  ],
  sales: [
    'Sales',
    'Attributed Sales',
    '14 Day Total Sales',
    '7 Day Total Sales',
    'Ad Sales',
    'Attributed Sales (14d)',
    'Ordered Product Sales',
  ],
  clicks: [
    'Clicks',
    'Click Throughs',
    'Ad Clicks',
  ],
  impressions: [
    'Impressions',
    'Ad Impressions',
  ],
  orders: [
    'Orders',
    'Units Ordered',
    'Attributed Units Ordered',
    '14 Day Total Orders',
  ],
  units: [
    'Units Ordered',
    'Attributed Units Ordered',
  ],
  searchTerm: [
    'Search Term',
    'Customer Search Term',
    'Keyword Text',
    'Targeting',
  ],
  campaignName: [
    'Campaign',
    'Campaign Name',
  ],
  asin: [
    'ASIN',
    'Advertised ASIN',
    'Child ASIN',
    'Parent ASIN',
  ],
  sku: [
    'SKU',
    'Advertised SKU',
  ],
  sessions: [
    'Sessions',
    'Total Sessions',
  ],
  orderedProductSales: [
    'Ordered Product Sales',
    'Ordered Product Sales (USD)',
    'Total Sales',
  ],
  date: [
    'Date',
    'Recorded Date',
    'Reported Date',
  ],
  other: [],
};

const normalizedVariations = new Map<string, CanonicalColumn>();
for (const [canonical, variants] of Object.entries(COLUMN_VARIATIONS)) {
  for (const v of variants) {
    normalizedVariations.set(v.toLowerCase().trim(), canonical as CanonicalColumn);
  }
}

/**
 * Map raw CSV headers to canonical column names.
 * Returns a map: canonical -> first matching raw header.
 */
export function mapHeaders(rawHeaders: string[]): HeaderMap {
  const map: HeaderMap = {};
  for (const raw of rawHeaders) {
    const key = raw.toLowerCase().trim();
    const canonical = normalizedVariations.get(key);
    if (canonical && !map[canonical]) {
      map[canonical] = raw;
    }
  }
  return map;
}

/**
 * Collect all unique canonical columns detected across multiple header arrays (Set-based).
 */
export function collectUniqueCanonicalHeaders(headerArrays: string[][]): Set<CanonicalColumn> {
  const set = new Set<CanonicalColumn>();
  for (const headers of headerArrays) {
    const map = mapHeaders(headers);
    for (const c of Object.keys(map) as CanonicalColumn[]) {
      if (c !== 'other') set.add(c);
    }
  }
  return set;
}

/** TACOS = total ad spend / total store sales. Need business (orderedProductSales or sales) + spend. */
export function hasRequiredForTACOS(map: HeaderMap): boolean {
  const hasSales =
    !!map.orderedProductSales ||
    !!map.sales;
  const hasSpend = !!map.spend;
  return hasSales && hasSpend;
}

/** ACOS = ad spend / attributed sales. Need ad report with spend + sales. */
export function hasRequiredForACOS(map: HeaderMap): boolean {
  return !!map.spend && !!map.sales;
}

/** Classify report type from headers for ASIN Bridge (Business vs Advertising). */
export function classifyReportType(map: HeaderMap): 'business' | 'advertising' | 'unknown' {
  const hasOrderedProductSales = !!map.orderedProductSales || !!map.sales;
  const hasAdMetrics = !!map.spend || !!map.clicks || !!map.impressions;
  if (hasOrderedProductSales && !hasAdMetrics) return 'business';
  if (hasAdMetrics) return 'advertising';
  return 'unknown';
}
