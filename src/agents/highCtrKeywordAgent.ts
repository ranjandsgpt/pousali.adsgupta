/**
 * Phase 6 — High CTR keywords not in manual campaigns.
 * Source: Search Term Report. CTR > account CTR average AND keyword not in manual campaign.
 * Suggestion: add to manual campaigns.
 */

import { getReportSourceForInsight } from '@/data/reportSourceRegistry';

export interface HighCtrKeywordRow {
  searchTerm: string;
  campaign: string;
  matchType?: string;
  clicks: number;
  impressions: number;
  spend: number;
  sales: number;
}

export interface HighCtrSuggestion {
  searchTerm: string;
  campaign: string;
  ctr: number;
  accountCtr: number;
  suggestedAction: string;
}

export function runHighCtrKeywordAgent(
  rows: HighCtrKeywordRow[],
  accountCtr: number
): HighCtrSuggestion[] {
  const source = getReportSourceForInsight('highCtrKeywordsNotManual');
  if (source !== 'search_term_report') {
    console.warn('[highCtrKeywordAgent] Expected source search_term_report, got', source);
  }

  const manualCampaigns = new Set(
    rows
      .filter((r) => (r.matchType || '').toLowerCase() !== 'auto' && (r.campaign || '').toLowerCase().includes('manual'))
      .map((r) => `${r.searchTerm}|${r.campaign}`)
  );

  const result: HighCtrSuggestion[] = [];
  for (const r of rows) {
    if (r.impressions < 100) continue;
    const ctr = r.clicks / r.impressions;
    if (ctr <= accountCtr) continue;
    const key = `${r.searchTerm}|${r.campaign}`;
    if (manualCampaigns.has(key)) continue;
    result.push({
      searchTerm: r.searchTerm,
      campaign: r.campaign,
      ctr: ctr * 100,
      accountCtr: accountCtr * 100,
      suggestedAction: 'Add to manual campaigns to scale high-intent traffic.',
    });
  }
  return result.sort((a, b) => b.ctr - a.ctr).slice(0, 30);
}
