/**
 * Amazon Seller Central Metrics Knowledge Base — Fallback Calculation Library.
 *
 * Priority order (never compute all 510 metrics automatically):
 * 1. Existing system logic (amazonMetricsLibrary + MemoryStore) — first priority.
 * 2. SLM + Gemini decide which metric to compute next → only then do we look up.
 * 3. CSV library → fallback knowledge base when the system doesn't already provide the metric.
 *
 * The CSV acts as a metrics dictionary + formula repository. Use it only when:
 * - A calculation is not already implemented in the system
 * - SLM or Gemini determines that a derived metric is required
 * - A validation rule requires the formula
 * - An insight engine requires supporting metrics
 *
 * CSV schema: id, name, description, formula, exampleFields → dependencies from formula.
 * To load the 510-metric CSV: loadMetricsFromCsv(csvText) at app init or when file is available.
 */

export interface MetricDefinition {
  id: number | string;
  name: string;
  description: string;
  formula: string;
  exampleFields: string[];
  dependencies: string[];
  category?: string;
}

export interface KnowledgeBaseEntry {
  metricName: string;
  formula: string;
  dependencies: string[];
  description: string;
  category: string;
}

/** Extract metric/field names from a formula string (e.g. "Clicks / Impressions * 100" → ["Clicks", "Impressions"]). */
export function extractDependenciesFromFormula(formula: string): string[] {
  const normalized = formula
    .replace(/\*/g, ' ')
    .replace(/\//g, ' ')
    .replace(/\+/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\(/g, ' ')
    .replace(/\)/g, ' ')
    .replace(/\d+\.?\d*/g, ' ')
    .replace(/%/g, ' ');
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 1 && /[A-Za-z]/.test(t));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    const key = t.trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

/** Parse a single CSV row into MetricDefinition. Columns: id, name, description, formula, exampleFields (comma-sep). */
export function parseMetricRow(row: Record<string, string>, index: number): MetricDefinition {
  const name = row.name ?? row.Name ?? row.metric ?? '';
  const formula = row.formula ?? row.Formula ?? '';
  const exampleFields = (row.exampleFields ?? row.example_fields ?? row.fields ?? '')
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const dependencies = row.dependencies
    ? row.dependencies.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    : extractDependenciesFromFormula(formula);
  return {
    id: index + 1,
    name,
    description: row.description ?? row.Description ?? '',
    formula,
    exampleFields,
    dependencies,
    category: row.category ?? row.Category ?? 'general',
  };
}

/** Parse CSV text into MetricDefinition[]. Expects header row. */
export function parseMetricsCsv(csvText: string): MetricDefinition[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const out: MetricDefinition[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    header.forEach((h, j) => { row[h] = values[j] ?? ''; });
    if (row.name || row.Name || row.formula || row.Formula) {
      out.push(parseMetricRow(row, out.length));
    }
  }
  return out;
}

/** Core metrics always available (fallback when CSV not loaded). */
const CORE_METRIC_DEFINITIONS: MetricDefinition[] = [
  { id: 'acos', name: 'ACOS', description: 'Advertising Cost of Sales', formula: 'Spend / Sales * 100', exampleFields: ['Spend', 'Sales'], dependencies: ['Spend', 'Sales'], category: 'efficiency' },
  { id: 'roas', name: 'ROAS', description: 'Return on Ad Spend', formula: 'Sales / Spend', exampleFields: ['Sales', 'Spend'], dependencies: ['Sales', 'Spend'], category: 'efficiency' },
  { id: 'tacos', name: 'TACOS', description: 'Total Advertising Cost of Sales', formula: 'Spend / Total Sales * 100', exampleFields: ['Spend', 'Total Sales'], dependencies: ['Spend', 'Total Sales'], category: 'efficiency' },
  { id: 'ctr', name: 'CTR', description: 'Click-Through Rate', formula: 'Clicks / Impressions * 100', exampleFields: ['Clicks', 'Impressions'], dependencies: ['Clicks', 'Impressions'], category: 'traffic' },
  { id: 'cpc', name: 'CPC', description: 'Cost Per Click', formula: 'Spend / Clicks', exampleFields: ['Spend', 'Clicks'], dependencies: ['Spend', 'Clicks'], category: 'traffic' },
  { id: 'cvr', name: 'CVR', description: 'Conversion Rate', formula: 'Orders / Clicks * 100', exampleFields: ['Orders', 'Clicks'], dependencies: ['Orders', 'Clicks'], category: 'conversion' },
  { id: 'buy_box_percentage', name: 'Buy Box Percentage', description: 'Percentage of page views where the product owned the Buy Box', formula: 'BuyBoxPercentage', exampleFields: ['BuyBoxPercentage'], dependencies: ['BuyBoxPercentage'], category: 'business' },
];

/** In-memory knowledge base: metric name → entry. */
const knowledgeBase = new Map<string, KnowledgeBaseEntry>();
const definitionById = new Map<string | number, MetricDefinition>();

function registerMetric(def: MetricDefinition): void {
  const key = def.name.replace(/\s+/g, '_').toLowerCase();
  knowledgeBase.set(key, {
    metricName: def.name,
    formula: def.formula,
    dependencies: def.dependencies,
    description: def.description,
    category: def.category ?? 'general',
  });
  definitionById.set(def.id, def);
}

// Seed with core metrics
CORE_METRIC_DEFINITIONS.forEach(registerMetric);

/** Load additional definitions from parsed CSV rows. */
export function loadMetricsFromDefinitions(defs: MetricDefinition[]): void {
  defs.forEach(registerMetric);
}

/** Load from CSV text (e.g. deepseek_csv_20260305_e7cc3a). */
export function loadMetricsFromCsv(csvText: string): number {
  const defs = parseMetricsCsv(csvText);
  loadMetricsFromDefinitions(defs);
  return defs.length;
}

/** Get all parsed metric definitions. */
export function getAllDefinitions(): MetricDefinition[] {
  return Array.from(definitionById.values());
}

/** Get knowledge base entry by metric name (normalized). */
export function getKnowledgeBaseEntry(metricName: string): KnowledgeBaseEntry | undefined {
  const key = metricName.replace(/\s+/g, '_').toLowerCase();
  return knowledgeBase.get(key);
}

/** Check if metric exists in knowledge base. */
export function metricExistsInKnowledgeBase(metricName: string): boolean {
  return getKnowledgeBaseEntry(metricName) != null;
}

/** Dependency graph: metric → list of dependency names. */
export function getDependencyGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  Array.from(knowledgeBase.entries()).forEach(([, entry]) => {
    graph.set(entry.metricName, [...entry.dependencies]);
  });
  return graph;
}

