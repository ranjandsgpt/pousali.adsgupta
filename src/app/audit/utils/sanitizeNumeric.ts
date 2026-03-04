/**
 * Section 3: Numerical Sanitizer for international Amazon reports.
 * Strips currency symbols (€, £, $), percent signs (%), and commas
 * e.g. €1,258.94 → 1258.94
 */
export function sanitizeNumeric(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value === null || value === undefined || value === '') return 0;
  let str = String(value).trim();
  // Strip currency symbols and percent
  str = str.replace(/[€£$%]/g, '');
  // Strip commas (and any other non-digit except . and -)
  str = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(str);
  return Number.isNaN(num) ? 0 : num;
}
