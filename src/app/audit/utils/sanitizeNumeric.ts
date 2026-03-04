/**
 * Sanitize numeric values from CSV (strip currency, commas, etc.).
 * Stub: implement when connecting parsing/calculations.
 */
export function sanitizeNumeric(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value === null || value === undefined || value === '') return 0;
  const str = String(value).replace(/[^\d.-]/g, '').trim();
  const num = parseFloat(str);
  return Number.isNaN(num) ? 0 : num;
}
