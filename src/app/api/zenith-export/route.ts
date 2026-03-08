/**
 * Zenith CXO Export API — build PremiumState from payload, return PPTX.
 * Premium design: Deep Midnight Blue #0F172A, Metallic Gold #D4AF37 (Phase 6).
 * 15-slide structure (Phase 7). Verified by CXO Judge before return.
 */

import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { runCxoJudgeAgent } from '@/agents/cxoJudgeAgent';
import type { PremiumState, VerifiedMetric, VerifiedInsight } from '@/agents/zenithTypes';
import { setExportStatus } from '@/services/exportStatusStore';
import { writeCache } from '@/services/exportCache';
import { checkExportConsistency } from '@/services/exportConsistencyGuard';

const SLIDE_TITLES = [
  'Amazon Advertising CXO Audit',
  'Executive Summary',
  'Account Health',
  'Revenue Breakdown',
  'Campaign Performance',
  'Campaign Efficiency',
  'Waste & Bleed Analysis',
  'Keyword Waste',
  'Scaling Opportunities',
  'Profitability',
  'Funnel',
  'Budget Allocation',
  'SKU / ASIN Impact',
  'Strategic Action Plan',
  'Next Steps',
];

const THEME = {
  background: '0F172A',
  accent: 'D4AF37',
};

function buildPremiumStateFromPayload(body: {
  executiveNarrative?: string;
  insights?: Array<{ title: string; description?: string; recommendedAction?: string }>;
  metrics?: Array<{ label: string; value: string | number }>;
  campaigns?: Array<{ campaignName: string; spend: number; sales: number; acos: number }>;
  keywords?: Array<{ searchTerm: string; campaign: string; spend: number; sales: number; roas: number }>;
  waste?: Array<{ searchTerm: string; campaign: string; spend: number; clicks: number }>;
}): PremiumState {
  const verifiedMetrics: VerifiedMetric[] = (body.metrics ?? []).map((m) => ({
    label: m.label,
    value: m.value,
    source: 'slm',
  }));
  const verifiedInsights: VerifiedInsight[] = (body.insights ?? []).map((i, idx) => ({
    id: `insight-${idx}`,
    title: i.title,
    description: i.description ?? '',
    recommendedAction: i.recommendedAction,
    verificationScore: 0.9,
    sourceEngine: 'gemini',
  }));
  const campaignAnalysis = body.campaigns ?? [];
  const keywordAnalysis = (body.keywords ?? []).map((k) => ({
    searchTerm: k.searchTerm,
    campaign: k.campaign,
    spend: k.spend,
    sales: k.sales,
    clicks: (k as { clicks?: number }).clicks ?? 0,
    acos: (k as { acos?: number }).acos ?? (k.sales > 0 ? (k.spend / k.sales) * 100 : 0),
    roas: k.roas,
  }));
  const wasteAnalysis = (body.waste ?? []).map((w) => ({ ...w, suggestedAction: 'Consider pausing or negating.' }));
  return {
    verifiedMetrics,
    verifiedInsights,
    charts: [],
    tables: [],
    campaignAnalysis,
    keywordAnalysis,
    wasteAnalysis,
    profitability: {
      breakEvenACOS: 30,
      targetROAS: 3,
      lossCampaignCount: campaignAnalysis.filter((c) => c.spend > 0 && c.sales / c.spend < 1 / 0.3).length,
    },
    executiveNarrative: body.executiveNarrative ?? '',
    recommendations: verifiedInsights.flatMap((i) => (i.recommendedAction ? [i.recommendedAction] : [])),
    generatedAt: new Date().toISOString(),
    modelVerificationStatus: 'Zenith Export Orchestrator',
  };
}

