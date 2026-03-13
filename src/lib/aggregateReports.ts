export interface AggregatedMetrics {
  // Primaries
  adSpend: number;
  adSales: number;
  totalStoreSales: number;
  adClicks: number;
  adImpressions: number;
  adOrders: number;
  storeOrders: number;
  sessions: number;
  unitsOrdered: number;
  buyBoxPct: number | null;

  // Derived
  organicSales: number;
  acos: number | null;
  tacos: number | null;
  roas: number | null;
  cpc: number | null;
  ctr: number | null;
  adCvr: number | null;
  sessionCvr: number | null;

  // Meta
  currency: string;
  rowCounts: {
    spAdvertised: number;
    spTargeting: number;
    spSearchTerm: number;
    business: number;
  };
  _ingestionLog: string[];
}

type Row = Record<string, string>;

function parseNumber(val: unknown): number {
  if (val == null || val === '' || val === '--' || val === '-') return 0;
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

function parseCurrency(val: unknown): number {
  if (val == null || val === '' || val === '--' || val === '-') return 0;
  // Strip any currency symbol (£, $, €, ¥, etc.), strip commas
  return parseFloat(String(val).replace(/[^0-9.\-]/g, '')) || 0;
}

function parsePercent(val: unknown): number {
  // Returns a decimal: "27.5%" → 0.275
  if (val == null || val === '' || val === '--' || val === '-') return 0;
  return parseFloat(String(val).replace('%', '').replace(',', '')) / 100 || 0;
}

function num(v: string | undefined, kind: 'number' | 'currency' | 'percent' = 'number'): number {
  if (v === undefined) return 0;
  switch (kind) {
    case 'currency':
      return parseCurrency(v);
    case 'percent':
      return parsePercent(v);
    default:
      return parseNumber(v);
  }
}

function sumCol(
  rows: Row[],
  col: string,
  kind: 'number' | 'currency' | 'percent' = 'number',
  log?: string[],
  label?: string
): number {
  let total = 0;
  let missing = 0;
  for (const row of rows) {
    if (!(col in row)) {
      missing += 1;
      continue;
    }
    total += num(row[col], kind);
  }
  if (log && label && missing > 0) {
    log.push(`WARNING: column "${col}" missing in ${missing}/${rows.length} rows for ${label}`);
  }
  return total;
}

export function aggregateReports(
  spAdvertisedRows: Row[],
  spTargetingRows: Row[],
  spSearchTermRows: Row[],
  businessRows: Row[]
): AggregatedMetrics {
  const log: string[] = [];

  // ── CURRENCY ──────────────────────────────────────────────
  const currency =
    spAdvertisedRows[0]?.['Currency'] ??
    businessRows[0]?.['Currency'] ??
    'GBP';

  // ── SP ADVERTISED PRODUCT REPORT ─────────────────────────
  // CRITICAL: Sum ALL rows. Zero deduplication.
  log.push(`SP Advertised: ${spAdvertisedRows.length} rows`);
  const adSpend = sumCol(spAdvertisedRows, 'Spend', 'currency', log, 'adSpend');
  const adSales = sumCol(spAdvertisedRows, '7 Day Total Sales', 'currency', log, 'adSales');
  const adClicks = sumCol(spAdvertisedRows, 'Clicks', 'number', log, 'adClicks');
  const adImp = sumCol(spAdvertisedRows, 'Impressions', 'number', log, 'adImpressions');
  const adOrders = sumCol(
    spAdvertisedRows,
    '7 Day Total Orders (#)',
    'number',
    log,
    'adOrders'
  );

  log.push(`adSpend=${adSpend} adSales=${adSales} adClicks=${adClicks}`);

  // ── BUSINESS REPORT ───────────────────────────────────────
  log.push(`Business Report: ${businessRows.length} rows`);
  const totalStoreSales = sumCol(
    businessRows,
    'Ordered Product Sales',
    'currency',
    log,
    'totalStoreSales'
  );
  const storeOrders = sumCol(
    businessRows,
    'Total order items',
    'number',
    log,
    'storeOrders'
  );
  const sessions = sumCol(
    businessRows,
    'Sessions – Total',
    'number',
    log,
    'sessions'
  );
  const unitsOrdered = sumCol(
    businessRows,
    'Units ordered',
    'number',
    log,
    'unitsOrdered'
  );

  // Buy Box: weighted average by sessions
  let buyBoxNumerator = 0;
  let buyBoxDenominator = 0;
  for (const row of businessRows) {
    const sess = parseNumber(row['Sessions – Total']);
    const buyBox = parsePercent(row['Featured Offer (Buy Box) percentage']);
    if (sess > 0 && buyBox > 0) {
      buyBoxNumerator += buyBox * sess;
      buyBoxDenominator += sess;
    }
  }
  const buyBoxPct = buyBoxDenominator > 0 ? buyBoxNumerator / buyBoxDenominator : null;

  log.push(`totalStoreSales=${totalStoreSales} sessions=${sessions}`);

  // ── DERIVED METRICS ───────────────────────────────────────
  // All computed HERE, from the aggregates above.
  // Nothing downstream recomputes these from raw columns.
  const organicSales = totalStoreSales - adSales;
  const acos = adSales > 0 ? adSpend / adSales : null;
  const tacos = totalStoreSales > 0 ? adSpend / totalStoreSales : null;
  const roas = adSpend > 0 ? adSales / adSpend : null;
  const cpc = adClicks > 0 ? adSpend / adClicks : null;
  const ctr = adImp > 0 ? adClicks / adImp : null;
  const adCvr = adClicks > 0 ? adOrders / adClicks : null;
  const sessionCvr = sessions > 0 ? unitsOrdered / sessions : null;

  log.push(
    `DERIVED: acos=${acos ?? 'null'} tacos=${tacos ?? 'null'} roas=${roas ?? 'null'}`
  );

  // ── SANITY CHECKS ─────────────────────────────────────────
  if (adSales > totalStoreSales && totalStoreSales > 0) {
    log.push(
      `INVARIANT FAIL: adSales (${adSales}) > totalStoreSales (${totalStoreSales})`
    );
  }
  if (adSpend < 0) {
    log.push(`INVARIANT FAIL: adSpend is negative (${adSpend})`);
  }
  if (acos !== null && (acos < 0 || acos > 50)) {
    log.push(
      `WARNING: ACOS=${(acos * 100).toFixed(
        1
      )}% — unusually high, verify data`
    );
  }

  return {
    adSpend,
    adSales,
    totalStoreSales,
    adClicks,
    adImpressions: adImp,
    adOrders,
    storeOrders,
    sessions,
    unitsOrdered,
    buyBoxPct,
    organicSales,
    acos,
    tacos,
    roas,
    cpc,
    ctr,
    adCvr,
    sessionCvr,
    currency,
    rowCounts: {
      spAdvertised: spAdvertisedRows.length,
      spTargeting: spTargetingRows.length,
      spSearchTerm: spSearchTermRows.length,
      business: businessRows.length,
    },
    _ingestionLog: log,
  };
}

