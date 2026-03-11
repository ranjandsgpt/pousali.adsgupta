/**
 * Self-Healing Pipeline: Map uploaded Amazon report headers to canonical metric fields.
 * Uses Gemini via audit-self-healing API. Locale/variant headers are normalized to a single schema.
 */

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
