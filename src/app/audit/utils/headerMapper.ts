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

/**
 * Normalize header for matching: remove spaces, hyphens, underscores; lowercase.
 * Enables matching "Sessions - Total", "Buy Box %", "Units Ordered - B2C", etc.
 */
export function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')
    .trim();
}

/** Possible header names per canonical column (matched via normalizeHeader) */
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
    'Total Sales',
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
    'Total Order Items',
  ],
  units: [
    'Units Ordered',
    'Attributed Units Ordered',
    'Ordered Units',
    'Units Ordered - B2C',
    'Units Ordered Total',
    'unitsordered',
    'Units Sold',
    'units_sold',
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
    'Sessions - Total',
    'Total Sessions',
    'Traffic Sessions',
    'sessions',
    'session',
    'sessions_total',
    'Sessions – Total',
  ],
  orderedProductSales: [
    'Ordered Product Sales',
    'Ordered Product Sales (USD)',
    'Total Sales',
    'Product Sales',
    'total_sales',
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
    'Page Views – Total',
    'Page views – Total',
    'Page Views - Total',
    'pageviews',
  ],
  buyBox: [
    'Featured Offer (Buy Box) percentage',
    'Buy Box %',
    'Buy Box Percentage',
    'Buy Box percentage',
    'Featured Offer Percentage',
    'Featured Offer %',
    'buy_box_percentage',
    'buyBoxPercentage',
    'BuyBoxPercentage',
    'Buy Box Pct',
    'buyboxpercentage',
    'BuyBox%',
    'buy box percentage',
    'buy_box',
    'buybox',
  ],
  unitSession: [
    'Unit Session %',
    'Unit Session Percentage',
    'Unit Session Pct',
    'UnitSessionPct',
    'UnitSessionPercentage',
    'Conversion Rate',
    'conversion_rate',
  ],
  other: [],
};

const normalizedVariations = new Map<string, CanonicalColumn>();
for (const [canonical, variants] of Object.entries(COLUMN_VARIATIONS)) {
  for (const v of variants) {
    const norm = normalizeHeader(v);
    if (norm && !normalizedVariations.has(norm)) {
      normalizedVariations.set(norm, canonical as CanonicalColumn);
    }
  }
}

/**
 * Map raw CSV headers to canonical column names using normalized matching.
 * Returns a map: canonical -> first matching raw header.
 */
export function mapHeaders(rawHeaders: string[]): HeaderMap {
  const map: HeaderMap = {};
  for (const raw of rawHeaders) {
    const key = normalizeHeader(raw);
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

/**
 * Classify report type from headers. Business reports: sessions, buy box, units ordered,
 * total order items, conversion rate (and/or orderedProductSales) without ad spend/clicks/impressions.
 */
export function classifyReportType(map: HeaderMap): 'business' | 'advertising' | 'unknown' {
  const hasOrderedProductSales = !!map.orderedProductSales || !!map.sales;
  const hasAdMetrics = !!map.spend || !!map.clicks || !!map.impressions;
  if (hasAdMetrics) return 'advertising';
  if (hasOrderedProductSales) return 'business';
  const hasSessions = !!map.sessions;
  const hasBuyBox = !!map.buyBox;
  const hasUnits = !!map.units || !!map.orders;
  const hasConversion = !!map.unitSession;
  if (hasSessions || hasBuyBox || hasUnits || hasConversion) return 'business';
  return 'unknown';
}

/**
 * Step 1.6 — Business Report Detection.
 * If the dataset contains any of these columns, classify as Amazon Business Report
 * and enable traffic and Buy Box analysis automatically.
 */
const BUSINESS_REPORT_INDICATOR_HEADERS = [
  'Sessions – Total',
  'Sessions - Total',
  'Page views – Total',
  'Page Views – Total',
  'Featured Offer (Buy Box) percentage',
  'Units ordered',
  'Units Ordered',
  'Ordered Product Sales',
];

export function isBusinessReportByHeaders(rawHeaders: string[]): boolean {
  const normalized = new Set(rawHeaders.map((h) => normalizeHeader(h)));
  for (const ind of BUSINESS_REPORT_INDICATOR_HEADERS) {
    if (normalized.has(normalizeHeader(ind))) return true;
  }
  const map = mapHeaders(rawHeaders);
  return !!(map.sessions || map.pageViews || map.buyBox || map.units || map.orderedProductSales);
}

/** Section 1: Campaign Report is single source of truth for totals. Classify ad report by filename. */
export type AdvertisingReportSubtype =
  | 'campaign'
  | 'search_term'
  | 'targeting'
  | 'advertised_product'
  | 'unknown';

export function classifyAdvertisingReportSubtype(map: HeaderMap): AdvertisingReportSubtype {
  const hasCampaign = !!map.campaignName;
  const hasSkuOrAsin = !!map.sku || !!map.asin;
  const hasSearchTerm = !!map.searchTerm;

  if (hasSearchTerm && map.searchTerm) {
    const norm = normalizeHeader(map.searchTerm);
    if (norm.includes('customersearchterm')) return 'search_term';
  }

  if (hasCampaign && hasSkuOrAsin) return 'advertised_product';
  if (hasCampaign && hasSearchTerm) return 'targeting';
  if (hasCampaign) return 'campaign';

  // Fallbacks when campaign name is missing
  if (hasSkuOrAsin) return 'advertised_product';
  if (hasSearchTerm) return 'targeting';

  return 'unknown';
}
