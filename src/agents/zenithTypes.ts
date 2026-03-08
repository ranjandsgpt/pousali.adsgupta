/**
 * Zenith CXO Export — PremiumState and related types.
 * Single source of truth for UI, PDF, and PPTX exports.
 */

export interface VerifiedMetric {
  label: string;
  value: string | number;
  unit?: string;
  source: 'slm' | 'gemini';
}

export interface VerifiedInsight {
  id: string;
  title: string;
  description: string;
  recommendedAction?: string;
  verificationScore?: number;
  sourceEngine: 'slm' | 'gemini';
}

export type ChartSource = 'slm' | 'gemini' | 'python';

export interface ChartSpec {
  id: string;
  type: string;
  title: string;
  axisLabels?: { x?: string; y?: string };
  dataset: Array<Record<string, unknown>>;
  colors?: string[];
  /** Chart source priority: SLM → Gemini → Python */
  source?: ChartSource;
}

export interface ChartSourceRecord {
  chartId: string;
  chartType?: string;
  source: ChartSource;
}

export interface TableSpec {
  id: string;
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
}

export interface CampaignAnalysisItem {
  campaignName: string;
  spend: number;
  sales: number;
  acos: number;
  roas?: number;
  budget?: number;
}

export interface KeywordAnalysisItem {
  searchTerm: string;
  campaign: string;
  spend: number;
  sales: number;
  clicks: number;
  acos: number;
  roas: number;
}

export interface WasteAnalysisItem {
  searchTerm: string;
  campaign: string;
  spend: number;
  clicks: number;
  suggestedAction?: string;
}

export interface ProfitabilitySnapshot {
  breakEvenACOS: number;
  targetROAS: number;
  lossCampaignCount: number;
  contributionMargin?: number;
}

/** Brand Intelligence: per-term classification and aggregate sales by type. */
export type BrandKeywordType = 'branded' | 'competitor' | 'generic';

export interface BrandAnalysisItem {
  searchTerm: string;
  keywordType: BrandKeywordType;
  sales: number;
  spend: number;
  orders: number;
}

export interface BrandAnalysisResult {
  terms: BrandAnalysisItem[];
  brandedSales: number;
  genericSales: number;
  competitorSales: number;
}

export interface StructuredInsightSection {
  id: string;
  title: string;
  cxoNarrative?: string;
  columns: string[];
  rows: Record<string, unknown>[];
  maxRowsPerSlide?: number;
}

/** Structured intelligence (Phase 19–20). */
export interface StructuredInsights {
  accountPerformanceSummary?: StructuredInsightSection;
  campaignTypePerformance?: StructuredInsightSection;
  matchTypePerformance?: StructuredInsightSection;
  topAsins?: StructuredInsightSection;
  bottomAsins?: StructuredInsightSection;
  asinCvrDiagnostics?: StructuredInsightSection;
  searchQueryConversionGaps?: StructuredInsightSection;
  actionPlan?: { bullets: string[]; cxoNarrative?: string };
  [key: string]: StructuredInsightSection | { bullets: string[]; cxoNarrative?: string } | undefined;
}

/**
 * PremiumState — unified state for CXO exports.
 * Built by ZenithExportOrchestrator from SLM + Gemini.
 */
export interface PremiumState {
  verifiedMetrics: VerifiedMetric[];
  verifiedInsights: VerifiedInsight[];
  charts: ChartSpec[];
  tables: TableSpec[];
  campaignAnalysis: CampaignAnalysisItem[];
  keywordAnalysis: KeywordAnalysisItem[];
  wasteAnalysis: WasteAnalysisItem[];
  profitability: ProfitabilitySnapshot;
  executiveNarrative: string;
  recommendations: string[];
  structuredInsights?: StructuredInsights;
  /** Export metadata (Phase 30). */
  generatedAt: string;
  confidenceScore?: number;
  modelVerificationStatus?: string;
  currency?: string;
  /** Chosen chart source per chart (SLM → Gemini → Python). Populated before render. */
  chartSources?: ChartSourceRecord[];
  /** Brand Intelligence: branded / competitor / generic classification and aggregate sales. */
  brandAnalysis?: BrandAnalysisResult;
}
