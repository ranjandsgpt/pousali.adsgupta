/** Phase 4: Historical types. */
export interface AccountHistoryRow {
  timestamp: string;
  account_id: string;
  totalAdSpend: number;
  totalAdSales: number;
  totalStoreSales: number;
  tacos: number;
  roas: number;
  totalClicks: number;
  totalOrders: number;
}
export interface MetricHistoryRow {
  timestamp: string;
  account_id: string;
  metric_name: string;
  value: number;
}
export interface CampaignHistoryRow {
  timestamp: string;
  account_id: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  sales: number;
  acos: number;
  roas: number;
}
export interface KeywordHistoryRow {
  timestamp: string;
  account_id: string;
  keyword_id: string;
  search_term: string;
  campaign_name: string;
  spend: number;
  sales: number;
  clicks: number;
  acos: number;
  roas: number;
}
export interface HistoricalMetrics {
  trendSlope: number;
  movingAverage: number;
  growthRate: number;
  volatility: number;
}
