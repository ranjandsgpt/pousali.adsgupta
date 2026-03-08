'use client';

import { useState, useEffect } from 'react';

interface AuditRunReport {
  runId: string;
  timestamp: string;
  systemHealth: { parserSuccess: boolean; reportParsingErrors: string[]; missingFields: string[] };
  agentPerformance: Array<{ name: string; status: string; executionTimeMs?: number }>;
  exportDiagnostics: { pdfSuccess: boolean; pptxSuccess: boolean; pythonFallbackUsed: boolean };
  userInteraction: { copilotQueries: number; downloadAttempts: number };
  performanceMetrics: Record<string, number>;
}

export function DiagnosticsViewer() {
  const [reports, setReports] = useState<AuditRunReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/telemetry-report')
      .then((r) => r.json())
      .then((d) => {
        setReports(d.reports ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading telemetry…</p>;
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Telemetry & Diagnostics</h2>
        <p className="text-sm text-[var(--color-text-muted)]">No audit run reports yet. Run an audit to see system health, agent performance, and export diagnostics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">Telemetry & Diagnostics</h2>
      {reports.map((r) => (
        <div key={r.runId} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">{r.runId} — {r.timestamp}</p>
          <div className="mt-2 grid gap-2 text-sm">
            <p><strong>System health:</strong> parser {r.systemHealth.parserSuccess ? 'OK' : 'failed'}; errors: {r.systemHealth.reportParsingErrors?.length ?? 0}</p>
            <p><strong>Agents:</strong> {r.agentPerformance?.map((a) => `${a.name}: ${a.status}`).join(', ') || '—'}</p>
            <p><strong>Export:</strong> PDF {r.exportDiagnostics?.pdfSuccess ? 'OK' : '—'}, PPTX {r.exportDiagnostics?.pptxSuccess ? 'OK' : '—'}, Python fallback: {r.exportDiagnostics?.pythonFallbackUsed ? 'yes' : 'no'}</p>
            <p><strong>Interaction:</strong> Copilot queries {r.userInteraction?.copilotQueries ?? 0}, Downloads {r.userInteraction?.downloadAttempts ?? 0}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
