/**
 * Section 17: Currency detection engine.
 * Scan first N rows of sales/spend columns to detect symbol; store for UI formatting.
 */

import { CURRENCY_SCAN_ROWS } from './constants';

export type DetectedCurrency = 'USD' | 'EUR' | 'GBP' | 'INR' | null;

const SYMBOL_TO_CODE: Record<string, DetectedCurrency> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '₹': 'INR',
};

export function getCurrencySymbol(code: DetectedCurrency): string {
  switch (code) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'INR': return '₹';
    case 'USD': return '$';
    default: return '$';
  }
}

/**
 * Scan first CURRENCY_SCAN_ROWS (100) rows of the given column values.
 * Detects $, €, £, ₹ from string values (e.g. "$1,245.22").
 */
export function detectCurrencyFromValues(values: unknown[]): DetectedCurrency {
  const scan = values.slice(0, CURRENCY_SCAN_ROWS);
  for (const v of scan) {
    const str = typeof v === 'string' ? v : String(v ?? '');
    for (const symbol of Object.keys(SYMBOL_TO_CODE)) {
      if (str.includes(symbol)) return SYMBOL_TO_CODE[symbol];
    }
  }
  return null;
}

/**
 * From parsed rows and canonical column keys for "sales" and "spend",
 * collect values from those columns and run detection.
 */
export function detectCurrencyFromRows(
  rows: Record<string, unknown>[],
  salesColumnKey: string | undefined,
  spendColumnKey: string | undefined
): DetectedCurrency {
  const values: unknown[] = [];
  const take = Math.min(rows.length, CURRENCY_SCAN_ROWS);
  for (let i = 0; i < take; i++) {
    const row = rows[i];
    if (salesColumnKey && row[salesColumnKey] != null) values.push(row[salesColumnKey]);
    if (spendColumnKey && row[spendColumnKey] != null) values.push(row[spendColumnKey]);
  }
  return detectCurrencyFromValues(values);
}
