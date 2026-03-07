/**
 * Schema Guard Agent — Guild 1. Prevent incorrect report mapping; validate required fields; map header aliases.
 * Writes to blackboard.schemaMap. Does not call other agents.
 */

import type { Blackboard } from '../blackboard';
import { mapHeaders, classifyReportType } from '../utils/headerMapper';

const REPORT_TYPE_LABELS: Record<string, string> = {
  business: 'Business Report',
  advertising: 'Advertising Report',
  unknown: 'Unknown',
};

/**
 * Run Schema Guard: detect report type and build header → canonical map for each file in rawReports.
 * Expects rawReports to have file names as keys; values can be { headers: string[] } or array of rows with keys.
 */
export function runSchemaGuardAgent(bb: Blackboard): void {
  const schemaMap: Blackboard['schemaMap'] = {};
  for (const [fileName, data] of Object.entries(bb.rawReports)) {
    let headers: string[] = [];
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      headers = Object.keys(data[0] as Record<string, unknown>).filter((k) => k !== '_sourceFile');
    } else if (data && typeof data === 'object' && Array.isArray((data as { headers?: string[] }).headers)) {
      headers = (data as { headers: string[] }).headers;
    }
    if (headers.length === 0) continue;
    const headerMap = mapHeaders(headers);
    const reportType = classifyReportType(headerMap);
    const required: string[] = ['spend', 'sales', 'clicks'].filter((c) => headerMap[c]);
    const headerToCanonical: Record<string, string> = {};
    for (const [canonical, raw] of Object.entries(headerMap)) {
      if (raw && typeof raw === 'string') headerToCanonical[raw] = canonical;
    }
    schemaMap[fileName] = {
      reportType: REPORT_TYPE_LABELS[reportType] || reportType,
      requiredFields: required,
      headerToCanonical,
    };
  }
  bb.schemaMap = schemaMap;
}
