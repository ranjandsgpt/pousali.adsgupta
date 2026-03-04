'use client';

import { useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import AgentSwarm from './components/AgentSwarm';
import KPIGrid from './components/KPIGrid';
import AuditTabs from './components/AuditTabs';
import ExportBar from './components/ExportBar';
import { AuditStoreProvider, useAuditStore } from './context/AuditStoreContext';
import { parseReportsStreaming } from './utils/reportParser';

export type AuditStep = 'upload' | 'processing' | 'dashboard';

function AuditPageContent() {
  const [step, setStep] = useState<AuditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const { setStore } = useAuditStore();

  const handleUploadComplete = (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStep('processing');
    parseReportsStreaming(files, (file, rows) => {
      // Optional: could drive AgentSwarm progress per file/rows
    })
      .then((store) => {
        setStore(store);
        setStep('dashboard');
      })
      .catch(() => {
        setStep('upload');
        // Could set error state and show message
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <UploadPanel
          onUploadComplete={handleUploadComplete}
          disabled={step === 'processing'}
        />

        {(step === 'processing' || step === 'dashboard') && (
          <AgentSwarm isRunning={step === 'processing'} />
        )}

        {step === 'dashboard' && (
          <>
            <KPIGrid />
            <AuditTabs />
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
      <AuditPageContent />
    </AuditStoreProvider>
  );
}
