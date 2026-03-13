/**
 * Section 2 & 15: Multi-file ingestion with streaming.
 * Section 12: SKU→ASIN (business first, then ad with resolution).
 * Section 14: Dedupe by composite key (date+campaign+adGroup+keyword+asin).
 * Section 16: Store, keyword, ASIN, campaign aggregation.
 */

import Papa from 'papaparse';
import { PARSER_CHUNK_SIZE, MAX_ROWS_PER_FILE } from './constants';
import {
  mapHeaders,
  normalizeHeader,
  classifyReportType,
  classifyAdvertisingReportSubtype,
  type HeaderMap,
  type AdvertisingReportSubtype,
} from './headerMapper';
import { sanitizeNumeric } from './sanitizeNumeric';
import { extractCanonicalValue, AMAZON_COLUMN_MAP } from '@/services/schemaMapper';
import { detectCurrencyFromValues, type DetectedCurrency } from './currencyDetector';
import { normalizeDate } from './dateNormalizer';
import { resolveAsin, type SkuToAsinMap } from './skuToAsin';
import { compositeKey, isDuplicate } from './duplicateDetection';
import {
  computeStoreMetrics,
  computeKeywordMetrics,
  computeAsinMetrics,
  computeCampaignMetrics,
  createEmptyStoreMetrics,
  type StoreMetrics,
  type KeywordMetrics,
  type AsinMetrics,
  type CampaignMetrics,
} from './aggregation';
import { aggregateReports, type AggregatedMetrics } from '@/lib/aggregateReports';
import { runInvariants, type InvariantResult } from '@/lib/invariants';

export type ReportType = 'business' | 'advertising' | 'unknown';

export interface ParsedRow {
  [key: string]: unknown;
  _sourceFile: string;
}

export interface MemoryStore {
  uniqueColumns: Set<string>;
  totalStoreSales: number;
  totalAdSpend: number;
  totalAdSales: number;
  totalOrders: number;
  /** Section 3: from Business Report */
  totalSessions: number;
  totalPageViews: number;
  buyBoxPercent: number;
  totalUnitsOrdered: number;
  currency: DetectedCurrency;
  files: { name: string; rows: number; type: ReportType }[];
  currencySample: unknown[];
  storeMetrics: StoreMetrics;
  keywordMetrics: Record<string, KeywordMetrics>;
  asinMetrics: Record<string, AsinMetrics>;
  campaignMetrics: Record<string, CampaignMetrics>;
  /** Section 4: funnel totals from Campaign Report */
  totalImpressions: number;
  totalClicks: number;
  /** Section 5: attribution from Campaign Report */
  attributedSales7d: number;
  attributedSales14d: number;
  attributedUnitsOrdered: number;
  /** Per-report-type totals for reconciliation debug (only when NEXT_PUBLIC_AUDIT_METRICS_DEBUG=true) */
  reportTypeTotals?: Partial<
    Record<
      AdvertisingReportSubtype,
      { spend: number; sales: number; clicks: number; impressions: number; orders: number }
    >
  >;
  /** Raw rows for canonical aggregation (single source of truth). */
  rawSpAdvertisedRows: Record<string, string>[];
  rawSpTargetingRows: Record<string, string>[];
  rawSpSearchTermRows: Record<string, string>[];
  rawBusinessRows: Record<string, string>[];
  /** Result of aggregateReports(); used by all metric tiles and agents. */
  aggregatedMetrics?: AggregatedMetrics;
  /** Result of runInvariants(); failed errors surface in UI banner. */
  invariantResults?: InvariantResult[];
}

