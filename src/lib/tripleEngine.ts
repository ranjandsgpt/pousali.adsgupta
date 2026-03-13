import { GoogleGenAI } from '@google/genai';
import { extractTextFromGenerateContentResponse } from './geminiResponse';
import type { AggregatedMetrics } from './aggregateReports';

export type EngineTask =
  | 'slide_content'
  | 'pdf_narrative'
  | 'acos_diagnosis'
  | 'opportunity_analysis'
  | 'insight_card'
  | 'action_copy'
  | 'copilot_answer'
  | 'schema_drift'
  | 'pattern_mining'
  | 'diagnostic_report';

export type EngineResult = {
  text: string;
  modelUsed: 'claude' | 'gemini' | 'slm';
  fallbackUsed: boolean;
  verifiedBy: 'gemini' | 'slm' | 'deterministic' | 'none';
  confidence: number;
  warnings: string[];
};

export type EngineParams = {
  task: EngineTask;
  system: string;
  prompt: string;
  maxTokens: number;
  metrics: AggregatedMetrics;
  jsonMode?: boolean;
  slmTemplate?: string;
};

export async function tripleEngine(params: EngineParams): Promise<EngineResult> {
  if (!params.slmTemplate) {
    throw new Error('tripleEngine missing slmTemplate — SLM template is required for all tasks.');
  }

  const warnings: string[] = [];

  const attempts: Array<() => Promise<string | null>> = [
    () => callClaude(params),
    () => callGemini(params),
    () => Promise.resolve(fillSLMTemplate(params)),
  ];
  const modelNames: Array<'claude' | 'gemini' | 'slm'> = ['claude', 'gemini', 'slm'];

  let rawText: string | null = null;
  let modelUsed: 'claude' | 'gemini' | 'slm' = 'slm';
  let fallbackUsed = false;

  for (let i = 0; i < attempts.length; i++) {
    try {
      const result = await withTimeout(attempts[i](), 8000);
      if (result && result.trim().length > 20) {
        rawText = result;
        modelUsed = modelNames[i];
        fallbackUsed = i > 0;
        break;
      }
    } catch (err: any) {
      const reason = classifyError(err);
      warnings.push(`${modelNames[i]} failed: ${reason}`);
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(
          '[TripleEngine]',
          `${modelNames[i]} failed (${reason})`,
          i === 0 ? '→ trying gemini' : i === 1 ? '→ using SLM template' : ''
        );
      }

      if (reason === 'json_parse' && i < 2) {
        try {
          const retry = await withTimeout(attempts[i](), 8000);
          if (retry && retry.trim().length > 20) {
            rawText = retry;
            modelUsed = modelNames[i];
            fallbackUsed = i > 0;
            break;
          }
        } catch {
          // move to next model
        }
      }
    }
  }

  if (!rawText) {
    rawText = fillSLMTemplate(params);
    modelUsed = 'slm';
    fallbackUsed = true;
  }

  if (params.jsonMode) {
    rawText = ensureValidJson(rawText, warnings);
  }

  const { verified, verifiedBy, caughtWarnings } = await verifyOutput(
    rawText,
    params.metrics,
    modelUsed
  );
  warnings.push(...caughtWarnings);

  const confidence =
    modelUsed === 'claude'
      ? 1.0
      : modelUsed === 'gemini'
        ? 0.7
        : 0.5;

  return {
    text: verified,
    modelUsed,
    fallbackUsed,
    verifiedBy,
    confidence,
    warnings,
  };
}

