/**
 * PDF export – Board-quality 8-page structure (Phase 5).
 * Page 1: Executive Summary | 2: Financial Grid | 3: Campaign Analysis | 4: Waste Report
 * Page 5: ASIN Intelligence | 6: Opportunities | 7: Methodology | 8: Appendix
 */
import { jsPDF } from 'jspdf';
import type { MemoryStore } from './reportParser';
import { buildFullExportData } from './exportDataBuilder';
import type { OverrideState } from '@/services/overrideEngine';
import { getCurrencySymbol } from './currencyDetector';
import { runSanityChecks } from './sanityChecks';

const MARGIN = 14;
const PAGE_HEIGHT = 297;
const PAGE_WIDTH = 210;

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

function heading(doc: jsPDF, y: number, text: string, margin: number, pageBreak = false): number {
  if (pageBreak || y > PAGE_HEIGHT - 36) {
    doc.addPage();
    y = margin + 10;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(text, margin, y);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y + 2, PAGE_WIDTH - margin, y + 2);
  return y + 14;
}

export function exportAuditPdf(store: MemoryStore, overrides?: OverrideState): void {
  const data = buildFullExportData(store, overrides);
  const agg = store.aggregatedMetrics;
  const sanity = runSanityChecks(store);
  const sym = getCurrencySymbol(store.currency) || '$';
  const doc = new jsPDF();
  let y = MARGIN + 10;

  // Page 1 — Executive Summary
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Amazon Advertising Performance Audit', MARGIN, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${data.generatedAt}.`, MARGIN, 28);
  y = heading(doc, 34, 'Executive Summary', MARGIN);
  doc.setFontSize(10);
  const verdict =
    agg != null
      ? `Ad spend ${sym}${agg.adSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })} generated ${sym}${agg.adSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} in ad sales. ROAS ${agg.roas?.toFixed(2) ?? '—'}×; ACOS ${agg.acos != null ? (agg.acos * 100).toFixed(1) : '—'}%.`
      : 'Key metrics and diagnostics follow.';
  doc.text(verdict, MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
  y += 14;
  doc.text('1. Review high-ACOS campaigns and reduce waste.', MARGIN, y);
  y += 6;
  doc.text('2. Scale high-ROAS keywords and campaigns.', MARGIN, y);
  y += 6;
  doc.text('3. Add negatives for zero-sales search terms.', MARGIN, y);
  y += 16;
  doc.setFontSize(9);
  doc.text('Prepared by Pousali Dasgupta | pousali.adsgupta.com', MARGIN, y);

  // Page 2 — Financial Performance Grid
  y = heading(doc, PAGE_HEIGHT - 10, 'Financial Performance', MARGIN, true);
  if (data.kpis.length > 0) {
    const kpiRows = data.kpis.map((k) => [k.label, k.value]);
    y = drawTable(doc, y, ['Metric', 'Value'], kpiRows.slice(0, 8), [100, 70], PAGE_WIDTH, MARGIN);
  }
  if (agg && agg.totalStoreSales > 0 && y < PAGE_HEIGHT - 30) {
    const adPct = (agg.adSales / agg.totalStoreSales) * 100;
    doc.setFontSize(10);
    doc.text(
      `${sym}${agg.adSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} of your ${sym}${agg.totalStoreSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} revenue came from advertising (${adPct.toFixed(0)}%).`,
      MARGIN,
      y + 4,
      { maxWidth: PAGE_WIDTH - 2 * MARGIN }
    );
  }

  // Page 3 — Campaign Analysis
  y = heading(doc, PAGE_HEIGHT - 10, 'Campaign Analysis', MARGIN, true);
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.campaignName).sort((a, b) => b.spend - a.spend).slice(0, 15);
  if (campaigns.length > 0) {
    const campRows = campaigns.map((c) => [
      String(c.campaignName).slice(0, 22),
      c.spend.toFixed(2),
      c.sales.toFixed(2),
      c.acos.toFixed(1),
      c.spend > 0 ? (c.sales / c.spend).toFixed(2) : '—',
    ]);
    y = drawTable(doc, y, ['Campaign', 'Spend', 'Sales', 'ACOS%', 'ROAS'], campRows, [45, 28, 28, 28, 28], PAGE_WIDTH, MARGIN);
  }

  // Page 4 — Waste Report
  y = heading(doc, PAGE_HEIGHT - 10, 'Waste Report', MARGIN, true);
  const waste = sanity.wastedKeywords.slice(0, 10);
  const totalWaste = waste.reduce((s, k) => s + k.spend, 0);
  if (totalWaste > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total zero-sales spend: ${sym}${totalWaste.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, MARGIN, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  }
  if (waste.length > 0) {
    const wasteRows = waste.map((k) => [String(k.searchTerm).slice(0, 30), k.spend.toFixed(2), String(k.clicks), '0']);
    y = drawTable(doc, y, ['Search Term', 'Spend', 'Clicks', 'Sales'], wasteRows, [70, 35, 30, 30], PAGE_WIDTH, MARGIN);
  }

  // Page 5 — ASIN Intelligence
  y = heading(doc, PAGE_HEIGHT - 10, 'ASIN Intelligence', MARGIN, true);
  const asins = Object.values(store.asinMetrics).sort((a, b) => b.totalSales - a.totalSales).slice(0, 15);
  if (asins.length > 0) {
    const asinRows = asins.map((a) => [
      a.asin,
      a.totalSales.toFixed(2),
      a.adSales.toFixed(2),
      a.adSpend > 0 && a.adSales > 0 ? ((a.adSpend / a.adSales) * 100).toFixed(1) : '—',
    ]);
    y = drawTable(doc, y, ['ASIN', 'Store Sales', 'Ad Sales', 'ACOS%'], asinRows, [35, 40, 40, 35], PAGE_WIDTH, MARGIN);
  }

  // Page 6 — Opportunities
  y = heading(doc, PAGE_HEIGHT - 10, 'Opportunities', MARGIN, true);
  const opps = data.opportunities.slice(0, 5);
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

  // Page 7 — Methodology
  y = heading(doc, PAGE_HEIGHT - 10, 'Methodology', MARGIN, true);
  doc.setFontSize(10);
  doc.text(`Report types: ${store.files.map((f) => `${f.name} (${f.rows} rows)`).join('; ') || 'None.'}`, MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
  y += 10;
  doc.text('Metrics: ACOS = Ad Spend / Ad Sales; ROAS = Ad Sales / Ad Spend; TACOS = Ad Spend / Total Store Sales. All from aggregated report data.', MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
  y += 12;
  const invOk = (store.invariantResults ?? []).filter((r) => !r.passed).length === 0;
  doc.text(`Data integrity: ${invOk ? 'All checks passed.' : 'Some invariant checks failed — review metrics.'}`, MARGIN, y);

  // Page 8 — Full Data Tables (appendix)
  y = heading(doc, PAGE_HEIGHT - 10, 'Appendix — Full Data Tables', MARGIN, true);
  let lastSection = '';
  for (const tbl of data.tables.slice(0, 3)) {
    if (tbl.section !== lastSection) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(tbl.section, MARGIN, y);
      y += 6;
      lastSection = tbl.section;
    }
    const headers = tbl.columns.map((c) => c.label);
    const rows = tbl.rows.slice(0, 20).map((r) =>
      tbl.columns.map((col) => {
        const v = r[col.key];
        return typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : String(v).slice(0, 20);
      })
    );
    const colWidth = (PAGE_WIDTH - 2 * MARGIN) / headers.length;
    y = drawTable(doc, y, headers, rows, headers.map(() => colWidth), PAGE_WIDTH, MARGIN);
  }

  doc.save('Amazon-Advertising-Performance-Audit.pdf');
}
