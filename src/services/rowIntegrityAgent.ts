export interface RowIntegrityInput {
  parserRowCounts?: Record<string, number>;
  schemaRowCounts?: Record<string, number>;
  engineRowCounts?: Record<string, number>;
}

export interface RowIntegrityIssue {
  stage: 'schemaMapper' | 'engine';
  reportType: string;
  parserRows: number;
  stageRows: number;
}

export interface RowIntegrityOutput {
  issues: RowIntegrityIssue[];
}

export function runRowIntegrityAgent(input: RowIntegrityInput): RowIntegrityOutput {
  const issues: RowIntegrityIssue[] = [];
  const parser = input.parserRowCounts ?? {};

  const checkStage = (stageCounts: Record<string, number> | undefined, stage: RowIntegrityIssue['stage']) => {
    if (!stageCounts) return;
    Object.keys(parser).forEach((key) => {
      const p = parser[key] ?? 0;
      const s = stageCounts[key] ?? 0;
      if (p > 0 && s !== p) {
        issues.push({
          stage,
          reportType: key,
          parserRows: p,
          stageRows: s,
        });
      }
    });
  };

  checkStage(input.schemaRowCounts ?? {}, 'schemaMapper');
  checkStage(input.engineRowCounts ?? {}, 'engine');

  return { issues };
}

