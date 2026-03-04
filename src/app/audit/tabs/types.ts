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

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  format?: 'currency' | 'percent' | 'number';
}

export interface TabTableConfig {
  title: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  defaultSortKey?: string;
}

export interface TabConfig {
  kpis: KPIMetric[];
  patterns: PatternDetection[];
  opportunities: OpportunityDetection[];
  tables: TabTableConfig[];
  chartIds: string[];
}
