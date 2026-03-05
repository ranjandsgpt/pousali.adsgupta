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
  | 'adGroup'
  | 'matchType'
  | 'asin'
  | 'sku'
  | 'sessions'
  | 'orderedProductSales'
  | 'date'
  | 'budget'
  | 'pageViews'
  | 'buyBox'
  | 'unitSession'
  | 'sales7d'
  | 'sales14d'
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
    'Ad Sales',
    'Ordered Product Sales',
  ],
  sales7d: [
    '7 Day Total Sales',
    '7 Day Sales',
  ],
  sales14d: [
    '14 Day Total Sales',
    '14 Day Total Sales (Attributed)',
    'Attributed Sales (14d)',
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
    'Ordered Units',
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
  adGroup: [
    'Ad Group',
    'Ad Group Name',
  ],
  matchType: [
    'Match Type',
    'Targeting',
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
    'Traffic Sessions',
  ],
  orderedProductSales: [
    'Ordered Product Sales',
    'Ordered Product Sales (USD)',
    'Total Sales',
    'Product Sales',
  ],
  date: [
    'Date',
    'Recorded Date',
    'Reported Date',
  ],
  budget: [
    'Budget',
    'Daily Budget',
  ],
  pageViews: [
    'Page Views',
    'Page Views (DPV)',
  ],
  buyBox: [
    'Buy Box %',
    'Buy Box Percentage',
    'Buy Box Pct',
  ],
  unitSession: [
    'Unit Session %',
    'Unit Session Percentage',
    'Unit Session Pct',
    'UnitSessionPct',
    'Conversion Rate',
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

/** Section 1: Campaign Report is single source of truth for totals. Classify ad report by filename. */
export type AdvertisingReportSubtype =
  | 'campaign'
  | 'search_term'
  | 'targeting'
  | 'advertised_product'
  | 'unknown';

export function classifyAdvertisingReportSubtype(fileName: string): AdvertisingReportSubtype {
  const lower = fileName.toLowerCase();
  if (lower.includes('search term') || lower.includes('customer search')) return 'search_term';
  if (lower.includes('targeting') && !lower.includes('advertised')) return 'targeting';
  if (lower.includes('advertised product') || lower.includes('product ad')) return 'advertised_product';
  if (lower.includes('campaign')) return 'campaign';
  return 'unknown';
}
