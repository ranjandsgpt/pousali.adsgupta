import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/** Aggregated audit summary only — no raw keywords or PII. */
export interface GenerateInsightsBody {
  totalSales?: number;
  totalAdSpend?: number;
  tacos?: number;
  acos?: number;
  roas?: number;
  topBleedingKeywords?: Array<{ keyword?: string; spend: number; sales: number }>;
  topOpportunities?: Array<{ keyword?: string; roas?: number; acos?: number }>;
  summaryTables?: Record<string, unknown>;
}

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function buildPrompt(payload: GenerateInsightsBody): string {
  const parts: string[] = [
    'You are an Amazon Ads audit expert. Based on the following aggregated metrics only (no raw data), write a concise audit narrative that includes:',
    '1. Account insights (2–3 sentences)',
    '2. Strategy recommendations (2–3 bullets)',
    '3. Growth opportunities (1–2 bullets)',
    '4. Risk alerts if any (1–2 bullets)',
    '',
    'Do not perform calculations; use the numbers provided. Be specific and actionable.',
    '',
    '--- Aggregated metrics ---',
  ];
  if (payload.totalSales != null) parts.push(`Total sales: ${payload.totalSales}`);
  if (payload.totalAdSpend != null) parts.push(`Total ad spend: ${payload.totalAdSpend}`);
  if (payload.tacos != null) parts.push(`TACOS: ${payload.tacos}%`);
  if (payload.acos != null) parts.push(`ACOS: ${payload.acos}%`);
  if (payload.roas != null) parts.push(`ROAS: ${payload.roas}`);
  if (payload.topBleedingKeywords?.length) {
    parts.push(
      '',
      'Top bleeding keywords (spend without sufficient sales):',
      JSON.stringify(payload.topBleedingKeywords.slice(0, 15))
    );
  }
  if (payload.topOpportunities?.length) {
    parts.push(
      '',
      'Top opportunities:',
      JSON.stringify(payload.topOpportunities.slice(0, 15))
    );
  }
  if (payload.summaryTables && Object.keys(payload.summaryTables).length > 0) {
    parts.push('', 'Summary tables:', JSON.stringify(payload.summaryTables));
  }
  return parts.join('\n');
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured' },
      { status: 503 }
    );
  }

  let body: GenerateInsightsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = buildPrompt(body);

  console.log('Using Gemini model:', model);

  const ai = new GoogleGenAI({ apiKey });

  try {
    const result = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const candidate = result.candidates?.[0];
    const text = candidate?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('\n')
      .trim();

    return NextResponse.json({ insight: text && text.length > 0 ? text : 'No insights generated' });
  } catch (e) {
    console.error('generate-insights error', e);
    return NextResponse.json(
      { insight: 'AI insights temporarily unavailable. Please rerun analysis.' },
      { status: 200 }
    );
  }
}
