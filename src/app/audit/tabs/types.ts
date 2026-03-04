/** Standard structures for agency-grade audit tabs. */

export interface KPIMetric {
  label: string;
  value: string | number;
  sub?: string;
  status?: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface PatternDetection {
  problemTitle: string;
  entityType: 'campaign' | 'keyword' | 'search term' | 'ASIN' | 'account';
  entityName: string;
  metricValues: Record<string, number | string>;
  estimatedImpact?: string;
  recommendedAction: string;
}

export interface OpportunityDetection {
  title: string;
  entityName: string;
  entityType: string;
  metricValues: Record<string, number | string>;
  potentialGain?: string;
  recommendedAction: string;
}

/** Deep-dive module: summary card with count, impact, and expandable detail (reference UX). */
export interface InsightModule {
  id: string;
  title: string;
  description: string;
  count: number;
  impact?: string;
  severity?: 'critical' | 'warning' | 'info' | 'opportunity';
  /** Table key to show when "Deep Dive" is expanded */
  tableRef?: string;
  chartId?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  format?: 'currency' | 'percent' | 'number';
}

/** Action button per row: e.g. Add as Negative, Optimize, Deactivate (reference UX). */
export type RowActionType = 'negative' | 'optimize' | 'deactivate' | 'scale' | 'monitor' | 'view';

export interface TabTableConfig {
  title: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  defaultSortKey?: string;
  /** Optional action column: key in row for entity name, type for button style */
  actionColumn?: { key: string; label: string; type: RowActionType };
}

export interface TabConfig {
  kpis: KPIMetric[];
  patterns: PatternDetection[];
  opportunities: OpportunityDetection[];
  /** Tab-specific insight modules for deep-dive UX */
  insightModules: InsightModule[];
  tables: TabTableConfig[];
  chartIds: string[];
}
