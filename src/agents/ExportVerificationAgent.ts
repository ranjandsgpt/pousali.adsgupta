import type { AggregatedMetrics } from '@/lib/aggregateReports';

export type VerificationResult = {
  passed: boolean;
  warnings: string[];
  blocked: false;
};

export function verifyPptxOutput(
  _pptxBuffer: Buffer | Uint8Array,
  metrics: AggregatedMetrics,
  slideCount: number
): VerificationResult {
  const warnings: string[] = [];

  if (slideCount !== 10) {
    warnings.push(`Expected 10 slides, got ${slideCount}`);
  }

  if (metrics.adSales > 0 && (!metrics.acos || metrics.acos === 0)) {
    warnings.push('ACOS is 0 but adSales > 0 — likely a calculation error');
  }

  if (metrics.adSpend > 0 && (!metrics.roas || metrics.roas === 0)) {
    warnings.push('ROAS is 0 but adSpend > 0 — likely a calculation error');
  }

  if (metrics.totalStoreSales < metrics.adSales) {
    warnings.push('totalStoreSales < adSales — organic sales would be negative');
  }

  const criticalFields = ['totalStoreSales', 'adSpend', 'adSales'] as const;
  for (const field of criticalFields) {
    if (!metrics[field] || metrics[field] === 0) {
      warnings.push(`Critical metric ${field} is 0 or missing in export`);
    }
  }

  return {
    passed: warnings.length === 0,
    warnings,
    blocked: false,
  };
}

