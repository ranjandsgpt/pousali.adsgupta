/**
 * Amazon Metrics Calculation Reference Library.
 *
 * DESIGN: The CSV is NOT the canonical metrics engine.
 * Priority: 1) Existing system  2) SLM  3) Gemini  4) CSV reference (fallback).
 *
 * This module is an AI-assisted calculation REFERENCE only:
 * - formula reference
 * - validation reference (e.g. Data Consistency, Statistical, CFO agents)
 * - AI reasoning reference (Gemini context)
 *
 * It does NOT automatically compute metrics. Consult only when:
 * - a calculation is missing in the system
 * - validation requires the formula
 * - SLM/Gemini request formula verification or metric derivation
 * - insight engine requires supporting metrics
 */

export interface ReferenceMetricDefinition {
  id: number;
  name: string;
  description: string;
  formula: string;
  exampleFields: string[];
  dependencies: string[];
  category: string;
}

export interface CalculationReferenceEntry {
  metricName: string;
  formula: string;
  dependencies: string[];
  description: string;
  category: string;
}

/** Parse a single CSV line respecting double-quoted fields (formulas with commas). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let cell = '';
      while (i < line.length) {
        if (line[i] === '"') {
          i++;
          if (line[i] === '"') {
            cell += '"';
            i++;
          } else break;
        } else {
          cell += line[i];
          i++;
        }
      }
      out.push(cell.trim());
    } else {
      let cell = '';
      while (i < line.length && line[i] !== ',') {
        cell += line[i];
        i++;
      }
      out.push(cell.trim());
      if (line[i] === ',') i++;
    }
  }
  return out;
}

/** Extract metric/field names from formula for dependencies. */
export function extractDependenciesFromFormula(formula: string): string[] {
  const normalized = formula
    .replace(/\*/g, ' ')
    .replace(/\//g, ' ')
    .replace(/\+/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\(/g, ' ')
    .replace(/\)/g, ' ')
    .replace(/\d+\.?\d*/g, ' ')
    .replace(/%/g, ' ')
    .replace(/\^/g, ' ');
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

/** Infer category from metric name or formula. */
function inferCategory(name: string, formula: string): string {
  const n = name.toLowerCase();
  const f = formula.toLowerCase();
  if (n.includes('acos') || n.includes('roas') || n.includes('roi') || n.includes('spend') || n.includes('sales')) return 'efficiency';
  if (n.includes('ctr') || n.includes('cpc') || n.includes('click') || n.includes('impression')) return 'traffic';
  if (n.includes('cvr') || n.includes('conversion') || n.includes('order')) return 'conversion';
  if (n.includes('forecast') || n.includes('predict') || n.includes('trend')) return 'forecasting';
  if (n.includes('inventory') || n.includes('stock') || n.includes('reorder')) return 'inventory';
  if (n.includes('b2b') || n.includes('session') || n.includes('buy box')) return 'business';
  return 'general';
}

/** Parse CSV text (header: #, Calculation Name, Description, Formula, Example Fields). */
export function parseReferenceCsv(csvText: string): ReferenceMetricDefinition[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headerRow = parseCsvLine(lines[0]);
  const header = headerRow.map((h) => h.trim().replace(/^"|"$/g, ''));
  const idIdx = header.findIndex((h) => h === '#' || h === 'id');
  const nameIdx = header.findIndex((h) => /calculation name|name|metric/i.test(h));
  const descIdx = header.findIndex((h) => /description|desc/i.test(h));
  const formulaIdx = header.findIndex((h) => /formula/i.test(h));
  const exampleIdx = header.findIndex((h) => /example|field/i.test(h));

  const out: ReferenceMetricDefinition[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const id = idIdx >= 0 && values[idIdx] ? parseInt(values[idIdx], 10) : i;
    const name = nameIdx >= 0 ? (values[nameIdx] ?? '').trim() : '';
    const description = descIdx >= 0 ? (values[descIdx] ?? '').trim() : '';
    const formula = formulaIdx >= 0 ? (values[formulaIdx] ?? '').trim() : '';
    const exampleStr = exampleIdx >= 0 ? (values[exampleIdx] ?? '').trim() : '';
    const exampleFields = exampleStr.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    const dependencies = extractDependenciesFromFormula(formula);
    if (!name && !formula) continue;
    const category = inferCategory(name, formula);
    out.push({
      id: Number.isNaN(id) ? i : id,
      name,
      description,
      formula,
      exampleFields,
      dependencies,
      category,
    });
  }
  return out;
}

// In-memory reference store (formula reference only — no computation)
const referenceStore = new Map<string, CalculationReferenceEntry>();
const referenceById = new Map<number, ReferenceMetricDefinition>();

function registerReference(def: ReferenceMetricDefinition): void {
  const key = def.name.replace(/\s+/g, '_').toLowerCase().replace(/[()]/g, '');
  referenceStore.set(key, {
    metricName: def.name,
    formula: def.formula,
    dependencies: def.dependencies,
    description: def.description,
    category: def.category,
  });
  referenceById.set(def.id, def);
}

/** Load reference definitions from parsed CSV. Does not compute anything. */
export function loadReferenceFromCsv(csvText: string): number {
  const defs = parseReferenceCsv(csvText);
  defs.forEach(registerReference);
  return defs.length;
}

/** Load from parsed definitions (e.g. after fetching CSV). */
export function loadReferenceFromDefinitions(defs: ReferenceMetricDefinition[]): void {
  defs.forEach(registerReference);
}

/** Get reference entry by metric name (for formula / validation / AI context). */
export function getReference(metricName: string): CalculationReferenceEntry | undefined {
  const key = metricName.replace(/\s+/g, '_').toLowerCase().replace(/[()]/g, '');
  return referenceStore.get(key);
}

/** Check if metric exists in reference library. */
export function metricExistsInReference(metricName: string): boolean {
  return getReference(metricName) != null;
}

/** Get formula for validation or AI context. Does not compute. */
export function getFormulaForValidation(metricName: string): string | null {
  return getReference(metricName)?.formula ?? null;
}

/** Dependency graph: metric name → dependency names (for resolve order). */
export function getDependencyGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  Array.from(referenceStore.entries()).forEach(([, entry]) => {
    graph.set(entry.metricName, [...entry.dependencies]);
  });
  return graph;
}

/** Topological order for resolving dependencies first. */
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

/** Validation tolerance 3%. */
export const VALIDATION_TOLERANCE_PCT = 3;

export type SystemMetricSource = Record<string, number>;

/** Validate reported value against reference formula (used by Data Consistency, Statistical, CFO agents). */
export function validateWithReference(
  metricName: string,
  reportedValue: number,
  systemValues: SystemMetricSource,
  evaluateFormula: (formula: string, data: SystemMetricSource) => number | null
): { valid: boolean; expected: number; differencePct: number; validationFlag: boolean } {
  const entry = getReference(metricName);
  if (!entry) {
    return { valid: false, expected: reportedValue, differencePct: 0, validationFlag: true };
  }
  const expected = evaluateFormula(entry.formula, systemValues);
  if (expected == null) {
    return { valid: false, expected: reportedValue, differencePct: 0, validationFlag: true };
  }
  const diff =
    reportedValue === 0
      ? (expected === 0 ? 0 : 100)
      : (Math.abs(reportedValue - expected) / Math.abs(reportedValue)) * 100;
  const validationFlag = diff > VALIDATION_TOLERANCE_PCT;
  return {
    valid: !validationFlag,
    expected,
    differencePct: diff,
    validationFlag,
  };
}

/** Metric relationship map: metric → influencing metrics (for insight engine). */
export const METRIC_RELATIONSHIP_MAP: Record<string, string[]> = {
  ROAS: ['CPC', 'CVR', 'ASP', 'Clicks', 'Sales', 'Spend'],
  ACOS: ['Spend', 'Sales', 'CVR', 'CPC', 'ASP'],
  CTR: ['Clicks', 'Impressions'],
  CVR: ['Orders', 'Clicks'],
  CPC: ['Spend', 'Clicks'],
  TACOS: ['Spend', 'Total Sales', 'Ad Sales'],
};

/** Get influencing metrics for a given metric (for AI explanations). */
export function getInfluencingMetrics(metricName: string): string[] {
  const key = Object.keys(METRIC_RELATIONSHIP_MAP).find(
    (k) => k.toLowerCase() === metricName.toLowerCase()
  );
  return key ? METRIC_RELATIONSHIP_MAP[key] : [];
}

/** Get formula context for AI (Step 12). */
export function getMetricDefinitionsContext(metricNames: string[]): string {
  const lines: string[] = ['Amazon Metrics Reference'];
  for (const name of metricNames) {
    const entry = getReference(name);
    if (entry) lines.push(`${entry.metricName} = ${entry.formula}`);
  }
  return lines.join('\n');
}

/** All reference metric names (for SLM/Gemini to know what can be requested). */
export function getAvailableReferenceMetricNames(): string[] {
  return Array.from(referenceStore.values()).map((e) => e.metricName);
}

/** All definitions (for debugging or export). */
export function getAllReferenceDefinitions(): ReferenceMetricDefinition[] {
  return Array.from(referenceById.values());
}