async function callClaude(params: EngineParams): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY && typeof window !== 'undefined') {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: params.maxTokens,
        system: params.system,
        messages: [{ role: 'user', content: params.prompt }],
      }),
    });
    if (!res.ok) throw new Error(`claude_http_${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(`claude_api: ${data.error.message}`);
    return (data.content as any[])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: params.maxTokens,
      system: params.system,
      messages: [{ role: 'user', content: params.prompt }],
    }),
  });
  if (!response.ok) throw new Error(`claude_http_${response.status}`);
  const data = await response.json();
  if ((data as any).error) throw new Error(`claude_api: ${(data as any).error.message}`);
  return (data.content as any[])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

async function callGemini(params: EngineParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('gemini_config_missing');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model,
    config: {
      systemInstruction: params.system,
      maxOutputTokens: params.maxTokens,
    },
    contents: [{ role: 'user' as const, parts: [{ text: params.prompt }] }],
  });
  const text = extractTextFromGenerateContentResponse(result);
  if (!text) {
    throw new Error('gemini_empty_response');
  }
  return text;
}

function fillSLMTemplate(params: EngineParams): string {
  const m = params.metrics;
  return (params.slmTemplate ?? '')
    .replace('{{accountName}}', 'This account')
    .replace('{{currency}}', m.currency ?? '£')
    .replace('{{adSales}}', (m.adSales ?? 0).toFixed(2))
    .replace('{{adSpend}}', (m.adSpend ?? 0).toFixed(2))
    .replace('{{acos}}', m.acos != null ? (m.acos * 100).toFixed(1) : 'N/A')
    .replace('{{roas}}', m.roas != null ? m.roas.toFixed(2) : 'N/A')
    .replace('{{tacos}}', m.tacos != null ? (m.tacos * 100).toFixed(1) : 'N/A')
    .replace('{{totalStoreSales}}', (m.totalStoreSales ?? 0).toFixed(2))
    .replace('{{sessions}}', (m.sessions ?? 0).toLocaleString())
    .replace('{{buyBox}}', m.buyBoxPct != null ? m.buyBoxPct.toFixed(1) : 'N/A');
}

async function verifyOutput(
  text: string,
  metrics: AggregatedMetrics,
  modelUsed: 'claude' | 'gemini' | 'slm'
): Promise<{
  verified: string;
  verifiedBy: EngineResult['verifiedBy'];
  caughtWarnings: string[];
}> {
  const warnings: string[] = [];

  const numberPattern = /[\£\$\€]?\d+(?:,\d{3})*(?:\.\d+)?%?/g;
  const numbersInText = text.match(numberPattern) ?? [];

  const validValues = buildValidValueSet(metrics);

  let verified = text;

  for (const numStr of numbersInText) {
    const num = parseFloat(numStr.replace(/[£$€,%,]/g, ''));
    if (!Number.isNaN(num) && !isValueInValidSet(num, validValues)) {
      const isApproxMatch = validValues.some(
        (v) => Math.abs(v - num) / Math.max(v, 1) < 0.01
      );
      if (!isApproxMatch) {
        warnings.push(`Unverified number in output: ${numStr} — removed`);
        verified = verified.replace(numStr, '[data unavailable]');
      }
    }
  }

  return {
    verified,
    verifiedBy: modelUsed === 'slm' ? 'deterministic' : 'gemini',
    caughtWarnings: warnings,
  };
}

function buildValidValueSet(metrics: AggregatedMetrics): number[] {
  const vals: number[] = [
    metrics.adSpend,
    metrics.adSales,
    metrics.totalStoreSales,
    metrics.organicSales,
    metrics.acos != null ? metrics.acos * 100 : 0,
    metrics.tacos != null ? metrics.tacos * 100 : 0,
    metrics.roas ?? 0,
    metrics.sessions,
    metrics.adClicks,
    metrics.adOrders,
    metrics.cpc ?? 0,
    metrics.buyBoxPct ?? 0,
  ];

  const anyMetrics = metrics as any;
  if (Array.isArray(anyMetrics.campaigns)) {
    anyMetrics.campaigns.forEach((c: any) => {
      if (typeof c?.spend === 'number') vals.push(c.spend);
      if (typeof c?.sales === 'number') vals.push(c.sales);
      if (typeof c?.acos === 'number') vals.push(c.acos * 100);
    });
  }

  return vals.filter((v) => typeof v === 'number' && Number.isFinite(v) && v !== 0);
}

function isValueInValidSet(value: number, set: number[]): boolean {
  return set.some((v) => v === value);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

function classifyError(err: any): string {
  const msg = err?.message ?? '';
  if (msg.includes('timeout')) return 'timeout';
  if (msg.includes('429')) return 'rate_limit';
  if (msg.toLowerCase().includes('json')) return 'json_parse';
  if (msg.includes('401') || msg.includes('403')) return 'auth';
  return 'unknown';
}

function ensureValidJson(text: string, warnings: string[]): string {
  try {
    JSON.parse(text);
    return text;
  } catch {
    const stripped = text.replace(/```json|```/g, '').trim();
    try {
      JSON.parse(stripped);
      return stripped;
    } catch {
      warnings.push('JSON parse failed after stripping — using raw text');
      return text;
    }
  }
}

