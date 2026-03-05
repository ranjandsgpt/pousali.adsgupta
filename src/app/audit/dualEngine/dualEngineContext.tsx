'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { MemoryStore } from '../utils/reportParser';
import { buildSlmArtifacts } from './slmPipeline';
import {
  verifyGeminiBySlm,
  computeConfidence,
  selectArtifacts,
  mergeRecoveredFields,
  computeAuditConfidenceScore,
} from './confidenceEngine';
import type {
  DualEngineResult,
  EngineArtifacts,
  VerificationScores,
  RecoveredFields,
  MetricItem,
  TableArtifact,
  ChartArtifact,
  InsightArtifact,
} from './types';

/** Merge recovered fields into store for display (e.g. sessions, buyBox from Gemini when SLM missed). */
export function mergeRecoveredIntoStore(store: MemoryStore, recovered: RecoveredFields): MemoryStore {
  if (!recovered || Object.keys(recovered).length === 0) return store;
  return {
    ...store,
    totalSessions: recovered.sessions ?? store.totalSessions,
    buyBoxPercent: recovered.buy_box_percentage ?? store.buyBoxPercent,
    totalUnitsOrdered: recovered.units_ordered ?? store.totalUnitsOrdered,
  };
}

const EMPTY_RESULT: DualEngineResult = {
  slmArtifacts: { metrics: [], tables: [], charts: [], insights: [] },
  geminiArtifacts: null,
  verificationSlmByGemini: null,
  verificationGeminiBySlm: null,
  confidence: {
    metrics: { score: 0, source: 'slm' },
    tables: { score: 0, source: 'slm' },
    charts: { score: 0, source: 'slm' },
    insights: { score: 0, source: 'slm' },
  },
  validated: { metrics: [], tables: [], charts: [], insights: [] },
  auditConfidenceScore: 0,
  recoveredFields: {},
  ready: false,
};

interface DualEngineContextValue extends DualEngineResult {
  loading: boolean;
  error: string | null;
  runDualEngine: (store: MemoryStore) => Promise<DualEngineResult>;
  reset: () => void;
}

const DualEngineContext = createContext<DualEngineContextValue | null>(null);

export function useDualEngine() {
  const ctx = useContext(DualEngineContext);
  if (!ctx) throw new Error('useDualEngine must be used within DualEngineProvider');
  return ctx;
}

function buildDatasetSummary(store: MemoryStore): Record<string, unknown> {
  return {
    totalAdSpend: store.totalAdSpend,
    totalAdSales: store.totalAdSales,
    totalStoreSales: store.totalStoreSales || store.storeMetrics.totalSales,
    totalSessions: store.totalSessions,
    buyBoxPercent: store.buyBoxPercent,
    totalUnitsOrdered: store.totalUnitsOrdered,
    totalClicks: store.totalClicks,
    totalOrders: store.totalOrders,
  };
}

async function fetchGeminiStructured(store: MemoryStore): Promise<{
  artifacts: EngineArtifacts;
  recovered_fields: RecoveredFields;
} | null> {
  const campaigns = Object.values(store.campaignMetrics)
    .filter((c) => c.campaignName)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 80)
    .map((c) => ({ campaignName: c.campaignName, spend: c.spend, sales: c.sales, acos: c.acos, budget: c.budget }));
  const searchTerms = Object.values(store.keywordMetrics)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 200)
    .map((k) => ({ searchTerm: k.searchTerm, campaign: k.campaign, spend: k.spend, sales: k.sales, clicks: k.clicks, acos: k.acos, roas: k.roas }));
  const asins = Object.values(store.asinMetrics)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 120)
    .map((a) => ({ asin: a.asin, adSpend: a.adSpend, adSales: a.adSales, totalSales: a.totalSales, sessions: a.sessions, buyBoxPercent: a.buyBoxPercent }));
  const accountSummary = {
    totalAdSpend: store.totalAdSpend,
    totalAdSales: store.totalAdSales,
    totalStoreSales: store.totalStoreSales || store.storeMetrics.totalSales,
    totalSessions: store.totalSessions,
    buyBoxPercent: store.buyBoxPercent,
    totalUnitsOrdered: store.totalUnitsOrdered,
  };
  const res = await fetch('/api/dual-engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'structured', payload: { accountSummary, campaigns, searchTerms, asins } }),
  });
  const data = await res.json();
  if (!res.ok || data.error) return null;
  const metrics = (data.metrics_gemini || []) as MetricItem[];
  const tables = (data.tables_gemini || []) as TableArtifact[];
  const charts = (data.charts_gemini || []) as ChartArtifact[];
  const insights = (data.insights_gemini || []) as InsightArtifact[];
  const recovered_fields = (data.recovered_fields || {}) as RecoveredFields;
  return {
    artifacts: { metrics, tables, charts, insights },
    recovered_fields,
  };
}

