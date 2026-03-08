'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useAuditStore } from './AuditStoreContext';
import { useValidatedArtifacts } from '../store/ValidatedArtifactsContext';
import { useGeminiReport } from './GeminiReportContext';
import { exportAuditPdf } from '../utils/exportPdf';

export type ExportProgressStatus = 'idle' | 'queued' | 'rendering' | 'verifying' | 'retrying' | 'ready' | 'error';

interface ExportContextValue {
  exportGenerating: boolean;
  /** Phase 40: status from /api/export-status for progress bar */
  exportStatus: ExportProgressStatus;
  exportStatusMessage: string;
  /** User-visible error when PDF/PPTX export fails */
  exportError: string | null;
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

export function ExportProvider({ children }: { children: ReactNode }) {
  const [exportGenerating, setExportGenerating] = useState(false);
  const [exportStatus, setExportStatusState] = useState<ExportProgressStatus>('idle');
  const [exportStatusMessage, setExportStatusMessage] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const { state } = useAuditStore();
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

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);
  }, []);

  const hasData = store.totalAdSpend > 0 || (store.totalStoreSales ?? store.storeMetrics?.totalSales ?? 0) > 0;

  const fetchBoardroomNarrative = useCallback(async (insights: Array<{ title: string; description?: string }>, currentNarrative: string): Promise<string> => {
    try {
      const res = await fetch('/api/zenith-boardroom-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insights, executiveNarrative: currentNarrative }),
      });
      if (!res.ok) return currentNarrative;
      const data = (await res.json()) as { narrative?: string };
      return data.narrative ?? currentNarrative;
    } catch {
      return currentNarrative;
    }
  }, []);

  const onDownloadPdf = useCallback(async () => {
    if (!hasData) {
      exportAuditPdf(store);
      return;
    }
    setExportError(null);
    setExportGenerating(true);
    setExportStatusState('rendering');
    setExportStatusMessage('Generating PDF…');
    try {
      const insights = (validated?.insights ?? []).map((i) => ({ title: i.title, description: i.description }));
      const narrative = await fetchBoardroomNarrative(insights, report ?? '');
      const payload = buildExportPayload();
      payload.executiveNarrative = narrative;
      const res = await fetch('/api/zenith-export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'PDF export failed');
      }
      const blob = await res.blob();
      triggerDownload(blob, 'audit-report.pdf');
      setExportStatusState('ready');
      setExportStatusMessage('Export ready');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'PDF export failed';
      console.error('Zenith PDF export', e);
      setExportError(msg);
      setExportStatusState('error');
      setExportStatusMessage(msg);
    } finally {
      setExportGenerating(false);
    }
  }, [store, buildExportPayload, hasData, triggerDownload, validated?.insights, report, fetchBoardroomNarrative]);

  const onDownloadPptx = useCallback(async () => {
    if (!hasData) return;
    setExportError(null);
    setExportGenerating(true);
    setExportStatusState('rendering');
    setExportStatusMessage('Generating PPTX…');
    try {
      const insights = (validated?.insights ?? []).map((i) => ({ title: i.title, description: i.description }));
      const narrative = await fetchBoardroomNarrative(insights, report ?? '');
      const payload = buildExportPayload();
      payload.executiveNarrative = narrative;
      const res = await fetch('/api/zenith-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'PPTX export failed');
      }
      const blob = await res.blob();
      triggerDownload(blob, 'audit-report.pptx');
      setExportStatusState('ready');
      setExportStatusMessage('Export ready');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'PPTX export failed';
      console.error('Zenith export', e);
      setExportError(msg);
      setExportStatusState('error');
      setExportStatusMessage(msg);
    } finally {
      setExportGenerating(false);
    }
  }, [store, buildExportPayload, hasData, triggerDownload, validated?.insights, report, fetchBoardroomNarrative]);

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
    exportError,
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
