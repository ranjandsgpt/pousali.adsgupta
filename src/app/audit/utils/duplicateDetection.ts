/**
 * Section 14: Duplicate row detection.
 * Dedupe using composite key: Date + Campaign + AdGroup + Keyword + ASIN.
 */

/**
 * Build composite hash key for a row. Normalized values joined.
 */
export function compositeKey(parts: {
  date: string;
  campaign: string;
  adGroup: string;
  keyword: string;
  asin: string;
}): string {
  const d = (parts.date ?? '').trim();
  const c = (parts.campaign ?? '').trim().toLowerCase();
  const a = (parts.adGroup ?? '').trim().toLowerCase();
  const k = (parts.keyword ?? '').trim().toLowerCase();
  const asin = (parts.asin ?? '').trim().toLowerCase();
  return `${d}|${c}|${a}|${k}|${asin}`;
}

/**
 * Returns true if key was already seen (duplicate).
 */
export function isDuplicate(key: string, seenRows: Set<string>): boolean {
  if (seenRows.has(key)) return true;
  seenRows.add(key);
  return false;
}
