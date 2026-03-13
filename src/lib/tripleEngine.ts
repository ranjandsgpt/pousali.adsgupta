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
  // Stub: task-aware templates using real metrics when available
  let text = '';

  const m = (metrics || {}) as Record<string, unknown>;
  const currency = (m.currency as string) ?? '£';

  if (task === 'pdf_narrative' || task === 'pptx_narrative') {
    const totalStoreSales = Number(m.totalStoreSales ?? m.totalSales ?? 0);
    const adSpend = Number(m.adSpend ?? 0);
    const adSales = Number(m.adSales ?? 0);
    const acosValue = m.acos != null ? Number(m.acos) * 100 : 0;
    const tacosValue = m.tacos != null ? Number(m.tacos) * 100 : 0;
    const adSalesPercent = totalStoreSales > 0 ? (adSales / totalStoreSales) * 100 : 0;
    const roasValue = m.roas != null ? Number(m.roas) : 0;
    const dependency = tacosValue > 35 ? 'heavy' : tacosValue > 20 ? 'moderate' : 'healthy';

    text = `**Overview:** The account generated ${currency}${totalStoreSales.toFixed(2)} in total store sales with ${currency}${adSpend.toFixed(2)} in advertising spend, resulting in an ACOS of ${acosValue.toFixed(1)}%.

**Key Finding:** Ad sales contributed ${adSalesPercent.toFixed(1)}% of total revenue with a ROAS of ${roasValue.toFixed(2)}x.

**Impact:** Current TACoS of ${tacosValue.toFixed(1)}% indicates ${dependency} ad dependency.

**Recommendation:** Review campaign efficiency and optimize high-spend, low-conversion keywords to improve overall profitability.`;
  }

  if (!text && slmTemplate && typeof slmTemplate === 'string') {
    text = slmTemplate
      .replace(/\{\{acos\}\}/g, m.acos != null ? String(m.acos) : '—')
      .replace(/\{\{roas\}\}/g, m.roas != null ? String(m.roas) : '—')
      .replace(/\{\{tacos\}\}/g, m.tacos != null ? String(m.tacos) : '—')
      .replace(/\{\{currency\}\}/g, currency)
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
