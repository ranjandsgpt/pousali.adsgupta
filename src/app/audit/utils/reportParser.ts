/**
 * Section 2 & 15: Multi-file ingestion with streaming.
 * Section 12: SKU→ASIN (business first, then ad with resolution).
 * Section 14: Dedupe by composite key (date+campaign+adGroup+keyword+asin).
 * Section 16: Store, keyword, ASIN, campaign aggregation.
 */

import Papa from 'papaparse';
import { PARSER_CHUNK_SIZE, MAX_ROWS_PER_FILE } from './constants';
import { mapHeaders, classifyReportType, type HeaderMap } from './headerMapper';
import { sanitizeNumeric } from './sanitizeNumeric';
import { detectCurrencyFromValues, type DetectedCurrency } from './currencyDetector';
import { normalizeDate } from './dateNormalizer';
import { resolveAsin, type SkuToAsinMap } from './skuToAsin';
import { compositeKey, isDuplicate } from './duplicateDetection';
import {
  computeStoreMetrics,
  computeKeywordMetrics,
  computeAsinMetrics,
  computeCampaignMetrics,
  type StoreMetrics,
  type KeywordMetrics,
  type AsinMetrics,
  type CampaignMetrics,
} from './aggregation';

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
  currency: DetectedCurrency;
  files: { name: string; rows: number; type: ReportType }[];
  currencySample: unknown[];
  /** Section 16 */
  storeMetrics: StoreMetrics;
  keywordMetrics: Record<string, KeywordMetrics>;
  asinMetrics: Record<string, AsinMetrics>;
  campaignMetrics: Record<string, CampaignMetrics>;
}

function createEmptyStore(): MemoryStore {
  return {
    uniqueColumns: new Set(),
    totalStoreSales: 0,
    totalAdSpend: 0,
    totalAdSales: 0,
    currency: null,
    files: [],
    currencySample: [],
    storeMetrics: {
      totalSales: 0,
      totalAdSpend: 0,
      totalAdSales: 0,
      tacos: 0,
      roas: 0,
      organicSales: 0,
    },
    keywordMetrics: {},
    asinMetrics: {},
    campaignMetrics: {},
  };
}

const EMPTY_STORE = createEmptyStore();

function getNumeric(row: Record<string, unknown>, rawKey: string | undefined): number {
  if (!rawKey || row[rawKey] == null) return 0;
  return sanitizeNumeric(row[rawKey]);
}

function getStr(row: Record<string, unknown>, rawKey: string | undefined): string {
  if (!rawKey || row[rawKey] == null) return '';
  return String(row[rawKey]).trim();
}

/** Parse business file: build SKU→ASIN map and sum totalStoreSales (Section 12). */
function parseBusinessFile(
  file: File,
  store: MemoryStore,
  skuToAsinMap: SkuToAsinMap,
  onProgress?: (file: string, rows: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let headerMap: HeaderMap | null = null;
    let rowCount = 0;
    const fileName = file.name;

    Papa.parse(file, {
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

        if (headerMap!.sku && headerMap!.asin) {
          const sku = String(row[headerMap!.sku] ?? '').trim();
          const asin = String(row[headerMap!.asin] ?? '').trim();
          if (sku && asin) skuToAsinMap[sku] = asin;
        }

        if (store.currencySample.length < 100) {
          const raw = row[headerMap!.orderedProductSales ?? ''] ?? row[headerMap!.sales ?? ''];
          if (raw != null) store.currencySample.push(raw);
        }

        if (onProgress && rowCount % 5000 === 0) onProgress(fileName, rowCount);
      },
      complete: () => {
        store.files.push({ name: fileName, rows: rowCount, type: 'business' });
        resolve();
      },
      error: (err) => reject(err),
    });
  });
}

/** Parse advertising file: dedupe, resolve ASIN, aggregate. */
function parseAdvertisingFile(
  file: File,
  store: MemoryStore,
  skuToAsinMap: SkuToAsinMap,
  seenRows: Set<string>,
  onProgress?: (file: string, rows: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let headerMap: HeaderMap | null = null;
    let rowCount = 0;
    const fileName = file.name;

    Papa.parse(file, {
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

        const key = compositeKey({ date: dateNorm, campaign, adGroup, keyword, asin });
        if (isDuplicate(key, seenRows)) return;

        const spend = getNumeric(row, headerMap!.spend);
        const sales = getNumeric(row, headerMap!.sales);
        const clicks = getNumeric(row, headerMap!.clicks);

        store.totalAdSpend += spend;
        store.totalAdSales += sales;
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

        if (onProgress && rowCount % 5000 === 0) onProgress(fileName, rowCount);
      },
      complete: () => {
        store.files.push({ name: fileName, rows: rowCount, type: 'advertising' });
        resolve();
      },
      error: (err) => reject(err),
    });
  });
}

/** First row only to get header map and type. */
function getHeaderMapFromFile(file: File): Promise<{ headerMap: HeaderMap; type: ReportType }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      preview: 1,
      skipEmptyLines: true,
      complete: (results) => {
        const row = results.data?.[0] as Record<string, unknown> | undefined;
        const fields = row ? Object.keys(row) : (results.meta?.fields ?? []);
        const headerMap = mapHeaders(fields);
        resolve({ headerMap, type: classifyReportType(headerMap) });
      },
      error: (err) => reject(err),
    });
  });
}

export async function parseReportsStreaming(
  files: File[],
  onProgress?: (file: string, rows: number) => void
): Promise<MemoryStore> {
  const store = createEmptyStore();
  const seenRows = new Set<string>();

  const fileInfos: Array<{ file: File; type: ReportType; headerMap: HeaderMap }> = [];
  for (const file of files) {
    const { headerMap, type } = await getHeaderMapFromFile(file);
    fileInfos.push({ file, type, headerMap });
  }

  const businessFiles = fileInfos.filter((f) => f.type === 'business');
  const adFiles = fileInfos.filter((f) => f.type === 'advertising');
  const otherFiles = fileInfos.filter((f) => f.type === 'unknown');

  const skuToAsinMap: SkuToAsinMap = {};
  for (const { file } of businessFiles) {
    await parseBusinessFile(file, store, skuToAsinMap, onProgress);
  }

  for (const { file } of adFiles) {
    await parseAdvertisingFile(file, store, skuToAsinMap, seenRows, onProgress);
  }

  for (const { file, headerMap } of otherFiles) {
    const hasSpend = !!headerMap.spend;
    const hasSales = !!headerMap.orderedProductSales || !!headerMap.sales;
    if (hasSales && !hasSpend) {
      await parseBusinessFile(file, store, skuToAsinMap, onProgress);
    } else if (hasSpend) {
      await parseAdvertisingFile(file, store, skuToAsinMap, seenRows, onProgress);
    }
  }

  store.currency = detectCurrencyFromValues(store.currencySample);

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

  store.storeMetrics = computeStoreMetrics(
    store.totalStoreSales,
    store.totalAdSpend,
    store.totalAdSales
  );

  return store;
}

export { EMPTY_STORE, createEmptyStore };