/**
 * Automated report export: Amazon_Performance_Report.pptx and Agency_Action_Plan.csv
 * Aligned to the same 10-section structure as the Gemini narrative.
 */

import type { MemoryStore } from './reportParser';
import { runSanityChecks } from './sanityChecks';
import { runDiagnosticEngines } from '../engines';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';
import type { OverrideState } from '@/services/overrideEngine';

const SECTION_TITLES = [
  'Executive Summary',
  'Top Performing ASINs',
  'Campaign Efficiency',
  'Targeting Strategy',
  'Search Term Winners',
  'Search Term Graveyard',
  'B2B Opportunity',
  'Low Conversion Risk',
  'Competitor Benchmarking',
  'Prioritized Action Roadmap',
];

function escapeCsvCell(val: string | number): string {
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Generate and download Agency_Action_Plan.csv from store and sanity/diagnostics.
 */
export function exportAgencyActionPlanCsv(store: MemoryStore): void {
  const sanity = runSanityChecks(store);
  const diagnostics = runDiagnosticEngines(store);
  const rows: string[][] = [
    ['Action_Type', 'Priority', 'Detail', 'Keyword_or_Campaign', 'Spend', 'Sales', 'ROAS_ACOS_Notes'],
  ];

  sanity.wastedKeywords.slice(0, 50).forEach((k) => {
    rows.push([
      'Negate / Pause',
      'High',
      'Wasted spend – zero sales',
      escapeCsvCell(k.searchTerm),
      String(k.spend),
      String(k.sales),
      escapeCsvCell(`Campaign: ${k.campaign}`),
    ]);
  });
  sanity.scalingKeywords.slice(0, 30).forEach((k) => {
    rows.push([
      'Scale',
      'High',
      'High ROAS, scaling candidate',
      escapeCsvCell(k.searchTerm),
      String(k.spend),
      String(k.sales),
      escapeCsvCell(`ROAS: ${k.roas.toFixed(2)}`),
    ]);
  });
  sanity.highACOSCampaigns.slice(0, 20).forEach((c) => {
    rows.push([
      'Reduce ACOS',
      'Medium',
      'High ACOS campaign',
      escapeCsvCell(c.campaignName),
      String(c.spend),
      String(c.sales),
      escapeCsvCell(`ACOS: ${c.acos.toFixed(1)}%`),
    ]);
  });
  sanity.budgetCappedCampaigns.slice(0, 20).forEach((c) => {
    const roas = c.spend > 0 ? c.sales / c.spend : 0;
    rows.push([
      'Increase Budget',
      'Medium',
      'Budget capped, strong ROAS',
      escapeCsvCell(c.campaignName),
      String(c.spend),
      String(c.sales),
      escapeCsvCell(`Budget: ${c.budget}, ROAS: ${roas.toFixed(2)}`),
    ]);
  });
  if (diagnostics.waste.bleedingKeywords.length > 0) {
    rows.push([
      'Summary',
      'High',
      escapeCsvCell(`Total estimated wasted spend: ${diagnostics.waste.totalWasteSpend.toFixed(2)}`),
      '',
      '',
      '',
      escapeCsvCell(`${diagnostics.waste.bleedingKeywords.length} bleeding keywords`),
    ]);
  }

  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Agency_Action_Plan.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** Board-quality 10-slide deck (Phase 5): Minto pyramid, conclusion first, data from AggregatedMetrics. */
const SLIDE_BG = { color: '0F1117' } as const;
const SLIDE_TEXT = { color: 'FFFFFF', fontSize: 14 };
const SLIDE_TITLE = { color: 'FFFFFF', fontSize: 18, bold: true };

/**
 * Generate and download Amazon_Performance_Report.pptx — 10-slide board deck.
 * Uses store.aggregatedMetrics when available; fallback to executeMetricEngineForStore.
 */
export async function exportAmazonPerformancePptx(store: MemoryStore, overrides?: OverrideState): Promise<void> {
  const sanity = runSanityChecks(store);
  const pptxgen = (await import('pptxgenjs')).default;
  const pres = new pptxgen();

  const agg = store.aggregatedMetrics;
  const canonical = agg ?? executeMetricEngineForStore(store, overrides);
  const totalStoreSales = agg ? agg.totalStoreSales : (canonical as { totalSales: number }).totalSales;
  const totalAdSales = agg ? agg.adSales : (canonical as { totalAdSales: number }).totalAdSales;
  const totalAdSpend = agg ? agg.adSpend : (canonical as { totalAdSpend: number }).totalAdSpend;
  const organicSales = agg ? agg.organicSales : (canonical as { organicSales: number }).organicSales;
  const acos = (agg ? agg.acos ?? 0 : (canonical as { acos: number }).acos) * 100;
  const roas = agg ? (agg.roas ?? 0) : (canonical as { roas: number }).roas;
  const tacos = (agg ? agg.tacos ?? 0 : (canonical as { tacos: number }).tacos) * 100;

  // Slide 1 — Title
  const s1 = pres.addSlide();
  (s1 as { background: unknown }).background = SLIDE_BG;
  s1.addText('Amazon Advertising Performance Audit', { x: 0.5, y: 1.5, w: 9, h: 1, ...SLIDE_TITLE, fontSize: 24 });
  s1.addText(`${store.files.map((f) => f.name).join(' | ') || 'Report'}`, { x: 0.5, y: 2.4, w: 9, h: 0.4, ...SLIDE_TEXT, fontSize: 12 });
  s1.addText(`ROAS ${roas.toFixed(2)}×  |  ACOS ${Number.isFinite(acos) ? acos.toFixed(1) : '—'}%  |  TACOS ${Number.isFinite(tacos) ? tacos.toFixed(1) : '—'}%`, {
    x: 0.5,
    y: 2.9,
    w: 9,
    h: 0.5,
    ...SLIDE_TEXT,
  });

  // Slide 2 — The Situation
  const s2 = pres.addSlide();
  (s2 as { background: unknown }).background = SLIDE_BG;
  s2.addText('The Situation', { x: 0.5, y: 0.3, w: 9, h: 0.5, ...SLIDE_TITLE });
  const situationText =
    totalAdSpend > 0 && totalAdSales > 0
      ? `Spend of ${totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })} generated ${totalAdSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} in ad revenue. ${sanity.highACOSCampaigns.length} campaigns above 50% ACOS.`
      : 'Upload advertising and business reports to see the situation.';
  s2.addText(situationText, { x: 0.5, y: 1, w: 9, h: 1.5, ...SLIDE_TEXT });

  // Slide 3 — Financial Scorecard
  const s3 = pres.addSlide();
  (s3 as { background: unknown }).background = SLIDE_BG;
  s3.addText('Financial Scorecard', { x: 0.5, y: 0.3, w: 9, h: 0.5, ...SLIDE_TITLE });
  s3.addText(
    [
      { text: `Total Store Sales: ${totalStoreSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, options: SLIDE_TEXT },
      { text: `Ad Spend: ${totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}  |  Ad Sales: ${totalAdSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, options: SLIDE_TEXT },
      { text: `ROAS: ${roas.toFixed(2)}×  |  ACOS: ${Number.isFinite(acos) ? acos.toFixed(1) : '—'}%  |  TACOS: ${Number.isFinite(tacos) ? tacos.toFixed(1) : '—'}%`, options: SLIDE_TEXT },
      { text: `Organic Sales: ${organicSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, options: SLIDE_TEXT },
    ],
    { x: 0.5, y: 1, w: 9, h: 2, fontSize: 12, color: 'FFFFFF' }
  );

  // Slide 4 — Where Your Money Goes (donut)
  const s4 = pres.addSlide();
  (s4 as { background: unknown }).background = SLIDE_BG;
  s4.addText('Where Your Money Goes', { x: 0.5, y: 0.2, w: 9, h: 0.4, ...SLIDE_TITLE });
  const pieData = [{ name: 'Sales', labels: ['Ad Sales', 'Organic Sales'], values: [totalAdSales, Math.max(0, organicSales)] }];
  s4.addChart(pres.ChartType.pie, pieData, { x: 1.5, y: 0.8, w: 7, h: 5 });

  // Slide 5 — The Problem (ACOS by campaign)
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.campaignName).sort((a, b) => b.spend - a.spend).slice(0, 10);
  const s5 = pres.addSlide();
  (s5 as { background: unknown }).background = SLIDE_BG;
  const above40 = campaigns.filter((c) => c.acos > 40).length;
  s5.addText(above40 > 0 ? `${above40} campaigns above sustainable ACOS` : 'The Problem', { x: 0.5, y: 0.3, w: 9, h: 0.5, ...SLIDE_TITLE });
  s5.addText(
    campaigns.map((c) => ({ text: `${(c.campaignName || '').slice(0, 25)}: ACOS ${c.acos.toFixed(1)}%, Spend ${c.spend.toFixed(2)}`, options: SLIDE_TEXT })),
    { x: 0.5, y: 1, w: 9, h: 5, fontSize: 11, color: 'FFFFFF' }
  );

  // Slide 6 — The Opportunity (waste)
  const totalWaste = sanity.wastedKeywords.reduce((s, k) => s + k.spend, 0);
  const s6 = pres.addSlide();
  (s6 as { background: unknown }).background = SLIDE_BG;
  s6.addText(`Recoverable: ${totalWaste.toLocaleString('en-US', { minimumFractionDigits: 2 })} on zero-conversion terms`, { x: 0.5, y: 0.3, w: 9, h: 0.5, ...SLIDE_TITLE });
  const topWaste = sanity.wastedKeywords.slice(0, 5);
  s6.addText(
    topWaste.length ? topWaste.map((k) => ({ text: `${k.searchTerm.slice(0, 40)} — ${k.spend.toFixed(2)}`, options: SLIDE_TEXT })) : [{ text: 'No waste in top list.', options: SLIDE_TEXT }],
    { x: 0.5, y: 1.2, w: 9, h: 4, fontSize: 12, color: 'FFFFFF' }
  );

  // Slide 7 — Top 3 Actions
  const s7 = pres.addSlide();
  (s7 as { background: unknown }).background = SLIDE_BG;
  s7.addText('Top 3 Actions', { x: 0.5, y: 0.3, w: 9, h: 0.5, ...SLIDE_TITLE });
  const actions = [
    sanity.wastedKeywords.length > 0 ? { action: 'Negate or pause wasted keywords', impact: `${sanity.wastedKeywords.length} terms`, effort: 'Low' } : null,
    sanity.scalingKeywords.length > 0 ? { action: 'Scale high-ROAS keywords', impact: `${sanity.scalingKeywords.length} terms`, effort: 'Medium' } : null,
    sanity.highACOSCampaigns.length > 0 ? { action: 'Review high-ACOS campaigns', impact: `${sanity.highACOSCampaigns.length} campaigns`, effort: 'Medium' } : null,
  ].filter(Boolean) as { action: string; impact: string; effort: string }[];
  s7.addText(
    actions.slice(0, 3).map((a) => ({ text: `${a.action} — ${a.impact} (${a.effort})`, options: SLIDE_TEXT })),
    { x: 0.5, y: 1, w: 9, h: 3, fontSize: 12, color: 'FFFFFF' }
  );

  // Slide 8 — ASIN Highlights
  const topAsins = Object.values(store.asinMetrics).sort((a, b) => b.totalSales - a.totalSales).slice(0, 6);
  const s8 = pres.addSlide();
  (s8 as { background: unknown }).background = SLIDE_BG;
  s8.addText('ASIN Highlights', { x: 0.5, y: 0.3, w: 9, h: 0.5, ...SLIDE_TITLE });
  s8.addText(
    topAsins.length ? topAsins.map((a) => ({ text: `${a.asin}: ${a.totalSales.toFixed(2)} sales, ACOS ${a.adSales > 0 ? ((a.adSpend / a.adSales) * 100).toFixed(1) : '—'}%`, options: SLIDE_TEXT })) : [{ text: 'No ASIN data.', options: SLIDE_TEXT }],
    { x: 0.5, y: 1, w: 9, h: 4, fontSize: 11, color: 'FFFFFF' }
  );

  // Slide 9 — This Week's Focus
  const s9 = pres.addSlide();
  (s9 as { background: unknown }).background = SLIDE_BG;
  s9.addText("This Week's Focus", { x: 0.5, y: 0.3, w: 9, h: 0.5, ...SLIDE_TITLE });
  s9.addText(
    ['1. Review and act on wasted keywords.', '2. Scale winners where ROAS > 3×.', '3. Owner: ______________'].map((t) => ({ text: t, options: SLIDE_TEXT })),
    { x: 0.5, y: 1, w: 9, h: 2, fontSize: 12, color: 'FFFFFF' }
  );

  // Slide 10 — Appendix
  const s10 = pres.addSlide();
  (s10 as { background: unknown }).background = SLIDE_BG;
  s10.addText('Appendix', { x: 0.5, y: 0.3, w: 9, h: 0.5, ...SLIDE_TITLE });
  s10.addText('Full data available on request. Metrics from aggregated report data. pousali.adsgupta.com', { x: 0.5, y: 1, w: 9, h: 1, ...SLIDE_TEXT });

  pres.writeFile({ fileName: 'Amazon_Performance_Report.pptx' });
}
