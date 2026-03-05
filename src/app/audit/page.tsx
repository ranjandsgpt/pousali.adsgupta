'use client';

import { useRef, useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import ProtocolsActiveDrawer from './components/ProtocolsActiveDrawer';
import KPISummarySection from './components/KPISummarySection';
import AuditTabs from './components/AuditTabs';
import ExportBar from './components/ExportBar';
import PrivacyNote from './components/PrivacyNote';
import DashboardTitleBar from './components/DashboardTitleBar';
import DetectedMetricsPanel from './components/DetectedMetricsPanel';
import MissingMetricsPanel from './components/MissingMetricsPanel';
import CriticalIssuesSection from './components/CriticalIssuesSection';
import OptimizationOpportunitiesSection from './components/OptimizationOpportunitiesSection';
import DiagnosticModulesSection from './components/DiagnosticModulesSection';
import { AuditStoreProvider, useAuditStore } from './context/AuditStoreContext';
import { LearningProvider, useLearning } from './learning/LearningContext';
import { parseReportsStreaming } from './utils/reportParser';
import { normalizeToCsvFiles } from './utils/xlsxToCsv';

export type AuditStep = 'upload' | 'processing' | 'dashboard';

function AuditPageContent() {
  const [step, setStep] = useState<AuditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const { setStore } = useAuditStore();
  const { runLearning } = useLearning();
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

        {step === 'dashboard' && (
          <>
            <DashboardTitleBar onRerunAnalysis={handleRerunAnalysis} />
            <div className="flex flex-col gap-6">
              <KPISummarySection />
              <DetectedMetricsPanel />
              <MissingMetricsPanel />
              <CriticalIssuesSection />
              <OptimizationOpportunitiesSection />
              <DiagnosticModulesSection />
              <section aria-labelledby="charts-deeper-heading">
                <h2 id="charts-deeper-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">7. Charts and deeper analysis</h2>
                <AuditTabs />
              </section>
            </div>
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
        <AuditPageContent />
      </LearningProvider>
    </AuditStoreProvider>
  );
}
