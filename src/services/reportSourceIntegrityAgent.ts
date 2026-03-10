export type ReportSourceKey = 'advertisedProductReport' | 'targetingReport' | 'campaignReport' | 'searchTermReport' | null;

export interface ReportSourceIntegrityInput {
  usedSource: ReportSourceKey;
  availableSources: {
    advertisedProduct: boolean;
    targeting: boolean;
    campaign: boolean;
    searchTerm: boolean;
  };
}

export interface ReportSourceIntegrityOutput {
  issues: string[];
}

export function runReportSourceIntegrityAgent(input: ReportSourceIntegrityInput): ReportSourceIntegrityOutput {
  const issues: string[] = [];

  if (input.usedSource === 'searchTermReport') {
    issues.push('Search Term Report must never be used as the canonical source for totals.');
  }

  if (input.availableSources.advertisedProduct && input.usedSource !== 'advertisedProductReport') {
    issues.push('Advertised Product Report is available and should be the primary source for totals.');
  } else if (!input.availableSources.advertisedProduct && input.availableSources.targeting && input.usedSource === 'campaignReport') {
    issues.push('Targeting Report is available and should be preferred over Campaign Report for totals.');
  }

  return { issues };
}

