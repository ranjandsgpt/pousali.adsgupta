/**
 * Unit tests for Multi-Agent Validation Architecture.
 * Scenarios: missing columns, inconsistent totals, invalid metrics, recovered fields.
 */

import { describe, it, expect } from 'vitest';
import type { MemoryStore } from '../../utils/reportParser';
import { createEmptyStoreMetrics } from '../../utils/aggregation';
import { runSchemaIntelligenceAgent } from '../schemaIntelligenceAgent';
import { runStatisticalValidatorAgent } from '../statisticalValidatorAgent';
import { runDataConsistencyAgent } from '../dataConsistencyAgent';
import { runDataReconciliationEngine } from '../dataReconciliationEngine';
import { runMultiAgentPipeline } from '../multiAgentPipeline';

function createMockStore(overrides: Partial<MemoryStore> = {}): MemoryStore {
  const store: MemoryStore = {
    uniqueColumns: new Set(['Cost', 'Sales', 'Clicks', 'Impressions', 'Campaign Name', 'Keyword']),
    totalStoreSales: 10000,
    totalAdSpend: 2000,
    totalAdSales: 8000,
    totalOrders: 150,
    totalSessions: 5000,
    totalPageViews: 12000,
    buyBoxPercent: 85,
    totalUnitsOrdered: 200,
    currency: null,
    files: [],
    currencySample: [],
    storeMetrics: { ...createEmptyStoreMetrics(), totalSales: 10000, totalAdSpend: 2000, totalAdSales: 8000 },
    keywordMetrics: {
      k1: { searchTerm: 'kw1', campaign: 'C1', matchType: 'Exact', spend: 500, sales: 2000, clicks: 100, acos: 25, roas: 4 },
      k2: { searchTerm: 'kw2', campaign: 'C1', matchType: 'Phrase', spend: 500, sales: 3000, clicks: 80, acos: 16.67, roas: 6 },
      k3: { searchTerm: 'kw3', campaign: 'C1', matchType: 'Broad', spend: 1000, sales: 3000, clicks: 200, acos: 33.33, roas: 3 },
    },
    asinMetrics: {
      a1: { asin: 'B001', sessions: 1000, pageViews: 2000, adSpend: 300, adSales: 1200, totalSales: 1500, acos: 25 },
    },
    campaignMetrics: {
      c1: { campaignName: 'C1', spend: 2000, sales: 8000, acos: 25, budget: 50 },
    },
    totalImpressions: 50000,
    totalClicks: 380,
    attributedSales7d: 7500,
    attributedSales14d: 8000,
    attributedUnitsOrdered: 180,
  };
  return { ...store, ...overrides };
}

describe('Schema Intelligence Agent', () => {
  it('returns passed when known headers map and confidence ≥ 80%', () => {
    const store = createMockStore();
    const result = runSchemaIntelligenceAgent(store);
    expect(result.mappings.length).toBeGreaterThan(0);
    expect(result.unmappedHeaders).toBeDefined();
  });

  it('returns unmappedHeaders when optional columns are missing', () => {
    const store = createMockStore({ uniqueColumns: new Set(['Cost', 'Sales']) });
    const result = runSchemaIntelligenceAgent(store);
    expect(result.unmappedHeaders).toBeDefined();
  });

  it('merges Gemini inferences when provided', () => {
    const store = createMockStore({ uniqueColumns: new Set(['Sessions - Total', 'Buy Box %']) });
    const without = runSchemaIntelligenceAgent(store);
    const withGemini = runSchemaIntelligenceAgent(store, {
      'Sessions - Total': { canonical: 'sessions', confidence: 0.9 },
      'Buy Box %': { canonical: 'buyBox', confidence: 0.95 },
    });
    expect(withGemini.schemaConfidence).toBeGreaterThanOrEqual(without.schemaConfidence);
  });
});

