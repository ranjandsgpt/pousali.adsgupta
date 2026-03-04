/**
 * Continuous Learning Intelligence Layer — types only.
 * No raw client data. Anonymized patterns and aggregated signals only.
 */

export interface WastePattern {
  pattern: string;
  avgSpend: number;
  avgCTR: number;
  frequency: number;
  observedAt: number;
}

export interface GrowthPattern {
  pattern: string;
  avgROAS: number;
  frequency: number;
  observedAt: number;
}

export interface CampaignPattern {
  campaignStructure: string;
  performance: string;
  frequency: number;
  observedAt: number;
}

export interface KeywordPattern {
  pattern: string;
  avgACOS?: number;
  avgROAS?: number;
  frequency: number;
  observedAt: number;
}

export interface AccountBenchmarks {
  averageTACOS: number;
  averageCTR: number;
  averageCVR: number;
  averageROAS: number;
  sampleCount: number;
  updatedAt: number;
}

export interface RecommendationRecord {
  recommendation: string;
  patternKey: string;
  expectedImpact: string;
  occurrenceCount: number;
  lastSeenAt: number;
}

export interface LearningDB {
  keywordPatterns: KeywordPattern[];
  campaignPatterns: CampaignPattern[];
  wastePatterns: WastePattern[];
  growthPatterns: GrowthPattern[];
  accountBenchmarks: AccountBenchmarks | null;
  recommendationRecords: RecommendationRecord[];
  accountsAnalyzed: number;
  patternsDiscovered: number;
  wastePatternsDetected: number;
  growthPatternsDetected: number;
  updatedAt: number;
}

export const LEARNING_DB_KEY = 'audit-learning-db';
export const LEARNING_DB_VERSION = 1;
export const LEARNING_STORE_NAME = 'learningStore';
