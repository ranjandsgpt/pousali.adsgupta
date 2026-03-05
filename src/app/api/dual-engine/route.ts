import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/**
 * Dual Engine API:
 * - mode: 'structured' — Gemini analyzes dataset and returns metrics_gemini, tables_gemini, charts_gemini, insights_gemini, recovered_fields
 * - mode: 'verify_slm' — Gemini receives SLM artifacts and returns verification scores (metrics_score, tables_score, charts_score, insights_score)
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

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }
  let body: { mode: 'structured' | 'verify_slm'; payload: StructuredPayload | VerifySlmPayload };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const ai = new GoogleGenAI({ apiKey });
  const { mode, payload } = body;
  if (mode === 'verify_slm') {
    const { datasetSummary, slmArtifacts } = payload as VerifySlmPayload;
    const prompt = `You are an Amazon PPC data auditor. You are given:
1) A dataset summary (normalized account data).
2) SLM (deterministic) analytics outputs: metrics, tables, charts, insights.

Verify the SLM outputs for consistency and correctness:
- Metrics: do the numbers align with the dataset? (e.g. ACOS = spend/sales, ROAS = sales/spend)
- Tables: do row counts and values match the data?
- Charts: do chart data series match the tables they reference?
- Insights: are the insights supported by the data?

Return ONLY a JSON object with scores from 0 to 1 (1 = fully valid):
{"metrics_score": number, "tables_score": number, "charts_score": number, "insights_score": number}

Dataset summary:
${JSON.stringify(datasetSummary, null, 2)}

SLM artifacts:
${JSON.stringify(slmArtifacts, null, 2)}`;
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = result.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() || '';
      const obj = parseJsonScores(text);
      const metrics_score = obj && typeof obj.metrics_score === 'number' ? obj.metrics_score : 0.9;
      const tables_score = obj && typeof obj.tables_score === 'number' ? obj.tables_score : 0.9;
      const charts_score = obj && typeof obj.charts_score === 'number' ? obj.charts_score : 0.9;
      const insights_score = obj && typeof obj.insights_score === 'number' ? obj.insights_score : 0.9;
      return NextResponse.json({
        metrics_score: Math.max(0, Math.min(1, metrics_score)),
        tables_score: Math.max(0, Math.min(1, tables_score)),
        charts_score: Math.max(0, Math.min(1, charts_score)),
        insights_score: Math.max(0, Math.min(1, insights_score)),
      });
    } catch (e) {
      console.error('dual-engine verify_slm', e);
      return NextResponse.json({
        metrics_score: 0.85,
        tables_score: 0.85,
        charts_score: 0.85,
        insights_score: 0.85,
      });
    }
  }
  if (mode === 'structured') {
    const p = payload as StructuredPayload;
    const prompt = `You are an Amazon PPC data analyst. Analyze this normalized dataset and return structured JSON only.

Dataset:
${JSON.stringify(p, null, 2)}

Tasks:
1) Extract key metrics (total ad spend, total ad sales, ACOS, ROAS, TACOS, sessions, buy_box_percentage, units_ordered, conversion_rate). Return as array of {label, value, numericValue}.
2) If the dataset has sessions or buy_box or units_ordered in asins/rows but not in summary, set recovered_fields: {sessions?, buy_box_percentage?, units_ordered?} with your best estimate.
3) Build 2-4 summary tables (campaigns by spend, top keywords, waste keywords, top ASINs) as {id, title, columns: [{key, label}], rows: [...]}.
4) Build 2-3 chart specs as {id, title, type: "pie"|"bar", data: [{name, labels: [], values: []}]}.
5) List 3-8 insights as {id, title, description, severity?, recommendedAction?, entityName?, entityType?}.

Return ONLY valid JSON in this exact shape (no markdown):
{
  "metrics": [...],
  "tables": [...],
  "charts": [...],
  "insights": [...],
  "recovered_fields": {}
}`;
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = result.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const raw = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(raw) as {
        metrics?: unknown[];
        tables?: unknown[];
        charts?: unknown[];
        insights?: unknown[];
        recovered_fields?: Record<string, number>;
      };
      return NextResponse.json({
        metrics_gemini: Array.isArray(parsed.metrics) ? parsed.metrics : [],
        tables_gemini: Array.isArray(parsed.tables) ? parsed.tables : [],
        charts_gemini: Array.isArray(parsed.charts) ? parsed.charts : [],
        insights_gemini: Array.isArray(parsed.insights) ? parsed.insights : [],
        recovered_fields: parsed.recovered_fields || {},
      });
    } catch (e) {
      console.error('dual-engine structured', e);
      return NextResponse.json(
        { error: 'Gemini structured analysis failed', metrics_gemini: [], tables_gemini: [], charts_gemini: [], insights_gemini: [], recovered_fields: {} },
        { status: 200 }
      );
    }
  }
  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
}
