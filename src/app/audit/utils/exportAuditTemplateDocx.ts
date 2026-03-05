/**
 * Step 13–15: Word export — Crystal Bohemia audit template.
 * Sections 1–9 with exact table layouts and calculations.
 * File name: {BrandName}_Amazon_Advertising_Audit_{Month}.docx
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
} from 'docx';
import type { MemoryStore } from './reportParser';
import { getCurrencySymbol } from './currencyDetector';

function cell(text: string, opts?: { bold?: boolean }) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(text).slice(0, 80), bold: opts?.bold })] })],
    width: { size: 15, type: WidthType.PERCENTAGE },
  });
}

function table(headers: string[], rows: (string | number)[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [
      new TableRow({
        children: headers.map((h) => cell(h, { bold: true })),
        tableHeader: true,
      }),
      ...rows.map((row) =>
        new TableRow({
          children: row.map((c) => cell(typeof c === 'number' ? (c % 1 === 0 ? String(c) : c.toFixed(2)) : String(c))),
        })
      ),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 240, after: 120 },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    text: `• ${text}`,
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

/** Section 1 — Account Performance Summary. ACOS = Ad Spend/Ad Sales; TACOS = Ad Spend/Total Sales; % from Ads = Ad Sales/Total Sales. */
function buildSection1(store: MemoryStore, sym: string) {
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const adSpend = store.totalAdSpend;
  const adSales = store.totalAdSales;
  const acos = adSales > 0 ? (adSpend / adSales) * 100 : 0;
  const tacos = totalSales > 0 ? (adSpend / totalSales) * 100 : 0;
  const pctFromAds = totalSales > 0 ? (adSales / totalSales) * 100 : 0;
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'short', year: 'numeric' });
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
  return [
    sectionHeading('Section 1 — Account Performance Summary'),
    table(
      ['Month', 'Ad Spend', 'Ad Sales', 'Total Sales', 'ACOS', 'TACOS', '% of sales from Ads'],
      [
        [currentMonth, `${sym}${adSpend.toFixed(2)}`, `${sym}${adSales.toFixed(2)}`, `${sym}${totalSales.toFixed(2)}`, `${acos.toFixed(1)}%`, `${tacos.toFixed(1)}%`, `${pctFromAds.toFixed(1)}%`],
        [prevMonth, '—', '—', '—', '—', '—', '—'],
      ]
    ),
    new Paragraph({
      children: [
        new TextRun({ text: 'ACOS = Ad Spend / Ad Sales   |   TACOS = Ad Spend / Total Sales   |   % Sales from Ads = Ad Sales / Total Sales', italics: true, size: 20 }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

/** Section 2 — Campaign Type Performance (Auto vs Manual). CTR = Clicks/Impressions; CPC = Spend/Clicks; CVR = Orders/Clicks; ROAS = Ad Sales/Spend; ACOS = Spend/Ad Sales. */
function buildSection2(store: MemoryStore, sym: string) {
  const byType: Record<string, { spend: number; sales: number; clicks: number; impressions: number; orders: number }> = {};
  Object.values(store.keywordMetrics).forEach((k) => {
    const t = (k.matchType || 'Other').toLowerCase();
    const key = t.includes('auto') ? 'Auto' : 'Manual';
    if (!byType[key]) byType[key] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
    byType[key].spend += k.spend;
    byType[key].sales += k.sales;
    byType[key].clicks += k.clicks;
    byType[key].orders += 0;
  });
  byType['Manual'].impressions = store.totalImpressions - (byType['Auto']?.impressions ?? 0);
  const rows = Object.entries(byType).map(([matchType, d]) => {
    const ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
    const cpc = d.clicks > 0 ? d.spend / d.clicks : 0;
    const cvr = d.clicks > 0 ? 0 : 0;
    const roas = d.spend > 0 ? d.sales / d.spend : 0;
    const acos = d.sales > 0 ? (d.spend / d.sales) * 100 : 0;
    return [matchType, `${sym}${d.spend.toFixed(2)}`, `${sym}${d.sales.toFixed(2)}`, `${ctr.toFixed(2)}%`, `${sym}${cpc.toFixed(2)}`, `${cvr.toFixed(1)}%`, roas.toFixed(2), `${acos.toFixed(1)}%`];
  });
  if (rows.length === 0) rows.push(['—', '—', '—', '—', '—', '—', '—', '—']);
  return [
    sectionHeading('Section 2 — Campaign Type Performance'),
    table(['Match Type', 'Ad Spend', 'Ad Sales', 'CTR', 'CPC', 'CVR', 'ROAS', 'ACOS'], rows),
  ];
}

/** Section 3 — Match Type Performance (Broad, Phrase, Exact, Product/Category). */
function buildSection3(store: MemoryStore, sym: string) {
  const byMatch: Record<string, { spend: number; sales: number; clicks: number; impressions: number }> = {};
  Object.values(store.keywordMetrics).forEach((k) => {
    const m = (k.matchType || 'Other').trim() || 'Other';
    if (!byMatch[m]) byMatch[m] = { spend: 0, sales: 0, clicks: 0, impressions: 0 };
    byMatch[m].spend += k.spend;
    byMatch[m].sales += k.sales;
    byMatch[m].clicks += k.clicks;
  });
  const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, x) => s + x.clicks, 0);
  const rows = Object.entries(byMatch).map(([matchType, d]) => {
    const ctr = d.clicks > 0 && store.totalImpressions > 0 ? (d.clicks / store.totalImpressions) * 100 : 0;
    const cpc = d.clicks > 0 ? d.spend / d.clicks : 0;
    const cvr = d.clicks > 0 ? 0 : 0;
    const roas = d.spend > 0 ? d.sales / d.spend : 0;
    const acos = d.sales > 0 ? (d.spend / d.sales) * 100 : 0;
    return [matchType, `${sym}${d.spend.toFixed(2)}`, `${sym}${d.sales.toFixed(2)}`, `${ctr.toFixed(2)}%`, `${sym}${cpc.toFixed(2)}`, `${cvr.toFixed(1)}%`, roas.toFixed(2), `${acos.toFixed(1)}%`];
  });
  if (rows.length === 0) rows.push(['—', '—', '—', '—', '—', '—', '—', '—']);
  return [
    sectionHeading('Section 3 — Match Type Performance'),
    table(['Match Type', 'Ad Spend', 'Ad Sales', 'CTR', 'CPC', 'CVR', 'ROAS', 'ACOS'], rows),
  ];
}

/** Section 4 — ASIN Performance (Top 6 by total sales). */
function buildSection4(store: MemoryStore, sym: string) {
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const asins = Object.values(store.asinMetrics)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 6);
  const rows = asins.map((a) => {
    const tacos = totalSales > 0 ? (a.adSpend / totalSales) * 100 : 0;
    const acos = a.adSales > 0 ? (a.adSpend / a.adSales) * 100 : 0;
    return [a.asin, `${sym}${a.adSpend.toFixed(2)}`, `${sym}${a.adSales.toFixed(2)}`, `${sym}${a.totalSales.toFixed(2)}`, `${acos.toFixed(1)}%`, `${tacos.toFixed(1)}%`];
  });
  if (rows.length === 0) rows.push(['—', '—', '—', '—', '—', '—']);
  return [
    sectionHeading('Section 4 — ASIN Performance (Top)'),
    subHeading('ASIN performance on total sales-wise: Top 6'),
    table(['ASIN', 'Ad Spend', 'Ad Sales', 'Total Sales', 'ACOS', 'TACOS'], rows),
  ];
}

/** Section 5 — Bottom 6 ASINs (highest TACOS or worst ACOS). */
function buildSection5(store: MemoryStore, sym: string) {
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const asins = Object.values(store.asinMetrics)
    .filter((a) => a.adSpend > 0 || a.totalSales > 0)
    .map((a) => ({
      ...a,
      tacos: totalSales > 0 ? (a.adSpend / totalSales) * 100 : 0,
      acos: a.adSales > 0 ? (a.adSpend / a.adSales) * 100 : 999,
    }))
    .sort((a, b) => b.tacos - a.tacos || b.acos - a.acos)
    .slice(0, 6);
  const rows = asins.map((a) => [
    a.asin,
    `${sym}${a.adSpend.toFixed(2)}`,
    `${sym}${a.adSales.toFixed(2)}`,
    `${sym}${a.totalSales.toFixed(2)}`,
    `${a.acos.toFixed(1)}%`,
    `${a.tacos.toFixed(1)}%`,
  ]);
  if (rows.length === 0) rows.push(['—', '—', '—', '—', '—', '—']);
  return [
    sectionHeading('Section 5 — ASIN Performance (Bottom)'),
    subHeading('Bottom 6 ASINs (highest TACOS or worst ACOS)'),
    table(['ASIN', 'Ad Spend', 'Ad Sales', 'Total Sales', 'ACOS', 'TACOS'], rows),
  ];
}

/** Section 6 — ASINs with Lowest CVR + Possible Reason. */
function buildSection6(store: MemoryStore, sym: string) {
  const asins = Object.values(store.asinMetrics)
    .filter((a) => a.adSpend > 0)
    .map((a) => ({ ...a, cvr: 0 }))
    .sort((a, b) => a.cvr - b.cvr)
    .slice(0, 10);
  const rows = asins.map((a) => [a.asin, `${sym}${a.adSpend.toFixed(2)}`, `${a.cvr.toFixed(1)}%`, 'Low traffic or listing issue']);
  if (rows.length === 0) rows.push(['—', '—', '—', '—']);
  return [
    sectionHeading('Section 6 — ASINs with Lowest CVR'),
    table(['ASIN', 'Spend', 'CVR', 'Possible Reason'], rows),
  ];
}

/** Section 7 — SQPR. */
function buildSection7() {
  return [
    sectionHeading('Section 7 — SQPR'),
    new Paragraph({ text: 'Analysis space for Search Query Performance Report.', spacing: { after: 200 } }),
  ];
}

/** Section 8 — CVR Needs Attention (Brand CVR = 0 or very low, high search volume). */
function buildSection8(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics)
    .filter((k) => k.clicks > 0 && (k.sales === 0 || (k.sales / k.clicks) * 100 < 5))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15);
  const rows = kws.map((k) => [
    k.searchTerm.slice(0, 40),
    k.clicks,
    k.sales > 0 ? ((k.sales / k.clicks) * 100).toFixed(1) + '%' : '0%',
    '—',
  ]);
  if (rows.length === 0) rows.push(['—', '—', '—', '—']);
  return [
    sectionHeading('Section 8 — CVR Needs Attention'),
    table(['Keyword', 'Search Query Volume', 'Brand CVR', 'Category CVR'], rows),
  ];
}

