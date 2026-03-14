'use client';
import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import AuditProcessingPanel from './components/AuditProcessingPanel';
import AuditSummaryBlock from './components/AuditSummaryBlock';
import AuditTabs from './components/AuditTabs';
import ExportBar from './components/ExportBar';
import { FeedbackWidget } from './components/FeedbackWidget';
import ReconciliationDiagnosticsPanel from './components/ReconciliationDiagnosticsPanel';
import PrivacyNote from './components/PrivacyNote';
import { AuditStoreProvider, useAuditStore } from './context/AuditStoreContext';
import { GeminiReportProvider, useGeminiReport } from './context/GeminiReportContext';
import { ExportProvider, useExport } from './context/ExportContext';
import { ValidatedArtifactsProvider } from './store/ValidatedArtifactsContext';
import { DualEngineProvider, useDualEngine } from './dualEngine/dualEngineContext';
import { PipelineProvider, usePipeline, type PipelineStageId } from './context/PipelineContext';
import { LearningProvider, useLearning } from './learning/LearningContext';
import { parseReportsStreaming } from './utils/reportParser';
import { normalizeToCsvFiles } from './utils/xlsxToCsv';
import { runReportVerification } from './utils/reportVerification';
import type { TabId } from './tabs/useTabData';
import { PendingCopilotQuestionProvider } from './context/PendingCopilotQuestionContext';
import { initUserSession, saveAuditResult } from '@/lib/userSession';
import { aggregateReports } from '@/lib/aggregateReports';

export type AuditStep = 'upload' | 'processing' | 'dashboard';