async function fetchVerifySlm(slmArtifacts: EngineArtifacts, datasetSummary: Record<string, unknown>): Promise<VerificationScores | null> {
  const res = await fetch('/api/dual-engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'verify_slm',
      payload: { datasetSummary, slmArtifacts },
    }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  return {
    metrics_score: data.metrics_score ?? 0.9,
    tables_score: data.tables_score ?? 0.9,
    charts_score: data.charts_score ?? 0.9,
    insights_score: data.insights_score ?? 0.9,
  };
}

export function DualEngineProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<DualEngineResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setResult(EMPTY_RESULT);
    setError(null);
  }, []);

  const runDualEngine = useCallback(async (store: MemoryStore): Promise<DualEngineResult> => {
    setLoading(true);
    setError(null);
    try {
      const datasetSummary = buildDatasetSummary(store);
      const [slmArtifacts, geminiResult] = await Promise.all([
        Promise.resolve(buildSlmArtifacts(store)),
        fetchGeminiStructured(store),
      ]);

      const geminiArtifacts = geminiResult?.artifacts ?? null;
      const recovered_fields = geminiResult?.recovered_fields ?? {};

      const verificationSlmByGemini = await fetchVerifySlm(slmArtifacts, datasetSummary);
      const verificationGeminiBySlm = geminiArtifacts
        ? verifyGeminiBySlm(geminiArtifacts, {
            totalAdSpend: store.totalAdSpend,
            totalAdSales: store.totalAdSales,
            totalStoreSales: store.totalStoreSales || store.storeMetrics.totalSales,
          })
        : null;

      const confidence = computeConfidence(
        verificationSlmByGemini,
        verificationGeminiBySlm,
        slmArtifacts,
        geminiArtifacts
      );
      const validated = selectArtifacts(slmArtifacts, geminiArtifacts, confidence);
      const auditConfidenceScore = computeAuditConfidenceScore(confidence);
      const recoveredFields = mergeRecoveredFields(
        store.totalSessions,
        store.buyBoxPercent,
        store.totalUnitsOrdered,
        recovered_fields,
        (confidence.metrics.score + confidence.tables.score + confidence.charts.score + confidence.insights.score) / 4,
        0.9
      );

      const next: DualEngineResult = {
        slmArtifacts,
        geminiArtifacts,
        verificationSlmByGemini,
        verificationGeminiBySlm,
        confidence,
        validated,
        auditConfidenceScore,
        recoveredFields,
        ready: true,
      };
      setResult(next);
      return next;
    } catch (e) {
      const slmArtifacts = buildSlmArtifacts(store);
      const confidence = {
        metrics: { score: 0.9, source: 'slm' as const },
        tables: { score: 0.9, source: 'slm' as const },
        charts: { score: 0.9, source: 'slm' as const },
        insights: { score: 0.9, source: 'slm' as const },
      };
      const next: DualEngineResult = {
        slmArtifacts,
        geminiArtifacts: null,
        verificationSlmByGemini: null,
        verificationGeminiBySlm: null,
        confidence,
        validated: selectArtifacts(slmArtifacts, null, confidence),
        auditConfidenceScore: 90,
        recoveredFields: {},
        ready: true,
      };
      setResult(next);
      setError(e instanceof Error ? e.message : 'Dual engine failed');
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DualEngineContext.Provider
      value={{
        ...result,
        loading,
        error,
        runDualEngine,
        reset,
      }}
    >
      {children}
    </DualEngineContext.Provider>
  );
}
