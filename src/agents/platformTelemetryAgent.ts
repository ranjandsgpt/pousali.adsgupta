/**
 * Platform Telemetry Agent — Monitors every execution of the platform.
 * Captures: system health, agent performance, export diagnostics, UI interaction, performance metrics.
 * Output: audit-run-report.json structure.
 */

export type TelemetryStatus = 'success' | 'warning' | 'error';

export interface AgentTelemetry {
  name: string;
  status: TelemetryStatus;
  executionTimeMs?: number;
  retryCount?: number;
  error?: string;
}

export interface ExportDiagnostics {
  pdfSuccess: boolean;
  pptxSuccess: boolean;
  chartRenderingSuccess: boolean;
  pythonFallbackUsed: boolean;
}

export interface AuditRunReport {
  runId: string;
  timestamp: string;
  systemHealth: {
    parserSuccess: boolean;
    reportParsingErrors: string[];
    missingFields: string[];
    blankMetrics: string[];
    normalizationFailures: string[];
  };
  agentPerformance: AgentTelemetry[];
  exportDiagnostics: ExportDiagnostics;
  userInteraction: {
    tabsClicked: string[];
    dropdownsUsed: string[];
    chartsViewed: string[];
    rerunClicks: number;
    downloadAttempts: number;
    likeDislikeFeedback: number;
    copilotQueries: number;
  };
  performanceMetrics: {
    timeToParseReportsMs?: number;
    timeToGenerateInsightsMs?: number;
    timeToGenerateExportsMs?: number;
  };
}

const reportStore: AuditRunReport[] = [];
const MAX_STORED = 50;

export function createAuditRunReport(): AuditRunReport {
  return {
    runId: `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    systemHealth: {
      parserSuccess: true,
      reportParsingErrors: [],
      missingFields: [],
      blankMetrics: [],
      normalizationFailures: [],
    },
    agentPerformance: [],
    exportDiagnostics: {
      pdfSuccess: false,
      pptxSuccess: false,
      chartRenderingSuccess: false,
      pythonFallbackUsed: false,
    },
    userInteraction: {
      tabsClicked: [],
      dropdownsUsed: [],
      chartsViewed: [],
      rerunClicks: 0,
      downloadAttempts: 0,
      likeDislikeFeedback: 0,
      copilotQueries: 0,
    },
    performanceMetrics: {},
  };
}

export function recordAgentRun(report: AuditRunReport, agent: string, status: TelemetryStatus, opts?: { executionTimeMs?: number; retryCount?: number; error?: string }) {
  report.agentPerformance.push({
    name: agent,
    status,
    executionTimeMs: opts?.executionTimeMs,
    retryCount: opts?.retryCount,
    error: opts?.error,
  });
}

export function recordExportDiagnostics(report: AuditRunReport, diagnostics: Partial<ExportDiagnostics>) {
  report.exportDiagnostics = { ...report.exportDiagnostics, ...diagnostics };
}

export function recordSystemHealth(report: AuditRunReport, health: Partial<AuditRunReport['systemHealth']>) {
  report.systemHealth = { ...report.systemHealth, ...health };
}

export function pushReport(report: AuditRunReport) {
  reportStore.unshift(report);
  if (reportStore.length > MAX_STORED) reportStore.pop();
}

export function getLatestReports(n: number = 10): AuditRunReport[] {
  return reportStore.slice(0, n);
}

export function getReportJson(): string {
  const latest = reportStore[0];
  return latest ? JSON.stringify(latest, null, 2) : '{}';
}
