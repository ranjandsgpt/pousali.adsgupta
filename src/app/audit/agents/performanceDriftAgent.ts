/**
 * Phase 4: Performance Drift Agent — detects drift in campaign/keyword performance over time.
 */

import { getCampaignHistory, getKeywordHistory } from '../db/historicalStore';

export interface DriftResult {
  score: number;
  issues: string[];
  level: string;
  driftedCampaigns: string[];
  driftedKeywords: string[];
}

export function runPerformanceDriftAgent(accountId: string, window = 14): DriftResult {
  const campaigns = getCampaignHistory(accountId, window);
  const keywords = getKeywordHistory(accountId, window * 5);
  const driftedCampaigns: string[] = [];
  const driftedKeywords: string[] = [];

  const campaignById = new Map<string, { sales: number[]; spend: number[] }>();
  for (const r of campaigns) {
    if (!campaignById.has(r.campaign_id)) campaignById.set(r.campaign_id, { sales: [], spend: [] });
    campaignById.get(r.campaign_id)!.sales.push(r.sales);
    campaignById.get(r.campaign_id)!.spend.push(r.spend);
  }
  campaignById.forEach((data, id) => {
    if (data.sales.length < 2) return;
    const first = data.sales[0];
    const last = data.sales[data.sales.length - 1];
    if (first > 0 && Math.abs((last - first) / first) > 0.3) driftedCampaigns.push(id);
  });

  const keywordById = new Map<string, { roas: number[] }>();
  for (const r of keywords) {
    const key = `${r.search_term}|${r.campaign_name}`;
    if (!keywordById.has(key)) keywordById.set(key, { roas: [] });
    const roas = r.spend > 0 ? r.sales / r.spend : 0;
    keywordById.get(key)!.roas.push(roas);
  }
  keywordById.forEach((data, key) => {
    if (data.roas.length < 2) return;
    const first = data.roas[0];
    const last = data.roas[data.roas.length - 1];
    if (first > 0 && Math.abs((last - first) / first) > 0.4) driftedKeywords.push(key);
  });

  const issues = [
    ...driftedCampaigns.slice(0, 3).map((c) => `Drift: campaign ${c} sales changed significantly.`),
    ...driftedKeywords.slice(0, 3).map((k) => `Drift: keyword ${k} ROAS changed significantly.`),
  ];
  const score = Math.max(0, 1 - issues.length * 0.1);
  return { score, issues, level: 'performance_drift', driftedCampaigns, driftedKeywords };
}
