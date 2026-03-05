/**
 * Phase 2 — Schema Intelligence Agent.
 * Detects and maps report headers against known Amazon schemas.
 * Questions every metric mapping; outputs schema confidence (target ≥ 80%).
 */

import type { MemoryStore } from '../utils/reportParser';
import { mapHeaders, type CanonicalColumn } from '../utils/headerMapper';

export const SCHEMA_CONFIDENCE_TARGET = 0.8;

export interface SchemaMappingResult {
  canonical: CanonicalColumn;
  rawHeader: string | null;
  confidence: number;
  reason: string;
}

export interface SchemaIntelligenceResult {
  /** Overall schema confidence (0–1). */
  schemaConfidence: number;
  /** Per-metric mapping and confidence. */
  mappings: SchemaMappingResult[];
  /** Whether schema confidence meets target (≥ 80%). */
  passed: boolean;
  /** Raw headers that have no mapping (for escalation to Gemini when passed is false). */
  unmappedHeaders: string[];
}

/** Gemini inference for a single header: canonical metric and confidence (0–1). */
export type GeminiSchemaInference = Record<string, { canonical: string; confidence: number }>;

const REQUIRED_FOR_CORE: CanonicalColumn[] = [
  'spend',
  'sales',
  'clicks',
  'impressions',
  'orders',
  'searchTerm',
  'campaignName',
  'matchType',
  'asin',
];

const OPTIONAL_METRICS: CanonicalColumn[] = [
  'sessions',
  'orderedProductSales',
  'pageViews',
  'buyBox',
  'unitSession',
  'units',
  'budget',
  'date',
  'sku',
  'adGroup',
  'sales7d',
  'sales14d',
];

const ALL_CANONICAL = new Set<string>([...REQUIRED_FOR_CORE, ...OPTIONAL_METRICS]);

/**
 * Compare report headers with known schemas; compute per-metric and overall confidence.
 * When geminiSchemaInferences is provided (from escalation), merge inferred mappings for unmapped headers.
 */
export function runSchemaIntelligenceAgent(
  store: MemoryStore,
  geminiSchemaInferences?: GeminiSchemaInference | null
): SchemaIntelligenceResult {
  const mappings: SchemaMappingResult[] = [];
  const allCanonical = [...REQUIRED_FOR_CORE, ...OPTIONAL_METRICS];
  const uniqueHeaders = Array.from(store.uniqueColumns) as string[];
  const headerMap = mapHeaders(uniqueHeaders);
  const unmappedHeaders: string[] = [];

  for (const canonical of allCanonical) {
    let rawHeader: string | null = headerMap[canonical] ?? null;
    let confidence: number;
    let reason: string;
    const isRequired = REQUIRED_FOR_CORE.includes(canonical);

    if (rawHeader) {
      confidence = 0.95;
      reason = `Mapped: "${rawHeader}" → ${canonical}`;
    } else {
      const fromGemini = geminiSchemaInferences
        ? (() => {
            let best: { rawHeader: string; confidence: number } | null = null;
            for (const [rawH, v] of Object.entries(geminiSchemaInferences)) {
              if (v.canonical === canonical && ALL_CANONICAL.has(v.canonical) && (best == null || v.confidence > best.confidence))
                best = { rawHeader: rawH, confidence: v.confidence };
            }
            return best;
          })()
        : null;
      if (fromGemini) {
        rawHeader = fromGemini.rawHeader;
        confidence = Math.min(1, fromGemini.confidence);
        reason = `Gemini inferred: "${rawHeader}" → ${canonical} (${(confidence * 100).toFixed(0)}%)`;
      } else {
        if (isRequired) {
          confidence = 0.3;
          reason = `Missing required mapping for ${canonical}`;
        } else {
          confidence = 0.7;
          reason = `Optional ${canonical} not detected`;
        }
      }
    }
    mappings.push({ canonical, rawHeader, confidence, reason });
  }

  for (const h of uniqueHeaders) {
    const mapped = allCanonical.some((c) => headerMap[c] === h) ||
      (geminiSchemaInferences && geminiSchemaInferences[h]);
    if (!mapped) unmappedHeaders.push(h);
  }

  const requiredScore =
    REQUIRED_FOR_CORE.length > 0
      ? REQUIRED_FOR_CORE.reduce((sum, c) => {
          const m = mappings.find((x) => x.canonical === c);
          return sum + (m?.confidence ?? 0);
        }, 0) / REQUIRED_FOR_CORE.length
      : 1;
  const optionalScore =
    OPTIONAL_METRICS.length > 0
      ? OPTIONAL_METRICS.reduce((sum, c) => {
          const m = mappings.find((x) => x.canonical === c);
          return sum + (m?.confidence ?? 0);
        }, 0) / OPTIONAL_METRICS.length
      : 1;
  const schemaConfidence = requiredScore * 0.7 + optionalScore * 0.3;
  const passed = schemaConfidence >= SCHEMA_CONFIDENCE_TARGET;

  return {
    schemaConfidence,
    mappings,
    passed,
    unmappedHeaders,
  };
}
