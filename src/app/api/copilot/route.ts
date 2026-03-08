import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { COPILOT_SYSTEM, buildCopilotUserMessage } from '@/lib/geminiPromptRegistry';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';
import { routeQuery } from '@/lib/copilot/queryRouter';
import { buildAuditContext, type AuditContextInput, type StoreSummarySnapshot } from '@/lib/copilot/contextBuilder';
import { validateCopilotResponse } from '@/lib/copilot/validateResponse';
import { assertNoFileReferences, sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { logGeminiRequest } from '@/lib/geminiRequestLogger';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const sym = (c: string | null) => (c === 'EUR' ? '€' : c === 'GBP' ? '£' : '$');

/** SLM deterministic path: answer metric questions from storeSummary only. No Gemini. */
function answerWithSlm(question: string, storeSummary: StoreSummarySnapshot): string | null {
  const q = question.toLowerCase().trim();
  const m = storeSummary.metrics;
  const sign = sym(m.currency);
  if (/\b(total )?ad spend|total spend|spend\b/.test(q) && !/\bsales\b/.test(q)) {
    return `Total ad spend: ${sign}${m.totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;
  }
  if (/\b(total )?ad sales|total sales|sales\b/.test(q) && !/\bspend\b/.test(q)) {
    return `Total ad sales: ${sign}${m.totalAdSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;
  }
  if (/\b(total )?store sales\b/.test(q)) {
    return `Total store sales: ${sign}${m.totalStoreSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;
  }
  if (/\broas\b/.test(q)) {
    return `ROAS (return on ad spend): ${m.roas.toFixed(2)}×.`;
  }
  if (/\bacos\b/.test(q)) {
    return `ACOS (ad cost of sales): ${m.acos.toFixed(1)}%.`;
  }
  if (/\btacos\b/.test(q)) {
    return `TACOS: ${m.tacos.toFixed(1)}%.`;
  }
  if (/\bcpc\b|cost per click/.test(q)) {
    return `CPC: ${sign}${m.cpc.toFixed(2)}.`;
  }
  if (/\bconversions?|orders\b/.test(q)) {
    return `Orders (conversions): ${m.totalOrders.toLocaleString()}.`;
  }
  if (/\bclicks\b/.test(q)) {
    return `Total clicks: ${m.totalClicks.toLocaleString()}.`;
  }
  if (/\bsessions\b/.test(q)) {
    return `Sessions: ${m.totalSessions.toLocaleString()}.`;
  }
  return null;
}

export interface CopilotRequestBody {
  question: string;
  auditContextInput: AuditContextInput;
}

export interface CopilotResponseBody {
  answer: string;
  reason?: string;
  recommendedAction?: string;
  confidence?: string;
  suggestedFollowUps?: string[];
  validated: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let body: CopilotRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { question, auditContextInput } = body;
  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid question' }, { status: 400 });
  }
  if (!auditContextInput || typeof auditContextInput !== 'object') {
    return NextResponse.json({ error: 'Missing or invalid auditContextInput' }, { status: 400 });
  }

  const route = routeQuery(question);
  const hasData =
    (auditContextInput.metrics?.length ?? 0) > 0 ||
    (auditContextInput.storeSummary?.metrics != null);

  if (!hasData) {
    return NextResponse.json({
      answer: 'The uploaded reports do not contain this data. Please upload and run an audit first.',
      validated: true,
      confidence: 'Low',
    } as CopilotResponseBody);
  }

  const storeSummary = auditContextInput.storeSummary as StoreSummarySnapshot;

  if (route.engine === 'slm') {
    const slmAnswer = answerWithSlm(route.normalizedQuery, storeSummary);
    if (slmAnswer) {
      return NextResponse.json({
        answer: slmAnswer,
        validated: true,
        suggestedFollowUps: ['Why is ACOS high?', 'Which campaigns should I pause?', 'View wasted keywords'],
      } as CopilotResponseBody);
    }
  }

  const context = buildAuditContext({
    metrics: auditContextInput.metrics ?? [],
    tables: auditContextInput.tables ?? [],
    charts: auditContextInput.charts ?? [],
    insights: auditContextInput.insights ?? [],
    storeSummary,
    patterns: auditContextInput.patterns ?? [],
    opportunities: auditContextInput.opportunities ?? [],
    agentSignals: auditContextInput.agentSignals,
    verifiedInsights: auditContextInput.verifiedInsights,
    chartSignals: auditContextInput.chartSignals,
    conversationMemory: auditContextInput.conversationMemory,
  });

  let feedbackContext = '';
  try {
    const { getFeedbackContextForEngines } = await import('@/app/audit/agents/humanFeedbackAgent');
    feedbackContext = getFeedbackContextForEngines();
    const { runCentralFeedbackAgent } = await import('@/app/audit/agents/centralFeedbackAgent');
    const central = runCentralFeedbackAgent();
    if (central.promptContextSnippet) {
      feedbackContext = feedbackContext
        ? `${feedbackContext}\n\n${central.promptContextSnippet}`
        : central.promptContextSnippet;
    }
  } catch {
    // optional
  }

  const userMessage = buildCopilotUserMessage(context.summary, route.normalizedQuery, feedbackContext);
  const safeMessage = sanitizeTextForGemini(userMessage);

  const contents = [{ role: 'user' as const, parts: [{ text: safeMessage }] }];
  assertNoFileReferences(contents);

  const ai = new GoogleGenAI({ apiKey });
  let rawText: string;
  const startMs = Date.now();

  try {
    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: COPILOT_SYSTEM },
      contents,
    });
    rawText = extractTextFromGenerateContentResponse(result);
    await logGeminiRequest({
      mode: 'copilot',
      promptLength: safeMessage.length,
      contextSize: context.summary.length,
      responseLatencyMs: Date.now() - startMs,
      validationResult: rawText ? 'ok' : 'empty',
    });
  } catch (e) {
    console.error('[copilot] Gemini error:', e);
    await logGeminiRequest({
      mode: 'copilot',
      promptLength: safeMessage.length,
      contextSize: context.summary.length,
      responseLatencyMs: Date.now() - startMs,
      validationResult: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({
      answer: 'AI insights temporarily unavailable — please try again.',
      validated: false,
      error: String(e),
    } as CopilotResponseBody);
  }

  if (!rawText) {
    return NextResponse.json({
      answer: 'No response from the AI. Please rephrase your question.',
      validated: false,
    } as CopilotResponseBody);
  }

  const validation = validateCopilotResponse(
    rawText,
    auditContextInput.storeSummary as StoreSummarySnapshot
  );

  if (!validation.valid && validation.fallbackMessage) {
    return NextResponse.json({
      answer: validation.fallbackMessage,
      reason: validation.errors.join('; '),
      validated: false,
      confidence: 'Low',
    } as CopilotResponseBody);
  }

  const suggestedFollowUps = [
    'See the worst campaigns',
    'View wasted keywords',
    'Generate an action plan',
  ];

  return NextResponse.json({
    answer: rawText,
    validated: validation.valid,
    suggestedFollowUps,
  } as CopilotResponseBody);
}
