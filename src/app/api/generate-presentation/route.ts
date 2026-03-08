import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  PRESENTATION_GENERATION_PROMPT,
  PRESENTATION_GENERATION_USER_PREFIX,
} from '@/lib/geminiPromptRegistry';
import { logGeminiResponse } from '@/lib/geminiResponseLogger';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';
import { assertNoFileReferences, sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { logGeminiRequest } from '@/lib/geminiRequestLogger';

/**
 * Mode 3 — Presentation Generation.
 * Input: structured summary only (JSON). No raw files sent to Gemini.
 * Output: Python code only.
 */

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured', script: null },
      { status: 503 }
    );
  }

  let payload: { summary?: string; fileNames?: string[] } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', script: null }, { status: 400 });
  }

  const fileNames = payload.fileNames?.join(', ') ?? 'none (structured context only)';
  const userText = sanitizeTextForGemini(
    `${PRESENTATION_GENERATION_USER_PREFIX}${fileNames}.\n\n${payload.summary ?? 'No summary provided.'}`
  );

  const contents = [{ role: 'user' as const, parts: [{ text: userText }] }];
  assertNoFileReferences(contents);

  const startMs = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: PRESENTATION_GENERATION_PROMPT },
      contents,
    });

    const text = extractTextFromGenerateContentResponse(result);

    await logGeminiResponse({
      mode: 'presentation',
      rawResponse: text.slice(0, 8000),
      outcome: text ? 'python_script' : 'empty',
    });
    await logGeminiRequest({
      mode: 'presentation',
      promptLength: userText.length,
      contextSize: userText.length,
      responseLatencyMs: Date.now() - startMs,
      validationResult: text ? 'ok' : 'empty',
    });

    if (!text) {
      return NextResponse.json({ script: null, error: 'No response from model' }, { status: 200 });
    }

    let script = text;
    const codeBlockMatch = text.match(/```(?:python)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      script = codeBlockMatch[1].trim();
    }

    return NextResponse.json({ script, executed: false }, { status: 200 });
  } catch (e) {
    console.error('generate-presentation error', e);
    await logGeminiRequest({
      mode: 'presentation',
      promptLength: userText.length,
      contextSize: userText.length,
      responseLatencyMs: Date.now() - startMs,
      validationResult: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { script: null, error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 200 }
    );
  }
}