function DashboardWithExport({
  activeTab,
  setActiveTab,
  onRerunAnalysis,
  onContinueAnyway,
}: {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  onRerunAnalysis: () => void;
  onContinueAnyway?: () => void;
}) {
  const exportCtx = useExport();
  return (
    <>
      <AuditSummaryBlock
        onRerunAnalysis={onRerunAnalysis}
        onContinueAnyway={onContinueAnyway}
        onFocusCriticalIssues={() => {
          setActiveTab('overview');
          if (typeof window !== 'undefined') {
            const el = document.getElementById('critical-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        onDownloadPdf={exportCtx?.onDownloadPdf}
        onDownloadPptx={exportCtx?.onDownloadPptx}
        onRefreshExports={exportCtx?.onRefreshExports}
        exportGenerating={exportCtx?.exportGenerating ?? false}
      />
      <ReconciliationDiagnosticsPanel />
      <AuditTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ExportBar
        onDownloadPdf={exportCtx?.onDownloadPdf}
        onDownloadPptx={exportCtx?.onDownloadPptx}
        onRefreshExports={exportCtx?.onRefreshExports}
        exportGenerating={exportCtx?.exportGenerating ?? false}
        exportStatus={exportCtx?.exportStatus ?? 'idle'}
        exportStatusMessage={exportCtx?.exportStatusMessage ?? ''}
        exportError={exportCtx?.exportError ?? null}
        chartsFallbackUsed={exportCtx?.chartsFallbackUsed ?? false}
      />
      <PrivacyNote />
      <FeedbackWidget />
    </>
  );
}

const MAX_PARSING_RETRIES = 3;

function AuditPageContent() {
  const [step, setStep] = useState<AuditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { state, setStore } = useAuditStore();
  const { runLearning } = useLearning();
  const { runGemini } = useGeminiReport();
  const { runDualEngine } = useDualEngine();
  const { setStage, resetPipeline } = usePipeline();
  const lastFilesRef = useRef<File[]>([]);
  const sessionRef = useRef<{ userId: string; sessionId: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await initUserSession();
        sessionRef.current = { userId: session.userId, sessionId: session.sessionId };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[AuditPage] initUserSession failed:', e);
      }
    })();
  }, []);

  const handleUploadComplete = (files: File[]) => {
    if (files.length === 0) return;
    lastFilesRef.current = files;
    setIsProcessing(true);
    setStep('processing');
    resetPipeline();

    (async () => {
      try {
        setStage('file_upload', 'running');
        const csvFiles = await normalizeToCsvFiles(files);
        setStage('file_upload', 'completed');

        let store = await parseReportsStreaming(
          csvFiles,
          () => {},
          (stage, status, error) => {
            setStage(stage as PipelineStageId, status === 'failed' ? 'failed' : status === 'running' ? 'running' : 'completed', error);
          }
        );

        let attempt = 0;
        let verification = runReportVerification(store);
        while (attempt < MAX_PARSING_RETRIES - 1) {
          const ok =
            verification.crossReport.passed &&
            verification.dataIntegrity.passed &&
            verification.metricVerification.acosMatch &&
            verification.metricVerification.roasMatch;
          if (ok && verification.confidenceScore >= 80) break;
          setStage('column_mapping', 'running');
          setStage('report_parsing', 'running');
          store = await parseReportsStreaming(
            csvFiles,
            () => {},
            (stage, status) => {
              setStage(stage as PipelineStageId, status === 'failed' ? 'failed' : status === 'running' ? 'running' : 'completed');
            }
          );
          verification = runReportVerification(store);
          attempt++;
        }

        setStage('pattern_detection', 'completed');
        setStage('sanity_validation', 'completed');
        setStage('cross_report_validation', verification.crossReport.passed ? 'completed' : 'failed', verification.crossReport.errors[0]);

        setStore(store);
        try {
          if (sessionRef.current && store.aggregatedMetrics) {
            await saveAuditResult(
              sessionRef.current.sessionId,
              sessionRef.current.userId,
              store.aggregatedMetrics
            );
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[AuditPage] saveAuditResult failed:', e);
        }
        await runLearning(store);
        setStep('dashboard');

        setStage('gemini_analysis', 'running');
        runDualEngine(store, {
          rawFiles: lastFilesRef.current,
          deferGemini: true,
          onGeminiComplete: (merged) => {
            if (merged) setStore(merged);
            setStage('gemini_analysis', 'completed');
            setStage('gemini_verification', 'completed');
            setStage('insight_rendering', 'completed');
          },
        });
        runGemini(store, {
          onComplete: (success) => {
            setStage('gemini_analysis', success ? 'completed' : 'failed');
          },
          rawFiles: lastFilesRef.current,
        });
      } catch (err) {
        setStage('report_parsing', 'failed', err instanceof Error ? err.message : 'Parse failed');
        setStep('upload');
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const handleRerunAnalysis = () => {
    const files = lastFilesRef.current;
    if (files.length > 0) {
      handleUploadComplete(files);
    }
  };

  const handleContinueAnyway = () => {
    const { store } = state;
    runDualEngine(store, {
      forceComplete: true,
      rawFiles: lastFilesRef.current,
      deferGemini: true,
      onGeminiComplete: (merged) => {
        if (merged) setStore(merged);
        setStage('gemini_analysis', 'completed');
        setStage('gemini_verification', 'completed');
        setStage('insight_rendering', 'completed');
      },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <Header rightSlot={null} />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-6 pr-6 sm:pr-8 space-y-6">
        <UploadPanel
          onUploadComplete={handleUploadComplete}
          disabled={step === 'processing'}
          collapsed={step === 'dashboard'}
        />
        {step === 'processing' && (
          <AuditProcessingPanel />
        )}

        {step === 'dashboard' && (
          <ExportProvider>
            <PendingCopilotQuestionProvider>
              <DashboardWithExport
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onRerunAnalysis={handleRerunAnalysis}
                onContinueAnyway={handleContinueAnyway}
              />
            </PendingCopilotQuestionProvider>
          </ExportProvider>
        )}
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <AuditStoreProvider>
      <LearningProvider>
        <PipelineProvider>
          <ValidatedArtifactsProvider>
            <DualEngineProvider>
              <GeminiReportProvider>
                <AuditPageContent />
              </GeminiReportProvider>
            </DualEngineProvider>
          </ValidatedArtifactsProvider>
        </PipelineProvider>
      </LearningProvider>
    </AuditStoreProvider>
  );
}
