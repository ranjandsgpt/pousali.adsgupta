'use client';

import { useRef, useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import ProtocolsActiveDrawer from './components/ProtocolsActiveDrawer';
import AuditSummaryBlock from './components/AuditSummaryBlock';
import AuditTabs from './components/AuditTabs';
import ExportBar from './components/ExportBar';
import PrivacyNote from './components/PrivacyNote';
import { AuditStoreProvider, useAuditStore } from './context/AuditStoreContext';
import { GeminiReportProvider, useGeminiReport } from './context/GeminiReportContext';
import { LearningProvider, useLearning } from './learning/LearningContext';
import { parseReportsStreaming } from './utils/reportParser';
import { normalizeToCsvFiles } from './utils/xlsxToCsv';
import type { TabId } from './tabs/useTabData';

export type AuditStep = 'upload' | 'processing' | 'dashboard';

function AuditPageContent() {
  const [step, setStep] = useState<AuditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { setStore } = useAuditStore();
  const { runLearning } = useLearning();
  const { runGemini } = useGeminiReport();
  const lastFilesRef = useRef<File[]>([]);

  const handleUploadComplete = (files: File[]) => {
    if (files.length === 0) return;
    lastFilesRef.current = files;
    setIsProcessing(true);
    setStep('processing');
    (async () => {
      try {
        const csvFiles = await normalizeToCsvFiles(files);
        const store = await parseReportsStreaming(csvFiles, () => {});
        setStore(store);
        await runLearning(store);
        setStep('dashboard');
        runGemini(store);
      } catch {
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

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <Header
        rightSlot={
          (step === 'processing' || step === 'dashboard') ? (
            <ProtocolsActiveDrawer isRunning={step === 'processing'} visible />
          ) : null
        }
      />
      {/* Section 40: responsive padding so page title does not overlap navbar; pr avoids body scrollbar overlapping content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-6 pr-6 sm:pr-8 space-y-6">
        <UploadPanel
          onUploadComplete={handleUploadComplete}
          disabled={step === 'processing'}
        />
        <PrivacyNote />

        {step === 'processing' && (
          <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 text-sm text-[var(--color-text-muted)]">
            Reprocessing reports and validating insights…
          </section>
        )}

        {step === 'dashboard' && (
          <>
            <AuditSummaryBlock
              onRerunAnalysis={handleRerunAnalysis}
              onFocusCriticalIssues={() => {
                setActiveTab('overview');
                if (typeof window !== 'undefined') {
                  const el = document.getElementById('critical-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
            <AuditTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <ExportBar />
          </>
        )}
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <AuditStoreProvider>
      <LearningProvider>
        <GeminiReportProvider>
          <AuditPageContent />
        </GeminiReportProvider>
      </LearningProvider>
    </AuditStoreProvider>
  );
}
