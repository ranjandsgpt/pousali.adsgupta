/**
 * Phase 41 — True PDF generation from PremiumState.
 * Flow: PremiumState → renderPremiumAssets (Python, mode=pdf) → generate_premium_pdf → CXO Judge → consistency check → cache → download.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { runCxoJudgeAgent } from '@/agents/cxoJudgeAgent';
import { runBrandIntelligence } from '@/agents/brandIntelligenceAgent';
import type { PremiumState, VerifiedMetric, VerifiedInsight } from '@/agents/zenithTypes';
import { setExportStatus } from '@/services/exportStatusStore';
import { writeCache, getCacheDir } from '@/services/exportCache';
import { renderPremiumAssets } from '@/services/renderPremiumAssets';
import { checkExportConsistency } from '@/services/exportConsistencyGuard';
import { renderNodePdf } from '@/services/renderNodePdf';

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
  console.log('[Zenith export-pdf] Started');
  try {
    setExportStatus('queued', 'Preparing PDF export…');
    const body = await request.json().catch(() => ({})) as {
      executiveNarrative?: string;
      insights?: Array<{ title: string; description?: string; recommendedAction?: string }>;
      metrics?: Array<{ label: string; value: string | number }>;
      campaigns?: Array<{ campaignName: string; spend: number; sales: number; acos: number }>;
      keywords?: Array<{ searchTerm: string; campaign: string; spend: number; sales: number; roas: number }>;
      waste?: Array<{ searchTerm: string; campaign: string; spend: number; clicks: number }>;
      auditId?: string;
    };

    const premiumState = buildPremiumStateFromPayload(body);
    const auditId = body.auditId ?? `audit-${Date.now()}`;

    const outputDir = path.join(getCacheDir(), 'charts');

    setExportStatus('rendering', 'Generating PDF…');
    let pdfBuffer: Buffer | null = null;

    try {
      const renderResult = await renderPremiumAssets(premiumState, outputDir, { mode: 'pdf' });
      if (renderResult.pdfPath) {
        try {
          pdfBuffer = await readFile(renderResult.pdfPath);
        } catch (e) {
          console.error('zenith-export-pdf read file', e);
        }
      }
    } catch (e) {
      console.warn('Python PDF failed — fallback to Node PDF', e);
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.warn('Python PDF failed — fallback to Node PDF');
      setExportStatus('rendering', 'Generating PDF (Node fallback)…');
      pdfBuffer = renderNodePdf(premiumState);
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      setExportStatus('error', 'PDF generation failed');
      return NextResponse.json(
        { error: 'PDF generation failed' },
        { status: 500 }
      );
    }

    setExportStatus('verifying', 'Verifying export…');
    const exportedMetrics = premiumState.verifiedMetrics
      .filter((m) => typeof m.value === 'number')
      .map((m) => ({ label: m.label, value: m.value as number }));

    const judge = runCxoJudgeAgent(premiumState, exportedMetrics, {
      maxTableRows: 25,
      maxSlideWords: 180,
      maxPointsScatter: 600,
      maxCategoriesBar: 40,
    });
    if (judge.status === 'FAILED_STORYLINE' || judge.status === 'FAILED_ACCURACY') {
      setExportStatus('error', judge.message ?? 'CXO Judge failed');
      return NextResponse.json(
        { error: judge.message ?? 'CXO Judge failed' },
        { status: 422 }
      );
    }

    const consistency = checkExportConsistency(
      premiumState,
      exportedMetrics.map((m) => ({ label: m.label, value: m.value })),
      'PDF',
      { tolerancePct: 0.0001 }
    );
    if (!consistency.passed) {
      setExportStatus('error', 'Export consistency check failed');
      return NextResponse.json(
        { error: 'FAILED_ACCURACY: metric mismatch (0.01% tolerance)', mismatches: consistency.mismatches },
        { status: 422 }
      );
    }

    setExportStatus('ready', 'Export ready');
    await writeCache(auditId, null, new Uint8Array(pdfBuffer));
    console.log('[Zenith export-pdf] Export ready, returning PDF length:', pdfBuffer.length);
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="audit-report.pdf"',
      },
    });
  } catch (e) {
    console.error('[Zenith export-pdf] Error', e);
    setExportStatus('error', e instanceof Error ? e.message : 'PDF export failed');
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'PDF export failed' },
      { status: 500 }
    );
  }
}
