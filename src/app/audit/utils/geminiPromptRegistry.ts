/**
 * Single canonical registry for all Gemini prompts.
 * Prevents duplication and inconsistency across analysis modules.
 */

/** Prompt for Gemini to verify SLM (deterministic) outputs. */
export const VERIFY_SLM_SYSTEM = `You are an Amazon PPC data auditor. You are given:
1) A dataset summary (normalized account data).
2) SLM (deterministic) analytics outputs: metrics, tables, charts, insights.

Verify the SLM outputs for consistency and correctness:
- Metrics: do the numbers align with the dataset? (e.g. ACOS = spend/sales, ROAS = sales/spend)
- Tables: do row counts and values match the data?
- Charts: do chart data series match the tables they reference?
- Insights: are the insights supported by the data?

Return ONLY a JSON object with scores from 0 to 1 (1 = fully valid):
{"metrics_score": number, "tables_score": number, "charts_score": number, "insights_score": number}`;

/** Build verify-SLM user message (dataset + SLM artifacts). */
export function buildVerifySlmUserMessage(datasetSummary: Record<string, unknown>, slmArtifacts: unknown): string {
  return `Dataset summary:
${JSON.stringify(datasetSummary, null, 2)}

SLM artifacts:
${JSON.stringify(slmArtifacts, null, 2)}`;
}

/**
 * Prompt for Gemini structured analysis from raw report files.
 * Used when raw CSV/XLSX files are sent; Gemini performs metric extraction, column inference, validation, missing field recovery.
 */
export const STRUCTURED_FROM_RAW_SYSTEM = `You are an Amazon PPC data analyst. You are given raw Amazon advertising and business report files (CSV or similar).

Tasks:
1) Extract key metrics from the files: total ad spend, total ad sales, ACOS, ROAS, TACOS, sessions, buy_box_percentage, units_ordered, page_views, conversion_rate (CVR = orders/clicks), contribution_margin ((adSales - adSpend)/adSales), wasted_spend, lost_revenue_estimate if inferable.
2) Infer column meanings where headers vary (e.g. "Sessions - Total", "Buy Box %", "Unit Session Percentage").
3) Validate data consistency across reports.
4) For any metric missing in the normalized summary but present in the raw files, set recovered_fields with your best estimate: {sessions?, buy_box_percentage?, units_ordered?, page_views?, conversion_rate?, contribution_margin?}.
5) Build 2-4 summary tables (campaigns by spend, top keywords, waste keywords, top ASINs) as {id, title, columns: [{key, label}], rows: [...]}.
6) Build 2-3 chart specs as {id, title, type: "pie"|"bar", data: [{name, labels: [], values: []}]}.
7) List 3-8 insights as {id, title, description, severity?, recommendedAction?, entityName?, entityType?}.

Return ONLY valid JSON in this exact shape (no markdown):
{
  "metrics": [{label, value, numericValue}],
  "tables": [...],
  "charts": [...],
  "insights": [...],
  "recovered_fields": {}
}`;

/** User message when Gemini has only normalized JSON (no raw files). */
export const STRUCTURED_FROM_JSON_USER_PREFIX = `Analyze this normalized dataset and return structured JSON only.

Dataset:
`;

/** User message prefix when Gemini receives raw files. */
export const STRUCTURED_FROM_RAW_USER_PREFIX = `The attached files are Amazon PPC reports (Sponsored Products Search Term, Advertised Product, Targeting, Campaign, Business Report). Use them for metric extraction, column inference, data validation, and missing field recovery.

Optional normalized summary (for reference; prefer extracting from raw files when possible):
`;

/** System instruction for CXO narrative / presentation (generate-insights API). */
export const NARRATIVE_SYSTEM_INSTRUCTION =
  'You are an Elite Amazon PPC Data Scientist and a world-class Management Consulting Presentation Designer (similar to McKinsey, BCG, Bain).\n\n' +
  'Your job is to analyze Amazon PPC and Business reports and produce a visually stunning CXO-level insights presentation.\n\n' +
  'Your output must prioritize clarity, visual storytelling, and concise executive communication. Minimize long paragraphs and convert insights into charts, tables, and KPI cards.\n' +
  'The output must be optimized to generate a PowerPoint presentation using Python (python-pptx).';

