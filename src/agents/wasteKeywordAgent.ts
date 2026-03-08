/**
 * Phase 9 — Wasted Keyword Definition.
 * Source: Search Term Report. Definition: clicks >= 10 AND sales = 0.
 * Copilot must explain: "Wasted keywords are search terms that have received at least 10 clicks but have generated zero sales."
 */

import { getReportSourceForInsight } from '@/data/reportSourceRegistry';
import { getCalculation } from '@/metrics/calculationRegistry';

export const WASTED_CLICK_THRESHOLD = 10;

export interface WasteKeywordRow {
  searchTerm: string;
  campaign: string;
  spend: number;
  sales: number;
  clicks: number;
}

export interface WasteKeywordResult {
  searchTerm: string;
  campaign: string;
  spend: number;
  clicks: number;
}

export function runWasteKeywordAgent(rows: WasteKeywordRow[]): WasteKeywordResult[] {
  const source = getReportSourceForInsight('wastedSearchTerms');
  if (source !== 'search_term_report') {
    console.warn('[wasteKeywordAgent] Expected source search_term_report, got', source);
  }

  return rows
    .filter((r) => r.clicks >= WASTED_CLICK_THRESHOLD && r.sales === 0)
    .map((r) => ({ searchTerm: r.searchTerm, campaign: r.campaign, spend: r.spend, clicks: r.clicks }))
    .sort((a, b) => b.spend - a.spend);
}

/** Copilot-facing explanation for wasted keywords (Phase 17). */
export function getWastedKeywordsExplanation(): string {
  const entry = getCalculation('wastedKeywords');
  return entry
    ? entry.definition
    : 'Wasted keywords are search terms that have received at least 10 clicks but have generated zero sales. They are identified from the Search Term Report.';
}
