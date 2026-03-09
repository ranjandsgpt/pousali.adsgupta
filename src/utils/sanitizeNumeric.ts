/**
 * Numeric sanitizer for Amazon CSV fields.
 *
 * Strips currency symbols (€, £, $), percent signs (%), commas and other
 * non-numeric characters so that values like "£141,589.10" or "2,398"
 * can be safely parsed as numbers.
 */
export function sanitizeNumeric(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value === null || value === undefined || value === '') return 0;
  let str = String(value).trim();
  // Strip currency symbols and percent signs
  str = str.replace(/[€£$%]/g, '');
  // Strip commas and any other non-digit except '.' and '-'
  str = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(str);
  return Number.isNaN(num) ? 0 : num;
}