function createEmptyStore(): MemoryStore {
  return {
    uniqueColumns: new Set(),
    totalStoreSales: 0,
    totalAdSpend: 0,
    totalAdSales: 0,
    totalOrders: 0,
    totalSessions: 0,
    totalPageViews: 0,
    buyBoxPercent: 0,
    totalUnitsOrdered: 0,
    currency: null,
    files: [],
    currencySample: [],
    storeMetrics: createEmptyStoreMetrics(),
    keywordMetrics: {},
    asinMetrics: {},
    campaignMetrics: {},
    totalImpressions: 0,
    totalClicks: 0,
    attributedSales7d: 0,
    attributedSales14d: 0,
    attributedUnitsOrdered: 0,
    rawSpAdvertisedRows: [],
    rawSpTargetingRows: [],
    rawSpSearchTermRows: [],
    rawBusinessRows: [],
  };
}

const EMPTY_STORE = createEmptyStore();

/** Known Amazon column names used to detect the true header row in first 10 rows. */
const KNOWN_AMAZON_HEADERS = [
  'Campaign Name',
  'Campaign',
  'Advertised SKU',
  'Advertised ASIN',
  'Customer Search Term',
  'Search Term',
  'Keyword Text',
  'Ordered Product Sales',
  'Spend',
  '7 Day Total Sales',
  'Sessions',
  'Units Ordered',
  'Total Order Items',
].map((h) => normalizeHeader(h));

/**
 * Scan the first maxRows lines to find the first row that looks like a CSV header
 * (contains at least one known Amazon column name). Returns row index (0-based).
 */
function detectHeaderRowIndex(lines: string[], maxRows = 10): number {
  for (let i = 0; i < Math.min(maxRows, lines.length); i++) {
    const line = lines[i];
    if (!line || typeof line !== 'string') continue;
    const cells = line.split(',').map((c) => normalizeHeader(c.trim()));
    for (const known of KNOWN_AMAZON_HEADERS) {
      if (cells.some((c) => c === known || c.includes(known) || known.includes(c))) return i;
    }
  }
  return 0;
}

function sanitizeCurrency(value: string | number): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

function getNumeric(row: Record<string, unknown>, rawKey: string | undefined): number {
  if (!rawKey || row[rawKey] == null) return 0;
  return sanitizeCurrency(row[rawKey] as any);
}

function getStr(row: Record<string, unknown>, rawKey: string | undefined): string {
  if (!rawKey || row[rawKey] == null) return '';
  return String(row[rawKey]).trim();
}

/** Copy row to Record<string, string> for aggregateReports. */
function rowToRecord(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(row)) {
    if (k === '_sourceFile') continue;
    out[k] = String(row[k] ?? '');
  }
  return out;
}

