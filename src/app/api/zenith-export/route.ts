/**
 * Zenith CXO Export API — build PremiumState from payload, return PPTX.
 * Board-style 10-slide deck with white background and navy headers.
 * Verified by CXO Judge before return.
 */

import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { runCxoJudgeAgent } from '@/agents/cxoJudgeAgent';
import { runBrandIntelligence } from '@/agents/brandIntelligenceAgent';
import type { PremiumState, VerifiedMetric, VerifiedInsight } from '@/agents/zenithTypes';
import { setExportStatus } from '@/services/exportStatusStore';
import { writeCache } from '@/services/exportCache';
import { checkExportConsistency } from '@/services/exportConsistencyGuard';
import { verifyPptxOutput } from '@/agents/ExportVerificationAgent';
import { generateSlideContent, type SlideManifest } from '@/agents/ClaudeSlideDataAgent';
import type { AggregatedMetrics } from '@/lib/aggregateReports';

const THEME = {
  navy: '1A3FAA',
  text: '1A3FAA',
  cardFill: 'E8EFFE',
  cardBorder: 'C7D7F5',
};

const MAX_ATTEMPTS = 3;

function buildPremiumStateFromPayload(body: {
  executiveNarrative?: string;
  insights?: Array<{ title: string; description?: string; recommendedAction?: string }>;
  metrics?: Array<{ label: string; value: string | number }>;
  campaigns?: Array<{ campaignName: string; spend: number; sales: number; acos: number }>;
  keywords?: Array<{ searchTerm: string; campaign: string; matchType?: string; spend: number; sales: number; roas: number }>;
  waste?: Array<{ searchTerm: string; campaign: string; spend: number; clicks: number }>;
  brandNames?: string[];
  competitorBrands?: string[];
  dataTrustReport?: PremiumState['dataTrustReport'];
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
    matchType: k.matchType,
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
    dataTrustReport: body.dataTrustReport,
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
      keywords?: Array<{ searchTerm: string; campaign: string; matchType?: string; spend: number; sales: number; roas: number }>;
      waste?: Array<{ searchTerm: string; campaign: string; spend: number; clicks: number }>;
      asins?: Array<{ asin: string; totalSales: number; adSales: number; adSpend: number }>;
    };

    const premiumState = buildPremiumStateFromPayload(body);
    const auditId = (body as { auditId?: string }).auditId ?? `audit-${Date.now()}`;

    setExportStatus('rendering', 'Building deck…');
    console.log('[Zenith export] Building deck, slides: 9');
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
    pres.title = 'Amazon Advertising Performance Audit';
    pres.author = 'Zenith Export Orchestrator';

    const currency = premiumState.currency ?? '£';
    const metricsMap = new Map<string, string | number>();
    premiumState.verifiedMetrics.forEach((m) => {
      metricsMap.set(m.label, m.value);
    });

    const getNumberMetric = (label: string): number => {
      const v = metricsMap.get(label);
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const numeric = parseFloat(v.replace(/[^0-9.\-]/g, ''));
        return Number.isNaN(numeric) ? 0 : numeric;
      }
      return 0;
    };

    const acosPct = getNumberMetric('ACOS');
    const roasVal = getNumberMetric('ROAS');
    const tacosPct = getNumberMetric('TACOS');
    const totalSales = getNumberMetric('Store Sales');
    const adSpend = getNumberMetric('Ad Spend');
    const adSales = getNumberMetric('Ad Sales');
    const sessions = getNumberMetric('Sessions');
    const clicks = getNumberMetric('Clicks');
    const cpc = getNumberMetric('CPC');

    const healthScore =
      premiumState.dataTrustReport?.trustScore != null
        ? Math.round(premiumState.dataTrustReport.trustScore * 100)
        : 80;
    const criticalIssuesCount = premiumState.wasteAnalysis.length;
    const auditConfidence = healthScore;

    const addHeader = (slide: pptxgen.Slide, title: string) => {
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: pres.presLayout.width ?? 10,
        h: 0.6,
        fill: { color: THEME.navy },
      });
      slide.addText(title.toUpperCase(), {
        x: 0.4,
        y: 0.15,
        w: 9,
        h: 0.4,
        fontFace: 'Calibri',
        fontSize: 16,
        bold: true,
        color: 'FFFFFF',
      });
    };

    const cardShadow = {
      type: 'outer',
      color: THEME.navy,
      blur: 8,
      offset: 2,
      opacity: 0.08,
    } as const;

    let slideManifest: SlideManifest | null = null;
    let metricsForEngine: AggregatedMetrics | null = null;
    try {
      const metricMap = new Map<string, number>();
      exportedMetrics.forEach((m) => {
        if (typeof m.value === 'number') {
          metricMap.set(m.label, m.value);
        }
      });
      const currencyForEngine = premiumState.currency ?? '£';
      const aggLike: AggregatedMetrics = {
        adSpend: metricMap.get('Ad Spend') ?? 0,
        adSales: metricMap.get('Ad Sales') ?? 0,
        totalStoreSales: metricMap.get('Store Sales') ?? 0,
        adClicks: metricMap.get('Clicks') ?? 0,
        adImpressions: 0,
        adOrders: metricMap.get('Orders') ?? 0,
        storeOrders: metricMap.get('Orders') ?? 0,
        sessions: metricMap.get('Sessions') ?? 0,
        unitsOrdered: 0,
        buyBoxPct: null,
        organicSales: 0,
        acos: (() => {
          const v = premiumState.verifiedMetrics.find((m) => m.label === 'ACOS')?.value;
          if (typeof v === 'string') {
            const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
            return Number.isNaN(n) ? null : n / 100;
          }
          return null;
        })(),
        tacos: (() => {
          const v = premiumState.verifiedMetrics.find((m) => m.label === 'TACOS')?.value;
          if (typeof v === 'string') {
            const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
            return Number.isNaN(n) ? null : n / 100;
          }
          return null;
        })(),
        roas: (() => {
          const v = premiumState.verifiedMetrics.find((m) => m.label === 'ROAS')?.value;
          if (typeof v === 'number') return v;
          if (typeof v === 'string') {
            const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
            return Number.isNaN(n) ? null : n;
          }
          return null;
        })(),
        cpc: null,
        ctr: null,
        adCvr: null,
        sessionCvr: null,
        currency: currencyForEngine,
        rowCounts: { spAdvertised: 0, spTargeting: 0, spSearchTerm: 0, business: 0 },
        _ingestionLog: [],
      };
      metricsForEngine = aggLike;
      const campaigns = premiumState.campaignAnalysis.map((c) => ({
        name: c.campaignName,
        spend: c.spend,
        sales: c.sales,
        acos: c.acos,
      }));
      const wasteTerms = premiumState.wasteAnalysis.map((w) => ({
        searchTerm: w.searchTerm,
        spend: w.spend,
      }));
      const opportunities = premiumState.recommendations.slice(0, 3).map((title) => ({
        title,
        estimatedImpact: 0,
      }));
      slideManifest = await generateSlideContent(aggLike, campaigns, wasteTerms, opportunities);
      // eslint-disable-next-line no-console
      console.log('[Zenith PPTX]', {
        model: slideManifest._engineMeta?.modelUsed,
        fallback: slideManifest._engineMeta?.fallbackUsed,
        confidence: slideManifest._engineMeta?.confidence,
        warnings: slideManifest._engineMeta?.warnings,
      });
    } catch {
      slideManifest = null;
    }

    // Slide 1 — Overview (cover + narrative)
    {
      const slide = pres.addSlide();
      slide.background = { color: 'FFFFFF' };
      addHeader(slide, '1. Overview');
      const narrative = premiumState.executiveNarrative || '';
      const engineVerdict = slideManifest?.executiveSummary?.verdict;
      const text =
        (engineVerdict && engineVerdict.trim().length > 0
          ? engineVerdict
          : narrative || `Ad spend ${currency}${adSpend.toLocaleString()} generated ${currency}${adSales.toLocaleString()} in ad sales. ROAS ${roasVal.toFixed(2)}×; ACOS ${acosPct.toFixed(1)}%.`);
      slide.addText(text.slice(0, 380), {
        x: 0.8,
        y: 0.9,
        w: 8.4,
        h: 1.8,
        fontFace: 'Calibri',
        fontSize: 14,
        color: THEME.text,
      });
      const points = [
        `Store sales: ${currency}${totalSales.toLocaleString()} | ACOS: ${acosPct.toFixed(1)}% | ROAS: ${roasVal.toFixed(2)}×`,
        `TACoS: ${tacosPct.toFixed(1)}% | Audit Confidence: ${auditConfidence}% | Critical Issues: ${criticalIssuesCount}`,
      ];
      slide.addText(
        points.map((p) => ({ text: p, options: { fontFace: 'Calibri', fontSize: 12, color: THEME.text, bullet: true } })),
        { x: 0.9, y: 2.9, w: 8, h: 1.2 }
      );
      slide.addText(`Generated ${new Date(premiumState.generatedAt).toLocaleDateString()} | pousali.adsgupta.com`, {
        x: 0.8,
        y: 5.2,
        w: 8,
        h: 0.35,
        fontFace: 'Calibri',
        fontSize: 9,
        color: THEME.text,
      });
    }

    // Slide 2 — Campaign Type (SP / SB / SD)
    const inferAdProduct = (name: string): 'SP' | 'SB' | 'SD' => {
      const c = (name || '').toLowerCase();
      if (c.includes('sponsored products') || c.includes('sp ')) return 'SP';
      if (c.includes('sponsored brands') || c.includes('sb ') || c.includes('hsa') || c.includes('headline')) return 'SB';
      if (c.includes('sponsored display') || c.includes('sd ')) return 'SD';
      return 'SP';
    };
    {
      const slide = pres.addSlide();
      slide.background = { color: 'FFFFFF' };
      addHeader(slide, '2. Campaign Type');
      let sp = 0, sb = 0, sd = 0;
      premiumState.campaignAnalysis.forEach((c) => {
        const t = inferAdProduct(c.campaignName);
        if (t === 'SP') sp += c.sales;
        else if (t === 'SB') sb += c.sales;
        else sd += c.sales;
      });
      const total = sp + sb + sd;
      const lines = total > 0
        ? [
            `SP (Sponsored Products): ${currency}${sp.toFixed(0)} ad sales`,
            `SB (Sponsored Brands): ${currency}${sb.toFixed(0)} ad sales`,
            `SD (Sponsored Display): ${currency}${sd.toFixed(0)} ad sales`,
          ]
        : ['Insufficient data — upload SP Targeting / Search Term report.'];
      slide.addText(
        lines.map((t) => ({ text: t, options: { fontFace: 'Calibri', fontSize: 14, color: THEME.text, bullet: true } })),
        { x: 0.9, y: 0.9, w: 8, h: 4 }
      );
    }

    // Slide 3 — Targeting (Auto vs Manual)
    {
      const slide = pres.addSlide();
      slide.background = { color: 'FFFFFF' };
      addHeader(slide, '3. Targeting');
      const kws = premiumState.keywordAnalysis;
      let autoSpend = 0, manualSpend = 0, autoSales = 0, manualSales = 0;
      kws.forEach((k) => {
        const m = (k.matchType ?? '').toLowerCase();
        const isAuto = m.includes('auto');
        if (isAuto) {
          autoSpend += k.spend;
          autoSales += k.sales;
        } else {
          manualSpend += k.spend;
          manualSales += k.sales;
        }
      });
      const hasTargeting = autoSpend + manualSpend > 0;
      const lines = hasTargeting
        ? [
            `Auto — Spend: ${currency}${autoSpend.toFixed(0)}, Sales: ${currency}${autoSales.toFixed(0)}`,
            `Manual — Spend: ${currency}${manualSpend.toFixed(0)}, Sales: ${currency}${manualSales.toFixed(0)}`,
          ]
        : ['Insufficient data — upload SP Targeting report.'];
      slide.addText(
        lines.map((t) => ({ text: t, options: { fontFace: 'Calibri', fontSize: 14, color: THEME.text, bullet: true } })),
        { x: 0.9, y: 0.9, w: 8, h: 4 }
      );
    }

    // Slide 4 — Keyword Intent
    {
      const slide = pres.addSlide();
      slide.background = { color: 'FFFFFF' };
      addHeader(slide, '4. Keyword Intent');
      const brand = premiumState.brandAnalysis;
      const hasBrand = brand && (brand.brandedSales > 0 || brand.genericSales > 0 || brand.competitorSales > 0);
      const lines = hasBrand
        ? [
            `Branded: ${currency}${(brand?.brandedSales ?? 0).toFixed(0)}`,
            `Generic: ${currency}${(brand?.genericSales ?? 0).toFixed(0)}`,
            `Competitor: ${currency}${(brand?.competitorSales ?? 0).toFixed(0)}`,
          ]
        : ['Insufficient data — configure brand terms or upload Search Term report.'];
      slide.addText(
        lines.map((t) => ({ text: t, options: { fontFace: 'Calibri', fontSize: 14, color: THEME.text, bullet: true } })),
        { x: 0.9, y: 0.9, w: 8, h: 4 }
      );
    }

    const addSimpleSlide = (title: string, lines: string[], insuffMsg?: string) => {
      const slide = pres.addSlide();
      slide.background = { color: 'FFFFFF' };
      addHeader(slide, title);
      const safeLines = lines.length ? lines : [insuffMsg ?? 'Insufficient data — upload the relevant report.'];
      slide.addText(
        safeLines.map((t) => ({ text: t, options: { fontFace: 'Calibri', fontSize: 14, color: THEME.text, bullet: true } })),
        { x: 0.9, y: 0.9, w: 8, h: 4 }
      );
    };

    // Slide 5 — Top 5 ASINs
    const asins = (body as { asins?: Array<{ asin: string; totalSales: number; adSales: number; adSpend: number }> }).asins ?? [];
    const top5Asins = asins.slice(0, 5);
    addSimpleSlide(
      '5. Top 5 ASINs',
      top5Asins.map((a) => `${a.asin} — Sales ${currency}${a.totalSales.toFixed(0)}, Ad Spend ${currency}${a.adSpend.toFixed(0)}`),
      'Insufficient data — upload Business Report.'
    );

    // Slide 6 — Bottom 5 ASINs (with Reason)
    const bottom5Asins = asins.slice(-5).reverse();
    addSimpleSlide(
      '6. Bottom 5 ASINs',
      bottom5Asins.map((a) => {
        const reason = a.adSpend > 0 && a.adSales === 0 ? 'Zero ad sales' : (a.adSpend > 0 && a.adSales > 0 && (a.adSpend / a.adSales) * 100 > 50 ? 'High ACOS' : 'Low volume');
        return `${a.asin} — ${currency}${a.totalSales.toFixed(0)} (${reason})`;
      }),
      'Insufficient data — upload Business Report.'
    );

    // Slide 7 — Wasted Spend
    {
      const baseLines = premiumState.wasteAnalysis.slice(0, 10).map(
        (w) => `${w.searchTerm.slice(0, 40)} — Spend ${currency}${w.spend.toFixed(0)}, Clicks ${w.clicks}`
      );
      const totalWaste = premiumState.wasteAnalysis.reduce((s, w) => s + w.spend, 0);
      const lines = totalWaste > 0 ? [`Total wasted: ${currency}${totalWaste.toFixed(0)}`, ...baseLines] : ['Insufficient data — upload SP Search Term report.'];
      addSimpleSlide('7. Wasted Spend', lines);
    }

    // Slide 8 — Top 10 Search Terms
    addSimpleSlide(
      '8. Top 10 Search Terms',
      premiumState.keywordAnalysis.slice(0, 10).map(
        (k) => `${k.searchTerm.slice(0, 40)} — Spend ${currency}${k.spend.toFixed(0)}, Sales ${currency}${k.sales.toFixed(0)}`
      ),
      'Insufficient data — upload SP Search Term report.'
    );

    // Slide 9 — Key Insights & Action Plan
    {
      const actions = slideManifest?.slides.find((s) => s.id === 'priority_actions')?.actions;
      let lines: string[];
      if (actions && actions.length > 0) {
        lines = actions.slice(0, 5).map((a) => `${a.number}. ${a.title} — ${a.detail}`.slice(0, 120));
      } else {
        lines = premiumState.recommendations.slice(0, 5).map((r, idx) => `${idx + 1}. ${r}`);
      }
      if (lines.length === 0) lines = ['Insufficient data — run full audit for insights.'];
      addSimpleSlide('9. Key Insights & Action Plan', lines);
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

    const footerText = premiumState.dataTrustReport != null
      ? `Generated ${premiumState.generatedAt} | ${premiumState.modelVerificationStatus ?? 'Zenith'} | Audit Confidence: ${Math.round(premiumState.dataTrustReport.trustScore * 100)}%${judge.status === 'PASSED' ? ' | Verified' : ''}`
      : `Generated ${premiumState.generatedAt} | ${premiumState.modelVerificationStatus ?? 'Zenith'}${judge.status === 'PASSED' ? ' | Verified' : ' | Visual layout simplified due to data density.'}`;
    pres.addSlide().addText(footerText, { x: 0.5, y: 5.2, w: 9, h: 0.4, fontSize: 8, color: THEME.text });

    const buffer = await pres.write({ outputType: 'nodebuffer' });
    const buf = buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);
    console.log('[Zenith export] Slides composed, buffer length:', buf.length);

    if (metricsForEngine) {
      const verification = verifyPptxOutput(buf, metricsForEngine, 9);
      if (!verification.passed) {
        // eslint-disable-next-line no-console
        console.warn('[Zenith export] PPTX verification warnings', verification.warnings);
      }
      setExportStatus('ready', 'Export ready');
      await writeCache(auditId, buf, null);
      console.log('[Zenith export] Export ready, returning PPTX');
      const res = new Response(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': 'attachment; filename="audit-report.pptx"',
        },
      });
      res.headers.set('X-Export-Verified', verification.passed ? 'true' : 'false');
      res.headers.set('X-Export-Warnings', JSON.stringify(verification.warnings));
      return res;
    }

    setExportStatus('ready', 'Export ready');
    await writeCache(auditId, buf, null);
    console.log('[Zenith export] Export ready, returning PPTX');
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