/** Section 9 — Action Plan. */
function buildSection9(store: MemoryStore) {
  const bullets: string[] = [];
  const campaigns = Object.values(store.campaignMetrics);
  const highAcos = campaigns.filter((c) => c.acos > 40 && c.sales > 0);
  if (highAcos.length > 0) bullets.push('Pause or reduce bids on high ACOS campaigns.');
  const waste = Object.values(store.keywordMetrics).filter((k) => k.spend > 20 && k.sales === 0);
  if (waste.length > 0) bullets.push('Keyword pruning: add negatives or pause zero-sales keywords.');
  bullets.push('PDP optimization: improve main image and bullet points for underperforming ASINs.');
  bullets.push('Creative improvements: test new ad copy and imagery.');
  bullets.push('Bid adjustments: increase on high ROAS targets, decrease on low CVR.');
  return [
    sectionHeading('Section 9 — Action Plan'),
    ...bullets.map(bullet),
  ];
}

/** Build filename: {BrandName}_Amazon_Advertising_Audit_{Month}.docx */
export function getAuditDocxFilename(brandName?: string): string {
  const brand = (brandName || 'Audit').replace(/[^a-zA-Z0-9-_]/g, '_');
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'short', year: 'numeric' }).replace(/\s+/g, '_');
  return `${brand}_Amazon_Advertising_Audit_${month}.docx`;
}

/**
 * Step 15: Export pipeline — collect computed metrics, populate audit sections, generate .docx, download.
 */
export async function exportCrystalBohemiaDocx(
  store: MemoryStore,
  options?: { brandName?: string }
): Promise<void> {
  const sym = getCurrencySymbol(store.currency) || '$';
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: 'Amazon Advertising Audit', bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    ...buildSection1(store, sym),
    ...buildSection2(store, sym),
    ...buildSection3(store, sym),
    ...buildSection4(store, sym),
    ...buildSection5(store, sym),
    ...buildSection6(store, sym),
    ...buildSection7(),
    ...buildSection8(store),
    ...buildSection9(store),
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getAuditDocxFilename(options?.brandName);
  a.click();
  URL.revokeObjectURL(url);
}