/** Parse business file from CSV string (first line = header). */
function parseBusinessFileFromContent(
  contentFromHeader: string,
  fileName: string,
  headerRowIndex: number,
  store: MemoryStore,
  skuToAsinMap: SkuToAsinMap,
  onProgress?: (file: string, rows: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let headerMap: HeaderMap | null = null;
    let rowCount = 0;
    let buyBoxSum = 0;
    let buyBoxCount = 0;
    let unitSessionSum = 0;
    let unitSessionCount = 0;

    Papa.parse(contentFromHeader, {
      header: true,
      skipEmptyLines: true,
      chunkSize: PARSER_CHUNK_SIZE,
      dynamicTyping: false,
      worker: false,
      step: (results, _parser) => {
        const row = results.data as Record<string, unknown>;
        if (!row || typeof row !== 'object') return;
        rowCount++;
        if (rowCount > MAX_ROWS_PER_FILE) return;

        if (!headerMap) {
          const rawHeaders = Object.keys(row).filter((k) => k !== '_sourceFile');
          headerMap = mapHeaders(rawHeaders);
          for (const k of Object.keys(headerMap)) store.uniqueColumns.add(k);
        }

        const sales = getNumeric(row, headerMap!.orderedProductSales) || getNumeric(row, headerMap!.sales);
        store.totalStoreSales += sales;

        store.totalSessions += getNumeric(row, headerMap!.sessions);
        store.totalPageViews += getNumeric(row, headerMap!.pageViews);
        const units = getNumeric(row, headerMap!.units) || getNumeric(row, headerMap!.orders);
        if (units > 0) store.totalUnitsOrdered += units;

        const buyBox = getNumeric(row, headerMap!.buyBox);
        if (buyBox > 0) { buyBoxSum += buyBox; buyBoxCount++; }
        const unitSess = getNumeric(row, headerMap!.unitSession);
        if (unitSess > 0) { unitSessionSum += unitSess; unitSessionCount++; }

        if (headerMap!.sku && headerMap!.asin) {
          const sku = String(row[headerMap!.sku] ?? '').trim();
          const asin = String(row[headerMap!.asin] ?? '').trim();
          if (sku && asin) skuToAsinMap[sku] = asin;
        }

        if (store.currencySample.length < 100) {
          const raw = row[headerMap!.orderedProductSales ?? ''] ?? row[headerMap!.sales ?? ''];
          if (raw != null) store.currencySample.push(raw);
        }

        if (store.rawBusinessRows.length < MAX_ROWS_PER_FILE) {
          store.rawBusinessRows.push(rowToRecord(row));
        }

        if (onProgress && rowCount % 5000 === 0) onProgress(fileName, rowCount);
      },
      complete: () => {
        if (buyBoxCount > 0) store.buyBoxPercent = buyBoxSum / buyBoxCount;
        store.files.push({ name: fileName, rows: rowCount, type: 'business' });
        if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
          // eslint-disable-next-line no-console
          console.log('[ParserDebug] File:', fileName);
          // eslint-disable-next-line no-console
          console.log('[ParserDebug] Rows parsed:', rowCount);
          // eslint-disable-next-line no-console
          console.log('[ParserDebug] Header detected at row:', headerRowIndex);
          // eslint-disable-next-line no-console
          console.log('[SchemaDebug] Report type: Business');
          // eslint-disable-next-line no-console
          console.log('[SchemaDebug] Rows after mapping:', rowCount);
        }
        resolve();
      },
      error: (err: unknown) => reject(err),
    });
  });
}

const REPORT_TYPE_LABEL: Record<AdvertisingReportSubtype, string> = {
  campaign: 'Campaign',
  advertised_product: 'Advertised Product',
  targeting: 'Targeting',
  search_term: 'Search Term',
  unknown: 'Unknown',
};

/** Debug probe: raw CSV totals before schema mapping. Only when NEXT_PUBLIC_AUDIT_METRICS_DEBUG=true. */
function debugRawAdvertisedTotals(
  rowCount: number,
  rawSpend: number,
  rawSales: number
): void {
  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG !== 'true') return;
  // eslint-disable-next-line no-console
  console.log('DEBUG RAW ADVERTISED ROWS:', rowCount);
  // eslint-disable-next-line no-console
  console.log('DEBUG RAW ADVERTISED SPEND:', rawSpend);
  // eslint-disable-next-line no-console
  console.log('DEBUG RAW ADVERTISED SALES:', rawSales);
}

function ensureReportTypeTotals(
  store: MemoryStore,
  subtype: AdvertisingReportSubtype
): { spend: number; sales: number; clicks: number; impressions: number; orders: number } {
  if (!store.reportTypeTotals) store.reportTypeTotals = {};
  if (!store.reportTypeTotals[subtype])
    store.reportTypeTotals[subtype] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
  return store.reportTypeTotals[subtype]!;
}

