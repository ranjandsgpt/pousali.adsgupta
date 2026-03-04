'use client';

import { useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import AgentSwarm from './components/AgentSwarm';
import KPIGrid from './components/KPIGrid';
import AuditTabs from './components/AuditTabs';
import ExportBar from './components/ExportBar';

export type AuditStep = 'upload' | 'processing' | 'dashboard';

export default function AuditPage() {
  const [step, setStep] = useState<AuditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadComplete = () => {
    setIsProcessing(true);
    setStep('processing');
    // Simulate agent swarm; later plug in real processing
    const t = setTimeout(() => {
      setStep('dashboard');
      setIsProcessing(false);
    }, 2000);
    return () => clearTimeout(t);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Upload Reports */}
        <UploadPanel
          onUploadComplete={handleUploadComplete}
          disabled={step === 'processing'}
        />

        {/* 2. Agent Swarm Processing */}
        {(step === 'processing' || step === 'dashboard') && (
          <AgentSwarm isRunning={step === 'processing'} />
        )}

        {/* 3. KPI Dashboard */}
        {step === 'dashboard' && (
          <>
            <KPIGrid />
            {/* 4. Charts / 5. Tables via Tabs */}
            <AuditTabs />
            {/* 6. Export Report */}
            <ExportBar />
          </>
        )}
      </div>
    </div>
  );
}
