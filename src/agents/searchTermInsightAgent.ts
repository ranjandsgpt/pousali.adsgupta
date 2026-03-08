/**
 * Phase 5 — Search Term Insights (Converting search terms missing Exact).
 * Source: Search Term Report only. Do not use Targeting report.
 */

import { getReportSourceForInsight } from '@/data/reportSourceRegistry';

export interface SearchTermRow {
  searchTerm: string;
  campaign: string;
  matchType: string;
  clicks: number;
  sales: number;
  spend: number;
  orders?: number;
}

export interface ConvertingTermMissingExact {
  searchTerm: string;
  campaign: string;
  matchType: string;
  clicks: number;
  sales: number;
  suggestedAction: string;
}

const CLICK_THRESHOLD = 5;
const MIN_ORDERS = 1;

/**
 * High-converting search terms not present in exact match campaigns.
 * Logic: Filter clicks > threshold, orders > 0. Group by matchType, searchTerm.
 * Detect: not in exact match → suggest add to exact.
 */
export function runSearchTermInsightAgent(rows: SearchTermRow[]): ConvertingTermMissingExact[] {
  const source = getReportSourceForInsight('convertingSearchTermsMissingExact');
  if (source !== 'search_term_report') {
    console.warn('[searchTermInsightAgent] Expected source search_term_report, got', source);
  }

  const exactTerms = new Set(
    rows.filter((r) => (r.matchType || '').toLowerCase() === 'exact').map((r) => `${r.searchTerm}|${r.campaign}`)
  );
  const result: ConvertingTermMissingExact[] = [];

  const byTerm = new Map<string, SearchTermRow[]>();
  for (const r of rows) {
    if (r.clicks < CLICK_THRESHOLD) continue;
    if ((r.orders ?? 0) >= MIN_ORDERS || r.sales > 0) {
      const key = `${r.searchTerm}|${r.campaign}`;
      const list = byTerm.get(key) ?? [];
      list.push(r);
      byTerm.set(key, list);
    }
  }

  for (const [key, list] of Array.from(byTerm.entries())) {
    if (exactTerms.has(key)) continue;
    const first = list[0];
    const totalClicks = list.reduce((s, r) => s + r.clicks, 0);
    const totalSales = list.reduce((s, r) => s + r.sales, 0);
    if (totalSales <= 0) continue;
    result.push({
      searchTerm: first.searchTerm,
      campaign: first.campaign,
      matchType: first.matchType || '—',
      clicks: totalClicks,
      sales: totalSales,
      suggestedAction: 'Add to Exact match campaign to capture high-intent traffic.',
    });
  }

  return result.slice(0, 50);
}
