export const METRIC_SOURCES = {
  // ── PRIMARY AGGREGATES (sum ALL rows, zero deduplication) ──
  adSpend: {
    report: 'SP_ADVERTISED_PRODUCT',
    column: 'Spend',
    aggregation: 'SUM',
    notes: 'Never deduplicate. Never use Targeting or Search Term report for this.',
  },
  adSales: {
    report: 'SP_ADVERTISED_PRODUCT',
    column: '7 Day Total Sales',
    aggregation: 'SUM',
    notes: 'Includes both Advertised SKU Sales and Other SKU Sales (halo). Never use 7 Day Advertised SKU Sales alone.',
  },
  totalStoreSales: {
    report: 'BUSINESS_REPORT',
    column: 'Ordered Product Sales',
    aggregation: 'SUM',
    notes: 'Sum of Child ASIN rows only. This is total store revenue including organic.',
  },
  adClicks: {
    report: 'SP_ADVERTISED_PRODUCT',
    column: 'Clicks',
    aggregation: 'SUM',
  },
  adImpressions: {
    report: 'SP_ADVERTISED_PRODUCT',
    column: 'Impressions',
    aggregation: 'SUM',
  },
  adOrders: {
    report: 'SP_ADVERTISED_PRODUCT',
    column: '7 Day Total Orders (#)',
    aggregation: 'SUM',
    notes: 'Ad-attributed orders. Do NOT use Business Report Total order items for this.',
  },
  storeOrders: {
    report: 'BUSINESS_REPORT',
    column: 'Total order items',
    aggregation: 'SUM',
    notes: 'Total store orders including organic. Different metric from adOrders.',
  },
  sessions: {
    report: 'BUSINESS_REPORT',
    column: 'Sessions – Total',
    aggregation: 'SUM',
  },
  unitsOrdered: {
    report: 'BUSINESS_REPORT',
    column: 'Units ordered',
    aggregation: 'SUM',
  },
  buyBoxPct: {
    report: 'BUSINESS_REPORT',
    column: 'Featured Offer (Buy Box) percentage',
    aggregation: 'WEIGHTED_AVERAGE',
    weightColumn: 'Sessions – Total',
    notes: 'Weighted average by sessions, never simple average.',
  },

  // ── DERIVED METRICS (computed from aggregates above, never from columns) ──
  organicSales: {
    formula: 'totalStoreSales - adSales',
    notes: 'Never read from a column. Always derived.',
  },
  acos: {
    formula: 'adSpend / adSales',
    guard: 'return null if adSales <= 0',
    displayAs: 'percentage',
  },
  tacos: {
    formula: 'adSpend / totalStoreSales',
    guard: 'return null if totalStoreSales <= 0',
    displayAs: 'percentage',
  },
  roas: {
    formula: 'adSales / adSpend',
    guard: 'return null if adSpend <= 0',
    displayAs: 'multiplier',
  },
  cpc: {
    formula: 'adSpend / adClicks',
    guard: 'return null if adClicks <= 0',
    displayAs: 'currency',
  },
  ctr: {
    formula: 'adClicks / adImpressions',
    guard: 'return null if adImpressions <= 0',
    displayAs: 'percentage',
  },
  adCvr: {
    formula: 'adOrders / adClicks',
    guard: 'return null if adClicks <= 0',
    displayAs: 'percentage',
    notes: 'Ad conversion rate. This is what the CONVERSION RATE tile should show.',
  },
  sessionCvr: {
    formula: 'unitsOrdered / sessions',
    guard: 'return null if sessions <= 0',
    displayAs: 'percentage',
    notes: 'Store session CVR. Different from adCvr. Label clearly if shown.',
  },
} as const;

export type MetricKey = keyof typeof METRIC_SOURCES;

