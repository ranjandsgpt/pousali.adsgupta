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
