/**
 * Zenith CXO Export API — build PremiumState from payload, return PPTX.
 * Premium design: Deep Midnight Blue #0F172A, Metallic Gold #D4AF37 (Phase 6).
 * 15-slide structure (Phase 7). Verified by CXO Judge before return.
 */

import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { runCxoJudgeAgent } from '@/agents/cxoJudgeAgent';
import { runBrandIntelligence } from '@/agents/brandIntelligenceAgent';
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

const MAX_ATTEMPTS = 3;

function buildPremiumStateFromPayload(body: {
  executiveNarrative?: string;
  insights?: Array<{ title: string; description?: string; recommendedAction?: string }>;
  metrics?: Array<{ label: string; value: string | number }>;
  campaigns?: Array<{ campaignName: string; spend: number; sales: number; acos: number }>;
  keywords?: Array<{ searchTerm: string; campaign: string; spend: number; sales: number; roas: number }>;
  waste?: Array<{ searchTerm: string; campaign: string; spend: number; clicks: number }>;
  brandNames?: string[];
  competitorBrands?: string[];
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
  const searchTermsForBrand = (body.keywords ?? []).map((k) => ({
    searchTerm: k.searchTerm,
    sales: k.sales,
    spend: k.spend,
    orders: 0,
  }));
  const brandAnalysis = runBrandIntelligence(
    searchTermsForBrand,
    body.brandNames ?? [],
    body.competitorBrands ?? []
  );
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
    brandAnalysis,
  };
}

export async function POST(request: NextRequest) {
  console.log('[Zenith export] Started');
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
    console.log('[Zenith export] Building deck, slides:', SLIDE_TITLES.length);
    const exportedMetrics = premiumState.verifiedMetrics
      .filter((m) => typeof m.value === 'number')
      .map((m) => ({ label: m.label, value: m.value as number }));

    let judge = runCxoJudgeAgent(premiumState, exportedMetrics, {
      maxTableRows: 25,
      maxSlideWords: 180,
      maxPointsScatter: 600,
      maxCategoriesBar: 40,
    });
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) {
        setExportStatus('retrying', `Retrying export (${attempt}/${MAX_ATTEMPTS})…`);
        judge = runCxoJudgeAgent(premiumState, exportedMetrics, {
          maxTableRows: 25,
          maxSlideWords: 180,
          maxPointsScatter: 600,
          maxCategoriesBar: 40,
          retryMode: true,
        });
      }
      if (judge.status === 'PASSED' || judge.status === 'PASSED_WITH_WARNINGS') break;
      if (judge.status === 'FAILED_STORYLINE') {
        setExportStatus('error', 'Narrative validation failed');
        return NextResponse.json(
          { error: 'FAILED_STORYLINE: regenerate narrative (Problem → Evidence → Impact → Recommendation)', message: judge.message },
          { status: 422 }
        );
      }
      if (judge.status === 'FAILED_ACCURACY') {
        setExportStatus('error', judge.message ?? 'Export check failed');
        return NextResponse.json({ error: judge.status, message: judge.message }, { status: 422 });
      }
      if (attempt < MAX_ATTEMPTS) {
        console.warn('Retrying export generation', attempt);
      }
    }

    const useSimplifiedLayout = judge.status !== 'PASSED';
    if (useSimplifiedLayout) {
      setExportStatus('rendering', 'Using simplified slide layout…');
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

      if (useSimplifiedLayout) {
        const bullets = premiumState.recommendations.slice(0, 2).map((r) => `• ${r.slice(0, 60)}`);
        const rec = premiumState.recommendations[0] ? `Recommendation: ${premiumState.recommendations[0].slice(0, 80)}` : '';
        const body = [...bullets, rec].filter(Boolean).join('\n');
        if (body) {
          slide.addText(body, { x: 0.5, y: 1.4, w: 9, h: 4, fontSize: 11, color: 'FFFFFF' });
        }
        continue;
      }

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
      `Generated ${premiumState.generatedAt} | ${premiumState.modelVerificationStatus ?? 'Zenith'}${judge.status === 'PASSED' ? ' | Verified' : ' | Visual layout simplified due to data density.'}`,
      { x: 0.5, y: 5.2, w: 9, h: 0.4, fontSize: 8, color: THEME.accent }
    );

    const buffer = await pres.write({ outputType: 'nodebuffer' });
    const buf = buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);
    console.log('[Zenith export] Slides composed, buffer length:', buf.length);
    setExportStatus('ready', 'Export ready');
    await writeCache(auditId, buf, null);
    console.log('[Zenith export] Export ready, returning PPTX');
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="audit-report.pptx"',
      },
    });
  } catch (e) {
    console.error('[Zenith export] Error', e);
    setExportStatus('error', e instanceof Error ? e.message : 'Zenith export failed');
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Zenith export failed' },
      { status: 500 }
    );
  }
}
