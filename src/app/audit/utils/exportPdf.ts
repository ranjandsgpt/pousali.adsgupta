/**
 * PDF export – 9-section structure.
 * 1. Overview | 2. Campaign Type | 3. Targeting | 4. Keyword Intent
 * 5. Top 5 ASINs | 6. Bottom 5 ASINs | 7. Wasted Spend | 8. Top 10 Search Terms | 9. Key Insights & Action Plan
 */
import { jsPDF } from 'jspdf';
import type { MemoryStore } from './reportParser';
import { buildFullExportData } from './exportDataBuilder';
import type { OverrideState } from '@/services/overrideEngine';
import { getCurrencySymbol } from './currencyDetector';
import { runSanityChecks } from './sanityChecks';
import { buildTargetingTypeSummary } from './targetingTypeAggregates';
import { classifyKeyword } from './keywordClassifier';

const MARGIN = 14;
const PAGE_HEIGHT = 297;
const PAGE_WIDTH = 210;

const INSUFFICIENT = 'Insufficient data — upload the relevant report to populate this section.';

function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  rows: (string | number)[][],
  colWidths: number[],
  pageWidth: number,
  margin: number
): number {
  const lineHeight = 6;
  const cellPadding = 2;
  let y = startY;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(String(h).slice(0, 32), x + cellPadding, y + lineHeight - 1);
    x += colWidths[i];
  });
  y += lineHeight + 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;
  doc.setFont('helvetica', 'normal');
  for (const row of rows) {
    if (y > PAGE_HEIGHT - 24) {
      doc.addPage();
      y = margin + 10;
    }
    x = margin;
    row.forEach((cell, i) => {
      doc.text(String(cell).slice(0, 28), x + cellPadding, y + lineHeight - 1);
      x += colWidths[i];
    });
    y += lineHeight;
  }
  return y + 6;
}

function sectionHeading(doc: jsPDF, y: number, title: string, margin: number, pageBreak = false): number {
  if (pageBreak || y > PAGE_HEIGHT - 36) {
    doc.addPage();
    y = margin + 10;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y + 2, PAGE_WIDTH - margin, y + 2);
  return y + 14;
}

function insuff(doc: jsPDF, y: number, msg: string, margin: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(msg, margin, y, { maxWidth: PAGE_WIDTH - 2 * margin });
  doc.setTextColor(0, 0, 0);
  return y + 12;
}

/** SP/SB/SD from campaign name (same logic as AdProductSalesPie). */
function inferAdProduct(campaignName: string): 'SP' | 'SB' | 'SD' | 'unclassified' {
  const c = (campaignName || '').toLowerCase();
  if (c.includes('sponsored products') || c.includes('sp ')) return 'SP';
  if (c.includes('sponsored brands') || c.includes('sb ') || c.includes('hsa') || c.includes('headline')) return 'SB';
  if (c.includes('sponsored display') || c.includes('sd ')) return 'SD';
  return 'unclassified';
}

