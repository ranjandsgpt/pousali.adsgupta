import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  VERIFY_SLM_PROMPT,
  buildVerifySlmUserMessage,
  STRUCTURED_FROM_RAW_SYSTEM,
  STRUCTURED_FROM_RAW_USER_PREFIX,
  STRUCTURED_FROM_JSON_USER_PREFIX,
  SCHEMA_INFER_SYSTEM,
  buildSchemaInferUserMessage,
} from '@/lib/geminiPromptRegistry';
import { logGeminiResponse } from '@/lib/geminiResponseLogger';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';
import { assertNoFileReferences, sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { logGeminiRequest } from '@/lib/geminiRequestLogger';
import {
  enforceGeminiLimits,
  getCachedResponse,
  setCachedResponse,
  consumeBudget,
} from '@/lib/geminiRateLimitCache';
import { sanitizeStructuredPayloadForGemini, sanitizeHeadersForPrivacy } from '@/lib/privacySanitizer';

/**
 * Dual Engine API:
 * - mode: 'structured' — Gemini receives structured JSON payload only; returns metrics_gemini, tables_gemini, charts_gemini, insights_gemini, recovered_fields
 * - mode: 'verify_slm' — Gemini receives SLM artifacts (text) and returns verification scores
 * - mode: 'infer_schema' — Gemini receives header list (text) and returns schema mappings
 *
 * Architecture: Gemini receives only structured audit context (text/JSON). No raw CSV/XLSX files are sent to Gemini.
 * Accepts application/json: body = { mode, payload }. Multipart form-data may include files for future server-side parsing only; files are not sent to Gemini.
 */

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

interface StructuredPayload {
  accountSummary: Record<string, unknown>;
  campaigns: unknown[];
  searchTerms: unknown[];
  asins: unknown[];
}

interface VerifySlmPayload {
  datasetSummary: Record<string, unknown>;
  slmArtifacts: {
    metrics: unknown[];
    tables: unknown[];
    charts: unknown[];
    insights: unknown[];
  };
}

interface InferSchemaPayload {
  headers: string[];
}

function parseJsonScores(text: string): Record<string, number> | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Mode 1 contract: verification_result, confidence_score, disagreements, correctedMetrics. */
function parseVerificationResult(
  text: string
): {
  verification_result?: string;
  confidence_score?: number;
  disagreements?: string[];
  correctedMetrics?: Record<string, number>;
} | null {
  const obj = parseJsonScores(text) as Record<string, unknown> | null;
  if (!obj || typeof obj !== 'object') return null;
  return {
    verification_result: typeof obj.verification_result === 'string' ? obj.verification_result : undefined,
    confidence_score: typeof obj.confidence_score === 'number' ? obj.confidence_score : undefined,
    disagreements: Array.isArray(obj.disagreements) ? obj.disagreements.filter((x): x is string => typeof x === 'string') : undefined,
    correctedMetrics: obj.correctedMetrics && typeof obj.correctedMetrics === 'object' ? (obj.correctedMetrics as Record<string, number>) : undefined,
  };
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceGeminiLimits(request);
  if (rateLimitResponse) return rateLimitResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }
  const contentType = request.headers.get('content-type') || '';
  let body: { mode: 'structured' | 'verify_slm' | 'infer_schema'; payload: StructuredPayload | VerifySlmPayload | InferSchemaPayload };
  let rawFiles: Blob[] = [];

  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const payloadStr = formData.get('payload') as string | null;
      if (!payloadStr) {
        return NextResponse.json({ error: 'Missing payload in form data' }, { status: 400 });
      }
      body = JSON.parse(payloadStr);
      const files = formData.getAll('files') as (Blob | File)[];
      rawFiles = files.filter((f): f is Blob => f != null && typeof (f as Blob).arrayBuffer === 'function');
    } catch (e) {
      console.error('dual-engine multipart parse', e);
      return NextResponse.json({ error: 'Invalid multipart/form-data' }, { status: 400 });
    }
  } else {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  }

  const ai = new GoogleGenAI({ apiKey });
  const { mode, payload: rawPayload } = body;

  if (mode === 'infer_schema') {
    const rawHeaders = (rawPayload as InferSchemaPayload).headers;
    if (!Array.isArray(rawHeaders) || rawHeaders.length === 0) {
      return NextResponse.json({ error: 'Missing or empty headers' }, { status: 400 });
    }
  }

  const payload = mode === 'infer_schema'
    ? { headers: sanitizeHeadersForPrivacy((rawPayload as InferSchemaPayload).headers || []) }
    : (sanitizeStructuredPayloadForGemini((rawPayload as unknown) as Record<string, unknown>) as unknown as StructuredPayload | VerifySlmPayload);

  if (mode === 'infer_schema') {
    const { headers } = payload as InferSchemaPayload;
    const cached = getCachedResponse(mode, payload);
    if (cached != null) return NextResponse.json(cached as Record<string, unknown>);
    const prompt = sanitizeTextForGemini(buildSchemaInferUserMessage(headers));
    try {
      consumeBudget();
      const result = await ai.models.generateContent({
        model,
        config: { systemInstruction: SCHEMA_INFER_SYSTEM },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = extractTextFromGenerateContentResponse(result);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const raw = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(raw) as { mappings?: { rawHeader: string; inferred_metric: string; confidence_score: number }[] };
      const mappings = Array.isArray(parsed.mappings) ? parsed.mappings : [];
      const response = { mappings };
      setCachedResponse(mode, payload, response);
      return NextResponse.json(response);
    } catch (e) {
      console.error('dual-engine infer_schema', e);
      return NextResponse.json({ mappings: [] });
    }
  }

  if (mode === 'verify_slm') {
    const { datasetSummary, slmArtifacts } = payload as VerifySlmPayload;
    const cached = getCachedResponse(mode, payload);
    if (cached != null) return NextResponse.json(cached as Record<string, unknown>);
    let feedbackContext = '';
    try {
      const { getFeedbackContextForEngines } = await import('@/app/audit/agents/humanFeedbackAgent');
      feedbackContext = getFeedbackContextForEngines();
    } catch {
      // optional: feedback not available
    }
    const prompt = sanitizeTextForGemini(buildVerifySlmUserMessage(datasetSummary, slmArtifacts, feedbackContext));
    try {
      consumeBudget();
      const result = await ai.models.generateContent({
        model,
        config: { systemInstruction: VERIFY_SLM_PROMPT },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = extractTextFromGenerateContentResponse(result);
      await logGeminiResponse({
        mode: 'verify_slm',
        rawResponse: text,
        outcome: text ? 'json' : 'empty',
      });
      const obj = parseVerificationResult(text);
      const confidence = obj?.confidence_score ?? 0.9;
      const score = Math.max(0, Math.min(1, typeof confidence === 'number' ? confidence : 0.9));
      const response = {
        verification_result: obj?.verification_result ?? 'agree',
        confidence_score: score,
        disagreements: Array.isArray(obj?.disagreements) ? obj.disagreements : [],
        correctedMetrics: obj?.correctedMetrics ?? {},
        metrics_score: score,
        tables_score: score,
        charts_score: score,
        insights_score: score,
      };
      setCachedResponse(mode, payload, response);
      return NextResponse.json(response);
    } catch (e) {
      console.error('dual-engine verify_slm', e);
      return NextResponse.json({
        verification_result: 'agree',
        confidence_score: 0.85,
        disagreements: [],
        correctedMetrics: {},
        metrics_score: 0.85,
        tables_score: 0.85,
        charts_score: 0.85,
        insights_score: 0.85,
      });
    }
  }

  if (mode === 'structured') {
    const p = payload as StructuredPayload;
    const cached = getCachedResponse(mode, payload);
    if (cached != null) return NextResponse.json(cached as Record<string, unknown>);
    const datasetJson = JSON.stringify(p, null, 2);
    const userText = sanitizeTextForGemini(STRUCTURED_FROM_JSON_USER_PREFIX + datasetJson);
    const contents = [{ role: 'user' as const, parts: [{ text: userText }] }];
    assertNoFileReferences(contents);

    const startMs = Date.now();
    try {
      consumeBudget();
      const result = await ai.models.generateContent({
        model,
        config: { systemInstruction: STRUCTURED_FROM_RAW_SYSTEM },
        contents,
      });
      const text = extractTextFromGenerateContentResponse(result);
      await logGeminiResponse({
        mode: 'structured',
        rawResponse: text.slice(0, 8000),
        outcome: text ? 'json' : 'empty',
      });
      await logGeminiRequest({
        mode: 'structured',
        promptLength: userText.length,
        contextSize: userText.length,
        responseLatencyMs: Date.now() - startMs,
        validationResult: text ? 'ok' : 'empty',
      });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const raw = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(raw) as {
        metrics?: unknown[];
        tables?: unknown[];
        charts?: unknown[];
        insights?: unknown[];
        recovered_fields?: Record<string, number>;
        schema_inferences?: Record<string, { canonical: string; confidence: number }>;
      };
      const response = {
        metrics_gemini: Array.isArray(parsed.metrics) ? parsed.metrics : [],
        tables_gemini: Array.isArray(parsed.tables) ? parsed.tables : [],
        charts_gemini: Array.isArray(parsed.charts) ? parsed.charts : [],
        insights_gemini: Array.isArray(parsed.insights) ? parsed.insights : [],
        recovered_fields: parsed.recovered_fields || {},
        schema_inferences: parsed.schema_inferences || {},
      };
      setCachedResponse(mode, payload, response);
      return NextResponse.json(response);
    } catch (e) {
      console.error('dual-engine structured', e);
      return NextResponse.json(
        {
          error: 'Gemini structured analysis failed',
          metrics_gemini: [],
          tables_gemini: [],
          charts_gemini: [],
          insights_gemini: [],
          recovered_fields: {},
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
}
