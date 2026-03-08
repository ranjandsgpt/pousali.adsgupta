/**
 * Phase 31 — Autonomous Insight Discovery Engine.
 * Discovers insights without user queries (waste keywords, high ACOS campaigns, ROAS < 1).
 */

import type { MemoryStore } from '@/app/audit/utils/reportParser';

export interface DiscoveredInsight {
  id: string;
  title: string;
  evidence: string;
  impactEstimate: string;
  recommendation: string;
  severity: 'critical' | 'warning' | 'info';
}

export function runAutonomousInsightAgent(store: MemoryStore): DiscoveredInsight[] {
  const results: DiscoveredInsight[] = [];
  const keywords = Object.values(store.keywordMetrics);
  const campaigns = Object.values(store.campaignMetrics);
  const zeroSales = keywords.filter((k) => k.clicks >= 10 && k.sales === 0);
  const wasteSpend = zeroSales.reduce((s, k) => s + k.spend, 0);
  const cur = store.currency ?? '€';

  if (zeroSales.length >= 5 && wasteSpend > 0) {
    results.push({
      id: 'auto-waste-keywords',
      title: `${zeroSales.length} keywords have spent without generating a single sale`,
      evidence: `${zeroSales.length} keywords have >10 clicks with zero sales. Total spend: ${cur}${wasteSpend.toFixed(2)}`,
      impactEstimate: `Approximately ${cur}${wasteSpend.toFixed(2)} of ad spend is wasted.`,
      recommendation: 'Pause or add these keywords as negatives and reallocate budget to high-ROAS campaigns.',
      severity: wasteSpend > 500 ? 'critical' : 'warning',
    });
  }

  const totalSpend = store.totalAdSpend || 1;
  const totalSales = store.totalAdSales || 0;
  const accountRoas = totalSales / totalSpend;
  const highAcos = campaigns.filter((c) => c.spend > 50 && c.acos > 50);
  if (highAcos.length >= 3) {
    results.push({
      id: 'auto-high-acos-campaigns',
      title: `${highAcos.length} campaigns have ACOS above 50%`,
      evidence: `Campaigns with spend >50 and ACOS >50%: ${highAcos.map((c) => c.campaignName).slice(0, 5).join(', ')}.`,
      impactEstimate: 'Efficiency is below target; profitability at risk.',
      recommendation: 'Review bids and targeting; consider pausing worst performers.',
      severity: 'warning',
    });
  }

  if (accountRoas < 1 && totalSpend > 100) {
    results.push({
      id: 'auto-roas-below-1',
      title: 'Account ROAS is below 1',
      evidence: `Ad sales (${totalSales.toFixed(0)}) are lower than ad spend (${totalSpend.toFixed(0)}).`,
      impactEstimate: 'Advertising is not paying for itself at current spend level.',
      recommendation: 'Reduce spend on low-ROAS segments or improve conversion.',
      severity: 'critical',
    });
  }

  return results;
}
