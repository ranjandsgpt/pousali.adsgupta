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

export interface RunDualEngineOptions {
  /** Raw report files (CSV/XLSX) to send to Gemini unmodified for metric extraction. */
  rawFiles?: File[];
  /** If true, show SLM result immediately and run Gemini in background; UI updates when Gemini completes. */
  deferGemini?: boolean;
  /** Called when Gemini verification completes (with merged store if recovered fields applied). */
  onGeminiComplete?: (mergedStore: MemoryStore | null) => void;
}

interface DualEngineContextValue extends DualEngineResult {
  loading: boolean;
  /** True when SLM result is shown and Gemini verification is still running (progressive rendering). */
  geminiVerificationPending: boolean;
  error: string | null;
  runDualEngine: (store: MemoryStore, options?: RunDualEngineOptions) => Promise<DualEngineResult>;
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

function buildStructuredPayload(store: MemoryStore): StructuredPayload {
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
  return { accountSummary, campaigns, searchTerms, asins };
}

interface StructuredPayload {
  accountSummary: Record<string, unknown>;
  campaigns: unknown[];
  searchTerms: unknown[];
  asins: unknown[];
}

async function fetchGeminiStructured(
  store: MemoryStore,
  rawFiles?: File[]
): Promise<{ artifacts: EngineArtifacts; recovered_fields: RecoveredFields } | null> {
  const payload = buildStructuredPayload(store);
  let res: Response;
  if (rawFiles != null && rawFiles.length > 0) {
    const formData = new FormData();
    rawFiles.forEach((f) => formData.append('files', f));
    formData.append('payload', JSON.stringify({ mode: 'structured', payload }));
    res = await fetch('/api/dual-engine', { method: 'POST', body: formData });
  } else {
    res = await fetch('/api/dual-engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'structured', payload }),
    });
  }
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
  const [geminiVerificationPending, setGeminiVerificationPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setResult(EMPTY_RESULT);
    setError(null);
    setGeminiVerificationPending(false);
  }, []);

  const runDualEngine = useCallback(
    async (store: MemoryStore, options?: RunDualEngineOptions): Promise<DualEngineResult> => {
      const { rawFiles, deferGemini, onGeminiComplete } = options ?? {};
      setLoading(true);
      setError(null);
      setGeminiVerificationPending(false);

      const slmArtifacts = buildSlmArtifacts(store);
      const datasetSummary = buildDatasetSummary(store);

      const setSlmOnlyResult = (): DualEngineResult => {
        const confidence = {
          metrics: { score: 0.9, source: 'slm' as const },
          tables: { score: 0.9, source: 'slm' as const },
          charts: { score: 0.9, source: 'slm' as const },
          insights: { score: 0.9, source: 'slm' as const },
        };
        const slmOnly: DualEngineResult = {
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
        setResult(slmOnly);
        return slmOnly;
      };

      if (deferGemini) {
        setSlmOnlyResult();
        setLoading(false);
        setGeminiVerificationPending(true);
        fetchGeminiStructured(store, rawFiles)
          .then((geminiResult) => {
            const geminiArtifacts = geminiResult?.artifacts ?? null;
            const recovered_fields = geminiResult?.recovered_fields ?? {};
            return Promise.all([
              Promise.resolve(geminiResult),
              fetchVerifySlm(slmArtifacts, datasetSummary),
              Promise.resolve(geminiArtifacts),
              Promise.resolve(recovered_fields),
            ]);
          })
          .then(([, verificationSlmByGemini, geminiArtifacts, recovered_fields]) => {
            const verificationGeminiBySlm =
              geminiArtifacts != null
                ? verifyGeminiBySlm(geminiArtifacts, {
                    totalAdSpend: store.totalAdSpend,
                    totalAdSales: store.totalAdSales,
                    totalStoreSales: store.totalStoreSales || store.storeMetrics.totalSales,
                  })
                : null;
            const confidence = computeConfidence(
              verificationSlmByGemini ?? null,
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
            setGeminiVerificationPending(false);
            const merged =
              Object.keys(recoveredFields).length > 0
                ? mergeRecoveredIntoStore(store, recoveredFields)
                : null;
            onGeminiComplete?.(merged ?? store);
          })
          .catch((e) => {
            setGeminiVerificationPending(false);
            setError(e instanceof Error ? e.message : 'Gemini verification failed');
            onGeminiComplete?.(null);
          });
        return setSlmOnlyResult();
      }

      try {
        const [geminiResult, verificationSlmByGemini] = await Promise.all([
          fetchGeminiStructured(store, rawFiles),
          fetchVerifySlm(slmArtifacts, datasetSummary),
        ]);

        const geminiArtifacts = geminiResult?.artifacts ?? null;
        const recovered_fields = geminiResult?.recovered_fields ?? {};

        const verificationGeminiBySlm = geminiArtifacts
          ? verifyGeminiBySlm(geminiArtifacts, {
              totalAdSpend: store.totalAdSpend,
              totalAdSales: store.totalAdSales,
              totalStoreSales: store.totalStoreSales || store.storeMetrics.totalSales,
            })
          : null;

        const confidence = computeConfidence(
          verificationSlmByGemini ?? null,
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
        const next = setSlmOnlyResult();
        setError(e instanceof Error ? e.message : 'Dual engine failed');
        return next;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <DualEngineContext.Provider
      value={{
        ...result,
        loading,
        geminiVerificationPending,
        error,
        runDualEngine,
        reset,
      }}
    >
      {children}
    </DualEngineContext.Provider>
  );
}
