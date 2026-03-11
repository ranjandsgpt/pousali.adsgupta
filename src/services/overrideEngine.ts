/**
 * Self-Healing Pipeline: Apply corrections to report data before metric calculation.
 * Overrides modify input data only; they never change deterministic formulas.
 */

import type { MetricExecutionInput } from './metricExecutionEngine';

export interface OverrideState {
  /** Enable currency sanitization on all numeric-like fields (default: true). */
  sanitizeCurrency?: boolean;

  /**
   * Legacy hint from Gemini self-healing for which report to prefer.
   * New code should use adSourceOverride instead.
   */
  preferredReport?: string;

  /** Legacy override for which business-report column to treat as Ordered Product Sales. */
  overrideSalesColumn?: string;

  /**
   * Preferred ad source for global ad totals. When set, overrides the default
   * advertised_product → targeting → campaign hierarchy in metricExecutionEngine.
   */
  adSourceOverride?: 'advertised_product' | 'targeting' | 'campaign';

  /**
   * Optional per-metric formula variants (e.g. alternative ACOS/ROAS definitions)
   * chosen by self-healing controller. Keys are metric IDs such as 'ACOS', 'ROAS'.
   */
  formulaOverrides?: {
    [metricId: string]: 'default' | 'alt1' | 'alt2';
  };

  /**
   * Strategy for computing organic sales.
   * - 'residual' (default): totalStoreSales - totalAdSales
   * - 'asin_join': use ASIN-level split from store.asinMetrics where available.
   */
  organicSplitStrategy?: 'residual' | 'asin_join';
}

/** Strip £ $ € , and any other non-numeric characters for parsing. */
export function sanitizeCurrencyValue(value: string | number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value == null || value === '') return 0;
  const str = String(value).trim();
  const cleaned = str.replace(/[£$€,]/g, '').replace(/\s/g, '').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Apply sanitization to a single row's numeric-like values. */
function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v != null && (typeof v === 'string' || typeof v === 'number')) {
      const s = String(v);
      if (/[\d.,£$€\s-]/.test(s) && /[\d]/.test(s)) {
        out[k] = sanitizeCurrencyValue(v);
      } else {
        out[k] = v;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Apply overrides to report input; returns new input with sanitized/remapped data. */
export function applyOverrides(
  reports: MetricExecutionInput,
  overrides: OverrideState
): MetricExecutionInput {
  const sanitize = overrides.sanitizeCurrency !== false;

  const mapRows = (rows: any[] | undefined): any[] => {
    if (!Array.isArray(rows)) return [];
    if (!sanitize) return rows;
    return rows.map((r) => (r && typeof r === 'object' ? sanitizeRow(r as Record<string, unknown>) : r));
  };

  const businessReport = mapRows(reports.businessReport);
  const campaignReport = mapRows(reports.campaignReport);
  const advertisedProductReport = mapRows(reports.advertisedProductReport);
  const targetingReport = mapRows(reports.targetingReport);
  const searchTermReport = reports.searchTermReport; // never used for totals; optional sanitize
  const out: MetricExecutionInput = {
    businessReport: businessReport.length ? businessReport : reports.businessReport,
    campaignReport: campaignReport.length ? campaignReport : reports.campaignReport,
    advertisedProductReport: advertisedProductReport.length ? advertisedProductReport : reports.advertisedProductReport,
    targetingReport: targetingReport.length ? targetingReport : reports.targetingReport,
    searchTermReport,
  };

  if (overrides.overrideSalesColumn && Array.isArray(out.businessReport)) {
    out.businessReport = out.businessReport.map((row: any) => {
      const val = row[overrides.overrideSalesColumn!];
      if (val !== undefined) {
        const next = { ...row };
        next['Ordered Product Sales'] = typeof val === 'number' ? val : sanitizeCurrencyValue(String(val));
        return next;
      }
      return row;
    });
  }

  return out;
}
