/**
 * Context Builder — Assemble audit context for the Copilot from validated artifacts and SLM data.
 * Gemini only receives this context (no raw reports).
 * Includes: agentSignals, verifiedInsights, chartSignals, conversationMemory.
 */

import type { MetricItem, TableArtifact, ChartArtifact, InsightArtifact } from '@/app/audit/dualEngine/types';
import type { PatternDetection, OpportunityDetection } from '@/app/audit/tabs/types';
import { formatMemoryForPrompt, type ConversationMemory } from './conversationMemory';

/** Agent signals (Waste, Scaling, Profit, Trend, Anomaly) — deterministic SLM/engine outputs. */
export interface AgentSignalsSnapshot {
  wasteSignals?: {
    totalWasteSpend: number;
    wastePctOfTotalAdSpend: number;
    bleedingKeywordCount: number;
    summary: string;
  };
  scalingSignals?: {
    scalingKeywordCount: number;
    scalingCampaignCount: number;
    avgRoas: number;
    summary: string;
  };
  profitSignals?: {
    breakEvenACOS: number;
    targetROAS: number;
    lossCampaignCount: number;
    summary: string;
  };
  trendSignals?: { trendSlope: number; growthRate: number; summary: string };
  anomalySignals?: { count: number; summary: string };
}

/** Verified insight with verification metadata. */
export interface VerifiedInsightSnapshot {
  insight: string;
  verificationScore: number;
  sourceEngine: 'slm' | 'gemini';
}

/** Chart-derived signals for Copilot reasoning. */
export interface ChartSignalsSnapshot {
  keywordScatter?: string;
  campaignROASDistribution?: string;
  salesBreakdown?: string;
  funnelSignals?: string;
}

/** Serializable store summary for API (no Set, no functions). */
export interface StoreSummarySnapshot {
  metrics: {
    totalAdSpend: number;
    totalAdSales: number;
    totalStoreSales: number;
    totalSessions: number;
    totalClicks: number;
    totalOrders: number;
    buyBoxPercent: number;
    roas: number;
    acos: number;
    tacos: number;
    cpc: number;
    currency: string | null;
  };
  /** Top campaigns by spend */
  campaigns: Array<{
    campaignName: string;
    spend: number;
    sales: number;
    acos: number;
    budget?: number;
  }>;
  /** Top keywords by spend */
  keywords: Array<{
    searchTerm: string;
    campaign: string;
    matchType?: string;
    spend: number;
    sales: number;
    clicks: number;
    acos: number;
    roas: number;
  }>;
}

/** Brand Intelligence aggregates for Copilot. */
export interface BrandMetricsSnapshot {
  brandedSales: number;
  genericSales: number;
  competitorSales: number;
}

/** Self-healing: active overrides applied to metric parsing (e.g. currency sanitization). */
export interface ActiveOverridesSnapshot {
  reasoning?: string;
  sanitizeCurrency?: boolean;
  preferredReport?: string;
  overrideSalesColumn?: string;
}

export interface AuditContextInput {
  metrics: MetricItem[];
  tables: TableArtifact[];
  charts: ChartArtifact[];
  insights: InsightArtifact[];
  storeSummary: StoreSummarySnapshot;
  patterns: PatternDetection[];
  opportunities: OpportunityDetection[];
  agentSignals?: AgentSignalsSnapshot;
  verifiedInsights?: VerifiedInsightSnapshot[];
  chartSignals?: ChartSignalsSnapshot;
  conversationMemory?: ConversationMemory;
  /** Brand Intelligence: branded / generic / competitor sales (from Brand Intelligence Agent). */
  brandMetrics?: BrandMetricsSnapshot;
  /** Validation warnings (e.g. from DiagnosticAgent, consistency checks). */
  validationWarnings?: string[];
  /** Self-healing: overrides currently applied so Copilot can explain them. */
  activeOverrides?: ActiveOverridesSnapshot;
}

export interface AuditContext {
  metrics: string;
  tables: string;
  insights: string;
  charts: string;
  profit: string;
  trends: string;
  agentSignals: string;
  verifiedInsights: string;
  chartSignals: string;
  conversationMemory: string;
  brandMetrics: string;
  validationAndOverrides: string;
  /** Full text for Gemini prompt */
  summary: string;
}

function formatMetrics(metrics: MetricItem[]): string {
  if (!metrics.length) return 'No metrics available.';
  return metrics.map((m) => `${m.label}: ${m.value}`).join('\n');
}

