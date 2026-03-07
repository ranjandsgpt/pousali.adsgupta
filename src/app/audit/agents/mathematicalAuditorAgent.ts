/**
 * Mathematical Auditor — Guild 2. Verify financial integrity (e.g. Sum(SearchTermSpend) == CampaignSpend).
 * Failures recorded in blackboard.anomalies. Does not call other agents.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { Blackboard } from '../blackboard';
import { appendAnomalies } from '../blackboard';

export function runMathematicalAuditorAgent(store: MemoryStore, bb: Blackboard): void {
  const anomalies: Blackboard['anomalies'] = [];
  const campaignSpend = Object.values(store.campaignMetrics).reduce((s, c) => s + c.spend, 0);
  const keywordSpend = Object.values(store.keywordMetrics).reduce((s, k) => s + k.spend, 0);
  const diff = Math.abs(campaignSpend - keywordSpend);
  if (campaignSpend > 0 && diff / campaignSpend > 0.05) {
    anomalies.push({
      id: 'sum-searchterm-vs-campaign-spend',
      type: 'reconciliation',
      description: `Sum(SearchTermSpend)=${keywordSpend.toFixed(2)} vs CampaignSpend=${campaignSpend.toFixed(2)}; deviation >5%`,
      severity: 'warning',
      source: 'MathematicalAuditor',
      expected: campaignSpend,
      actual: keywordSpend,
    });
  }
  const totalAdSales = store.totalAdSales;
  const totalStoreSales = store.totalStoreSales || store.storeMetrics.totalSales;
  if (totalStoreSales > 0 && totalAdSales > totalStoreSales) {
    anomalies.push({
      id: 'adsales-exceeds-totalsales',
      type: 'cross_report',
      description: 'AdSales exceeds TotalBusinessSales; cross-report reconciliation failed.',
      severity: 'critical',
      source: 'MathematicalAuditor',
      expected: totalStoreSales,
      actual: totalAdSales,
    });
  }
  if (anomalies.length > 0) appendAnomalies(bb, anomalies);
}
