import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  INSIGHT_NARRATIVE_PROMPT,
  INSIGHT_NARRATIVE_USER_PREFIX,
} from '@/lib/geminiPromptRegistry';
import { validateNarrativeResponse } from '@/lib/geminiResponseValidation';
import { logGeminiResponse } from '@/lib/geminiResponseLogger';

/**
 * Mode 2 — Insight Narrative.
 * Request: normalized dataset + optional raw files (multipart).
 * Response: PLAIN TEXT only for "AI Audit Narrative — Gemini" section.
 * No JSON, no code. Raw files are passed to Gemini unmodified.
 */
export interface InsightNarrativePayload {
  accountSummary: Record<string, unknown>;
  campaigns: unknown[];
  searchTerms: unknown[];
  asins: unknown[];
  patterns: unknown[];
  sanity: Record<string, unknown>;
  metricsReferenceContext?: string;
}

const FAILSAFE_MESSAGE =
  'AI analysis temporarily unavailable. Please rerun analysis.';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_RETRIES = 1;

function getMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  return 'text/csv';
}

async function callGeminiNarrative(
  ai: GoogleGenAI,
  systemInstruction: string,
  userText: string,
  rawFiles: { blob: Blob; name: string }[]
): Promise<string> {
  let parts: { text?: string; fileData?: { fileUri?: string; mimeType?: string } }[] = [];
  if (rawFiles.length > 0) {
    const uploaded: { name?: string; mimeType?: string }[] = [];
    for (const { blob, name } of rawFiles) {
      const mimeType = getMimeType(name);
      const file = await ai.files.upload({
        file: blob as globalThis.Blob,
        config: { mimeType },
      });
      uploaded.push({ name: (file as { name?: string }).name, mimeType });
    }
    parts = [
      ...uploaded.map((u) => ({ fileData: { fileUri: u.name, mimeType: u.mimeType } })),
      { text: userText },
    ];
  } else {
    parts = [{ text: userText }];
  }
  const fileParts = parts.filter((x) => x.fileData?.fileUri);
  const result = await ai.models.generateContent({
    model,
    config: { systemInstruction },
    contents: [
      {
        role: 'user',
        parts:
          fileParts.length > 0
            ? ([...fileParts.map((x) => ({ fileData: x.fileData })), { text: userText }] as const)
            : [{ text: userText }],
      },
    ],
  });
  return (
    result.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('\n')
      .trim() || ''
  );
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured', report: FAILSAFE_MESSAGE },
      { status: 503 }
    );
  }

  const contentType = request.headers.get('content-type') || '';
  let payload: InsightNarrativePayload;
  const rawFiles: { blob: Blob; name: string }[] = [];

  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const payloadStr = formData.get('payload') as string | null;
      if (!payloadStr) {
        return NextResponse.json(
          { error: 'Missing payload in form data', report: FAILSAFE_MESSAGE },
          { status: 400 }
        );
      }
      payload = JSON.parse(payloadStr) as InsightNarrativePayload;
      const files = formData.getAll('files') as (Blob | File)[];
      for (const f of files) {
        if (f != null && typeof (f as Blob).arrayBuffer === 'function') {
          const name = f instanceof File ? f.name : 'report.csv';
          rawFiles.push({ blob: f as Blob, name });
        }
      }
    } catch (e) {
      console.error('generate-insights multipart parse', e);
      return NextResponse.json(
        { error: 'Invalid multipart/form-data', report: FAILSAFE_MESSAGE },
        { status: 400 }
      );
    }
  } else {
    try {
      payload = await request.json() as InsightNarrativePayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', report: FAILSAFE_MESSAGE },
        { status: 400 }
      );
    }
  }

  const dataJson = JSON.stringify(
    {
      accountSummary: payload.accountSummary,
      campaigns: payload.campaigns,
      searchTerms: payload.searchTerms,
      asins: payload.asins,
      patterns: payload.patterns,
      sanity: payload.sanity,
    },
    null,
    2
  );
  const userText =
    rawFiles.length > 0
      ? `${INSIGHT_NARRATIVE_USER_PREFIX}\n${dataJson}`
      : `No raw files attached. Use the normalized dataset below.\n\n${INSIGHT_NARRATIVE_USER_PREFIX}\n${dataJson}`;

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

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      lastRaw = await callGeminiNarrative(
        ai,
        systemInstruction,
        userText,
        rawFiles
      );
      await logGeminiResponse({
        mode: 'insight_narrative',
        rawResponse: lastRaw.slice(0, 10000),
        outcome: lastRaw ? 'plain_text' : 'empty',
        ...(attempt > 0 ? { error: `retry ${attempt}` } : {}),
      });
      if (!lastRaw) {
        return NextResponse.json({ report: FAILSAFE_MESSAGE }, { status: 200 });
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
    } catch (e) {
      console.error('generate-insights error', e);
      await logGeminiResponse({
        mode: 'insight_narrative',
        rawResponse: lastRaw || '(no response)',
        outcome: 'error',
        error: e instanceof Error ? e.message : String(e),
      });
      return NextResponse.json({ report: FAILSAFE_MESSAGE }, { status: 200 });
    }
  }

  const report = narrative && narrative.length > 0 ? narrative : FAILSAFE_MESSAGE;
  return NextResponse.json({ report }, { status: 200 });
}
