import { normalizeHeader } from '@/app/audit/utils/headerMapper';

export type ReportClassification =
  | 'campaign'
  | 'advertisedProduct'
  | 'targeting'
  | 'searchTerm'
  | 'business'
  | 'unknown';

export interface ReportClassificationInputFile {
  name: string;
  headers: string[];
  classifiedAs: ReportClassification;
}

export interface ReportClassificationOutput {
  issues: string[];
}

function inferFromHeaders(headers: string[]): ReportClassification {
  const norms = headers.map((h) => normalizeHeader(h));
  const has = (needle: string) => norms.includes(normalizeHeader(needle));

  if (has('Customer Search Term') || has('Search Term')) return 'searchTerm';
  if (has('Advertised SKU')) return 'advertisedProduct';
  if (has('Keyword Text')) return 'targeting';
  if (has('Campaign Name') || has('Campaign')) return 'campaign';
  if (has('Ordered Product Sales')) return 'business';
  return 'unknown';
}

export function runReportClassificationAgent(files: ReportClassificationInputFile[]): ReportClassificationOutput {
  const issues: string[] = [];

  files.forEach((file) => {
    const inferred = inferFromHeaders(file.headers);
    if (inferred !== 'unknown' && inferred !== file.classifiedAs) {
      issues.push(
        `Report classification mismatch for file "${file.name}": classified as ${file.classifiedAs}, but headers look like ${inferred} report.`
      );
    }
  });

  return { issues };
}

