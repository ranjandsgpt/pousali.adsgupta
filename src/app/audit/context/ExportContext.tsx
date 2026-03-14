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
import { runDataTrustAgent } from '@/agents/dataTrustAgent';
import { aggregateReports } from '@/lib/aggregateReports';

export type ExportProgressStatus = 'idle' | 'queued' | 'rendering' | 'verifying' | 'retrying' | 'ready' | 'error';

interface ExportContextValue {
  exportGenerating: boolean;
  /** Phase 40: status from /api/export-status for progress bar */
  exportStatus: ExportProgressStatus;
  exportStatusMessage: string;
  /** User-visible error when PDF/PPTX export fails */
  exportError: string | null;
  /** Phase 1 Prompt 6: true when last PDF used Node/chart fallback (transparency) */
  chartsFallbackUsed: boolean;
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
  const [chartsFallbackUsed, setChartsFallbackUsed] = useState(false);
  const { state } = useAuditStore();
  const { validated } = useValidatedArtifacts();
  const { report } = useGeminiReport();
  const store = state.store;
  const overrides = state.learnedOverrides?.overrides;

  const buildExportPayload = useCallback(() => {
    const agg =
      store.aggregatedMetrics ??
      aggregateReports(
        store.rawSpAdvertisedRows,
        store.rawSpTargetingRows,
        store.rawSpSearchTermRows,
        store.rawBusinessRows
      );

    const totalAdSpend = agg.adSpend;
    const totalAdSales = agg.adSales;
    const totalStoreSales = agg.totalStoreSales;
    const acos = (agg.acos ?? 0) * 100;
    const roas = agg.roas ?? 0;
    const tacos = (agg.tacos ?? 0) * 100;
    const totalClicks = agg.adClicks > 0 ? agg.adClicks : store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
    const cpc = agg.cpc && agg.cpc > 0 ? agg.cpc : totalClicks > 0 ? totalAdSpend / totalClicks : 0;
    const metrics = [
      { label: 'Ad Spend', value: totalAdSpend },
      { label: 'Ad Sales', value: totalAdSales },
      { label: 'Store Sales', value: totalStoreSales },
      { label: 'ACOS', value: `${acos.toFixed(1)}%` },
      { label: 'ROAS', value: roas.toFixed(2) },
      { label: 'TACOS', value: `${tacos.toFixed(1)}%` },
      { label: 'Sessions', value: agg.sessions },
      { label: 'Clicks', value: totalClicks },
      { label: 'Orders', value: agg.storeOrders },
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
      .map((k) => ({ searchTerm: k.searchTerm, campaign: k.campaign || '', matchType: (k as { matchType?: string }).matchType ?? '', spend: k.spend, sales: k.sales, roas: k.roas }));
    const asins = Object.values(store.asinMetrics)
      .sort((a, b) => b.totalSales - a.totalSales)
      .map((a) => ({ asin: a.asin, totalSales: a.totalSales, adSales: a.adSales, adSpend: a.adSpend }));
    const waste = Object.values(store.keywordMetrics)
      .filter((k) => k.clicks >= 10 && k.sales === 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 100)
      .map((k) => ({ searchTerm: k.searchTerm, campaign: k.campaign || '', spend: k.spend, clicks: k.clicks }));
    const insights = (validated?.insights ?? []).map((i) => ({ title: i.title, description: i.description, recommendedAction: i.recommendedAction }));
    const dataTrustReport = runDataTrustAgent(store);
    return { executiveNarrative: report ?? '', insights, metrics, campaigns, keywords, waste, asins, dataTrustReport };
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
      exportAuditPdf(store, overrides);
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
      const chartsFallback = res.headers.get('X-Charts-Fallback-Used') === 'true';
      setChartsFallbackUsed(chartsFallback);
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
  }, [store, overrides, buildExportPayload, hasData, triggerDownload, validated?.insights, report, fetchBoardroomNarrative]);

  const onDownloadPptx = useCallback(async () => {
    if (!hasData) return;
    setExportError(null);
    setExportGenerating(true);
    setExportStatusState('rendering');
    setExportStatusMessage('Generating PPTX…');
    try {
      const payload = buildExportPayload();
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
      const verified = res.headers.get('X-Export-Verified');
      const warningsHeader = res.headers.get('X-Export-Warnings');
      if (verified === 'false') {
        console.warn(
          '[Export] PPTX verification warnings',
          warningsHeader ? JSON.parse(warningsHeader) : []
        );
        setExportStatusMessage(
          'Export complete — some metrics may be incomplete. Check your uploaded reports.'
        );
      } else {
        setExportStatusMessage('Export ready');
      }
      triggerDownload(blob, 'audit-report.pptx');
      setExportStatusState('ready');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'PPTX export failed';
      console.error('Zenith export', e);
      setExportError(msg);
      setExportStatusState('error');
      setExportStatusMessage(msg);
    } finally {
      setExportGenerating(false);
    }
  }, [buildExportPayload, hasData, triggerDownload]);

  const onRefreshExports = useCallback(async () => {
    if (exportGenerating) return;
    setExportError(null);
    setExportStatusState('queued');
    setExportStatusMessage('Queued export regeneration…');
    try {
      await fetch('/api/export-invalidate', { method: 'POST' });
    } catch {
      // ignore refresh errors; user can retry download
    }
  }, [exportGenerating]);

  const value: ExportContextValue = {
    exportGenerating,
    exportStatus,
    exportStatusMessage,
    exportError,
    chartsFallbackUsed,
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
