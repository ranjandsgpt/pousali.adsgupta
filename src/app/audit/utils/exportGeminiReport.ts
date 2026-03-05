/**
 * Automated report export: Amazon_Performance_Report.pptx and Agency_Action_Plan.csv
 * Aligned to the same 10-section structure as the Gemini narrative.
 */

import type { MemoryStore } from './reportParser';
import { runSanityChecks } from './sanityChecks';
import { runDiagnosticEngines } from '../engines';

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

/**
 * Generate and download Amazon_Performance_Report.pptx with 10-section slides and 3 charts.
 */
export async function exportAmazonPerformancePptx(store: MemoryStore): Promise<void> {
  const sanity = runSanityChecks(store);
  const diagnostics = runDiagnosticEngines(store);
  const pptxgen = (await import('pptxgenjs')).default;
  const pres = new pptxgen();

  const totalStoreSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const totalAdSales = store.totalAdSales;
  const totalAdSpend = store.totalAdSpend;
  const organicSales = totalStoreSales - totalAdSales;
  const acos = totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;
  const roas = totalAdSpend > 0 ? totalAdSales / totalAdSpend : 0;

  // Title slide
  const titleSlide = pres.addSlide();
  titleSlide.addText('Amazon Performance Report', { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 24, bold: true });
  titleSlide.addText('Executive audit – 10 sections', { x: 0.5, y: 2.5, w: 9, h: 0.5, fontSize: 14 });

  // 1. Executive Summary
  const s1 = pres.addSlide();
  s1.addText(SECTION_TITLES[0], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s1.addText(
    [
          { text: `Total store sales: ${totalStoreSales.toFixed(2)}`, options: {} },
          { text: `Ad sales: ${totalAdSales.toFixed(2)} | Ad spend: ${totalAdSpend.toFixed(2)}`, options: {} },
          { text: `ACOS: ${acos.toFixed(1)}% | ROAS: ${roas.toFixed(2)}×`, options: {} },
          { text: `Organic sales: ${organicSales.toFixed(2)}`, options: {} },
    ],
    { x: 0.5, y: 1, w: 9, h: 1.5, fontSize: 12 }
  );

  // 2. Top Performing ASINs
  const topAsins = Object.values(store.asinMetrics)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10);
  const s2 = pres.addSlide();
  s2.addText(SECTION_TITLES[1], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s2.addText(
    topAsins.map((a) => ({ text: `${a.asin}: ${a.totalSales.toFixed(2)} sales`, options: {} })),
    { x: 0.5, y: 1, w: 9, h: 5, fontSize: 11 }
  );

  // 3. Campaign Efficiency
  const campaigns = Object.values(store.campaignMetrics)
    .filter((c) => c.campaignName)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
  const s3 = pres.addSlide();
  s3.addText(SECTION_TITLES[2], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s3.addText(
    campaigns.map((c) => ({
      text: `${c.campaignName}: Spend ${c.spend.toFixed(2)}, Sales ${c.sales.toFixed(2)}, ACOS ${c.acos.toFixed(1)}%`,
      options: {},
    })),
    { x: 0.5, y: 1, w: 9, h: 5, fontSize: 11 }
  );

  // 4. Targeting Strategy
  const s4 = pres.addSlide();
  s4.addText(SECTION_TITLES[3], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s4.addText('See ROAS by Match Type chart in this deck.', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 12 });

  // 5. Search Term Winners
  const winners = Object.values(store.keywordMetrics)
    .filter((k) => k.sales > 0)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
  const s5 = pres.addSlide();
  s5.addText(SECTION_TITLES[4], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s5.addText(
    winners.map((k) => ({ text: `${k.searchTerm}: ${k.sales.toFixed(2)} sales, ROAS ${k.roas.toFixed(2)}`, options: {} })),
    { x: 0.5, y: 1, w: 9, h: 5, fontSize: 11 }
  );

  // 6. Search Term Graveyard
  const graveyard = sanity.wastedKeywords.slice(0, 10);
  const s6 = pres.addSlide();
  s6.addText(SECTION_TITLES[5], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s6.addText(
    graveyard.length
      ? graveyard.map((k) => ({ text: `${k.searchTerm}: ${k.spend.toFixed(2)} spend, 0 sales`, options: {} }))
      : [{ text: 'No high-spend zero-sales keywords in top list.', options: {} }],
    { x: 0.5, y: 1, w: 9, h: 5, fontSize: 11 }
  );

  // 7. B2B Opportunity
  const s7 = pres.addSlide();
  s7.addText(SECTION_TITLES[6], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s7.addText('B2B vs B2C breakdown from Business Report when available.', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 12 });

  // 8. Low Conversion Risk
  const s8 = pres.addSlide();
  s8.addText(SECTION_TITLES[7], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s8.addText(
    diagnostics.waste.bleedingKeywords.length > 0
      ? `Keywords with traffic but no sales: ${diagnostics.waste.bleedingKeywords.length}. Review Search Term Graveyard.`
      : 'No high-risk low-conversion keywords flagged.',
    { x: 0.5, y: 1, w: 9, h: 1, fontSize: 12 }
  );

  // 9. Competitor Benchmarking
  const s9 = pres.addSlide();
  s9.addText(SECTION_TITLES[8], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  s9.addText('Competitor and match-type overlap from targeting data. See Targeting Strategy.', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 12 });

  // 10. Prioritized Action Roadmap
  const s10 = pres.addSlide();
  s10.addText(SECTION_TITLES[9], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true });
  const roadmapBullets = [
    sanity.wastedKeywords.length > 0 && `Negate or pause ${Math.min(sanity.wastedKeywords.length, 50)} wasted keywords`,
    sanity.scalingKeywords.length > 0 && `Scale ${sanity.scalingKeywords.length} high-ROAS keywords`,
    sanity.highACOSCampaigns.length > 0 && `Review ${sanity.highACOSCampaigns.length} high-ACOS campaigns`,
    sanity.budgetCappedCampaigns.length > 0 && `Increase budget on ${sanity.budgetCappedCampaigns.length} capped campaigns`,
  ].filter(Boolean) as string[];
  s10.addText(
    roadmapBullets.length ? roadmapBullets.map((t) => ({ text: t, options: {} })) : [{ text: 'No actions generated from current data.', options: {} }],
    { x: 0.5, y: 1, w: 9, h: 4, fontSize: 12 }
  );

  // Chart: Sales Breakdown Pie
  const pieSlide = pres.addSlide();
  pieSlide.addText('Sales Breakdown', { x: 0.5, y: 0.2, w: 9, h: 0.4, fontSize: 16, bold: true });
  const pieData = [
    {
      name: 'Sales',
      labels: ['Ad Sales', 'Organic Sales'],
      values: [totalAdSales, Math.max(0, organicSales)],
    },
  ];
  pieSlide.addChart(pres.ChartType.pie, pieData, { x: 1, y: 0.8, w: 8, h: 5 });

  // Chart: ROAS by Match Type Bar
  const byMatchType = new Map<string, { spend: number; sales: number }>();
  Object.values(store.keywordMetrics).forEach((k) => {
    const mt = (k.matchType || 'other').toLowerCase();
    const cur = byMatchType.get(mt) || { spend: 0, sales: 0 };
    cur.spend += k.spend;
    cur.sales += k.sales;
    byMatchType.set(mt, cur);
  });
  const matchTypeLabels = Array.from(byMatchType.keys()).slice(0, 8);
  const matchTypeRoas = matchTypeLabels.map((mt) => {
    const d = byMatchType.get(mt)!;
    return d.spend > 0 ? d.sales / d.spend : 0;
  });
  const barSlide = pres.addSlide();
  barSlide.addText('ROAS by Match Type', { x: 0.5, y: 0.2, w: 9, h: 0.4, fontSize: 16, bold: true });
  const barData = [
    { name: 'ROAS', labels: matchTypeLabels.length ? matchTypeLabels : ['N/A'], values: matchTypeRoas.length ? matchTypeRoas : [0] },
  ];
  barSlide.addChart(pres.ChartType.bar, barData, { x: 1, y: 0.8, w: 8, h: 5 });

  // Chart: Top ASIN Sales Bar
  const asinSlide = pres.addSlide();
  asinSlide.addText('Top ASIN Sales', { x: 0.5, y: 0.2, w: 9, h: 0.4, fontSize: 16, bold: true });
  const asinLabels = topAsins.map((a) => a.asin);
  const asinValues = topAsins.map((a) => a.totalSales);
  const asinBarData = [{ name: 'Sales', labels: asinLabels, values: asinValues }];
  asinSlide.addChart(pres.ChartType.bar, asinBarData, { x: 1, y: 0.8, w: 8, h: 5 });

  pres.writeFile({ fileName: 'Amazon_Performance_Report.pptx' });
}
