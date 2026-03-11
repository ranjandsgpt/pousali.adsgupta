export type ReportSourceKey = 'advertisedProductReport' | 'targetingReport' | 'campaignReport';

export interface SourceSelectionInput {
  advertisedProductRowCount: number;
  targetingRowCount: number;
  campaignRowCount: number;
  searchTermRowCount: number;
}

export interface SourceSelectionOutput {
  recommendedSource: ReportSourceKey | null;
  issues: string[];
}

export function runSourceSelectionAgent(input: SourceSelectionInput): SourceSelectionOutput {
  const issues: string[] = [];
  let recommendedSource: ReportSourceKey | null = null;

  if (input.advertisedProductRowCount > 0) recommendedSource = 'advertisedProductReport';
  else if (input.targetingRowCount > 0) recommendedSource = 'targetingReport';
  else if (input.campaignRowCount > 0) recommendedSource = 'campaignReport';

  if (input.searchTermRowCount > 0) {
    issues.push('Search Term report must not be used for totals. It is excluded from source selection.');
  }

  return { recommendedSource, issues };
}
