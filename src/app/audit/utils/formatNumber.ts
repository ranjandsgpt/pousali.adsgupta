/**
 * Section 17: All UI numbers must render with detected currency, e.g. $1,245.22
 */
import type { DetectedCurrency } from './currencyDetector';
import { getCurrencySymbol } from './currencyDetector';

export function formatCurrency(
  value: number,
  currencyCode: DetectedCurrency,
  options?: { decimals?: number }
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const decimals = options?.decimals ?? 2;
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formatted}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
