/**
 * Section 2 & 15: Multi-file ingestion with streaming.
 * - _sourceFile tracking for provenance
 * - Set-based header collection across files
 * - ASIN Bridge: Global Store Aggregation (sum sales from Business, sum spend from Ad reports)
 */

import Papa from 'papaparse';
import { PARSER_CHUNK_SIZE, MAX_ROWS_PER_FILE } from './constants';
import { mapHeaders, classifyReportType, type HeaderMap } from './headerMapper';
import { sanitizeNumeric } from './sanitizeNumeric';
import {
  detectCurrencyFromValues,
  type DetectedCurrency,
} from './currencyDetector';

export type ReportType = 'business' | 'advertising' | 'unknown';

export interface ParsedRow {
  [key: string]: unknown;
  _sourceFile: string;
}

export interface MemoryStore {
  /** All unique canonical columns detected across files (Set-based) */
  uniqueColumns: Set<string>;
  /** Total store sales from Business Reports (Global Store Aggregation) */
  totalStoreSales: number;
  /** Total ad spend from Ad Reports */
  totalAdSpend: number;
  /** Detected currency from first 100 rows of sales/spend */
  currency: DetectedCurrency;
  /** Per-file row counts and types */
  files: { name: string; rows: number; type: ReportType }[];
  /** First ~100 row values for currency scan (sales/spend columns) */
  currencySample: unknown[];
}

function createEmptyStore(): MemoryStore {
  return {
    uniqueColumns: new Set(),
    totalStoreSales: 0,
    totalAdSpend: 0,
    currency: null,
    files: [],
    currencySample: [],
  };
}

const EMPTY_STORE = createEmptyStore();

function getNumeric(row: Record<string, unknown>, rawKey: string | undefined): number {
  if (!rawKey || row[rawKey] == null) return 0;
  return sanitizeNumeric(row[rawKey]);
}

/**
 * Stream-parse one CSV file and merge into running totals.
 * Enforces MAX_ROWS_PER_FILE; adds _sourceFile to each row for provenance.
 */
function parseOneFile(
  file: File,
  store: MemoryStore,
  onProgress?: (file: string, rows: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let headerMap: HeaderMap | null = null;
    let reportType: ReportType = 'unknown';
    let rowCount = 0;
    const fileName = file.name;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      chunkSize: PARSER_CHUNK_SIZE,
      dynamicTyping: false,
      worker: false, // keep main thread to avoid Next/browser worker issues; chunkSize still batches
      step: (results, _parser) => {
        const row = results.data as Record<string, unknown>;
        if (!row || typeof row !== 'object') return;

        rowCount++;
        if (rowCount > MAX_ROWS_PER_FILE) return; // stop processing this file

        if (!headerMap) {
          const rawHeaders = Object.keys(row).filter((k) => k !== '_sourceFile');
          headerMap = mapHeaders(rawHeaders);
          reportType = classifyReportType(headerMap);
          for (const k of Object.keys(headerMap)) store.uniqueColumns.add(k);
        }

        (row as ParsedRow)._sourceFile = fileName;

        const rawSpend = headerMap!.spend ? row[headerMap!.spend] : null;
        const rawSales = headerMap!.sales ? row[headerMap!.sales] : null;
        const rawOrderedSales = headerMap!.orderedProductSales ? row[headerMap!.orderedProductSales] : null;

        if (reportType === 'business') {
          const sales = getNumeric(row, headerMap!.orderedProductSales) || getNumeric(row, headerMap!.sales);
          store.totalStoreSales += sales;
          if (store.currencySample.length < 100) {
            if (rawOrderedSales != null) store.currencySample.push(rawOrderedSales);
            else if (rawSales != null) store.currencySample.push(rawSales);
          }
        } else if (reportType === 'advertising') {
          const spend = getNumeric(row, headerMap!.spend);
          store.totalAdSpend += spend;
          if (store.currencySample.length < 100) {
            if (rawSpend != null) store.currencySample.push(rawSpend);
            if (rawSales != null) store.currencySample.push(rawSales);
          }
        }

        if (onProgress && rowCount % 5000 === 0) onProgress(fileName, rowCount);
      },
      complete: () => {
        store.files.push({
          name: fileName,
          rows: rowCount,
          type: reportType,
        });
        resolve();
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Parse multiple files with streaming; merge into one MemoryStore.
 * Section 2: ASIN Bridge — sum total sales from Business, total spend from Ad reports independently.
 */
export async function parseReportsStreaming(
  files: File[],
  onProgress?: (file: string, rows: number) => void
): Promise<MemoryStore> {
  const store: MemoryStore = {
    uniqueColumns: new Set(),
    totalStoreSales: 0,
    totalAdSpend: 0,
    currency: null,
    files: [],
    currencySample: [],
  };

  for (const file of files) {
    await parseOneFile(file, store, onProgress);
  }

  store.currency = detectCurrencyFromValues(store.currencySample);
  return store;
}

export { EMPTY_STORE, createEmptyStore };
