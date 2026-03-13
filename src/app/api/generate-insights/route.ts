import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  INSIGHT_NARRATIVE_PROMPT,
  INSIGHT_NARRATIVE_USER_PREFIX,
} from '@/lib/geminiPromptRegistry';
import { MAX_TOKENS_NARRATIVE } from '@/lib/geminiPromptRules';
import { validateNarrativeResponse } from '@/lib/geminiResponseValidation';
import { logGeminiResponse } from '@/lib/geminiResponseLogger';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';
import { assertNoFileReferences, sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { logGeminiRequest } from '@/lib/geminiRequestLogger';

/**
 * Mode 2 — Executive Narrative (Insight Narrative).
 * Request: structured audit context only (JSON). No raw CSV/XLSX files.
 * Response: PLAIN TEXT for "AI Audit Narrative — Gemini" section.
 */
export interface InsightNarrativePayload {
  accountSummary: Record<string, unknown>;
  campaigns?: unknown[];
  searchTerms?: unknown[];
  asins?: unknown[];
  patterns?: unknown[];
  sanity?: Record<string, unknown>;
  /** Deterministic insight summaries from the Insight Rule Engine. */
  insightsSummary?: string[] | string;
  metricsReferenceContext?: string;
  /** Optional mode: default = 'narrative', 'plan' = 7-day optimization plan. */
  mode?: 'narrative' | 'plan';
}

const FAILSAFE_MESSAGE =
  'AI analysis temporarily unavailable. Please rerun analysis.';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_RETRIES = 1;

/** Call Gemini with text-only content. No file references. */
async function callGeminiNarrative(
  ai: GoogleGenAI,
  systemInstruction: string,
  userText: string
): Promise<string> {
  const contents = [{ role: 'user' as const, parts: [{ text: userText }] }];
  assertNoFileReferences(contents);
  const result = await ai.models.generateContent({
    model,
    config: { systemInstruction, maxOutputTokens: MAX_TOKENS_NARRATIVE },
    contents,
  });
  return extractTextFromGenerateContentResponse(result);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured', report: FAILSAFE_MESSAGE },
      { status: 503 }
    );
  }

  let payload: InsightNarrativePayload;
  try {
    payload = (await request.json()) as InsightNarrativePayload;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', report: FAILSAFE_MESSAGE },
      { status: 400 }
    );
  }

  const insightsSummaryText = Array.isArray(payload.insightsSummary)
    ? payload.insightsSummary.join('\n')
    : typeof payload.insightsSummary === 'string'
      ? payload.insightsSummary
      : '';

  let rawUserText: string;
  if (payload.mode === 'plan') {
    rawUserText = [
      'Generate a 7 day Amazon PPC optimization plan using these deterministic insights.',
      '',
      'Insights detected:',
      insightsSummaryText || '(no insights provided)',
    ].join('\n');
  } else {
    const dataJson = JSON.stringify(
      {
        accountSummary: payload.accountSummary,
        insightsSummary: insightsSummaryText,
      },
      null,
      2
    );
    rawUserText = `${INSIGHT_NARRATIVE_USER_PREFIX}\n\nUse the following verified audit data (structured context only).\n\n${dataJson}`;
  }

  const userText = sanitizeTextForGemini(rawUserText);

  const metricsReferenceContext =
    typeof payload.metricsReferenceContext === 'string'
      ? payload.metricsReferenceContext
      : '';
  const systemInstruction = metricsReferenceContext
    ? `${INSIGHT_NARRATIVE_PROMPT}\n\n${metricsReferenceContext}`
    : INSIGHT_NARRATIVE_PROMPT;

  const ai = new GoogleGenAI({ apiKey });
  let lastRaw = '';
  let narrative: string | null = null;
  let errorCode: string | undefined;
  let errorDetail: string | undefined;

  const contextSize = userText.length;
  const startMs = Date.now();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      lastRaw = await callGeminiNarrative(ai, systemInstruction, userText);
      const latencyMs = Date.now() - startMs;
      await logGeminiResponse({
        mode: 'insight_narrative',
        rawResponse: lastRaw.slice(0, 10000),
        outcome: lastRaw ? 'plain_text' : 'empty',
        ...(attempt > 0 ? { error: `retry ${attempt}` } : {}),
      });
      await logGeminiRequest({
        mode: 'insight_narrative',
        promptLength: userText.length,
        contextSize,
        responseLatencyMs: latencyMs,
        validationResult: lastRaw ? 'ok' : 'empty',
      });
      if (!lastRaw) {
        errorCode = 'gemini_empty';
        errorDetail = 'Gemini returned no text. Check model name and API quota.';
        break;
      }
      const validation = validateNarrativeResponse(lastRaw);
      if (validation.valid && validation.narrative) {
        narrative = validation.narrative;
        break;
      }
      if (validation.shouldRetry && attempt < MAX_RETRIES) {
        continue;
      }
      if (validation.narrative) {
        narrative = validation.narrative;
        break;
      }
      errorCode = 'validation_failed';
      errorDetail = validation.reason ?? 'Response format was not accepted.';
      break;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error('generate-insights error', e);
      await logGeminiResponse({
        mode: 'insight_narrative',
        rawResponse: lastRaw || '(no response)',
        outcome: 'error',
        error: errMsg,
      });
      await logGeminiRequest({
        mode: 'insight_narrative',
        promptLength: userText.length,
        contextSize,
        responseLatencyMs: Date.now() - startMs,
        validationResult: 'error',
        error: errMsg.slice(0, 200),
      });
      errorCode = 'gemini_error';
      errorDetail = errMsg.slice(0, 200);
      break;
    }
  }

  const report = narrative && narrative.length > 0 ? narrative : FAILSAFE_MESSAGE;
  const body: { report: string; errorCode?: string; errorDetail?: string } = { report };
  if (errorCode) body.errorCode = errorCode;
  if (errorDetail) body.errorDetail = errorDetail;
  return NextResponse.json(body, { status: 200 });
}
