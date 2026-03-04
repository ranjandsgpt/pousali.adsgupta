/**
 * Parse Amazon CSV exports into normalized structures.
 * Stub: implement with PapaParse when connecting upload pipeline.
 */
export interface ParsedReport {
  type: 'business' | 'advertising' | 'unknown';
  headers: string[];
  rows: Record<string, unknown>[];
  currency?: string;
}

export async function parseReport(_file: File): Promise<ParsedReport> {
  return {
    type: 'unknown',
    headers: [],
    rows: [],
  };
}

export async function parseReports(_files: File[]): Promise<ParsedReport[]> {
  return [];
}
