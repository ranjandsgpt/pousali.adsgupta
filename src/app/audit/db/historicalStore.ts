/** Phase 4: In-memory historical storage. */
import type { AccountHistoryRow, MetricHistoryRow, CampaignHistoryRow, KeywordHistoryRow } from './historicalTypes';
const accountHistory: AccountHistoryRow[] = [];
const metricHistory: MetricHistoryRow[] = [];
const campaignHistory: CampaignHistoryRow[] = [];
const keywordHistory: KeywordHistoryRow[] = [];
export function appendAccountHistory(row: AccountHistoryRow): void { accountHistory.push(row); }
export function appendMetricHistory(row: MetricHistoryRow): void { metricHistory.push(row); }
export function appendCampaignHistory(row: CampaignHistoryRow): void { campaignHistory.push(row); }
export function appendKeywordHistory(row: KeywordHistoryRow): void { keywordHistory.push(row); }
export function getAccountHistory(accountId: string, limit = 30): AccountHistoryRow[] {
  return accountHistory.filter((r) => r.account_id === accountId).slice(-limit);
}
export function getMetricHistory(accountId: string, metricName: string, limit = 30): MetricHistoryRow[] {
  return metricHistory.filter((r) => r.account_id === accountId && r.metric_name === metricName).slice(-limit);
}
export function getCampaignHistory(accountId: string, limit = 100): CampaignHistoryRow[] {
  return campaignHistory.filter((r) => r.account_id === accountId).slice(-limit);
}
export function getKeywordHistory(accountId: string, limit = 200): KeywordHistoryRow[] {
  return keywordHistory.filter((r) => r.account_id === accountId).slice(-limit);
}