/** Topological order for computation (dependencies first). */
export function getComputeOrder(requestedMetrics: string[]): string[] {
  const graph = getDependencyGraph();
  const visited = new Set<string>();
  const order: string[] = [];
  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);
    const deps = graph.get(name);
    if (deps) for (const d of deps) visit(d);
    order.push(name);
  }
  for (const m of requestedMetrics) visit(m);
  return order;
}

/** Resolution: system value map (e.g. from MemoryStore / existing analytics). */
export type SystemMetricSource = Record<string, number>;

export type ResolvedMetric = { value: number; source: 'system' | 'computed' } | { available: false; reason: string };

/** Why the metric was requested — CSV is used only when one of these applies. */
export type MetricRequestSource = 'slm' | 'gemini' | 'validation' | 'insight' | 'chart';

/** Metric names that the existing system already computes (amazonMetricsLibrary + aggregates). Do not use CSV for these when system value exists. */
const SYSTEM_COMPUTED_METRIC_NAMES = new Set([
  'acos', 'roas', 'tacos', 'ctr', 'cpc', 'cvr', 'buy box percentage', 'buy_box_percentage',
  'ad sales', 'ad spend', 'total sales', 'total ad sales', 'total ad spend', 'organic sales',
  'conversion rate', 'wasted spend', 'contribution margin', 'session conversion rate',
  'ad sales percent', 'lost revenue estimate', 'impressions', 'clicks', 'orders', 'sessions',
]);

