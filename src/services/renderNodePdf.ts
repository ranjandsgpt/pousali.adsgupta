/**
 * Server-side Node PDF fallback when Python PDF is unavailable.
 * Uses jsPDF; same structure as client exportAuditPdf but accepts PremiumState and returns Buffer.
 */

import { jsPDF } from 'jspdf';
import type { PremiumState } from '@/agents/zenithTypes';

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

/**
 * Generate PDF buffer from PremiumState (Node fallback when Python reportlab unavailable).
 */
export function renderNodePdf(premiumState: PremiumState): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(18);
  doc.text('Amazon Advertising CXO Audit', margin, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${premiumState.generatedAt}. Node fallback PDF.`, margin, 28);
  if (premiumState.dataTrustReport != null) {
    doc.setFontSize(9);
    doc.text(`Audit Confidence: ${Math.round(premiumState.dataTrustReport.trustScore * 100)}%`, margin, 33);
  }
  let y = 36;

  y = sectionHeading(doc, y, 'Executive Summary', margin);
  doc.setFontSize(10);
  doc.text((premiumState.executiveNarrative || 'No narrative available.').slice(0, 800), margin, y);
  y += 40;

  y = sectionHeading(doc, y, 'Account Health', margin, true);
  const metrics = premiumState.verifiedMetrics ?? [];
  if (metrics.length > 0) {
    const rows = metrics.slice(0, 12).map((m) => [m.label, String(m.value)]);
    y = drawTable(doc, y, ['Metric', 'Value'], rows, [80, 70], pageWidth, margin);
  }

  y = sectionHeading(doc, y, 'Campaign Performance', margin, true);
  const campaigns = premiumState.campaignAnalysis ?? [];
  if (campaigns.length > 0) {
    const rows = campaigns.slice(0, 10).map((c) => [
      (c.campaignName || '').slice(0, 25),
      c.spend.toFixed(0),
      c.sales.toFixed(0),
      `${c.acos.toFixed(0)}%`,
    ]);
    y = drawTable(doc, y, ['Campaign', 'Spend', 'Sales', 'ACOS'], rows, [60, 30, 30, 25], pageWidth, margin);
  }

  y = sectionHeading(doc, y, 'Waste & Bleed', margin, true);
  const waste = premiumState.wasteAnalysis ?? [];
  if (waste.length > 0) {
    const rows = waste.slice(0, 10).map((w) => [
      w.searchTerm.slice(0, 25),
      w.campaign.slice(0, 15),
      w.spend.toFixed(0),
      String(w.clicks),
    ]);
    y = drawTable(doc, y, ['Keyword', 'Campaign', 'Spend', 'Clicks'], rows, [55, 40, 35, 25], pageWidth, margin);
  }

  y = sectionHeading(doc, y, 'Profitability', margin, true);
  const p = premiumState.profitability;
  doc.text(
    `Break-even ACOS: ${p.breakEvenACOS}% | Target ROAS: ${p.targetROAS}× | Loss campaigns: ${p.lossCampaignCount}`,
    margin,
    y
  );
  y += 14;

  y = sectionHeading(doc, y, 'Action Plan', margin, true);
  const recs = premiumState.recommendations ?? [];
  recs.slice(0, 8).forEach((r) => {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margin + 10;
    }
    doc.text(`• ${r.slice(0, 80)}`, margin, y);
    y += 6;
  });

  const data = doc.output('arraybuffer');
  return Buffer.from(data);
}
