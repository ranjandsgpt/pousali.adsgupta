/**
 * Word export – Crystal Bohemia audit template (Sections 1–9).
 * Step 15: When user clicks Download Word → {BrandName}_Amazon_Advertising_Audit_{Month}.docx
 */
import type { MemoryStore } from './reportParser';
import { exportCrystalBohemiaDocx } from './exportAuditTemplateDocx';
import { buildFullExportData } from './exportDataBuilder';
import type { OverrideState } from '@/services/overrideEngine';
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

function cell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(text).slice(0, 80) })] })],
    width: { size: 20, type: WidthType.PERCENTAGE },
  });
}

function tableFromColumnsAndRows(headers: string[], rows: (string | number)[][]): Table {
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
        children: headers.map((h) => cell(h)),
        tableHeader: true,
      }),
      ...rows.map((row) =>
        new TableRow({
          children: row.map((c) => cell(String(c))),
        })
      ),
    ],
  });
}

/** Export using Crystal Bohemia template (default). Optionally pass brandName for filename. */
export async function exportAuditDocx(store: MemoryStore, options?: { brandName?: string }): Promise<void> {
  await exportCrystalBohemiaDocx(store, options);
}

/** Legacy full audit export (KPIs, patterns, opportunities, all tables, chart data). */
export async function exportAuditDocxLegacy(store: MemoryStore, overrides?: OverrideState): Promise<void> {
  const data = buildFullExportData(store, overrides);
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: data.title, bold: true, size: 28 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated ${data.generatedAt}. All data processed client-side.`,
          size: 22,
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  if (data.kpis.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Key metrics', bold: true, size: 24 })],
        spacing: { before: 200, after: 120 },
      }),
      tableFromColumnsAndRows(
        ['Metric', 'Value'],
        data.kpis.map((k) => [k.label, k.value])
      )
    );
  }

  if (data.patterns.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Pattern detection (issues & risks)', bold: true, size: 24 })],
        spacing: { before: 300, after: 120 },
      }),
      tableFromColumnsAndRows(
        ['Issue', 'Entity', 'Action', 'Metrics'],
        data.patterns.map((p) => [
          p.problemTitle,
          String(p.entityName).slice(0, 40),
          String(p.recommendedAction).slice(0, 50),
          (p.metricValues || '').slice(0, 30),
        ])
      )
    );
  }

  if (data.opportunities.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Opportunities', bold: true, size: 24 })],
        spacing: { before: 300, after: 120 },
      }),
      tableFromColumnsAndRows(
        ['Type', 'Entity', 'Action', 'Metrics'],
        data.opportunities.map((o) => [
          o.title,
          String(o.entityName).slice(0, 40),
          String(o.recommendedAction).slice(0, 50),
          (o.metricValues || '').slice(0, 30),
        ])
      )
    );
  }

  let lastSection = '';
  for (const tbl of data.tables) {
    if (tbl.section !== lastSection) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: tbl.section, bold: true, size: 24 })],
          spacing: { before: 300, after: 120 },
        })
      );
      lastSection = tbl.section;
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: tbl.title, bold: true, size: 22 })],
        spacing: { after: 80 },
      }),
      tableFromColumnsAndRows(
        tbl.columns.map((c) => c.label),
        tbl.rows.map((r) =>
          tbl.columns.map((col) => {
            const v = r[col.key];
            if (typeof v === 'number') {
              const key = col.key.toLowerCase();
              if (key.includes('acos') || key.includes('roas')) return v.toFixed(2);
              return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
            }
            return String(v);
          })
        )
      )
    );
  }

  for (const chart of data.chartDatasets) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Chart: ${chart.title}`, bold: true, size: 24 })],
        spacing: { before: 300, after: 120 },
      })
    );
    if (chart.labels && chart.values) {
      const rows = chart.labels.map((l, i) => [l.slice(0, 50), chart.values![i] ?? 0]);
      children.push(tableFromColumnsAndRows(['Category', 'Value'], rows));
    } else if (chart.data && chart.data.length > 0) {
      const rows = chart.data.map((d) => [d.name, d.value]);
      children.push(tableFromColumnsAndRows(['Category', 'Value'], rows));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Amazon-Advertising-Performance-Audit-Legacy.docx';
  a.click();
  URL.revokeObjectURL(url);
}