export function exportAuditPdf(store: MemoryStore, overrides?: OverrideState): void {
  const data = buildFullExportData(store, overrides);
  const agg = store.aggregatedMetrics;
  const sanity = runSanityChecks(store);
  const sym = getCurrencySymbol(store.currency) || '$';
  const doc = new jsPDF();
  let y = MARGIN + 10;

  // ——— 1. Overview ———
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Amazon Advertising Performance Audit', MARGIN, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${data.generatedAt}.`, MARGIN, 28);
  y = sectionHeading(doc, 34, '1. Overview', MARGIN);
  doc.setFontSize(10);
  const verdict =
    agg != null
      ? `Ad spend ${sym}${agg.adSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })} generated ${sym}${agg.adSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} in ad sales. ROAS ${agg.roas?.toFixed(2) ?? '—'}×; ACOS ${agg.acos != null ? (agg.acos * 100).toFixed(1) : '—'}%.`
      : INSUFFICIENT + ' (Campaign / SP reports)';
  doc.text(verdict, MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
  y += 14;
  doc.text('1. Review high-ACOS campaigns and reduce waste.', MARGIN, y);
  y += 6;
  doc.text('2. Scale high-ROAS keywords and campaigns.', MARGIN, y);
  y += 6;
  doc.text('3. Add negatives for zero-sales search terms.', MARGIN, y);
  y += 16;

  // ——— 2. Campaign Type (SP / SB / SD) ———
  y = sectionHeading(doc, y > PAGE_HEIGHT - 30 ? PAGE_HEIGHT - 10 : y, '2. Campaign Type', MARGIN, y > PAGE_HEIGHT - 30);
  let sp = 0, sb = 0, sd = 0, uncl = 0;
  for (const kw of Object.values(store.keywordMetrics)) {
    const cls = inferAdProduct(kw.campaign);
    const sales = kw.sales;
    if (!sales || sales <= 0) continue;
    if (cls === 'SP') sp += sales;
    else if (cls === 'SB') sb += sales;
    else if (cls === 'SD') sd += sales;
    else uncl += sales;
  }
  const baseTotal = sp + sb + sd;
  if (baseTotal > 0 && uncl > 0) {
    sp += uncl * (sp / baseTotal);
    sb += uncl * (sb / baseTotal);
    sd += uncl * (sd / baseTotal);
  }
  const total = sp + sb + sd;
  if (total > 0) {
    const rows = [
      ['SP (Sponsored Products)', sp.toFixed(2), ((sp / total) * 100).toFixed(1) + '%'],
      ['SB (Sponsored Brands)', sb.toFixed(2), ((sb / total) * 100).toFixed(1) + '%'],
      ['SD (Sponsored Display)', sd.toFixed(2), ((sd / total) * 100).toFixed(1) + '%'],
    ].filter((r) => Number(r[1]) > 0);
    y = drawTable(doc, y, ['Type', 'Ad Sales', 'Share'], rows, [70, 45, 35], PAGE_WIDTH, MARGIN);
  } else {
    y = insuff(doc, y, INSUFFICIENT + ' (SP Targeting / Search Term report)', MARGIN);
  }

  // ——— 3. Targeting (Auto vs Manual) ———
  y = sectionHeading(doc, y > PAGE_HEIGHT - 30 ? PAGE_HEIGHT - 10 : y, '3. Targeting', MARGIN, y > PAGE_HEIGHT - 30);
  const targeting = buildTargetingTypeSummary(store.keywordMetrics);
  const tSpend = targeting.auto.spend + targeting.manual.spend;
  const tSales = targeting.auto.sales + targeting.manual.sales;
  if (tSpend > 0 || tSales > 0) {
    const rows = [
      ['Auto', targeting.auto.spend.toFixed(2), targeting.auto.sales.toFixed(2)],
      ['Manual', targeting.manual.spend.toFixed(2), targeting.manual.sales.toFixed(2)],
    ];
    y = drawTable(doc, y, ['Targeting', 'Ad Spend', 'Ad Sales'], rows, [50, 50, 50], PAGE_WIDTH, MARGIN);
  } else {
    y = insuff(doc, y, INSUFFICIENT + ' (SP Targeting report)', MARGIN);
  }

  // ——— 4. Keyword Intent ———
  y = sectionHeading(doc, y > PAGE_HEIGHT - 30 ? PAGE_HEIGHT - 10 : y, '4. Keyword Intent', MARGIN, y > PAGE_HEIGHT - 30);
  const brandNames = (store as unknown as { brandNames?: string[] }).brandNames ?? [];
  const competitorTerms = (store as unknown as { competitorBrands?: string[] }).competitorBrands ?? [];
  const byIntent: Record<string, { spend: number; sales: number }> = { Branded: { spend: 0, sales: 0 }, Generic: { spend: 0, sales: 0 }, Competitor: { spend: 0, sales: 0 } };
  for (const kw of Object.values(store.keywordMetrics)) {
    const tag = classifyKeyword(kw.searchTerm, { brandNames, competitorTerms });
    byIntent[tag].spend += kw.spend;
    byIntent[tag].sales += kw.sales;
  }
  const intentTotal = byIntent.Branded.spend + byIntent.Generic.spend + byIntent.Competitor.spend;
  if (intentTotal > 0) {
    const rows = ['Branded', 'Generic', 'Competitor']
      .map((name) => [name, byIntent[name].spend.toFixed(2), byIntent[name].sales.toFixed(2)])
      .filter((r) => Number(r[1]) > 0);
    y = drawTable(doc, y, ['Intent', 'Ad Spend', 'Ad Sales'], rows, [45, 50, 55], PAGE_WIDTH, MARGIN);
  } else {
    y = insuff(doc, y, INSUFFICIENT + ' (Search Term report)', MARGIN);
  }

  // ——— 5. Top 5 ASINs ———
  y = sectionHeading(doc, y > PAGE_HEIGHT - 30 ? PAGE_HEIGHT - 10 : y, '5. Top 5 ASINs', MARGIN, y > PAGE_HEIGHT - 30);
  const asinsAll = Object.values(store.asinMetrics).sort((a, b) => b.totalSales - a.totalSales);
  const top5 = asinsAll.slice(0, 5);
  if (top5.length > 0) {
    const rows = top5.map((a) => [
      a.asin,
      a.totalSales.toFixed(2),
      a.adSales.toFixed(2),
      a.adSpend > 0 && a.adSales > 0 ? ((a.adSpend / a.adSales) * 100).toFixed(1) : '—',
    ]);
    y = drawTable(doc, y, ['ASIN', 'Store Sales', 'Ad Sales', 'ACOS%'], rows, [35, 40, 40, 35], PAGE_WIDTH, MARGIN);
  } else {
    y = insuff(doc, y, INSUFFICIENT + ' (Business Report)', MARGIN);
  }

  // ——— 6. Bottom 5 ASINs (with Reason) ———
  y = sectionHeading(doc, y > PAGE_HEIGHT - 30 ? PAGE_HEIGHT - 10 : y, '6. Bottom 5 ASINs', MARGIN, y > PAGE_HEIGHT - 30);
  const bottom5 = asinsAll.slice(-5).reverse();
  if (bottom5.length > 0) {
    const rows = bottom5.map((a) => {
      let reason = 'Low volume';
      if (a.adSpend > 0 && a.adSales === 0) reason = 'Zero ad sales';
      else if (a.adSpend > 0 && a.adSales > 0 && (a.adSpend / a.adSales) * 100 > 50) reason = 'High ACOS';
      return [
        a.asin,
        a.totalSales.toFixed(2),
        a.adSpend.toFixed(2),
        a.adSpend > 0 && a.adSales > 0 ? ((a.adSpend / a.adSales) * 100).toFixed(1) : '—',
        reason,
      ];
    });
    y = drawTable(doc, y, ['ASIN', 'Store Sales', 'Ad Spend', 'ACOS%', 'Reason'], rows, [28, 32, 28, 28, 34], PAGE_WIDTH, MARGIN);
  } else {
    y = insuff(doc, y, INSUFFICIENT + ' (Business Report)', MARGIN);
  }

  // ——— 7. Wasted Spend ———
  y = sectionHeading(doc, y > PAGE_HEIGHT - 30 ? PAGE_HEIGHT - 10 : y, '7. Wasted Spend', MARGIN, y > PAGE_HEIGHT - 30);
  const wasted = Object.values(store.keywordMetrics).filter((k) => k.spend > 0 && k.sales === 0).sort((a, b) => b.spend - a.spend).slice(0, 10);
  const totalWaste = wasted.reduce((s, k) => s + k.spend, 0);
  if (totalWaste > 0 && wasted.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total wasted (0 sales): ${sym}${totalWaste.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, MARGIN, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const wasteRows = wasted.map((k) => [String(k.searchTerm).slice(0, 28), k.spend.toFixed(2), String(k.clicks)]);
    y = drawTable(doc, y, ['Search Term', 'Spend', 'Clicks'], wasteRows, [80, 40, 30], PAGE_WIDTH, MARGIN);
  } else {
    y = insuff(doc, y, INSUFFICIENT + ' (SP Search Term report)', MARGIN);
  }

  // ——— 8. Top 10 Search Terms ———
  y = sectionHeading(doc, y > PAGE_HEIGHT - 30 ? PAGE_HEIGHT - 10 : y, '8. Top 10 Search Terms', MARGIN, y > PAGE_HEIGHT - 30);
  const topTerms = Object.values(store.keywordMetrics).sort((a, b) => b.spend - a.spend).slice(0, 10);
  if (topTerms.length > 0) {
    const rows = topTerms.map((k) => [
      String(k.searchTerm).slice(0, 24),
      k.spend.toFixed(2),
      k.sales.toFixed(2),
      k.matchType?.slice(0, 8) ?? '—',
    ]);
    y = drawTable(doc, y, ['Search Term', 'Spend', 'Sales', 'Match'], rows, [65, 35, 35, 25], PAGE_WIDTH, MARGIN);
  } else {
    y = insuff(doc, y, INSUFFICIENT + ' (SP Search Term report)', MARGIN);
  }

  // ——— 9. Key Insights & Action Plan ———
  y = sectionHeading(doc, y > PAGE_HEIGHT - 30 ? PAGE_HEIGHT - 10 : y, '9. Key Insights & Action Plan', MARGIN, y > PAGE_HEIGHT - 30);
  const opps = data.opportunities.slice(0, 8);
  if (opps.length > 0) {
    opps.forEach((o) => {
      if (y > PAGE_HEIGHT - 24) {
        doc.addPage();
        y = MARGIN + 10;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(o.title, MARGIN, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`${o.entityName}: ${o.recommendedAction}`, MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
      y += 10;
    });
  }
  if (data.patterns.length > 0 && y < PAGE_HEIGHT - 40) {
    doc.setFont('helvetica', 'bold');
    doc.text('Issues to address', MARGIN, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    data.patterns.slice(0, 3).forEach((p) => {
      doc.text(`${p.problemTitle} — ${p.entityName}: ${p.recommendedAction}`, MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
      y += 8;
    });
  }
  if (opps.length === 0 && data.patterns.length === 0) {
    y = insuff(doc, y, INSUFFICIENT + ' Run full audit for insights.', MARGIN);
  }

  y += 12;
  doc.setFontSize(9);
  doc.text('Prepared by Pousali Dasgupta | pousali.adsgupta.com', MARGIN, y);

  doc.save('Amazon-Advertising-Performance-Audit.pdf');
}
