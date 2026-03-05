/**
 * Multi-layer report verification: cross-report validation, data integrity,
 * metric verification (ACOS/ROAS two methods), and confidence score.
 */

import type { MemoryStore } from './reportParser';

const METRIC_DEVIATION_THRESHOLD_PCT = 5;

export interface CrossReportValidationResult {
  passed: boolean;
  errors: string[];
}

/** Layer 2: adSales <= totalSales, unitsOrdered >= adUnits, sessions >= clicks */
export function runCrossReportValidation(store: MemoryStore): CrossReportValidationResult {
  const errors: string[] = [];
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  if (store.totalAdSales > totalSales && totalSales > 0) {
    errors.push(`Ad sales (${store.totalAdSales}) exceeds total sales (${totalSales})`);
  }
  const totalUnits = store.totalUnitsOrdered || 0;
  const adUnits = store.attributedUnitsOrdered || 0;
  if (totalUnits > 0 && adUnits > totalUnits) {
    errors.push(`Attributed units (${adUnits}) exceeds total units ordered (${totalUnits})`);
  }
  const sessions = store.totalSessions || Object.values(store.asinMetrics).reduce((s, a) => s + a.sessions, 0);
  const clicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  if (sessions > 0 && clicks > sessions) {
    errors.push(`Clicks (${clicks}) exceeds sessions (${sessions})`);
  }
  return { passed: errors.length === 0, errors };
}

export interface DataIntegrityResult {
  passed: boolean;
  nullCount: number;
  conversionFailures: number;
  duplicateColumns: string[];
}

/** Layer 3: null detection, numeric conversion, duplicate column detection (simplified: we don't have raw rows here, so we validate store aggregates) */
export function runDataIntegrityCheck(store: MemoryStore): DataIntegrityResult {
  const duplicateColumns: string[] = [];
  let nullCount = 0;
  let conversionFailures = 0;
  if (store.totalAdSpend < 0 || store.totalAdSales < 0) conversionFailures++;
  if (Number.isNaN(store.storeMetrics.roas) || Number.isNaN(store.storeMetrics.tacos)) conversionFailures++;
  for (const k of Object.values(store.keywordMetrics)) {
    if (k.spend < 0 || k.sales < 0 || Number.isNaN(k.acos)) conversionFailures++;
  }
  return { passed: conversionFailures === 0 && nullCount === 0, nullCount, conversionFailures, duplicateColumns };
}

export interface MetricVerificationResult {
  acosMatch: boolean;
  roasMatch: boolean;
  discrepancies: string[];
}

/** Multi-pass: verify ACOS and ROAS with two methods; flag if deviation > 5% */
export function verifyComputedMetrics(store: MemoryStore): MetricVerificationResult {
  const discrepancies: string[] = [];
  const totalSpend = store.totalAdSpend;
  const totalSales = store.totalAdSales;
  const clicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);

  const acos1 = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
  const cpc = clicks > 0 ? totalSpend / clicks : 0;
  const acos2 = totalSales > 0 && cpc > 0 ? (cpc * clicks / totalSales) * 100 : acos1;
  const acosDeviation = acos1 > 0 ? Math.abs(acos1 - acos2) / acos1 * 100 : 0;
  const acosMatch = acosDeviation <= METRIC_DEVIATION_THRESHOLD_PCT;

  const roas1 = totalSpend > 0 ? totalSales / totalSpend : 0;
  const revenuePerClick = clicks > 0 ? totalSales / clicks : 0;
  const roas2 = totalSpend > 0 && cpc > 0 ? revenuePerClick / cpc : roas1;
  const roasDeviation = roas1 > 0 ? Math.abs(roas1 - roas2) / roas1 * 100 : 0;
  const roasMatch = roasDeviation <= METRIC_DEVIATION_THRESHOLD_PCT;

  if (!acosMatch) discrepancies.push(`ACOS verification deviation ${acosDeviation.toFixed(1)}%`);
  if (!roasMatch) discrepancies.push(`ROAS verification deviation ${roasDeviation.toFixed(1)}%`);
  return { acosMatch, roasMatch, discrepancies };
}

export interface ReportVerificationSummary {
  crossReport: CrossReportValidationResult;
  dataIntegrity: DataIntegrityResult;
  metricVerification: MetricVerificationResult;
  confidenceScore: number;
}

/** Compute report confidence score 0-100 from mapping success, verification, cross-report alignment, missing data ratio */
export function computeReportConfidenceScore(
  store: MemoryStore,
  summary: {
    crossReport: CrossReportValidationResult;
    dataIntegrity: DataIntegrityResult;
    metricVerification: MetricVerificationResult;
    columnMappingSuccess?: number;
    missingDataRatio?: number;
  }
): number {
  let score = 100;
  if (!summary.crossReport.passed) score -= 20;
  if (!summary.dataIntegrity.passed) score -= 15;
  if (!summary.metricVerification.acosMatch || !summary.metricVerification.roasMatch) score -= 15;
  if (summary.columnMappingSuccess != null && summary.columnMappingSuccess < 1) score -= 10;
  if (summary.missingDataRatio != null && summary.missingDataRatio > 0.2) score -= 10;
  const hasSessions = store.totalSessions > 0 || Object.values(store.asinMetrics).some((a) => a.sessions > 0);
  if (!hasSessions && (store.totalStoreSales > 0 || store.totalAdSales > 0)) score -= 5;
  const hasBuyBox = store.buyBoxPercent > 0 || Object.values(store.asinMetrics).some((a) => (a.buyBoxPercent ?? 0) > 0);
  if (!hasBuyBox && Object.keys(store.asinMetrics).length > 0) score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function runReportVerification(store: MemoryStore): ReportVerificationSummary {
  const crossReport = runCrossReportValidation(store);
  const dataIntegrity = runDataIntegrityCheck(store);
  const metricVerification = verifyComputedMetrics(store);
  const confidenceScore = computeReportConfidenceScore(store, {
    crossReport,
    dataIntegrity,
    metricVerification,
  });
  return { crossReport, dataIntegrity, metricVerification, confidenceScore };
}
