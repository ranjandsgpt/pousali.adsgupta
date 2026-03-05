/**
 * PDF export – full audit: KPIs, patterns, opportunities, all tables, chart data.
 * Excludes Gemini narrative; includes everything else from the UI.
 */
import { jsPDF } from 'jspdf';
import type { MemoryStore } from './reportParser';
import { buildFullExportData } from './exportDataBuilder';

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
    if (y > doc.internal.pageSize.getHeight() - 24) {
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

function sectionHeading(doc: jsPDF, y: number, text: string, margin: number): number {
  if (y > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    y = margin + 10;
  }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(text, margin, y);
  return y + 10;
}

export function exportAuditPdf(store: MemoryStore): void {
  const data = buildFullExportData(store);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(18);
  doc.text(data.title, margin, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${data.generatedAt}. All data processed client-side.`, margin, 28);
  let y = 36;

  if (data.kpis.length > 0) {
    y = sectionHeading(doc, y, 'Key metrics', margin);
    const kpiHeaders = ['Metric', 'Value'];
    const kpiRows = data.kpis.map((k) => [k.label, k.value]);
    const kpiWidths = [80, 70];
    y = drawTable(doc, y, kpiHeaders, kpiRows, kpiWidths, pageWidth, margin);
  }

  if (data.patterns.length > 0) {
    y = sectionHeading(doc, y, 'Pattern detection (issues & risks)', margin);
    const patternRows = data.patterns.map((p) => [
      p.problemTitle,
      String(p.entityName).slice(0, 25),
      String(p.recommendedAction).slice(0, 35),
      (p.metricValues || '').slice(0, 20),
    ]);
    y = drawTable(doc, y, ['Issue', 'Entity', 'Action', 'Metrics'], patternRows, [40, 35, 45, 35], pageWidth, margin);
  }

  if (data.opportunities.length > 0) {
    y = sectionHeading(doc, y, 'Opportunities', margin);
    const oppRows = data.opportunities.map((o) => [
      o.title,
      String(o.entityName).slice(0, 28),
      String(o.recommendedAction).slice(0, 30),
      (o.metricValues || '').slice(0, 18),
    ]);
    y = drawTable(doc, y, ['Type', 'Entity', 'Action', 'Metrics'], oppRows, [35, 38, 42, 40], pageWidth, margin);
  }

  let lastSection = '';
  for (const tbl of data.tables) {
    if (tbl.section !== lastSection) {
      y = sectionHeading(doc, y, tbl.section, margin);
      lastSection = tbl.section;
    }
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = margin + 10;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(tbl.title, margin, y);
    y += 6;
    const headers = tbl.columns.map((c) => c.label);
    const rows = tbl.rows.map((r) => tbl.columns.map((col) => {
      const v = r[col.key];
      return typeof v === 'number' ? (col.key.toLowerCase().includes('acos') || col.key.toLowerCase().includes('roas') ? v.toFixed(2) : v.toLocaleString('en-US', { maximumFractionDigits: 2 })) : String(v);
    }));
    const colWidth = (pageWidth - 2 * margin) / headers.length;
    const colWidths = headers.map(() => colWidth);
    y = drawTable(doc, y, headers, rows, colWidths, pageWidth, margin);
  }

  for (const chart of data.chartDatasets) {
    y = sectionHeading(doc, y, `Chart: ${chart.title}`, margin);
    if (chart.labels && chart.values) {
      const rows = chart.labels.map((l, i) => [l.slice(0, 30), chart.values![i] ?? 0]);
      y = drawTable(doc, y, ['Category', 'Value'], rows, [100, 60], pageWidth, margin);
    } else if (chart.data && chart.data.length > 0) {
      const rows = chart.data.map((d) => [d.name, d.value]);
      y = drawTable(doc, y, ['Category', 'Value'], rows, [80, 80], pageWidth, margin);
    }
  }

  doc.save('Amazon-Advertising-Performance-Audit.pdf');
}
