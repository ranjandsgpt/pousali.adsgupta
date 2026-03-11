export interface DebugReportInput {
  rowsParsed?: Record<string, number>;
  rowsMapped?: Record<string, number>;
  rowsAggregated?: Record<string, number>;
  reportTotals?: Record<string, { spend: number; sales: number; clicks?: number; impressions?: number; orders?: number }>;
  anomalies?: string[];
}

export interface DebugReportOutput {
  rowsParsed: Record<string, number>;
  rowsMapped: Record<string, number>;
  rowsAggregated: Record<string, number>;
  reportTotals: Record<string, { spend: number; sales: number; clicks?: number; impressions?: number; orders?: number }>;
  anomalies: string[];
}

export function runDebugReportAgent(input: DebugReportInput): DebugReportOutput {
  return {
    rowsParsed: input.rowsParsed ?? {},
    rowsMapped: input.rowsMapped ?? {},
    rowsAggregated: input.rowsAggregated ?? {},
    reportTotals: input.reportTotals ?? {},
    anomalies: input.anomalies ?? [],
  };
}
