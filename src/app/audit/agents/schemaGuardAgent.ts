/**
 * Schema Guard Agent — Guild 1. Prevent incorrect report mapping; validate required fields; map header aliases.
 * Uses amazonSchemaGraph.json for matching. Writes to blackboard.schemaMap. Runs during ingestion (pipeline).
 * When confidence < 0.8, unmappedHeaders are exposed for Gemini infer_schema fallback.
 */

import type { Blackboard } from '../blackboard';
import { mapHeaders, classifyReportType, normalizeHeader } from '../utils/headerMapper';
import schemaGraph from '../schema/amazonSchemaGraph.json';

const REPORT_TYPE_LABELS: Record<string, string> = {
  business: 'Business Report',
  advertising: 'Advertising Report',
  unknown: 'Unknown',
};

const SCHEMA_CONFIDENCE_THRESHOLD = 0.8;

/** Build alias → canonical map from schema graph (canonical key → list of aliases). */
function buildGraphLookup(): Map<string, string> {
  const map = new Map<string, string>();
  const graph = schemaGraph as Record<string, string[]>;
  for (const [canonical, aliases] of Object.entries(graph)) {
    if (!Array.isArray(aliases)) continue;
    for (const a of aliases) {
      const norm = normalizeHeader(a);
      if (norm && !map.has(norm)) map.set(norm, canonical);
    }
    const canonNorm = normalizeHeader(canonical);
    if (canonNorm && !map.has(canonNorm)) map.set(canonNorm, canonical);
  }
  return map;
}

const graphLookup = buildGraphLookup();

/**
 * Match headers to schema graph; return confidence (0–1) and unmapped headers.
 * Field normalization for parsing still uses headerMapper (mapHeaders).
 */
function matchHeadersToGraph(rawHeaders: string[]): { confidence: number; unmappedHeaders: string[] } {
  const unmappedHeaders: string[] = [];
  for (const raw of rawHeaders) {
    const key = normalizeHeader(raw);
    const canonical = graphLookup.get(key);
    if (!canonical) unmappedHeaders.push(raw);
  }
  const matched = rawHeaders.length - unmappedHeaders.length;
  const confidence = rawHeaders.length > 0 ? matched / rawHeaders.length : 1;
  return { confidence, unmappedHeaders };
}

/**
 * Run Schema Guard during ingestion: match headers to schema graph, detect missing/unmapped,
 * set confidence and unmappedHeaders for Gemini fallback when confidence < 0.8.
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
    const { confidence, unmappedHeaders } = matchHeadersToGraph(headers);
    schemaMap[fileName] = {
      reportType: REPORT_TYPE_LABELS[reportType] || reportType,
      requiredFields: required,
      headerToCanonical,
      confidence,
      unmappedHeaders: unmappedHeaders.length > 0 ? unmappedHeaders : undefined,
    };
  }
  bb.schemaMap = schemaMap;
}

/** Return whether schema guard confidence is below threshold (use Gemini fallback). */
export function isSchemaGuardConfidenceLow(bb: Blackboard): boolean {
  for (const entry of Object.values(bb.schemaMap)) {
    if (entry.confidence != null && entry.confidence < SCHEMA_CONFIDENCE_THRESHOLD) return true;
  }
  return false;
}
