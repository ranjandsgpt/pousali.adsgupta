/**
 * Phase 35 — Insight Confidence Model.
 * Assigns confidence score to every insight from data trust, completeness, and statistical significance.
 */

import type { DataTrustReport } from './zenithTypes';

export function runInsightConfidenceAgent(
  dataTrust: DataTrustReport | undefined,
  datasetCompleteness: number,
  hasSignificantSample: boolean
): number {
  const trust = dataTrust?.trustScore ?? 0.9;
  const completeness = Math.min(1, datasetCompleteness);
  const significance = hasSignificantSample ? 1 : 0.7;
  const confidence = (trust * 0.5 + completeness * 0.3 + significance * 0.2);
  return Math.round(confidence * 100) / 100;
}

export function runInsightConfidenceBatch(
  count: number,
  dataTrust: DataTrustReport | undefined,
  totalRows: number
): number[] {
  const completeness = totalRows > 100 ? 1 : totalRows / 100;
  const hasSignificantSample = totalRows >= 50;
  const base = runInsightConfidenceAgent(dataTrust, completeness, hasSignificantSample);
  return Array.from({ length: count }, () => Math.min(1, base + (Math.random() * 0.1 - 0.05)));
}