/** User prompt prefix for narrative (normalized JSON dataset follows). */
export const NARRATIVE_USER_PREFIX =
  'I have uploaded Amazon PPC reports including:\n\n' +
  'Sponsored Products Search Term Report\n' +
  'Advertised Product Report\n' +
  'Targeting Report\n' +
  'Campaign Report\n' +
  'Business Report\n\n' +
  'The data has already been normalized into JSON (accountSummary, campaigns, searchTerms, asins, patterns, sanity).\n' +
  'Before any calculations, assume that currency symbols (€,$), percent signs (%), and commas have been removed and metrics converted to numeric form.\n\n' +
  'You must calculate at minimum:\n' +
  '- Total Store Sales\n' +
  '- Total Ad Sales\n' +
  '- Total Ad Spend\n' +
  '- ROAS\n' +
  '- ACOS\n' +
  '- TACOS\n' +
  '- Organic Sales\n' +
  '- Wasted Spend (spend on search terms with 0 sales)\n' +
  '- Top 10 ASIN Conversion Rates\n\n' +
  'Then generate a structured 10-slide executive presentation dataset with the following structure:\n\n' +
  'Slide 1 — Title Slide: "Amazon Advertising Executive Dashboard" (title only).\n' +
  'Slide 2 — Executive Macro View: KPI cards for Total Revenue, Ad Revenue Share, ROAS, Wasted Spend.\n' +
  'Slide 3 — Revenue Drivers: Top 10 ASINs by sales (horizontal bar chart dataset).\n' +
  'Slide 4 — Efficiency Breakdown: ROAS by match type (bar chart dataset).\n' +
  'Slide 5 — Wasted Spend Alert: Top 10 keywords with spend but zero sales (horizontal bar chart dataset).\n' +
  'Slide 6 — High Converting Keywords: table with keyword, spend, sales, ROAS, ACOS.\n' +
  'Slide 7 — B2B Opportunity: B2B vs B2C revenue share dataset.\n' +
  'Slide 8 — Campaign Efficiency Matrix: scatter plot dataset (x=spend, y=sales, size=ROAS).\n' +
  'Slide 9 — Conversion Risk: table of ASINs with high spend, low sales, low conversion.\n' +
  'Slide 10 — Action Plan: 3–5 bullet recommendations (plain text, no paragraphs).\n\n' +
  'Chart design requirements:\n' +
  '- Use palette: Deep Blue #1B365D, Teal #00A499, Coral #FF6B6B, Gold #FFC000.\n' +
  '- Charts must assume clean axes, bold titles, minimal grid lines, no top/right borders.\n' +
  '- When describing Python plotting, assume dpi=300 and bbox_inches="tight".\n\n' +
  'PPTX generation (for python-pptx) requirements:\n' +
  '- Font: Arial or Helvetica.\n' +
  '- Title font size: 28 pt; Body: 12 pt; Tables: <=10 pt.\n' +
  '- Tables: alternating row colors, dark blue header row, centered headers, right-aligned numeric columns; use Inches() for widths.\n\n' +
  'You must return ONLY valid JSON with this exact top-level shape (no markdown, no comments):\n' +
  '{\n' +
  '  "slides": [\n' +
  '    {\n' +
  '      "id": number,\n' +
  '      "title": string,\n' +
  '      "layout": "title" | "kpi" | "bar" | "pie" | "table" | "scatter" | "bullets",\n' +
  '      "kpis"?: [{"label": string, "value": number, "formatted": string}] ,\n' +
  '      "chart"?: {"type": "bar"|"pie"|"scatter", "labels"?: string[], "values"?: number[], "series"?: any, "x"?: number[], "y"?: number[], "size"?: number[]},\n' +
  '      "table"?: {"columns": [{"key": string, "label": string, "align"?: "left"|"right"}], "rows": Record<string, unknown>[]},\n' +
  '      "bullets"?: string[]\n' +
  '    }\n' +
  '  ],\n' +
  '  "python_script": string,\n' +
  '  "action_plan_rows": [{"keyword": string, "action": string, "reason": string}] \n' +
  '}\n\n' +
  'The python_script should be a complete python-pptx script that reads the slides structure above (assume it is already available as a Python dict) and generates Amazon_Insights.pptx and Action_Plan.csv.\n' +
  'Do not describe files in prose; just return the JSON with these fields.\n\n' +
  '---\n\n' +
  'Normalized dataset (JSON for analysis follows):\n\n';
