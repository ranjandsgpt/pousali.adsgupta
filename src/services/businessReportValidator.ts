export interface BusinessReportValidatorInput {
  totalSales: number;
  adSales: number;
}

export interface BusinessReportValidatorOutput {
  issues: string[];
}

export function runBusinessReportValidator(input: BusinessReportValidatorInput): BusinessReportValidatorOutput {
  const issues: string[] = [];
  if (input.totalSales < input.adSales) {
    issues.push('Business report validation failed: total store sales are lower than ad-attributed sales.');
  }
  return { issues };
}

