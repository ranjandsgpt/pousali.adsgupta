/**
 * Triple engine stub — LLM/SLM orchestration for Copilot, PDF narrative, slides, insight cards.
 * Replace with real Gemini/SLM implementation when available.
 */

export const engineLogBuffer: Array<{ taskType: string; durationMs?: number }> = [];

export interface TripleEngineOptions {
  task: string;
  maxTokens: number;
  metrics?: object;
  system?: string;
  prompt?: string;
  slmTemplate?: string;
  jsonMode?: boolean;
}

export interface TripleEngineResult {
  text: string;
  modelUsed?: 'claude' | 'gemini' | 'slm';
  fallbackUsed?: boolean;
  confidence?: number;
  warnings?: string[];
}

export async function tripleEngine(options: TripleEngineOptions): Promise<TripleEngineResult> {
  const start = Date.now();
  const { task, slmTemplate, metrics } = options;
  // Stub: return SLM-style placeholder from template if present, else generic message
  let text = '';
  if (slmTemplate && typeof slmTemplate === 'string') {
    const m = (metrics || {}) as Record<string, unknown>;
    text = slmTemplate
      .replace(/\{\{acos\}\}/g, m.acos != null ? String(m.acos) : '—')
      .replace(/\{\{roas\}\}/g, m.roas != null ? String(m.roas) : '—')
      .replace(/\{\{tacos\}\}/g, m.tacos != null ? String(m.tacos) : '—')
      .replace(/\{\{currency\}\}/g, (m.currency as string) ?? '£')
      .replace(/\{\{adSpend\}\}/g, (m.adSpend != null ? Number(m.adSpend) : 0).toFixed(2))
      .replace(/\{\{adSales\}\}/g, (m.adSales != null ? Number(m.adSales) : 0).toFixed(2));
  }
  if (!text) {
    text = 'Analysis will appear here once the LLM engine is configured. Upload reports and run the audit for data-backed insights.';
  }
  const durationMs = Date.now() - start;
  engineLogBuffer.push({ taskType: task, durationMs });
  return { text, modelUsed: 'slm', fallbackUsed: true, confidence: 0.8 };
}
