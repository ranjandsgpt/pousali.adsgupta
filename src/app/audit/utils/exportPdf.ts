/**
 * PDF export – CFO-grade structure (Phase 7).
 * Sections: Executive Summary, Account Health, Advertising Efficiency, Campaign Performance,
 * Keyword Strategy, Waste & Bleed, ASIN Performance, Profitability, Strategic Opportunities, Action Plan.
 */
import { jsPDF } from 'jspdf';
import type { MemoryStore } from './reportParser';
import { buildFullExportData } from './exportDataBuilder';

const CFO_SECTIONS = [
  'Executive Summary',
  'Account Health Overview',
  'Advertising Efficiency',
  'Campaign Performance',
  'Keyword Strategy',
  'Waste & Bleed Analysis',
  'ASIN Performance',
  'Profitability Analysis',
  'Strategic Opportunities',
  'Action Plan',
] as const;

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

function sectionHeading(doc: jsPDF, y: number, text: string, margin: number, pageBreakBefore = false): number {
  if (pageBreakBefore || y > doc.internal.pageSize.getHeight() - 36) {
    doc.addPage();
    y = margin + 10;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(text, margin, y);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y + 2, doc.internal.pageSize.getWidth() - margin, y + 2);
  return y + 14;
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

  y = sectionHeading(doc, y, CFO_SECTIONS[0], margin);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This audit summarizes advertising performance, key risks, and recommended actions. Key metrics and diagnostics follow.', margin, y);
  y += 12;

  y = sectionHeading(doc, y, CFO_SECTIONS[1], margin, true);
  if (data.kpis.length > 0) {
    const kpiHeaders = ['Metric', 'Value'];
    const kpiRows = data.kpis.map((k) => [k.label, k.value]);
    const kpiWidths = [80, 70];
    y = drawTable(doc, y, kpiHeaders, kpiRows, kpiWidths, pageWidth, margin);
  }

  y = sectionHeading(doc, y, CFO_SECTIONS[2], margin, true);
  if (data.kpis.length > 0) {
    const effRows = data.kpis.filter((k) => ['ACOS', 'ROAS', 'TACOS'].includes(k.label)).map((k) => [k.label, k.value]);
    if (effRows.length > 0) {
      y = drawTable(doc, y, ['Metric', 'Value'], effRows, [80, 70], pageWidth, margin);
    }
  }

  if (data.patterns.length > 0) {
    y = sectionHeading(doc, y, CFO_SECTIONS[5], margin, true);
    const patternRows = data.patterns.map((p) => [
      p.problemTitle,
      String(p.entityName).slice(0, 25),
      String(p.recommendedAction).slice(0, 35),
      (p.metricValues || '').slice(0, 20),
    ]);
    y = drawTable(doc, y, ['Issue', 'Entity', 'Action', 'Metrics'], patternRows, [40, 35, 45, 35], pageWidth, margin);
  }

  if (data.opportunities.length > 0) {
    y = sectionHeading(doc, y, CFO_SECTIONS[8], margin, true);
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
      y = sectionHeading(doc, y, tbl.section, margin, lastSection !== '');
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

  y = sectionHeading(doc, y, CFO_SECTIONS[9], margin, true);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const actions = [
    'Review and act on high-ACOS campaigns and bleeding keywords.',
    'Scale winners (high ROAS, low spend) with increased budget.',
    'Add negative keywords where waste is identified.',
    'Monitor profitability and break-even ACOS.',
  ];
  actions.forEach((line) => {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margin + 10;
    }
    doc.text(`• ${line}`, margin, y);
    y += 6;
  });

  doc.save('Amazon-Advertising-Performance-Audit.pdf');
}
