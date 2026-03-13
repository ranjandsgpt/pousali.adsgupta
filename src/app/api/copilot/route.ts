import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { COPILOT_SYSTEM, buildCopilotUserMessage } from '@/lib/geminiPromptRegistry';
import { MAX_TOKENS_NARRATIVE } from '@/lib/geminiPromptRules';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';
import { buildAuditContext, type AuditContextInput, type StoreSummarySnapshot } from '@/lib/copilot/contextBuilder';
import { validateCopilotResponse } from '@/lib/copilot/validateResponse';
import { assertNoFileReferences, sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { logGeminiRequest } from '@/lib/geminiRequestLogger';
import { runQueryIntelligenceAgent } from '@/agents/queryIntelligenceAgent';
import { recordQueryInteraction } from '@/agents/queryInteractionStore';
import { runInsightDiscoveryAgent } from '@/agents/insightDiscoveryAgent';
import { getCalculationAnswer } from '@/lib/copilot/calculationKnowledgeRegistry';
import { getWastedKeywordsExplanation } from '@/agents/wasteKeywordAgent';

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
  /** Use this ID when submitting feedback (like/dislike) so the system can link to intent/capability. */
  responseId?: string;
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

  const hasData =
    (auditContextInput.metrics?.length ?? 0) > 0 ||
    (auditContextInput.storeSummary?.metrics != null);

  // Only return definitions when there is no audit data, or when the question explicitly asks for a formula/definition.
  // When we have data, always use the insight pipeline (QI → SLM/Gemini) so users get real metrics and insights.
  const asksForDefinition = /\b(how\s+is|how\s+are|what\s+is\s+the\s+formula|define|definition|calculated?|formula)\b/i.test(question);
  if (!hasData || asksForDefinition) {
    const calculationAnswer = getCalculationAnswer(question);
    if (calculationAnswer && (!hasData || asksForDefinition)) {
      return NextResponse.json({
        answer: calculationAnswer,
        validated: true,
        suggestedFollowUps: runInsightDiscoveryAgent(question),
      } as CopilotResponseBody);
    }
    const q = question.toLowerCase().trim();
    if (/\bwhere\s+(do|are)\s+wasted\s+keyword|wasted\s+keyword.*(come\s+from|from\s+where)\b/.test(q)) {
      return NextResponse.json({
        answer: getWastedKeywordsExplanation(),
        validated: true,
        suggestedFollowUps: runInsightDiscoveryAgent(question),
      } as CopilotResponseBody);
    }
    if (!hasData) {
      return NextResponse.json({
        answer: 'The uploaded reports do not contain this data. Please upload and run an audit first.',
        validated: true,
        confidence: 'Low',
      } as CopilotResponseBody);
    }
  }

  const storeSummary = auditContextInput.storeSummary as StoreSummarySnapshot;

  // Query Intelligence Agent: intent → capability → route → SLM/formula/dataset or Gemini
  const qiResult = runQueryIntelligenceAgent({
    question,
    storeSummary,
    slmAnswerFn: answerWithSlm,
  });

  if (qiResult.kind === 'answer') {
    const responseId = randomUUID();
    recordQueryInteraction(responseId, {
      question,
      intent: qiResult.intent,
      capability: qiResult.capability,
      answer: qiResult.answer,
    });
    const suggestedFollowUps = runInsightDiscoveryAgent(question);
    return NextResponse.json({
      answer: qiResult.answer,
      validated: qiResult.validated,
      suggestedFollowUps,
      responseId,
    } as CopilotResponseBody);
  }

  // need_gemini: use existing pipeline with normalized query (and optional decomposition)
  const normalizedQuery = qiResult.normalizedQuery;

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

  const userMessage = buildCopilotUserMessage(
    context.summary,
    normalizedQuery,
    feedbackContext
  );
  const safeMessage = sanitizeTextForGemini(userMessage);

  const contents = [{ role: 'user' as const, parts: [{ text: safeMessage }] }];
  assertNoFileReferences(contents);

  const ai = new GoogleGenAI({ apiKey });
  let rawText: string;
  const startMs = Date.now();

  try {
    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: COPILOT_SYSTEM, maxOutputTokens: MAX_TOKENS_NARRATIVE },
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
    const responseId = randomUUID();
    recordQueryInteraction(responseId, {
      question,
      intent: qiResult.intent,
      capability: qiResult.capability,
      answer: validation.fallbackMessage,
    });
    return NextResponse.json({
      answer: validation.fallbackMessage,
      reason: validation.errors.join('; '),
      validated: false,
      confidence: 'Low',
      responseId,
    } as CopilotResponseBody);
  }

  const suggestedFollowUps =
    runInsightDiscoveryAgent(question).length > 0
      ? runInsightDiscoveryAgent(question)
      : ['See the worst campaigns', 'View wasted keywords', 'Generate an action plan'];

  const responseId = randomUUID();
  recordQueryInteraction(responseId, {
    question,
    intent: qiResult.intent,
    capability: qiResult.capability,
    answer: rawText,
  });

  return NextResponse.json({
    answer: rawText,
    validated: validation.valid,
    suggestedFollowUps,
    responseId,
  } as CopilotResponseBody);
}