function formatTables(tables: TableArtifact[]): string {
  if (!tables.length) return 'No tables available.';
  return tables
    .map((t) => {
      const headers = t.columns.map((c) => c.label).join(' | ');
      const rows = (t.rows as Record<string, unknown>[]).slice(0, 15).map((r) => t.columns.map((c) => String(r[c.key] ?? '—')).join(' | '));
      return `[${t.title}]\n${headers}\n${rows.join('\n')}`;
    })
    .join('\n\n');
}

function formatCharts(charts: ChartArtifact[]): string {
  if (!charts.length) return 'No chart data available.';
  return charts
    .map((c) => {
      const data = Array.isArray(c.data) ? c.data.slice(0, 10).map((d: { name?: string; value?: number }) => `${d.name}: ${d.value}`).join(', ') : '';
      return `[${c.title}] ${data}`;
    })
    .join('\n');
}

function formatInsights(insights: InsightArtifact[]): string {
  if (!insights.length) return 'No insights available.';
  return insights
    .map((i) => `[${i.title}] ${i.description}${i.recommendedAction ? ` Action: ${i.recommendedAction}` : ''}`)
    .join('\n');
}

function formatStoreSummary(s: StoreSummarySnapshot): string {
  const m = s.metrics;
  const sym = m.currency === 'EUR' ? '€' : m.currency === 'GBP' ? '£' : '$';
  const lines = [
    `Total Ad Spend: ${sym}${m.totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `Total Ad Sales: ${sym}${m.totalAdSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `Total Store Sales: ${sym}${m.totalStoreSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `ROAS: ${m.roas.toFixed(2)}`,
    `ACOS: ${m.acos.toFixed(1)}%`,
    `TACOS: ${m.tacos.toFixed(1)}%`,
    `Sessions: ${m.totalSessions}`,
    `Clicks: ${m.totalClicks}`,
    `Orders: ${m.totalOrders}`,
    `CPC: ${sym}${m.cpc.toFixed(2)}`,
    `Buy Box %: ${m.buyBoxPercent}`,
  ];
  if (s.campaigns.length) {
    lines.push('\nTop campaigns (spend, sales, ACOS):');
    s.campaigns.slice(0, 20).forEach((c) => {
      lines.push(`  ${c.campaignName}: spend ${c.spend.toFixed(0)}, sales ${c.sales.toFixed(0)}, ACOS ${c.acos.toFixed(0)}%`);
    });
  }
  if (s.keywords.length) {
    lines.push('\nTop keywords (spend, sales, clicks, ACOS, ROAS):');
    s.keywords.slice(0, 25).forEach((k) => {
      lines.push(`  "${k.searchTerm}" (${k.campaign}): spend ${k.spend.toFixed(0)}, sales ${k.sales.toFixed(0)}, ACOS ${k.acos.toFixed(0)}%, ROAS ${k.roas.toFixed(2)}`);
    });
  }
  return lines.join('\n');
}

function formatPatterns(patterns: PatternDetection[]): string {
  if (!patterns.length) return 'No detected issues.';
  return patterns
    .map((p) => `[${p.problemTitle}] ${p.entityType}: ${p.entityName}. ${p.recommendedAction}${p.metricValues && Object.keys(p.metricValues).length ? ` Metrics: ${JSON.stringify(p.metricValues)}` : ''}`)
    .join('\n');
}

function formatOpportunities(opps: OpportunityDetection[]): string {
  if (!opps.length) return 'No opportunities detected.';
  return opps
    .map((o) => `[${o.title}] ${o.entityType}: ${o.entityName}. ${o.recommendedAction}${o.metricValues && Object.keys(o.metricValues).length ? ` Metrics: ${JSON.stringify(o.metricValues)}` : ''}`)
    .join('\n');
}

function formatAgentSignals(signals: AgentSignalsSnapshot | undefined): string {
  if (!signals) return 'No agent signals available.';
  const parts: string[] = [];
  if (signals.wasteSignals) {
    parts.push(`Waste (deterministic): ${signals.wasteSignals.summary}`);
  }
  if (signals.scalingSignals) {
    parts.push(`Scaling (deterministic): ${signals.scalingSignals.summary}`);
  }
  if (signals.profitSignals) {
    parts.push(`Profit (deterministic): ${signals.profitSignals.summary}`);
  }
  if (signals.trendSignals) {
    parts.push(`Trend: ${signals.trendSignals.summary}`);
  }
  if (signals.anomalySignals) {
    parts.push(`Anomalies: ${signals.anomalySignals.summary}`);
  }
  return parts.length > 0 ? parts.join('\n') : 'No agent signals available.';
}

function formatVerifiedInsights(verified: VerifiedInsightSnapshot[] | undefined): string {
  if (!verified?.length) return 'No verified insights.';
  return verified
    .map((v) => `[${v.sourceEngine}] (score ${Math.round(v.verificationScore * 100)}%) ${v.insight}`)
    .join('\n');
}

function formatChartSignals(chartSignals: ChartSignalsSnapshot | undefined): string {
  if (!chartSignals) return 'No chart signals.';
  const parts: string[] = [];
  if (chartSignals.keywordScatter) parts.push(`Keyword scatter: ${chartSignals.keywordScatter}`);
  if (chartSignals.campaignROASDistribution) parts.push(`Campaign ROAS: ${chartSignals.campaignROASDistribution}`);
  if (chartSignals.salesBreakdown) parts.push(`Sales breakdown: ${chartSignals.salesBreakdown}`);
  if (chartSignals.funnelSignals) parts.push(`Funnel: ${chartSignals.funnelSignals}`);
  return parts.length > 0 ? parts.join('\n') : 'No chart signals.';
}

function formatBrandMetrics(brand: BrandMetricsSnapshot | undefined): string {
  if (!brand) return 'No brand metrics available.';
  return `Branded sales: ${brand.brandedSales.toFixed(2)} | Generic sales: ${brand.genericSales.toFixed(2)} | Competitor sales: ${brand.competitorSales.toFixed(2)}`;
}

function formatValidationAndOverrides(
  validationWarnings: string[] | undefined,
  activeOverrides: ActiveOverridesSnapshot | undefined
): string {
  const parts: string[] = [];
  if (validationWarnings?.length) {
    parts.push('Validation warnings:', ...validationWarnings.map((w) => `- ${w}`));
  }
  if (activeOverrides?.reasoning || activeOverrides?.sanitizeCurrency || activeOverrides?.overrideSalesColumn || activeOverrides?.preferredReport) {
    parts.push(
      'Active self-healing overrides (applied to metric parsing):',
      activeOverrides.reasoning ? `Reasoning: ${activeOverrides.reasoning}` : '',
      activeOverrides.sanitizeCurrency ? 'Currency sanitization: enabled' : '',
      activeOverrides.overrideSalesColumn ? `Sales column override: ${activeOverrides.overrideSalesColumn}` : '',
      activeOverrides.preferredReport ? `Preferred report: ${activeOverrides.preferredReport}` : ''
    );
  }
  return parts.filter(Boolean).join('\n') || 'No validation warnings or overrides.';
}

/** Build structured audit context for the Copilot. */
export function buildAuditContext(input: AuditContextInput): AuditContext {
  const metrics = formatMetrics(input.metrics);
  const tables = formatTables(input.tables);
  const insights = formatInsights(input.insights);
  const charts = formatCharts(input.charts);
  const profit = formatStoreSummary(input.storeSummary);
  const trends = [
    formatPatterns(input.patterns),
    formatOpportunities(input.opportunities),
  ].filter(Boolean).join('\n\n');
  const agentSignals = formatAgentSignals(input.agentSignals);
  const verifiedInsights = formatVerifiedInsights(input.verifiedInsights);
  const chartSignals = formatChartSignals(input.chartSignals);
  const conversationMemory = input.conversationMemory ? formatMemoryForPrompt(input.conversationMemory) : '';
  const brandMetrics = formatBrandMetrics(input.brandMetrics);
  const validationAndOverrides = formatValidationAndOverrides(input.validationWarnings, input.activeOverrides);

  const summaryParts = [
    '--- Metrics ---',
    metrics,
    '--- Account summary (profit/totals) ---',
    profit,
    '--- Brand Intelligence (branded / generic / competitor sales) ---',
    brandMetrics,
    '--- Validation & self-healing ---',
    validationAndOverrides,
    '--- Agent signals (deterministic) ---',
    agentSignals,
    '--- Detected issues (patterns) ---',
    trends,
    '--- Verified insights ---',
    verifiedInsights,
    '--- Insights ---',
    insights,
    '--- Chart signals ---',
    chartSignals,
    '--- Tables (sample) ---',
    tables,
    '--- Charts (data) ---',
    charts,
  ];
  if (conversationMemory) summaryParts.push('--- Conversation context ---', conversationMemory);
  const summary = summaryParts.join('\n\n');

  return {
    metrics,
    tables,
    insights,
    charts,
    profit,
    trends,
    agentSignals,
    verifiedInsights,
    chartSignals,
    conversationMemory,
    brandMetrics,
    validationAndOverrides,
    summary,
  };
}
