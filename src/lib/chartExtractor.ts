/**
 * Chart Extractor — read chart metadata from UI / registry for export.
 * Extracts: chart type, axis labels, dataset, colors, title.
 * Used to recreate graphs in PPTX/PDF (e.g. Spend vs ROAS, Campaign Spend Distribution).
 */

import type { ChartSpec } from '@/agents/zenithTypes';

export interface ExtractedChartMeta {
  chartType: string;
  axisLabels?: { x?: string; y?: string };
  dataset: Array<Record<string, unknown>>;
  colors?: string[];
  title: string;
  id: string;
}

/** Known audit UI chart identifiers. */
export const AUDIT_CHART_IDS = [
  'spend-vs-roas',
  'campaign-spend-distribution',
  'waste-keyword-spend',
  'ad-vs-organic-sales',
  'campaign-efficiency-acos',
  'keyword-roas-distribution',
  'funnel-impressions-clicks-orders',
  'budget-allocation-scatter',
] as const;

/**
 * Build ChartSpec from known audit chart definitions.
 * In a full implementation this would read from a chart registry or DOM.
 */
export function extractChartsFromAuditData(payload: {
  campaignSpend?: Array<{ name: string; value: number }>;
  keywordWaste?: Array<{ name: string; value: number }>;
  adVsOrganic?: Array<{ name: string; value: number }>;
  campaignRoas?: Array<{ name: string; value: number }>;
}): ChartSpec[] {
  const specs: ChartSpec[] = [];

  if (payload.campaignSpend?.length) {
    specs.push({
      id: 'campaign-spend-distribution',
      type: 'bar',
      title: 'Campaign Spend Distribution',
      axisLabels: { x: 'Campaign', y: 'Spend' },
      dataset: payload.campaignSpend.map((d) => ({ name: d.name, value: d.value })),
      colors: ['#0F172A', '#D4AF37'],
    });
  }

  if (payload.keywordWaste?.length) {
    specs.push({
      id: 'waste-keyword-spend',
      type: 'bar',
      title: 'Waste Keyword Spend',
      axisLabels: { x: 'Keyword', y: 'Spend' },
      dataset: payload.keywordWaste.map((d) => ({ name: d.name, value: d.value })),
      colors: ['#0F172A', '#D4AF37'],
    });
  }

  if (payload.adVsOrganic?.length) {
    specs.push({
      id: 'ad-vs-organic-sales',
      type: 'pie',
      title: 'Ad vs Organic Sales',
      dataset: payload.adVsOrganic.map((d) => ({ name: d.name, value: d.value })),
      colors: ['#D4AF37', '#1e3a5f'],
    });
  }

  if (payload.campaignRoas?.length) {
    specs.push({
      id: 'spend-vs-roas',
      type: 'scatter',
      title: 'Spend vs ROAS',
      axisLabels: { x: 'Spend', y: 'ROAS' },
      dataset: payload.campaignRoas.map((d) => ({ name: d.name, value: d.value })),
    });
  }

  return specs;
}

/** Convert extracted meta to ChartSpec. */
export function toChartSpec(meta: ExtractedChartMeta): ChartSpec {
  return {
    id: meta.id,
    type: meta.chartType,
    title: meta.title,
    axisLabels: meta.axisLabels,
    dataset: meta.dataset,
    colors: meta.colors,
  };
}
