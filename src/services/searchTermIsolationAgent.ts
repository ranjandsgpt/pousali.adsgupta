export interface SearchTermIsolationInput {
  usedSource: 'advertisedProductReport' | 'targetingReport' | 'campaignReport' | 'searchTermReport' | null;
}

export interface SearchTermIsolationOutput {
  issues: string[];
}

export function runSearchTermIsolationAgent(input: SearchTermIsolationInput): SearchTermIsolationOutput {
  const issues: string[] = [];
  if (input.usedSource === 'searchTermReport') {
    issues.push('Search Term report rows must not be used for global totals. Engine is using a disallowed source.');
  }
  return { issues };
}

