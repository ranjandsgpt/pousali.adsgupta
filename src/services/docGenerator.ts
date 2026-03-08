/**
 * Auto Documentation Engine — Generates help center docs from the codebase.
 * Scans: src/agents, src/services, src/lib, src/app/api, export-engine.
 * Output: docs/generated/*.md
 * Run via: npm run generate-docs or scripts/updateDocs.ts
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import path from 'path';
import { SIDEBAR_SECTIONS } from '../app/amazon_audit_faq/helpCenterSections';

const ROOT = typeof process !== 'undefined' && process.cwd ? process.cwd() : path.resolve('.');
const SRC = path.join(ROOT, 'src');
const DOCS_GEN = path.join(ROOT, 'docs', 'generated');

export { SIDEBAR_SECTIONS };

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

function extractBlockComment(content: string, start: number): string | null {
  const match = content.slice(start).match(/\/\*\*?([\s\S]*?)\*\//);
  return match ? match[1].trim().replace(/\s*\*\s?/g, '\n').trim() : null;
}

function extractExportFunctions(content: string): Array<{ name: string; comment: string | null }> {
  const funcs: Array<{ name: string; comment: string | null }> = [];
  const re = /export\s+function\s+(\w+)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const comment = extractBlockComment(content, Math.max(0, content.lastIndexOf('/**', m.index)));
    funcs.push({ name: m[1], comment });
  }
  const classRe = /export\s+(?:class|interface|type)\s+(\w+)/g;
  while ((m = classRe.exec(content)) !== null) {
    const comment = extractBlockComment(content, Math.max(0, content.lastIndexOf('/**', m.index)));
    funcs.push({ name: m[1], comment });
  }
  return funcs;
}

async function listTsFiles(dir: string, base = dir): Promise<string[]> {
  const out: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        out.push(...(await listTsFiles(full, base)));
      } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
        out.push(path.relative(base, full));
      }
    }
  } catch {
    //
  }
  return out;
}

async function generateAgentsDoc(): Promise<string> {
  const agentsDir = path.join(SRC, 'agents');
  const auditAgentsDir = path.join(SRC, 'app', 'audit', 'agents');
  const md: string[] = ['# Agents & Intelligence\n', 'Auto-generated from `src/agents` and `src/app/audit/agents`.\n'];
  const files: string[] = [];
  try {
    files.push(...(await listTsFiles(agentsDir, SRC)), ...(await listTsFiles(auditAgentsDir, SRC)));
  } catch {
    //
  }
  const seen = new Set<string>();
  for (const rel of files) {
    const name = path.basename(rel, path.extname(rel));
    if (seen.has(name)) continue;
    seen.add(name);
    const full = path.join(SRC, rel);
    try {
      const content = await readFile(full, 'utf-8');
      const block = content.match(/\/\*\*([\s\S]*?)\*\//)?.[1]?.trim() ?? '';
      const firstLine = block.split('\n')[0]?.replace(/\s*\*\s?/g, '').trim() ?? '';
      const funcs = extractExportFunctions(content);
      md.push(`## ${name}\n`);
      md.push(`${firstLine || 'No description.'}\n`);
      if (funcs.length) {
        md.push('### Exports\n');
        for (const f of funcs.slice(0, 15)) {
          md.push(`- **${f.name}**${f.comment ? ` — ${f.comment.split('\n')[0]}` : ''}\n`);
        }
      }
      md.push('\n');
    } catch {
      md.push(`## ${name}\n*(Could not read file)*\n\n`);
    }
  }
  return md.join('');
}

async function generateFormulasDoc(): Promise<string> {
  const md: string[] = [
    '# Metrics & Formulas\n',
    'Auto-generated from `amazonMetricsLibrary` and `formulaRegistry`.\n',
    '## ROAS (Return On Ad Spend)\n',
    '**Formula:** ROAS = Ad Sales / Ad Spend\n',
    '**Interpretation:** ROAS > 3 indicates efficient ad spend. ROAS < 1 indicates loss-making campaigns.\n',
    '## ACOS (Advertising Cost of Sales)\n',
    '**Formula:** ACOS = (Ad Spend / Ad Sales) × 100\n',
    '**Interpretation:** Lower ACOS is better. Target typically 15–30% for profitability.\n',
    '## TACOS (Total Advertising Cost of Sales)\n',
    '**Formula:** TACOS = (Ad Spend / Total Store Sales) × 100\n',
    '## CPC (Cost Per Click)\n',
    '**Formula:** CPC = Ad Spend / Clicks\n',
    '## CTR (Click-Through Rate)\n',
    '**Formula:** CTR = (Clicks / Impressions) × 100\n',
    '## CVR (Conversion Rate)\n',
    '**Formula:** CVR = (Orders / Clicks) × 100\n',
    '## Organic Sales\n',
    '**Formula:** Organic Sales = Total Store Sales − Ad Sales\n',
    '## Wasted Spend\n',
    '**Formula:** Wasted Spend = sum of spend where attributed sales = 0\n',
    '## Contribution Margin\n',
    '**Formula:** Contribution Margin % = (Ad Sales − Ad Spend) / Ad Sales × 100\n',
  ];
  return md.join('');
}

async function generateArchitectureDoc(): Promise<string> {
  return `# Platform Architecture

Auto-generated architecture overview.

## High-Level Flow

\`\`\`mermaid
graph TD
  User --> UploadReports
  UploadReports --> DataNormalization
  DataNormalization --> AuditStore
  AuditStore --> Agents
  Agents --> Insights
  Insights --> Charts
  Charts --> Copilot
  Copilot --> ExportPipeline
  ExportPipeline --> PDF
  ExportPipeline --> PPTX
\`\`\`

## Layers

1. **Upload & normalization** — Reports parsed and stored in Audit Store.
2. **Agents** — SLM and Gemini agents produce metrics, insights, waste/scaling signals.
3. **Charts** — Rendered from PremiumState (Python or Node fallback).
4. **Copilot** — Query Intelligence routes to SLM or Gemini; responses validated.
5. **Export** — Zenith Export Orchestrator builds PremiumState → CXO Judge → PPTX/PDF.
`;
}

async function generateCopilotDoc(): Promise<string> {
  return `# AI Copilot

## Flow

\`\`\`mermaid
graph TD
  UserQuestion --> QueryIntelligenceAgent
  QueryIntelligenceAgent --> IntentDetection
  IntentDetection --> MetricRouter
  MetricRouter --> SLM
  MetricRouter --> Gemini
  SLM --> VerifiedAnswer
  Gemini --> VerifiedAnswer
  VerifiedAnswer --> Response
\`\`\`

## SLM vs Gemini

- **SLM (Small Language Model / deterministic):** Metric queries (spend, sales, ROAS, ACOS, etc.) answered from \`storeSummary\` without calling Gemini.
- **Gemini:** Explanations, diagnostics, strategy, and complex questions use the LLM with audit context.

## Context Builder

Audit context includes: metrics, tables, charts, insights, storeSummary, patterns, opportunities, agentSignals, verifiedInsights, chartSignals, conversationMemory.

## Conversation Memory

Turns are appended for follow-up context in the prompt.
`;
}

async function generateQuerySystemDoc(): Promise<string> {
  return `# Query Intelligence System

## Pipeline

\`\`\`mermaid
graph TD
  UserQuestion --> QueryIntelligenceAgent
  QueryIntelligenceAgent --> IntentDetection
  QueryIntelligenceAgent --> CapabilityDetection
  CapabilityDetection --> MetricDiscovery
  MetricDiscovery --> AgentRouter
  AgentRouter --> SLM
  AgentRouter --> Gemini
  AgentRouter --> MetricsLibrary
  AgentRouter --> Tables
  SLM --> ResponseValidator
  Gemini --> ResponseValidator
  ResponseValidator --> CopilotUI
  CopilotUI --> CentralFeedbackAgent
\`\`\`

## Intent Types

metric | formula | dataset | diagnostic | strategy | explanation | forecast | out_of_scope

## Capability

available | derivable | unknown | out_of_scope

## Agent Router

- **metric** → SLM calculation engine
- **formula** → metrics library (amazonMetricsLibrary)
- **dataset** → PremiumState tables
- **diagnostic / strategy** → Gemini
`;
}

async function generateBrandIntelligenceDoc(): Promise<string> {
  return `# Brand Intelligence

## Purpose

Classifies search terms into **branded**, **competitor**, or **generic** based on brand and competitor lists.

## Inputs

- \`searchTerms[]\` — term, sales, spend
- \`brandNames[]\` — brand tokens
- \`competitorBrands[]\` — competitor tokens

## Output

- \`brandedSales\`, \`genericSales\`, \`competitorSales\`
- Per-term \`BrandAnalysisItem\` with \`keywordType\`

## Logic

- Term contains a brand name → branded
- Term contains a competitor name → competitor
- Else → generic
`;
}

async function generateChartsDoc(): Promise<string> {
  return `# Charts & Visualizations

## Chart: Spend vs ROAS

**Purpose:** Identify inefficient campaigns.

**Axes:** X = Ad Spend, Y = ROAS

**Interpretation:**
- Top-left = low spend, high ROAS (scaling opportunity)
- Bottom-right = high spend, low ROAS (waste)

## Chart: Campaign Spend Distribution

**Purpose:** See spend concentration across campaigns.

## Chart: ACOS Distribution

**Purpose:** Distribution of ACOS across keywords/campaigns.

## Rendering

- **Python:** \`export_engine.py\` with PremiumState (timeout 8s).
- **Node fallback:** \`renderChartsNodeFallback\` — placeholder PNGs so export never blocks.
- Charts rendered in **parallel** for performance.
`;
}

async function generateExportSystemDoc(): Promise<string> {
  return `# Export System (Zenith)

## Flow

\`\`\`mermaid
graph TD
  PremiumState --> ChartRenderer
  ChartRenderer --> Python
  ChartRenderer --> NodeFallback
  Python --> CXOJudge
  NodeFallback --> CXOJudge
  CXOJudge --> PDF
  CXOJudge --> PPTX
  PDF --> Cache
  PPTX --> Cache
\`\`\`

## PremiumState

Unified state: verifiedMetrics, verifiedInsights, charts, tables, campaignAnalysis, keywordAnalysis, wasteAnalysis, profitability, structuredInsights, brandAnalysis.

## CXO Judge

- **PASSED** / **PASSED_WITH_WARNINGS** — export proceeds (simplified layout on warnings).
- **FAILED_ACCURACY** / **FAILED_STORYLINE** — block export.
- Visual limits: max_table_rows=25, max_slide_words=180, max_points_scatter=600, max_categories_bar=40.

## Cache

- Local: \`project/export-cache\`
- Serverless (Vercel): \`/tmp/export-cache\`
`;
}

async function generateFeedbackDoc(): Promise<string> {
  return `# Feedback System

## Central Feedback Agent

Aggregates feedback (like/dislike, correct/incorrect) from Copilot, metrics, insights. Detects repeated corrections and builds prompt context for engines.

## Query Interaction Store

Each Copilot response is stored with \`responseId\`, \`question\`, \`intent\`, \`capability\`, \`answer\`. When user sends feedback with \`responseId\`, the full interaction is linked.

## Human Feedback Agent

Analyzes incorrect feedback and produces a prompt snippet for SLM/Gemini to re-verify metrics.
`;
}

async function generateFaqDoc(): Promise<string> {
  return `# FAQ

## How is ROAS calculated?

ROAS = Ad Sales / Ad Spend. See [Metrics & Formulas](/amazon_audit_faq/formulas).

## Why is ACOS high?

ACOS = (Ad Spend / Ad Sales) × 100. High ACOS can mean low conversion or high CPC. Use the Copilot to ask "Why is ACOS high?" for diagnostics.

## What does the Waste score mean?

Waste = spend on keywords/campaigns with zero attributed sales. See [Charts & Visualizations](/amazon_audit_faq/charts).

## How does the AI Copilot work?

The Query Intelligence Agent classifies your question, then routes to the SLM (for metrics) or Gemini (for explanations). See [AI Copilot](/amazon_audit_faq/copilot).

## How are charts generated?

Charts are rendered from PremiumState by the Python export engine (or Node fallback). See [Export System](/amazon_audit_faq/export-system).
`;
}

async function generateGettingStartedDoc(): Promise<string> {
  return `# Getting Started

1. **Upload** your Amazon Advertising reports (Campaign, Keyword, etc.).
2. **Run the audit** — the platform normalizes data and runs agents.
3. **View** metrics, insights, charts, and tabs.
4. **Ask** the AI Copilot questions about your data.
5. **Export** to PPTX or PDF via the Export system.
`;
}

async function generateSecurityDoc(): Promise<string> {
  return `# Security & Validation

- **Metric verification:** Numeric claims in Copilot responses are validated against storeSummary.
- **Response validation:** \`validateCopilotResponse\` checks ACOS, spend, sales, ROAS against audit data.
- **Export consistency:** \`checkExportConsistency\` ensures UI, PremiumState, and export match within tolerance.
`;
}

async function generateCodeDoc(): Promise<string> {
  return `# Code Explorer

## Modules

- **src/agents** — Query Intelligence, CXO Judge, Brand Intelligence, Structured Insights, Zenith Export, Model Sync, etc.
- **src/services** — Export pipeline, render premium assets, cache, chart source resolver.
- **src/lib** — Copilot context builder, validation, Gemini prompts.
- **src/app/api** — Copilot, zenith-export, zenith-export-pdf, audit-feedback, dual-engine.

## Key Files

| Module | Path |
|--------|------|
| Query Intelligence Agent | src/agents/queryIntelligenceAgent.ts |
| CXO Judge Agent | src/agents/cxoJudgeAgent.ts |
| Brand Intelligence | src/agents/brandIntelligenceAgent.ts |
| Export Pipeline | src/services/exportPipeline.ts |
| Render Charts | src/services/renderPremiumAssets.ts |
| Copilot API | src/app/api/copilot/route.ts |
| Formulas | src/app/audit/utils/amazonMetricsLibrary.ts |
`;
}

async function generateSemanticQueryDoc(): Promise<string> {
  return `# Semantic Query Engine

## Architecture

User Question → Query Intelligence Agent → Intent Detection → Schema Grounding Agent → Semantic Query Engine → Metrics Catalog / Dataset Resolver → SLM or Gemini → Response.

## Metrics Catalog

Defined in \`src/analytics/metricsCatalog.ts\`. Includes: ROAS, ACOS, TACOS, CTR, CPC, CVR, Ad Sales, Store Sales, Waste Spend, Profitability Score, Break-even ACOS.

## Dataset Schema Registry

Datasets: campaigns, searchTerms, keywords, asins, charts, insights, brandAnalysis. Each defines fields and metrics.

## Query Parser

Extracts: metrics, filters, aggregations, sorting, limits. Example: "Top 5 campaigns by ROAS" → dataset: campaigns, metric: ROAS, sort: desc, limit: 5.

## Supported Query Examples

- Total ad sales / Total store sales
- Top campaigns by ROAS
- Campaigns with ACOS > 70%
- Keywords with clicks but zero sales
- ASINs with highest conversion rate

## Explainability

Copilot can explain: formula used, dataset used, query interpretation.
`;
}

async function generateTroubleshootingDoc(): Promise<string> {
  return `# Troubleshooting

## Export fails with ENOENT

Ensure you are using the serverless-safe cache path. On Vercel, cache uses \`/tmp/export-cache\`. Locally, \`project/export-cache\`.

## PDF export fails

Python PDF may be unavailable. The pipeline falls back to Node (jsPDF). Check \`renderPremiumAssets\` and \`renderNodePdf\`.

## Copilot returns "cannot be answered"

The Query Intelligence Agent may have classified the question as \`unknown\` or \`out_of_scope\`. Check [Query Intelligence](/amazon_audit_faq/query-system) for supported intents.
`;
}

export async function runDocGenerator(): Promise<{ files: string[] }> {
  await ensureDir(DOCS_GEN);
  const files: string[] = [];

  const tasks: Array<{ name: string; fn: () => Promise<string> }> = [
    { name: 'getting-started.md', fn: generateGettingStartedDoc },
    { name: 'architecture.md', fn: generateArchitectureDoc },
    { name: 'agents.md', fn: generateAgentsDoc },
    { name: 'formulas.md', fn: generateFormulasDoc },
    { name: 'charts.md', fn: generateChartsDoc },
    { name: 'copilot.md', fn: generateCopilotDoc },
    { name: 'query-system.md', fn: generateQuerySystemDoc },
    { name: 'brand-intelligence.md', fn: generateBrandIntelligenceDoc },
    { name: 'export-system.md', fn: generateExportSystemDoc },
    { name: 'feedback.md', fn: generateFeedbackDoc },
    { name: 'security.md', fn: generateSecurityDoc },
    { name: 'troubleshooting.md', fn: generateTroubleshootingDoc },
    { name: 'faq.md', fn: generateFaqDoc },
    { name: 'code.md', fn: generateCodeDoc },
    { name: 'semantic-query-engine.md', fn: generateSemanticQueryDoc },
  ];

  for (const { name, fn } of tasks) {
    const content = await fn();
    const outPath = path.join(DOCS_GEN, name);
    await writeFile(outPath, content, 'utf-8');
    files.push(outPath);
  }

  // Architecture diagram (mermaid only)
  const diagramPath = path.join(DOCS_GEN, 'architecture-diagram.md');
  await writeFile(
    diagramPath,
    `# Architecture Diagram

\`\`\`mermaid
graph TD
  User --> UploadReports
  UploadReports --> DataNormalization
  DataNormalization --> AuditStore
  AuditStore --> Agents
  Agents --> Insights
  Insights --> Charts
  Charts --> Copilot
  Copilot --> ExportPipeline
  ExportPipeline --> PDF
  ExportPipeline --> PPTX
\`\`\`
`,
    'utf-8'
  );
  files.push(diagramPath);

  return { files };
}
