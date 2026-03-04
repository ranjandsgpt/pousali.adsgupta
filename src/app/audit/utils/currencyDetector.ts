/**
 * Detect currency symbol/code from report headers or sample data.
 * Stub: implement when connecting parsing (€, £, $).
 */
export type DetectedCurrency = 'EUR' | 'GBP' | 'USD' | null;

export function detectCurrency(_headers: string[], _sampleRow?: Record<string, unknown>): DetectedCurrency {
  return null;
}

export function getCurrencySymbol(code: DetectedCurrency): string {
  switch (code) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'USD': return '$';
    default: return '$';
  }
}