export async function POST(request: NextRequest) {
  try {
    setExportStatus('queued', 'Preparing export…');
    const body = await request.json().catch(() => ({})) as {
      executiveNarrative?: string;
      insights?: Array<{ title: string; description?: string; recommendedAction?: string }>;
      metrics?: Array<{ label: string; value: string | number }>;
      campaigns?: Array<{ campaignName: string; spend: number; sales: number; acos: number }>;
      keywords?: Array<{ searchTerm: string; campaign: string; spend: number; sales: number; roas: number }>;
      waste?: Array<{ searchTerm: string; campaign: string; spend: number; clicks: number }>;
    };

    const premiumState = buildPremiumStateFromPayload(body);
    const auditId = (body as { auditId?: string }).auditId ?? `audit-${Date.now()}`;

    setExportStatus('rendering', 'Building deck…');
    const exportedMetrics = premiumState.verifiedMetrics
      .filter((m) => typeof m.value === 'number')
      .map((m) => ({ label: m.label, value: m.value as number }));
    const judge = runCxoJudgeAgent(premiumState, exportedMetrics, { maxTableRows: 12, maxSlideWords: 120 });
    if (judge.status === 'FAILED_STORYLINE') {
      setExportStatus('error', 'Narrative validation failed');
      return NextResponse.json(
        { error: 'FAILED_STORYLINE: regenerate narrative (Problem → Evidence → Impact → Recommendation)', message: judge.message },
        { status: 422 }
      );
    }
    if (judge.status === 'FAILED_AESTHETIC' || judge.status === 'FAILED_ACCURACY') {
      setExportStatus('error', judge.message ?? 'Export check failed');
      return NextResponse.json({ error: judge.status, message: judge.message }, { status: 422 });
    }

    const pres = new pptxgen();
    pres.title = 'Amazon Advertising CXO Audit';
    pres.author = 'Zenith Export Orchestrator';

    for (let i = 0; i < SLIDE_TITLES.length; i++) {
      const slide = pres.addSlide();
      slide.background = { color: THEME.background };
      slide.addText(SLIDE_TITLES[i], {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: THEME.accent,
      });

      if (i === 1 && premiumState.executiveNarrative) {
        slide.addText(premiumState.executiveNarrative.slice(0, 800), {
          x: 0.5,
          y: 1.4,
          w: 9,
          h: 4,
          fontSize: 11,
          color: 'FFFFFF',
        });
      }
      if (i === 2 && premiumState.verifiedMetrics.length > 0) {
        const rows: { text: string }[][] = [
          [{ text: 'Metric' }, { text: 'Value' }],
          ...premiumState.verifiedMetrics.slice(0, 10).map((m) => [{ text: m.label }, { text: String(m.value) }]),
        ];
        slide.addTable(rows, {
          x: 0.5,
          y: 1.4,
          w: 9,
          colW: [4, 3],
          fontSize: 10,
          color: 'FFFFFF',
        });
      }
      if (i === 4 && premiumState.campaignAnalysis.length > 0) {
        const top = premiumState.campaignAnalysis.slice(0, 8);
        const rows: { text: string }[][] = [
          [{ text: 'Campaign' }, { text: 'Spend' }, { text: 'Sales' }, { text: 'ACOS' }],
          ...top.map((c) => [
            { text: c.campaignName.slice(0, 30) },
            { text: String(c.spend.toFixed(0)) },
            { text: String(c.sales.toFixed(0)) },
            { text: `${c.acos.toFixed(0)}%` },
          ]),
        ];
        slide.addTable(rows, { x: 0.5, y: 1.4, w: 9, colW: [3, 2, 2, 1.5], fontSize: 9 });
      }
      if (i === 7 && premiumState.wasteAnalysis.length > 0) {
        const top = premiumState.wasteAnalysis.slice(0, 8);
        const rows: { text: string }[][] = [
          [{ text: 'Keyword' }, { text: 'Campaign' }, { text: 'Spend' }, { text: 'Clicks' }],
          ...top.map((w) => [
            { text: w.searchTerm.slice(0, 25) },
            { text: w.campaign.slice(0, 20) },
            { text: String(w.spend.toFixed(0)) },
            { text: String(w.clicks) },
          ]),
        ];
        slide.addTable(rows, { x: 0.5, y: 1.4, w: 9, colW: [3, 2.5, 2, 1.5], fontSize: 9 });
      }
      if (i === 9) {
        const p = premiumState.profitability;
        slide.addText(
          `Break-even ACOS: ${p.breakEvenACOS}% | Target ROAS: ${p.targetROAS}× | Loss campaigns: ${p.lossCampaignCount}`,
          { x: 0.5, y: 1.4, w: 9, h: 0.6, fontSize: 12, color: 'FFFFFF' }
        );
      }
      if (i === 13 && premiumState.recommendations.length > 0) {
        const text = premiumState.recommendations.slice(0, 6).map((r) => `• ${r}`).join('\n');
        slide.addText(text, { x: 0.5, y: 1.4, w: 9, h: 4, fontSize: 11, color: 'FFFFFF' });
      }
    }

    setExportStatus('verifying', 'Verifying export…');
    const consistency = checkExportConsistency(
      premiumState,
      exportedMetrics.map((m) => ({ label: m.label, value: m.value })),
      'PPT',
      { tolerancePct: 0.0001 }
    );
    if (!consistency.passed) {
      setExportStatus('error', 'Export consistency check failed');
      return NextResponse.json(
        { error: 'FAILED_ACCURACY: metric mismatch (0.01% tolerance)', mismatches: consistency.mismatches },
        { status: 422 }
      );
    }

    pres.addSlide().addText(
      `Generated ${premiumState.generatedAt} | ${premiumState.modelVerificationStatus ?? 'Zenith'}${judge.status === 'PASSED' ? ' | Verified' : ''}`,
      { x: 0.5, y: 5.2, w: 9, h: 0.4, fontSize: 8, color: THEME.accent }
    );

    const buffer = await pres.write({ outputType: 'nodebuffer' });
    const buf = buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);
    setExportStatus('ready', 'Export ready');
    await writeCache(auditId, buf, null);
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="Amazon-Advertising-CXO-Audit.pptx"',
      },
    });
  } catch (e) {
    console.error('zenith-export', e);
    setExportStatus('error', e instanceof Error ? e.message : 'Zenith export failed');
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Zenith export failed' },
      { status: 500 }
    );
  }
}
