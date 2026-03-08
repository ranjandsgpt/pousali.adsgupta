/**
 * Phase 37 — Gemini narrative polishing before export.
 * Shorten insights, remove filler, highlight metrics.
 * Example: "Campaign SP-Auto-Red wine-EC has high ACOS" → "SP-Auto-Red wine-EC shows severe inefficiency with ACOS exceeding 500%."
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const POLISH_SYSTEM = `You are an expert editor for CXO reports. Your job is to polish audit insights for executive slides.
Rules:
- Shorten each insight to 1-2 sentences max.
- Remove filler words and vague language.
- Highlight specific metrics (ACOS, ROAS, spend, sales) with numbers when present.
- Use strong, direct language: "shows severe inefficiency", "exceeds X%", "ready to scale".
- Keep the same meaning and factual content.`;

export interface PolishPayload {
  insights: Array<{ title: string; description?: string }>;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured', polished: [] },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as PolishPayload;
    const insights = body.insights ?? [];
    if (insights.length === 0) {
      return NextResponse.json({ polished: insights });
    }

    const inputText = insights
      .map((i, idx) => `[${idx}] Title: ${i.title}\nDescription: ${i.description ?? ''}`)
      .join('\n\n');
    const safeText = sanitizeTextForGemini(inputText);

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Polish the following audit insights for a CXO slide deck. Return a JSON array of objects with "title" and "description" (polished). One object per insight, same order.\n\n${safeText}`;

    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: POLISH_SYSTEM },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const raw = extractTextFromGenerateContentResponse(result);
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const polished = JSON.parse(jsonMatch[0]) as Array<{ title: string; description: string }>;
      return NextResponse.json({ polished });
    }

    return NextResponse.json({
      polished: insights.map((i) => ({ title: i.title, description: i.description ?? '' })),
    });
  } catch (e) {
    console.error('zenith-narrative-polish', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Polish failed', polished: [] },
      { status: 500 }
    );
  }
}
