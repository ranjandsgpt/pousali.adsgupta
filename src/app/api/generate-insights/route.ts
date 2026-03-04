import { NextRequest, NextResponse } from 'next/server';

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

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

  try {
    const response = await fetch(
      `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);

      let details = errorText;
      try {
        const errJson = JSON.parse(errorText) as { error?: { message?: string; status?: string } };
        if (errJson.error?.message) details = errJson.error.message;
      } catch {
        // keep raw errorText
      }

      return NextResponse.json(
        { error: 'Gemini API request failed', details },
        { status: 500 }
      );
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
      }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No insights generated';

    return NextResponse.json({ insight: text });
  } catch (e) {
    console.error('generate-insights error', e);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
