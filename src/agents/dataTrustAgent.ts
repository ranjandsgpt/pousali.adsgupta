/**
 * Phase 21 — Data Trust & Reliability Agent.
 * Evaluates quality and reliability of the audit dataset; integrates into PremiumState.
 */

import type { MemoryStore } from '@/app/audit/utils/reportParser';
import type { DataTrustReport } from './zenithTypes';

const RECONCILIATION_TOLERANCE = 0.02; // 2% allowed mismatch

export function runDataTrustAgent(store: MemoryStore): DataTrustReport {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const keywordSample = Object.values(store.keywordMetrics).slice(0, 1)[0];
  const campaignSample = Object.values(store.campaignMetrics).slice(0, 1)[0];

  if (store.totalAdSpend == null) missingFields.push('totalAdSpend');
  if (store.totalAdSales == null) missingFields.push('totalAdSales');
  if (store.totalOrders == null) missingFields.push('totalOrders');
  if (store.totalSessions == null) missingFields.push('totalSessions');
  const m = store.storeMetrics;
  if (m && m.totalSales == null && store.totalStoreSales == null) missingFields.push('totalSales');
  if (keywordSample) {
    const k = keywordSample as { spend?: number; sales?: number; clicks?: number; acos?: number; roas?: number; searchTerm?: string; campaign?: string };
    if (k.spend == null) missingFields.push('keyword.spend');
    if (k.sales == null) missingFields.push('keyword.sales');
    if (k.searchTerm == null) missingFields.push('keyword.searchTerm');
    if (k.campaign == null) missingFields.push('keyword.campaign');
  }
  if (campaignSample) {
    const c = campaignSample as { campaignName?: string; spend?: number; sales?: number; acos?: number };
    if (c.campaignName == null) missingFields.push('campaign.campaignName');
    if (c.spend == null) missingFields.push('campaign.spend');
    if (c.sales == null) missingFields.push('campaign.sales');
    if (c.acos == null) missingFields.push('campaign.acos');
  }

  let duplicateRows = 0;
  const seen = new Set<string>();
  for (const k of Object.keys(store.keywordMetrics)) {
    const row = store.keywordMetrics[k];
    const key = `${row.searchTerm}|${row.campaign}|${row.spend}|${row.sales}`;
    if (seen.has(key)) duplicateRows++;
    else seen.add(key);
  }

  const campaignSpendTotal = Object.values(store.campaignMetrics).reduce((s, c) => s + c.spend, 0);
  const accountSpend = store.totalAdSpend || 0;
  const mismatch = accountSpend > 0 ? Math.abs(campaignSpendTotal - accountSpend) / accountSpend : 0;
  const attributionMismatch = mismatch > RECONCILIATION_TOLERANCE;
  if (attributionMismatch) {
    warnings.push(`Campaign spend total (${campaignSpendTotal.toFixed(0)}) differs from account spend (${accountSpend.toFixed(0)}) by ${(mismatch * 100).toFixed(1)}%.`);
  }

  const keywordSpendTotal = Object.values(store.keywordMetrics).reduce((s, k) => s + k.spend, 0);
  if (accountSpend > 0 && Math.abs(keywordSpendTotal - accountSpend) / accountSpend > RECONCILIATION_TOLERANCE) {
    warnings.push(`Keyword-level spend (${keywordSpendTotal.toFixed(0)}) does not reconcile with account spend.`);
  }

  const fileCount = store.files?.length ?? 0;
  const hasBusiness = store.files?.some((f) => f.type === 'business') ?? false;
  const hasAdvertising = store.files?.some((f) => f.type === 'advertising') ?? false;
  let reportCoverage = 0.5;
  if (fileCount > 0) reportCoverage = 0.5 + (hasBusiness ? 0.25 : 0) + (hasAdvertising ? 0.25 : 0);
  if (!hasBusiness) warnings.push('No business report loaded; store metrics may be incomplete.');
  if (!hasAdvertising) warnings.push('No advertising report loaded; campaign/keyword metrics may be incomplete.');

  const zeroSalesKeywords = Object.values(store.keywordMetrics).filter((k) => k.clicks >= 10 && k.sales === 0);
  if (zeroSalesKeywords.length > 50) {
    warnings.push(`Missing search term attribution for ${Math.min(zeroSalesKeywords.length, 200)} rows (high click, zero sales).`);
  }

  const missingUnique = Array.from(new Set(missingFields));
  let trustScore = 1 - missingUnique.length * 0.05 - warnings.length * 0.03 - (attributionMismatch ? 0.1 : 0) - Math.min(duplicateRows / 100, 0.1);
  trustScore = Math.max(0, Math.min(1, trustScore));

  return {
    trustScore: Math.round(trustScore * 100) / 100,
    missingFields: missingUnique,
    reportCoverage,
    attributionMismatch,
    duplicateRows,
    warnings,
  };
}