/** Parse advertising file from CSV string (first line = header). */
function parseAdvertisingFileFromContent(
  contentFromHeader: string,
  fileName: string,
  headerRowIndex: number,
  store: MemoryStore,
  skuToAsinMap: SkuToAsinMap,
  seenRows: Set<string>,
  subtype: AdvertisingReportSubtype,
  onProgress?: (file: string, rows: number) => void,
  options?: { contributeToTotals: boolean }
): Promise<void> {
  const contributeToTotals = options?.contributeToTotals !== false;
  return new Promise((resolve, reject) => {
    let headerMap: HeaderMap | null = null;
    let rowCount = 0;
    const diag = ensureReportTypeTotals(store, subtype);
    let rawDebugSpend = 0;
    let rawDebugSales = 0;

    Papa.parse(contentFromHeader, {
      header: true,
      skipEmptyLines: true,
      chunkSize: PARSER_CHUNK_SIZE,
      dynamicTyping: false,
      worker: false,
      step: (results, _parser) => {
        const row = results.data as Record<string, unknown>;
        if (!row || typeof row !== 'object') return;
        rowCount++;
        if (rowCount > MAX_ROWS_PER_FILE) return;

        if (!headerMap) {
          const rawHeaders = Object.keys(row).filter((k) => k !== '_sourceFile');
          headerMap = mapHeaders(rawHeaders);
          for (const k of Object.keys(headerMap)) store.uniqueColumns.add(k);
        }

        const dateRaw = getStr(row, headerMap!.date);
        const dateNorm = normalizeDate(dateRaw);
        const campaign = getStr(row, headerMap!.campaignName);
        const adGroup = getStr(row, headerMap!.adGroup);
        const keyword = getStr(row, headerMap!.searchTerm);
        const asin = resolveAsin(row, headerMap!.asin, headerMap!.sku, skuToAsinMap);

        // IMPORTANT: Never deduplicate SP Advertised Product Report rows.
        // Deduplication by composite key is only allowed for non-advertised_product subtypes.
        if (subtype !== 'advertised_product') {
          const key = compositeKey({ date: dateNorm, campaign, adGroup, keyword, asin });
          if (isDuplicate(key, seenRows)) return;
        }

        if (
          process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true' &&
          subtype === 'advertised_product' &&
          headerMap!.sku
        ) {
          const rawSpendVal =
            parseFloat(String(row[headerMap!.spend] ?? row['Spend'] ?? 0).replace(/[^0-9.-]/g, '')) || 0;
          const rawSalesVal =
            parseFloat(
              String(row[headerMap!['sales7d']] ?? row['7 Day Total Sales'] ?? 0).replace(/[^0-9.-]/g, '')
            ) || 0;
          rawDebugSpend += rawSpendVal;
          rawDebugSales += rawSalesVal;
        }

        const spend = extractCanonicalValue(row, AMAZON_COLUMN_MAP.spend);
        const sales7d = extractCanonicalValue(row, AMAZON_COLUMN_MAP.sales7d);
        const sales = sales7d || getNumeric(row, headerMap!['sales14d']);
        const sales14d = getNumeric(row, headerMap!['sales14d']);
        const clicks = extractCanonicalValue(row, AMAZON_COLUMN_MAP.clicks);
        const impressions = extractCanonicalValue(row, AMAZON_COLUMN_MAP.impressions);
        const orders = extractCanonicalValue(row, AMAZON_COLUMN_MAP.orders) || getNumeric(row, headerMap!.units);

        diag.spend += spend;
        diag.sales += sales;
        diag.clicks += clicks;
        diag.impressions += impressions;
        diag.orders += orders;

        if (contributeToTotals) {
          store.totalAdSpend += spend;
          store.totalAdSales += sales;
          if (orders > 0) store.totalOrders += orders;
          store.totalImpressions += impressions;
          store.totalClicks += clicks;
          store.attributedSales7d += sales7d;
          store.attributedSales14d += sales14d;
          store.attributedUnitsOrdered += orders;
        }
        if (store.currencySample.length < 100) {
          if (row[headerMap!.spend] != null) store.currencySample.push(row[headerMap!.spend]);
          if (row[headerMap!.sales] != null) store.currencySample.push(row[headerMap!.sales]);
        }

        const kwKey = `${keyword}|${campaign}|${getStr(row, headerMap!.matchType)}|${asin}`;
        if (!store.keywordMetrics[kwKey])
          store.keywordMetrics[kwKey] = {
            searchTerm: keyword,
            campaign,
            matchType: getStr(row, headerMap!.matchType),
            asin: asin || undefined,
            spend: 0,
            sales: 0,
            clicks: 0,
            acos: 0,
            roas: 0,
          };
        store.keywordMetrics[kwKey].spend += spend;
        store.keywordMetrics[kwKey].sales += sales;
        store.keywordMetrics[kwKey].clicks += clicks;

        if (asin) {
          if (!store.asinMetrics[asin])
            store.asinMetrics[asin] = {
              asin,
              sessions: 0,
              pageViews: 0,
              adSpend: 0,
              adSales: 0,
              totalSales: 0,
              acos: 0,
            };
          store.asinMetrics[asin].adSpend += spend;
          store.asinMetrics[asin].adSales += sales;
          store.asinMetrics[asin].sessions += getNumeric(row, headerMap!.sessions);
          store.asinMetrics[asin].pageViews += getNumeric(row, headerMap!.pageViews);
        }

        const campKey = campaign || '_unknown_';
        if (!store.campaignMetrics[campKey])
          store.campaignMetrics[campKey] = {
            campaignName: campaign,
            spend: 0,
            sales: 0,
            acos: 0,
            budget: 0,
          };
        store.campaignMetrics[campKey].spend += spend;
        store.campaignMetrics[campKey].sales += sales;
        store.campaignMetrics[campKey].budget += getNumeric(row, headerMap!.budget);

        if (subtype === 'advertised_product' && store.rawSpAdvertisedRows.length < MAX_ROWS_PER_FILE) {
          store.rawSpAdvertisedRows.push(rowToRecord(row));
        } else if (subtype === 'targeting' && store.rawSpTargetingRows.length < MAX_ROWS_PER_FILE) {
          store.rawSpTargetingRows.push(rowToRecord(row));
        } else if (subtype === 'search_term' && store.rawSpSearchTermRows.length < MAX_ROWS_PER_FILE) {
          store.rawSpSearchTermRows.push(rowToRecord(row));
        }

        if (onProgress && rowCount % 5000 === 0) onProgress(fileName, rowCount);
      },
      complete: () => {
        store.files.push({ name: fileName, rows: rowCount, type: 'advertising' });
        if (
          process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true' &&
          subtype === 'advertised_product' &&
          headerMap?.sku
        ) {
          debugRawAdvertisedTotals(rowCount, rawDebugSpend, rawDebugSales);
        }
        if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
          // eslint-disable-next-line no-console
          console.log('[ParserDebug] File:', fileName);
          // eslint-disable-next-line no-console
          console.log('[ParserDebug] Rows parsed:', rowCount);
          // eslint-disable-next-line no-console
          console.log('[ParserDebug] Header detected at row:', headerRowIndex);
          // eslint-disable-next-line no-console
          console.log('[SchemaDebug] Report type:', REPORT_TYPE_LABEL[subtype]);
          // eslint-disable-next-line no-console
          console.log('[SchemaDebug] Rows after mapping:', rowCount);
        }
        resolve();
      },
      error: (err: unknown) => reject(err),
    });
  });
}

