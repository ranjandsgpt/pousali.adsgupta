/**
 * Section 9: PDF export – client-side, white-label (no platform branding).
 */
import { jsPDF } from 'jspdf';
import type { MemoryStore } from './reportParser';
import { getCurrencySymbol } from './currencyDetector';
import { formatPercent } from './formatNumber';

function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  rows: string[][],
  colWidths: number[]
): number {
  const lineHeight = 6;
  const cellPadding = 2;
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x + cellPadding, y + lineHeight - 1);
    x += colWidths[i];
  });
  y += lineHeight + 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;

  doc.setFont('helvetica', 'normal');
  for (const row of rows) {
    if (y > doc.internal.pageSize.getHeight() - 20) {
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
  return y + 4;
}

export function exportAuditPdf(store: MemoryStore): void {
  const doc = new jsPDF();
  const symbol = getCurrencySymbol(store.currency) || '$';

  doc.setFontSize(18);
  doc.text('Performance Audit', 14, 20);

  doc.setFontSize(10);
  doc.text(`Generated ${new Date().toLocaleDateString()} – All data processed client-side.`, 14, 28);

  let y = 38;
  const m = store.storeMetrics;
  const colWidths = [55, 50];
  y = drawTable(
    doc,
    y,
    ['Metric', 'Value'],
    [
      ['Total Store Sales', `${symbol}${m.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Total Ad Spend', `${symbol}${m.totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Total Ad Sales', `${symbol}${m.totalAdSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['TACOS', formatPercent(m.tacos)],
      ['ROAS', m.roas.toFixed(2) + '×'],
      ['Organic Sales', `${symbol}${m.organicSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ],
    colWidths
  );

  const kwRows = Object.values(store.keywordMetrics)
    .slice(0, 30)
    .map((k) => [
      k.searchTerm.slice(0, 20),
      k.matchType,
      k.campaign.slice(0, 15),
      k.spend.toFixed(2),
      k.sales.toFixed(2),
      formatPercent(k.acos),
    ]);
  if (kwRows.length > 0) {
    doc.setFontSize(12);
    doc.text('Search Term Performance (sample)', 14, y + 6);
    y += 12;
    y = drawTable(
      doc,
      y,
      ['Search Term', 'Match', 'Campaign', 'Spend', 'Sales', 'ACOS'],
      kwRows,
      [32, 22, 28, 22, 22, 22]
    );
  }

  doc.save('performance-audit.pdf');
}
