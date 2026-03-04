/**
 * Section 9: Word export – client-side, white-label (no platform branding).
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
} from 'docx';
import type { MemoryStore } from './reportParser';
import { getCurrencySymbol } from './currencyDetector';
import { formatPercent } from './formatNumber';

function cell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text })] })],
    width: { size: 20, type: WidthType.PERCENTAGE },
  });
}

export async function exportAuditDocx(store: MemoryStore): Promise<void> {
  const symbol = getCurrencySymbol(store.currency) || '$';
  const m = store.storeMetrics;

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: 'Performance Audit', bold: true, size: 28 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated ${new Date().toLocaleDateString()}. All data processed client-side.`,
          size: 22,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Store metrics', bold: true, size: 24 })],
      spacing: { after: 120 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: [
        new TableRow({
          children: [cell('Metric'), cell('Value')],
          tableHeader: true,
        }),
        new TableRow({ children: [cell('Total Store Sales'), cell(`${symbol}${m.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)] }),
        new TableRow({ children: [cell('Total Ad Spend'), cell(`${symbol}${m.totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)] }),
        new TableRow({ children: [cell('Total Ad Sales'), cell(`${symbol}${m.totalAdSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)] }),
        new TableRow({ children: [cell('TACOS'), cell(formatPercent(m.tacos))] }),
        new TableRow({ children: [cell('ROAS'), cell(m.roas.toFixed(2) + '×')] }),
        new TableRow({ children: [cell('Organic Sales'), cell(`${symbol}${m.organicSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)] }),
      ],
    }),
  ];

  const kwList = Object.values(store.keywordMetrics).slice(0, 25);
  if (kwList.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Search Term Performance (sample)', bold: true, size: 24 })],
        spacing: { before: 300, after: 120 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
        },
        rows: [
          new TableRow({
            children: ['Search Term', 'Match', 'Campaign', 'Spend', 'Sales', 'ACOS'].map((h) => cell(h)),
            tableHeader: true,
          }),
          ...kwList.map((k) =>
            new TableRow({
              children: [
                cell(k.searchTerm.slice(0, 30)),
                cell(k.matchType),
                cell(k.campaign.slice(0, 20)),
                cell(k.spend.toFixed(2)),
                cell(k.sales.toFixed(2)),
                cell(formatPercent(k.acos)),
              ],
            })
          ),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'performance-audit.docx';
  a.click();
  URL.revokeObjectURL(url);
}