/** Get header map and report type from CSV content (first line = header). */
function getHeaderMapFromText(csvContentFromHeader: string): { headerMap: HeaderMap; type: ReportType } {
  const parsed = Papa.parse(csvContentFromHeader, { header: true, preview: 1, skipEmptyLines: true });
  const row = parsed.data?.[0] as Record<string, unknown> | undefined;
  const fields = row ? Object.keys(row) : (parsed.meta?.fields ?? []);
  const headerMap = mapHeaders(fields);
  return { headerMap, type: classifyReportType(headerMap) };
}

export type PipelineStageCallback = (stage: string, status: 'running' | 'completed' | 'failed', error?: string) => void;

export async function parseReportsStreaming(
  files: File[],
  onProgress?: (file: string, rows: number) => void,
  onStageUpdate?: PipelineStageCallback
): Promise<MemoryStore> {
  const store = createEmptyStore();
  const seenRows = new Set<string>();

  onStageUpdate?.('header_detection', 'running');
  const fileInfos: Array<{
    file: File;
    type: ReportType;
    headerMap: HeaderMap;
    headerRowIndex: number;
    contentFromHeader: string;
    subtype?: AdvertisingReportSubtype;
  }> = [];
  for (const file of files) {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const headerRowIndex = detectHeaderRowIndex(lines);
    const contentFromHeader = lines.slice(headerRowIndex).join('\n');
    const { headerMap, type } = getHeaderMapFromText(contentFromHeader);
    const subtype = type === 'advertising' ? classifyAdvertisingReportSubtype(headerMap) : undefined;
    fileInfos.push({ file, type, headerMap, headerRowIndex, contentFromHeader, subtype });
  }
  onStageUpdate?.('header_detection', 'completed');
  onStageUpdate?.('report_type_classification', 'completed');
  onStageUpdate?.('column_mapping', 'completed');
  onStageUpdate?.('report_parsing', 'running');

  const businessFiles = fileInfos.filter((f) => f.type === 'business');
  const adFiles = fileInfos.filter((f) => f.type === 'advertising');
  const otherFiles = fileInfos.filter((f) => f.type === 'unknown');

  const skuToAsinMap: SkuToAsinMap = {};
  for (const info of businessFiles) {
    await parseBusinessFileFromContent(
      info.contentFromHeader,
      info.file.name,
      info.headerRowIndex,
      store,
      skuToAsinMap,
      onProgress
    );
  }

  const campaignFiles = adFiles.filter((f) => f.subtype === 'campaign');
  const advertisedProductFiles = adFiles.filter((f) => f.subtype === 'advertised_product');
  const targetingFiles = adFiles.filter((f) => f.subtype === 'targeting');
  const searchTermFiles = adFiles.filter((f) => f.subtype === 'search_term');
  const otherAdFiles = adFiles.filter((f) => f.subtype === 'unknown');

  let adSourceForTotals: 'campaign' | 'advertised_product' | 'targeting' | 'none' = 'none';
  // Account-level ad totals MUST come from SP Advertised Product Report only.
  // Targeting and Search Term reports are analysis-only and never contribute to totals.
  if (advertisedProductFiles.length > 0) adSourceForTotals = 'advertised_product';

  const allAdGroups = [
    ...campaignFiles,
    ...advertisedProductFiles,
    ...targetingFiles,
    ...searchTermFiles,
    ...otherAdFiles,
  ];

  for (const info of allAdGroups) {
    const subtype = info.subtype ?? 'unknown';
    const contributeToTotals = subtype === adSourceForTotals;
    await parseAdvertisingFileFromContent(
      info.contentFromHeader,
      info.file.name,
      info.headerRowIndex,
      store,
      skuToAsinMap,
      seenRows,
      subtype,
      onProgress,
      { contributeToTotals }
    );
  }

  for (const info of otherFiles) {
    const { headerMap, contentFromHeader, file, headerRowIndex } = info;
    const hasSpend = !!headerMap.spend;
    const hasSales = !!headerMap.orderedProductSales || !!headerMap.sales;
    if (hasSales && !hasSpend) {
      await parseBusinessFileFromContent(
        contentFromHeader,
        file.name,
        headerRowIndex,
        store,
        skuToAsinMap,
        onProgress
      );
    } else if (hasSpend) {
      const subtype = classifyAdvertisingReportSubtype(headerMap);
      // Only SP Advertised Product Report contributes to account-level ad totals.
      const contributeToTotals = subtype === 'advertised_product';
      await parseAdvertisingFileFromContent(
        contentFromHeader,
        file.name,
        headerRowIndex,
        store,
        skuToAsinMap,
        seenRows,
        subtype,
        onProgress,
        { contributeToTotals }
      );
    }
  }

  // Single source of truth: aggregateReports() produces all account-level metrics.
  const result = aggregateReports(
    store.rawSpAdvertisedRows,
    store.rawSpTargetingRows,
    store.rawSpSearchTermRows,
    store.rawBusinessRows
  );
  store.aggregatedMetrics = result;
  store.totalAdSpend = result.adSpend;
  store.totalAdSales = result.adSales;
  store.totalStoreSales = result.totalStoreSales;
  store.totalOrders = result.adOrders;
  store.totalClicks = result.adClicks;
  store.totalImpressions = result.adImpressions;
  store.totalSessions = result.sessions;
  store.totalUnitsOrdered = result.unitsOrdered;
  store.buyBoxPercent = result.buyBoxPct ?? 0;
  store.attributedSales7d = result.adSales;
  store.attributedUnitsOrdered = result.adOrders;

  const invariantResults = runInvariants(result);
  store.invariantResults = invariantResults;
  const failedErrors = invariantResults.filter((r) => !r.passed && r.severity === 'error');
  if (failedErrors.length > 0) {
    failedErrors.forEach((r) => {
      // eslint-disable-next-line no-console
      console.error('[INVARIANT FAIL]', r.name, r.description, { passed: r.passed });
    });
  }

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('[AGGREGATION COMPLETE]', {
      adSpend: result.adSpend,
      adSales: result.adSales,
      totalStoreSales: result.totalStoreSales,
      organicSales: result.organicSales,
      acos: result.acos,
      tacos: result.tacos,
      roas: result.roas,
      adCvr: result.adCvr,
      rows: result.rowCounts,
      log: result._ingestionLog,
    });
  }

  onStageUpdate?.('report_parsing', 'completed');
  onStageUpdate?.('currency_normalization', 'running');
  store.currency = detectCurrencyFromValues(store.currencySample);
  onStageUpdate?.('currency_normalization', 'completed');
  onStageUpdate?.('metric_computation', 'running');
  for (const k of Object.keys(store.keywordMetrics)) {
    const m = store.keywordMetrics[k];
    const { acos, roas } = computeKeywordMetrics(m.spend, m.sales, m.clicks);
    m.acos = acos;
    m.roas = roas;
  }
  for (const asin of Object.keys(store.asinMetrics)) {
    const m = store.asinMetrics[asin];
    m.acos = computeAsinMetrics(m.adSpend, m.adSales, m.totalSales).acos;
  }
  for (const camp of Object.keys(store.campaignMetrics)) {
    const m = store.campaignMetrics[camp];
    m.acos = computeCampaignMetrics(m.spend, m.sales).acos;
  }

  const top10AsinSales = Object.values(store.asinMetrics)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10)
    .reduce((sum, a) => sum + a.totalSales, 0);
  const revenueConcentrationTop10Asin =
    store.totalStoreSales > 0 ? top10AsinSales / store.totalStoreSales : 0;
  const wastedSpend = Object.values(store.keywordMetrics)
    .filter((k) => k.sales === 0)
    .reduce((s, k) => s + k.spend, 0);

  store.storeMetrics = computeStoreMetrics(
    store.totalStoreSales,
    store.totalAdSpend,
    store.totalAdSales,
    {
      totalSessions: store.totalSessions,
      totalOrders: store.totalOrders,
      revenueConcentrationTop10Asin,
      attributedSales7d: store.attributedSales7d,
      attributedSales14d: store.attributedSales14d,
      attributedUnitsOrdered: store.attributedUnitsOrdered,
      totalClicks: store.totalClicks,
      wastedSpend,
      targetACOSPct: 15,
    }
  );
  onStageUpdate?.('metric_computation', 'completed');
  return store;
}

export { EMPTY_STORE, createEmptyStore };