/** Simple formula evaluator for known patterns (Spend, Sales, Clicks, Impressions, Orders, Total Sales). */
function evaluateFormula(formula: string, data: SystemMetricSource): number | null {
  const f = formula.replace(/\s+/g, ' ');
  const keys = ['Spend', 'Sales', 'Clicks', 'Impressions', 'Orders', 'Total Sales', 'Ad Spend', 'Ad Sales', 'BuyBoxPercentage'];
  let expr = f;
  for (const k of keys) {
    const v = data[k] ?? data[k.replace(/\s+/g, '')];
    if (v !== undefined && typeof v === 'number') expr = expr.replace(new RegExp(k.replace(/\s/g, '\\s'), 'gi'), String(v));
  }
  try {
    const sanitized = expr.replace(/\* 100/g, '* 100').replace(/\/\s*(\d)/g, '/ $1');
    const fn = new Function(`return (${sanitized})`);
    const result = fn();
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * Resolution: existing system first, then CSV fallback only when requested by SLM/Gemini/validation/insight/chart.
 * Never iterates the full CSV — lookup by metric name only when needed.
 */
export function resolveMetric(
  metricName: string,
  systemValues: SystemMetricSource,
  requestedBy?: MetricRequestSource
): ResolvedMetric {
  const normalized = metricName.replace(/\s+/g, '_').toLowerCase();
  const normalizedSpaces = metricName.replace(/_/g, ' ').toLowerCase().trim();

  // Priority 1: Existing system — use system value if present (system always wins)
  const systemKey = Object.keys(systemValues).find((k) => k.replace(/\s+/g, '_').toLowerCase() === normalized);
  if (systemKey != null && typeof systemValues[systemKey] === 'number') {
    return { value: systemValues[systemKey], source: 'system' };
  }
  const altKey = Object.keys(systemValues).find((k) => k.replace(/\s+/g, ' ').toLowerCase() === normalizedSpaces);
  if (altKey != null && typeof systemValues[altKey] === 'number') {
    return { value: systemValues[altKey], source: 'system' };
  }

  // Priority 2 & 3: CSV fallback — only when explicitly requested (SLM, Gemini, validation, insight, chart)
  const entry = getKnowledgeBaseEntry(metricName);
  if (!entry) return { available: false, reason: 'Metric not in knowledge base (CSV fallback)' };
  const hasDeps = entry.dependencies.every((d) => {
    const dk = Object.keys(systemValues).find((k) => k.replace(/\s+/g, '') === d.replace(/\s+/g, ''));
    return dk != null || entry.dependencies.some((dep) => systemValues[dep] !== undefined);
  });
  const data: SystemMetricSource = { ...systemValues };
  if (!hasDeps) {
    const missing = entry.dependencies.filter((d) => {
      const k = Object.keys(systemValues).find((k2) => k2.replace(/\s+/g, '') === d.replace(/\s+/g, ''));
      return !k && systemValues[d] === undefined;
    });
    return { available: false, reason: `Missing dependencies: ${missing.join(', ')}` };
  }
  const computed = evaluateFormula(entry.formula, data);
  if (computed != null) return { value: computed, source: 'computed' };
  return { available: false, reason: 'Could not evaluate formula' };
}

/** True if the existing system already computes this metric (do not use CSV when system value is provided). */
export function isSystemComputedMetric(metricName: string): boolean {
  const n = metricName.replace(/\s+/g, ' ').toLowerCase().trim();
  const u = metricName.replace(/\s+/g, '_').toLowerCase();
  return SYSTEM_COMPUTED_METRIC_NAMES.has(n) || SYSTEM_COMPUTED_METRIC_NAMES.has(u);
}

/**
 * Resolve with explicit priority: system first, then CSV dictionary only when requested.
 * Use this when SLM/Gemini/validation/insight requests a specific metric — never batch-compute all CSV metrics.
 */
export function resolveMetricWithPriority(
  metricName: string,
  systemValues: SystemMetricSource,
  requestedBy: MetricRequestSource
): ResolvedMetric {
  return resolveMetric(metricName, systemValues, requestedBy);
}

/** Step 5: Validation – compare computed vs reported; flag if difference > tolerance (e.g. 3%). */
const VALIDATION_TOLERANCE_PCT = 3;

export function validateMetric(
  metricName: string,
  reportedValue: number,
  systemValues: SystemMetricSource
): { valid: boolean; expected: number; differencePct: number; validationFlag: boolean } {
  const resolved = resolveMetric(metricName, systemValues, 'validation');
  if (!('value' in resolved)) {
    return { valid: false, expected: reportedValue, differencePct: 0, validationFlag: true };
  }
  const expected = resolved.value;
  const diff = reportedValue === 0 ? (expected === 0 ? 0 : 100) : Math.abs(reportedValue - expected) / Math.abs(reportedValue) * 100;
  const validationFlag = diff > VALIDATION_TOLERANCE_PCT;
  return {
    valid: !validationFlag,
    expected,
    differencePct: diff,
    validationFlag,
  };
}

/** Get formula context string for AI (Step 12). */
export function getMetricDefinitionsContext(metricNames: string[]): string {
  const lines: string[] = [];
  for (const name of metricNames) {
    const entry = getKnowledgeBaseEntry(name);
    if (entry) lines.push(`${entry.metricName} = ${entry.formula}`);
  }
  return lines.join('\n');
}

/**
 * Lazy compute: only when SLM/Gemini/validation/insight/chart requests this metric.
 * Never compute the full 510-metric CSV — lookup by name and compute only this one when requested.
 */
export function computeMetricWhenRequested(
  metricName: string,
  systemValues: SystemMetricSource,
  requestedBy: MetricRequestSource
): ResolvedMetric {
  return resolveMetric(metricName, systemValues, requestedBy);
}

/**
 * Get formula for a metric from the CSV dictionary (for validation or AI context).
 * Does not compute the metric — use resolveMetric / computeMetricWhenRequested for values.
 */
export function getFormulaForMetric(metricName: string): string | null {
  const entry = getKnowledgeBaseEntry(metricName);
  return entry?.formula ?? null;
}

/** List metric names available in the CSV fallback (for SLM/Gemini to know what can be requested). */
export function getAvailableFallbackMetricNames(): string[] {
  return Array.from(knowledgeBase.values()).map((e) => e.metricName);
}
