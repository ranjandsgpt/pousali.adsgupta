import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { NARRATIVE_SYSTEM_INSTRUCTION, NARRATIVE_USER_PREFIX } from '@/app/audit/utils/geminiPromptRegistry';

/**
 * Request payload: normalized account summary, campaigns, search terms, ASINs,
 * patterns, and sanity classifications. Built on the client from MemoryStore.
 */
export interface DualIntelligenceRequest {
  accountSummary: Record<string, unknown>;
  campaigns: unknown[];
  searchTerms: unknown[];
  asins: unknown[];
  patterns: unknown[];
  sanity: Record<string, unknown>;
}

const FAILSAFE_MESSAGE =
  'AI analysis temporarily unavailable. Please rerun analysis.';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured', report: FAILSAFE_MESSAGE },
      { status: 503 }
    );
  }

  let body: DualIntelligenceRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', report: FAILSAFE_MESSAGE },
      { status: 400 }
    );
  }

  const dataJson = JSON.stringify(body, null, 2);
  const userPrompt = NARRATIVE_USER_PREFIX + dataJson;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: NARRATIVE_SYSTEM_INSTRUCTION },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });

    const text =
      result.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('\n')
        .trim() || '';

    if (!text) {
      return NextResponse.json({ report: FAILSAFE_MESSAGE }, { status: 200 });
    }

    const parsed = extractJsonObject(text);
    if (!parsed || typeof parsed !== 'object') {
      // Fallback: return raw text for debugging, but keep report string.
      return NextResponse.json({ report: text }, { status: 200 });
    }

    const presentation = parsed as {
      slides?: unknown[];
      python_script?: string;
      action_plan_rows?: unknown[];
    };

    return NextResponse.json(
      {
        report: JSON.stringify(presentation, null, 2),
        presentation,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('generate-insights error', e);
    return NextResponse.json(
      { report: FAILSAFE_MESSAGE },
      { status: 200 }
    );
  }
}
