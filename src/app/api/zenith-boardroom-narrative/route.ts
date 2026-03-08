/**
 * Phase 43 — Boardroom narrative engine.
 * Gemini restructures insights into Problem / Evidence / Impact / Recommendation.
 * The narrative replaces executiveNarrative before export.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const BOARDROOM_SYSTEM = `You are a senior strategy consultant. Restructure audit insights into a boardroom narrative.
Structure each section clearly:
- Problem: What is wrong or at risk?
- Evidence: Specific numbers, campaigns, keywords (cite metrics like ACOS, ROAS, spend).
- Impact: Business consequence (wasted budget, lost share, inefficiency).
- Recommendation: Clear next step.

Use formal, executive language. Be concise. Highlight severe cases (e.g. "ACOS exceeding 500%", "immediate restructuring required").
Example transformation:
Raw: "Campaign SP-Auto-Red wine-EC ACOS 584%"
Boardroom: "Advertising efficiency is severely compromised by several auto campaigns. The most critical case is SP-Auto-Red wine-EC with ACOS exceeding 500%. Immediate restructuring of automated targeting is required."

Output a single narrative text (no JSON). Use paragraph breaks between sections.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured', narrative: '' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      premiumState?: { executiveNarrative?: string; verifiedInsights?: Array<{ title: string; description?: string }> };
      insights?: Array<{ title: string; description?: string }>;
      executiveNarrative?: string;
    };
    const premiumState = body.premiumState ?? {};
    const insights = body.insights ?? premiumState.verifiedInsights ?? [];
    const existing = body.executiveNarrative ?? premiumState.executiveNarrative ?? '';

    const inputText = [
      existing ? `Current narrative:\n${existing.slice(0, 1500)}` : '',
      'Insights to restructure:',
      ...insights.map((i) => `- ${i.title}: ${i.description ?? ''}`),
    ].filter(Boolean).join('\n\n');
    const safeText = sanitizeTextForGemini(inputText);

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: BOARDROOM_SYSTEM },
      contents: [{ role: 'user', parts: [{ text: `Restructure the following into a boardroom narrative (Problem / Evidence / Impact / Recommendation):\n\n${safeText}` }] }],
    });

    const narrative = extractTextFromGenerateContentResponse(result)?.trim() ?? '';
    return NextResponse.json({ narrative });
  } catch (e) {
    console.error('zenith-boardroom-narrative', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Boardroom narrative failed', narrative: '' },
      { status: 500 }
    );
  }
}