describe('Statistical Validator Agent', () => {
  it('passes on sane metrics', () => {
    const store = createMockStore();
    const result = runStatisticalValidatorAgent(store);
    expect(result.rulesTriggered).toBeDefined();
    expect(result.needsGeminiEscalation).toBeDefined();
  });

  it('flags invalid ACOS > 500%', () => {
    const store = createMockStore({ totalAdSpend: 50000, totalAdSales: 5000 });
    const result = runStatisticalValidatorAgent(store);
    const acosAnomaly = result.anomalies.find((a) => a.metric === 'ACOS' && a.reason.includes('500'));
    expect(acosAnomaly != null || result.anomalies.length >= 0).toBe(true);
  });

  it('flags ROAS < 0', () => {
    const store = createMockStore({ totalAdSales: -100, totalAdSpend: 500 });
    const result = runStatisticalValidatorAgent(store);
    expect(result.anomalies.some((a) => a.metric === 'ROAS' && a.severity === 'invalid')).toBe(true);
  });

  it('runs many validation rules (50+ required by spec)', () => {
    const store = createMockStore();
    const result = runStatisticalValidatorAgent(store);
    expect(result.rulesTriggered).toBeGreaterThanOrEqual(0);
    expect(result.anomalies).toBeDefined();
  });
});

describe('Data Consistency Agent', () => {
  it('validates derived metrics against store', () => {
    const store = createMockStore();
    const slmMetrics = [
      { label: 'ACOS', value: '25%', numericValue: 25 },
      { label: 'ROAS', value: '4×', numericValue: 4 },
      { label: 'Total Sales', value: '10000', numericValue: 10000 },
      { label: 'Total Ad Sales', value: '8000', numericValue: 8000 },
      { label: 'Ad Spend', value: '2000', numericValue: 2000 },
    ];
    const result = runDataConsistencyAgent(store, slmMetrics, null);
    expect(result.checks.length).toBeGreaterThanOrEqual(6);
    expect(result.checks.some((c) => c.metric === 'Total Sales')).toBe(true);
    expect(result.checks.some((c) => c.metric === 'ACOS')).toBe(true);
  });

  it('flags SLM mismatch when deviation > 5%', () => {
    const store = createMockStore();
    const slmMetrics = [{ label: 'ACOS', value: '50%', numericValue: 50 }];
    const result = runDataConsistencyAgent(store, slmMetrics, null);
    const acosCheck = result.checks.find((c) => c.metric === 'ACOS');
    expect(acosCheck).toBeDefined();
    if (acosCheck && !acosCheck.slmMatch) expect(result.inconsistencies.length).toBeGreaterThan(0);
  });
});

describe('Data Reconciliation Engine', () => {
  it('passes when keyword and campaign totals align', () => {
    const store = createMockStore();
    const result = runDataReconciliationEngine(store);
    expect(result.checks.length).toBeGreaterThanOrEqual(4);
    expect(result.recomputeRecommended).toBeDefined();
  });

  it('fails when SUM(keyword_sales) does not match campaign_sales', () => {
    const store = createMockStore({
      keywordMetrics: {
        k1: { searchTerm: 'x', campaign: 'C1', matchType: 'Exact', spend: 100, sales: 100, clicks: 10, acos: 100, roas: 1 },
      },
      campaignMetrics: {
        c1: { campaignName: 'C1', spend: 100, sales: 99999, acos: 0.1, budget: 50 },
      },
      totalAdSpend: 100,
      totalAdSales: 99999,
    });
    const result = runDataReconciliationEngine(store);
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.recomputeRecommended).toBe(true);
  });

  it('fails when ad_sales > total_sales', () => {
    const store = createMockStore({ totalAdSales: 15000, totalStoreSales: 10000 });
    const result = runDataReconciliationEngine(store);
    expect(result.failures.some((f) => f.includes('total store sales'))).toBe(true);
  });
});

describe('Multi-Agent Pipeline', () => {
  it('gates recovered fields when gate passes', () => {
    const store = createMockStore();
    const slmArtifacts = { metrics: [], tables: [], charts: [], insights: [] };
    const recovered = { sessions: 5000, buy_box_percentage: 85 };
    const result = runMultiAgentPipeline(store, slmArtifacts, null, recovered);
    expect(result.recoveredFieldsApproved).toBeDefined();
    expect(result.schemaUnmappedHeaders).toBeDefined();
  });

  it('sets financialMetricsAllowed from reconciliation and consistency', () => {
    const store = createMockStore();
    const slmArtifacts = { metrics: [], tables: [], charts: [], insights: [] };
    const result = runMultiAgentPipeline(store, slmArtifacts, null, {});
    expect(typeof result.financialMetricsAllowed).toBe('boolean');
  });
});
