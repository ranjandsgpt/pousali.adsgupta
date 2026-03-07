/**
 * Phase 6: Presentation Engine — generate PPTX server-side (10-slide structure).
 * Returns actual file; Gemini narrative/insights can be injected via payload.
 */

import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';

const SLIDE_TITLES = [
  'Executive Summary',
  'KPI Dashboard',
  'Top ASINs',
  'Campaign Performance',
  'Keyword Opportunities',
  'Waste Analysis',
  'Funnel',
  'Profitability',
  'Strategic Actions',
  'Roadmap',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { summary = '', metrics = [], insights = [] } = body as {
      summary?: string;
      metrics?: { label: string; value: string | number }[];
      insights?: { title: string; description?: string }[];
    };

    const pres = new pptxgen();
    pres.title = 'Amazon Advertising Audit';
    pres.author = 'Audit Platform';

    for (let i = 0; i < SLIDE_TITLES.length; i++) {
      const slide = pres.addSlide();
      slide.addText(SLIDE_TITLES[i], { x: 0.5, y: 0.5, w: 9, h: 0.75, fontSize: 24, bold: true });
      if (i === 0 && summary) {
        slide.addText(summary.slice(0, 500), { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 12 });
      }
      if (i === 1 && Array.isArray(metrics) && metrics.length > 0) {
        const rows: { text: string }[][] = [
          [{ text: 'Metric' }, { text: 'Value' }],
          ...metrics.slice(0, 8).map((m) => [{ text: m.label }, { text: String(m.value) }]),
        ];
        slide.addTable(rows, { x: 0.5, y: 1.5, w: 9, colW: [4, 3], fontSize: 11 });
      }
      if (i === 8 && Array.isArray(insights) && insights.length > 0) {
        const text = insights.slice(0, 5).map((s) => `• ${s.title}`).join('\n');
        slide.addText(text, { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 12 });
      }
    }

    const buffer = await pres.write({ outputType: 'nodebuffer' });
    const responseBody = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
    return new NextResponse(responseBody as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="audit-presentation.pptx"',
      },
    });
  } catch (e) {
    console.error('generate-presentation-pptx', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'PPTX generation failed' },
      { status: 500 }
    );
  }
}
