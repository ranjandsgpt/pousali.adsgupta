/**
 * Self-Healing Pipeline: Map uploaded Amazon report headers to canonical metric fields.
 * Canonical mapping for Amazon reports is hardcoded below; API remains for optional self-healing.
 */

import { sanitizeNumeric } from '@/utils/sanitizeNumeric';

/** Explicit Amazon column → canonical field mapping. No dynamic/fuzzy detection for metrics. */
export const AMAZON_COLUMN_MAP = {
  spend: ['Spend', 'Cost'],
  sales7d: [
    '7 Day Total Sales',
    '7-Day Total Sales',
    '7 Day Advertised Sales',
    'Sales',
    'Attributed Sales',
  ],
  clicks: ['Clicks'],
  impressions: ['Impressions'],
  orders: ['7 Day Total Orders (#)', 'Total Orders', 'Orders'],
  totalSales: ['Ordered Product Sales'],
} as const;

export function extractCanonicalValue(row: any, aliases: readonly string[]): number {
  for (const col of aliases) {
    if (row[col] !== undefined) {
      return sanitizeNumeric(row[col]);
    }
  }
  return 0;
}

/** Return a row with only canonical fields for metric engine consumption. */
export function canonicalizeRow(row: any): {
  spend: number;
  sales7d: number;
  clicks: number;
  impressions: number;
  orders: number;
  totalSales: number;
} {
  return {
    spend: extractCanonicalValue(row, AMAZON_COLUMN_MAP.spend),
    sales7d: extractCanonicalValue(row, AMAZON_COLUMN_MAP.sales7d),
    clicks: extractCanonicalValue(row, AMAZON_COLUMN_MAP.clicks),
    impressions: extractCanonicalValue(row, AMAZON_COLUMN_MAP.impressions),
    orders: extractCanonicalValue(row, AMAZON_COLUMN_MAP.orders),
    totalSales: extractCanonicalValue(row, AMAZON_COLUMN_MAP.totalSales),
  };
}

export interface SchemaMapping {
  totalSales?: string;
  adSpend?: string;
  adSales?: string;
  clicks?: string;
  impressions?: string;
  orders?: string;
}

export async function mapHeadersToSchema(headers: string[]): Promise<SchemaMapping> {
  if (!headers?.length) return {};
  try {
    const res = await fetch('/api/audit-self-healing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'map_headers', headers }),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, string>;
    const out: SchemaMapping = {};
    if (typeof data.totalSales === 'string') out.totalSales = data.totalSales;
    if (typeof data.adSpend === 'string') out.adSpend = data.adSpend;
    if (typeof data.adSales === 'string') out.adSales = data.adSales;
    if (typeof data.clicks === 'string') out.clicks = data.clicks;
    if (typeof data.impressions === 'string') out.impressions = data.impressions;
    if (typeof data.orders === 'string') out.orders = data.orders;
    return out;
  } catch {
    return {};
  }
}

/** Alias for mapHeadersToSchema (user-facing name). */
export const mapHeaders = mapHeadersToSchema;

/**
 * Debug probe: totals from rows that have canonical fields (spend, sales7d).
 * Only run when NEXT_PUBLIC_AUDIT_METRICS_DEBUG === "true".
 * Call from metric engine with rows after schema mapping.
 */
export function debugSchemaTotals(rows: any[]): void {
  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG !== 'true') return;
  let spend = 0;
  let sales = 0;
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    spend += Number(r.spend) || 0;
    sales += Number(r.sales7d) || 0;
  }
  // eslint-disable-next-line no-console
  console.log('DEBUG SCHEMA ROWS:', rows.length);
  // eslint-disable-next-line no-console
  console.log('DEBUG SCHEMA SPEND:', spend);
  // eslint-disable-next-line no-console
  console.log('DEBUG SCHEMA SALES:', sales);
}
