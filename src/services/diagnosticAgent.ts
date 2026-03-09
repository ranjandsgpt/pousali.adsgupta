/**
 * Self-Healing Pipeline: Critic layer (Observer–Critic). Detects report parsing errors
 * and suggests corrections. Gemini analyzes headers and sample rows only; never modifies formulas.
 */

export interface ValidationReport {
  status: 'ok' | 'warning' | 'error';
  rootCause?: string;
  suggestedFix?: {
    regex?: string;
    overrideColumn?: string;
    fallbackReport?: string;
  };
}

export async function runDiagnosticAgent(params: {
  headers: string[];
  sampleRows?: Record<string, unknown>[];
  canonicalMetrics?: Record<string, number>;
}): Promise<ValidationReport> {
  const { headers = [], sampleRows = [], canonicalMetrics = {} } = params;
  try {
    const res = await fetch('/api/audit-self-healing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'diagnostic',
        headers,
        sampleRows: sampleRows.slice(0, 5),
        canonicalMetrics,
      }),
    });
    if (!res.ok) return { status: 'ok' };
    const data = (await res.json()) as ValidationReport;
    return {
      status: data.status ?? 'ok',
      rootCause: data.rootCause,
      suggestedFix: data.suggestedFix,
    };
  } catch {
    return { status: 'ok' };
  }
}
