/**
 * Map raw CSV headers to canonical column names for reports.
 * Handles missing columns: tool must still run and show available insights.
 * Stub: implement when connecting parsing.
 */
export type CanonicalColumn =
  | 'date'
  | 'sales'
  | 'adSpend'
  | 'orders'
  | 'units'
  | 'asin'
  | 'sku'
  | 'campaignName'
  | 'searchTerm'
  | 'keyword'
  | 'impressions'
  | 'clicks'
  | 'cost'
  | 'other';

export interface HeaderMap {
  [canonical: string]: string; // canonical -> raw header name
}

export function mapHeaders(rawHeaders: string[]): HeaderMap {
  return {};
}

export function hasRequiredForTACOS(map: HeaderMap): boolean {
  return false;
}

export function hasRequiredForACOS(map: HeaderMap): boolean {
  return false;
}
