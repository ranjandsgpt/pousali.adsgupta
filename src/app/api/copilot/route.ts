import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { COPILOT_SYSTEM, buildCopilotUserMessage } from '@/lib/geminiPromptRegistry';
import { MAX_TOKENS_NARRATIVE } from '@/lib/geminiPromptRules';
import { buildAuditContext, type AuditContextInput, type StoreSummarySnapshot } from '@/lib/copilot/contextBuilder';
import { validateCopilotResponse } from '@/lib/copilot/validateResponse';
import { detectQueryAmbiguity } from '@/lib/copilot/queryAmbiguity';
import { assertNoFileReferences, sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { logGeminiRequest } from '@/lib/geminiRequestLogger';
import { runQueryIntelligenceAgent } from '@/agents/queryIntelligenceAgent';
import { recordQueryInteraction } from '@/agents/queryInteractionStore';
import { runInsightDiscoveryAgent } from '@/agents/insightDiscoveryAgent';
import { getCalculationAnswer } from '@/lib/copilot/calculationKnowledgeRegistry';
import { getWastedKeywordsExplanation } from '@/agents/wasteKeywordAgent';
import { aggregateReports } from '@/lib/aggregateReports';
import { tripleEngine } from '@/lib/tripleEngine';

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

  const ambiguity = detectQueryAmbiguity(question);
  if (ambiguity.ambiguous && ambiguity.suggestion) {
    return NextResponse.json({
      answer: ambiguity.suggestion,
      validated: true,
      suggestedFollowUps: [],
    } as CopilotResponseBody);
  }

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

  let summaryForPrompt = context.summary;
  const qLower = question.toLowerCase();
  const sign = sym(storeSummary?.metrics?.currency ?? null);

  if (/\bwasted|waste|zero sales|no sales|negative keyword\b/.test(qLower) && storeSummary?.keywords?.length) {
    const wasted = (storeSummary.keywords as Array<{ searchTerm: string; spend: number; sales: number }>)
      .filter((k) => k.spend > 0 && k.sales === 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);
    if (wasted.length) {
      summaryForPrompt += '\n\n--- Top 5 wasted search terms (spend > 0, 0 sales) ---\n' +
        wasted.map((k) => `- ${k.searchTerm}: ${sign}${k.spend.toFixed(2)}`).join('\n');
    }
  }

  if (/\bmatch type|broad|phrase|exact|auto\s*manual|manual\s*targeting\b/.test(qLower) && storeSummary?.keywords?.length) {
    const kws = storeSummary.keywords as Array<{ matchType?: string; spend: number; sales: number }>;
    let autoSpend = 0, autoSales = 0, manualSpend = 0, manualSales = 0;
    const byMatch: Record<string, { spend: number; sales: number }> = {};
    kws.forEach((k) => {
      const m = (k.matchType ?? 'other').toLowerCase();
      if (m.includes('auto')) {
        autoSpend += k.spend;
        autoSales += k.sales;
      } else {
        manualSpend += k.spend;
        manualSales += k.sales;
        byMatch[m] = byMatch[m] || { spend: 0, sales: 0 };
        byMatch[m].spend += k.spend;
        byMatch[m].sales += k.sales;
      }
    });
    const parts = [`Auto: spend ${sign}${autoSpend.toFixed(2)}, sales ${sign}${autoSales.toFixed(2)}`, `Manual: spend ${sign}${manualSpend.toFixed(2)}, sales ${sign}${manualSales.toFixed(2)}`];
    Object.entries(byMatch).forEach(([mt, v]) => { parts.push(`${mt}: spend ${sign}${v.spend.toFixed(2)}, sales ${sign}${v.sales.toFixed(2)}`); });
    if (parts.some((p) => p.includes(sign))) {
      summaryForPrompt += '\n\n--- Match type / targeting ---\n' + parts.join('\n');
    }
  }

  if (/\bbrand|competitor|generic|intent\b/.test(qLower) && auditContextInput.brandMetrics) {
    const b = auditContextInput.brandMetrics;
    summaryForPrompt += '\n\n--- Keyword intent (Brand Intelligence) ---\n' +
      `Branded: ${sign}${b.brandedSales.toFixed(2)} | Generic: ${sign}${b.genericSales.toFixed(2)} | Competitor: ${sign}${b.competitorSales.toFixed(2)}`;
  }

  if (/\bsp\s|sb\s|sd\s|sponsored products|sponsored brands|sponsored display|campaign type\b/.test(qLower) && storeSummary?.campaigns?.length) {
    const infer = (name: string) => {
      const c = (name || '').toLowerCase();
      if (c.includes('sponsored products') || c.includes('sp ')) return 'SP';
      if (c.includes('sponsored brands') || c.includes('sb ') || c.includes('hsa') || c.includes('headline')) return 'SB';
      if (c.includes('sponsored display') || c.includes('sd ')) return 'SD';
      return null;
    };
    let spSpend = 0, sbSpend = 0, sdSpend = 0, spSales = 0, sbSales = 0, sdSales = 0;
    storeSummary.campaigns.forEach((c) => {
      const t = infer(c.campaignName);
      if (t === 'SP') { spSpend += c.spend; spSales += c.sales; }
      else if (t === 'SB') { sbSpend += c.spend; sbSales += c.sales; }
      else if (t === 'SD') { sdSpend += c.spend; sdSales += c.sales; }
    });
    summaryForPrompt += '\n\n--- Campaign type (SP / SB / SD) ---\n' +
      `SP: spend ${sign}${spSpend.toFixed(2)}, sales ${sign}${spSales.toFixed(2)} | SB: spend ${sign}${sbSpend.toFixed(2)}, sales ${sign}${sbSales.toFixed(2)} | SD: spend ${sign}${sdSpend.toFixed(2)}, sales ${sign}${sdSales.toFixed(2)}`;
  }

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

  const userMessage = buildCopilotUserMessage(summaryForPrompt, normalizedQuery, feedbackContext);
  const safeMessage = sanitizeTextForGemini(userMessage);

  const summary = auditContextInput.storeSummary as StoreSummarySnapshot | undefined;

  let rawText: string;
  const startMs = Date.now();

  try {
    const engineResult = await tripleEngine({
      task: 'copilot_answer',
      maxTokens: MAX_TOKENS_NARRATIVE,
      metrics: {
        adSpend: summary?.metrics.totalAdSpend ?? 0,
        adSales: summary?.metrics.totalAdSales ?? 0,
        totalStoreSales: summary?.metrics.totalStoreSales ?? 0,
        adClicks: summary?.metrics.totalClicks ?? 0,
        adImpressions: 0,
        adOrders: summary?.metrics.totalOrders ?? 0,
        storeOrders: summary?.metrics.totalOrders ?? 0,
        sessions: summary?.metrics.totalSessions ?? 0,
        unitsOrdered: 0,
        buyBoxPct: summary?.metrics.buyBoxPercent ?? null,
        organicSales: summary
          ? summary.metrics.totalStoreSales - summary.metrics.totalAdSales
          : 0,
        acos: summary ? summary.metrics.acos / 100 : null,
        tacos: summary ? summary.metrics.tacos / 100 : null,
        roas: summary?.metrics.roas ?? null,
        cpc: summary?.metrics.cpc ?? null,
        ctr: null,
        adCvr: null,
        sessionCvr: null,
        currency: summary?.metrics.currency ?? '£',
        rowCounts: { spAdvertised: 0, spTargeting: 0, spSearchTerm: 0, business: 0 },
        _ingestionLog: [],
      },
      system: COPILOT_SYSTEM,
      prompt: safeMessage,
      slmTemplate: `Based on the account data, ACOS is {{acos}}%, ROAS is {{roas}}x, and TACoS is {{tacos}}%. For more detailed analysis, please ensure your report files have loaded correctly.`,
    });
    rawText = engineResult.text;
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
