import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { COPILOT_SYSTEM, buildCopilotUserMessage } from '@/lib/geminiPromptRegistry';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';
import { routeQuery } from '@/lib/copilot/queryRouter';
import { buildAuditContext, type AuditContextInput, type StoreSummarySnapshot } from '@/lib/copilot/contextBuilder';
import { validateCopilotResponse } from '@/lib/copilot/validateResponse';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

  const context = buildAuditContext({
    metrics: auditContextInput.metrics ?? [],
    tables: auditContextInput.tables ?? [],
    charts: auditContextInput.charts ?? [],
    insights: auditContextInput.insights ?? [],
    storeSummary: auditContextInput.storeSummary as StoreSummarySnapshot,
    patterns: auditContextInput.patterns ?? [],
    opportunities: auditContextInput.opportunities ?? [],
  });

  const userMessage = buildCopilotUserMessage(context.summary, route.normalizedQuery);

  const ai = new GoogleGenAI({ apiKey });
  let rawText: string;

  try {
    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: COPILOT_SYSTEM },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    });
    rawText = extractTextFromGenerateContentResponse(result);
  } catch (e) {
    console.error('[copilot] Gemini error:', e);
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
