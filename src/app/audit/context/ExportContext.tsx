'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuditStore } from './AuditStoreContext';
import { useValidatedArtifacts } from '../store/ValidatedArtifactsContext';
import { useGeminiReport } from './GeminiReportContext';
import { exportAuditPdf } from '../utils/exportPdf';

export type ExportProgressStatus = 'idle' | 'queued' | 'rendering' | 'verifying' | 'ready' | 'error';

interface ExportContextValue {
  exportGenerating: boolean;
  /** Phase 40: status from /api/export-status for progress bar */
  exportStatus: ExportProgressStatus;
  exportStatusMessage: string;
  onDownloadPdf: () => void | Promise<void>;
  onDownloadPptx: () => void | Promise<void>;
  onRefreshExports: () => void;
}

const ExportContext = createContext<ExportContextValue | null>(null);

export function useExport() {
  const ctx = useContext(ExportContext);
  if (!ctx) return null;
  return ctx;
}

const POLL_INTERVAL_MS = 800;

export function ExportProvider({ children }: { children: ReactNode }) {
  const [exportGenerating, setExportGenerating] = useState(false);
  const [exportStatus, setExportStatusState] = useState<ExportProgressStatus>('idle');
  const [exportStatusMessage, setExportStatusMessage] = useState('');
  const { state } = useAuditStore();

  useEffect(() => {
    if (!exportGenerating) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch('/api/export-status');
        const data = (await res.json()) as { status: ExportProgressStatus; message?: string };
        setExportStatusState(data.status);
        setExportStatusMessage(data.message ?? data.status);
      } catch {
        //
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [exportGenerating]);
  const { validated } = useValidatedArtifacts();
  const { report } = useGeminiReport();
  const store = state.store;

  const buildExportPayload = useCallback(() => {
    const totalAdSpend = store.totalAdSpend;
    const totalAdSales = store.totalAdSales;
    const totalStoreSales = store.totalStoreSales ?? store.storeMetrics.totalSales;
    const acos = totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;
    const roas = totalAdSpend > 0 ? totalAdSales / totalAdSpend : 0;
    const tacos = totalStoreSales > 0 ? (totalAdSpend / totalStoreSales) * 100 : 0;
    const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
    const cpc = totalClicks > 0 ? totalAdSpend / totalClicks : 0;
    const metrics = [
      { label: 'Ad Spend', value: totalAdSpend },
      { label: 'Ad Sales', value: totalAdSales },
      { label: 'Store Sales', value: totalStoreSales },
      { label: 'ACOS', value: `${acos.toFixed(1)}%` },
      { label: 'ROAS', value: roas.toFixed(2) },
      { label: 'TACOS', value: `${tacos.toFixed(1)}%` },
      { label: 'Sessions', value: store.totalSessions },
      { label: 'Clicks', value: totalClicks },
      { label: 'Orders', value: store.totalOrders ?? 0 },
      { label: 'CPC', value: cpc.toFixed(2) },
    ];
    const campaigns = Object.values(store.campaignMetrics)
      .filter((c) => c.campaignName)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 80)
      .map((c) => ({ campaignName: c.campaignName || '', spend: c.spend, sales: c.sales, acos: c.acos }));
    const keywords = Object.values(store.keywordMetrics)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 200)
      .map((k) => ({ searchTerm: k.searchTerm, campaign: k.campaign || '', spend: k.spend, sales: k.sales, roas: k.roas }));
    const waste = Object.values(store.keywordMetrics)
      .filter((k) => k.clicks >= 10 && k.sales === 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 100)
      .map((k) => ({ searchTerm: k.searchTerm, campaign: k.campaign || '', spend: k.spend, clicks: k.clicks }));
    const insights = (validated?.insights ?? []).map((i) => ({ title: i.title, description: i.description, recommendedAction: i.recommendedAction }));
    return { executiveNarrative: report ?? '', insights, metrics, campaigns, keywords, waste };
  }, [store, validated?.insights, report]);

  const onDownloadPdf = useCallback(async () => {
    const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;
    if (!hasData) {
      exportAuditPdf(store);
      return;
    }
    setExportGenerating(true);
    try {
      const payload = buildExportPayload();
      const res = await fetch('/api/zenith-export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'PDF export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Amazon-Advertising-CXO-Audit.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Zenith PDF export', e);
    } finally {
      setExportGenerating(false);
    }
  }, [store, buildExportPayload]);

  const onDownloadPptx = useCallback(async () => {
    const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;
    if (!hasData) return;
    setExportGenerating(true);
    try {
      const payload = buildExportPayload();
      const res = await fetch('/api/zenith-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Amazon-Advertising-CXO-Audit.pptx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Zenith export', e);
    } finally {
      setExportGenerating(false);
    }
  }, [store, buildExportPayload]);

  const onRefreshExports = useCallback(async () => {
    if (exportGenerating) return;
    try {
      await fetch('/api/export-invalidate', { method: 'POST' });
    } catch {
      //
    }
    onDownloadPptx();
  }, [exportGenerating, onDownloadPptx]);

  const value: ExportContextValue = {
    exportGenerating,
    exportStatus,
    exportStatusMessage,
    onDownloadPdf,
    onDownloadPptx,
    onRefreshExports,
  };

  return (
    <ExportContext.Provider value={value}>
      {children}
    </ExportContext.Provider>
  );
}
