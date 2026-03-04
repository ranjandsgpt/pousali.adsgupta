/**
 * Pattern Extraction Engine — runs after every audit.
 * Only anonymized aggregates. No raw keywords, client names, or product titles.
 */

import type { MemoryStore } from '../utils/reportParser';
import type {
  LearningDB,
  WastePattern,
  GrowthPattern,
  CampaignPattern,
  KeywordPattern,
  AccountBenchmarks,
} from './types';
import { loadLearningDB, saveLearningDB, createEmptyLearningDB } from './learningStore';

const WASTE_CLICKS_MIN = 10;
const GROWTH_ACOS_MAX = 15;
const GROWTH_ROAS_MIN = 4;
const MAX_PATTERNS_PER_TYPE = 200;
const BENCHMARK_SMOOTH = 0.15;

export async function extractPatternsAndUpdateLearning(store: MemoryStore): Promise<LearningDB> {
  const db = await loadLearningDB();

  const now = Date.now();

  // --- Waste patterns (keywords with 10+ clicks, no sales) ---
  const wasteKeywords = Object.values(store.keywordMetrics).filter(
    (m) => m.clicks >= WASTE_CLICKS_MIN && m.sales === 0
  );
  if (wasteKeywords.length > 0) {
    const avgSpend = wasteKeywords.reduce((s, m) => s + m.spend, 0) / wasteKeywords.length;
    const totalClicks = wasteKeywords.reduce((s, m) => s + m.clicks, 0);
    const totalImpressions = Math.max(totalClicks * 100, 1);
    const avgCTR = (totalClicks / totalImpressions) * 100;
    const existing = db.wastePatterns.find((p) => p.pattern === 'keywords_with_10_clicks_no_sales');
    const next: WastePattern = {
      pattern: 'keywords_with_10_clicks_no_sales',
      avgSpend: existing ? (existing.avgSpend + avgSpend) / 2 : avgSpend,
      avgCTR: existing ? (existing.avgCTR + avgCTR) / 2 : avgCTR,
      frequency: (existing?.frequency ?? 0) + 1,
      observedAt: now,
    };
    db.wastePatterns = [next, ...db.wastePatterns.filter((p) => p.pattern !== next.pattern)].slice(
      0,
      MAX_PATTERNS_PER_TYPE
    );
    db.wastePatternsDetected = db.wastePatterns.reduce((s, p) => s + p.frequency, 0);
  }

  // --- Growth patterns (low ACOS, high conversion / high ROAS) ---
  const growthKeywords = Object.values(store.keywordMetrics).filter(
    (m) => m.sales > 0 && m.acos > 0 && m.acos < GROWTH_ACOS_MAX && m.roas >= GROWTH_ROAS_MIN
  );
  if (growthKeywords.length > 0) {
    const avgROAS = growthKeywords.reduce((s, m) => s + m.roas, 0) / growthKeywords.length;
    const existing = db.growthPatterns.find((p) => p.pattern === 'low_ACOS_high_conversion');
    const next: GrowthPattern = {
      pattern: 'low_ACOS_high_conversion',
      avgROAS: existing ? (existing.avgROAS + avgROAS) / 2 : avgROAS,
      frequency: (existing?.frequency ?? 0) + 1,
      observedAt: now,
    };
    db.growthPatterns = [next, ...db.growthPatterns.filter((p) => p.pattern !== next.pattern)].slice(
      0,
      MAX_PATTERNS_PER_TYPE
    );
    db.growthPatternsDetected = db.growthPatterns.reduce((s, p) => s + p.frequency, 0);
  }

  // --- Campaign structure (simplified: single vs multi keyword) ---
  const campaignCount = Object.keys(store.campaignMetrics).length;
  const keywordCount = Object.keys(store.keywordMetrics).length;
  const keywordsPerCampaign = campaignCount > 0 ? keywordCount / campaignCount : 0;
  const structure = keywordsPerCampaign <= 3 ? 'single_keyword_adgroups' : 'multi_keyword_adgroups';
  const avgAcos =
    Object.values(store.campaignMetrics).reduce((s, m) => s + m.acos, 0) / Math.max(campaignCount, 1);
  const performance = avgAcos < 20 ? 'high' : avgAcos < 35 ? 'medium' : 'low';
  const existingCamp = db.campaignPatterns.find(
    (p) => p.campaignStructure === structure && p.performance === performance
  );
  const nextCamp: CampaignPattern = {
    campaignStructure: structure,
    performance,
    frequency: (existingCamp?.frequency ?? 0) + 1,
    observedAt: now,
  };
  db.campaignPatterns = [
    nextCamp,
    ...db.campaignPatterns.filter(
      (p) => !(p.campaignStructure === structure && p.performance === performance)
    ),
  ].slice(0, MAX_PATTERNS_PER_TYPE);

  // --- Account benchmarks (rolling average) ---
  const m = store.storeMetrics;
  const totalSessions = Object.values(store.asinMetrics).reduce((s, a) => s + a.sessions, 0);
  const totalOrders = store.totalOrders || 0;
  const cvr = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;
  const totalClicks = Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalImpressions = Math.max(totalClicks * 80, 1);
  const ctr = (totalClicks / totalImpressions) * 100;

  const prev = db.accountBenchmarks;
  const n = prev ? prev.sampleCount + 1 : 1;
  const smooth = BENCHMARK_SMOOTH;
  db.accountBenchmarks = {
    averageTACOS: prev ? prev.averageTACOS * (1 - smooth) + m.tacos * smooth : m.tacos,
    averageCTR: prev ? prev.averageCTR * (1 - smooth) + ctr * smooth : ctr,
    averageCVR: prev ? prev.averageCVR * (1 - smooth) + cvr * smooth : cvr,
    averageROAS: prev ? prev.averageROAS * (1 - smooth) + m.roas * smooth : m.roas,
    sampleCount: n,
    updatedAt: now,
  };

  db.accountsAnalyzed = n;
  db.patternsDiscovered =
    db.wastePatterns.length +
    db.growthPatterns.length +
    db.campaignPatterns.length +
    db.keywordPatterns.length;
  db.updatedAt = now;

  await saveLearningDB(db);
  return db;
}

export function getCrossAccountInsights(
  store: MemoryStore,
  learning: LearningDB
): Array<{ text: string; confidence: number }> {
  const insights: Array<{ text: string; confidence: number }> = [];
  const bench = learning.accountBenchmarks;
  const m = store.storeMetrics;
  if (!bench || bench.sampleCount < 2) return insights;

  const totalSessions = Object.values(store.asinMetrics).reduce((s, a) => s + a.sessions, 0);
  const totalOrders = store.totalOrders || 0;
  const cvr = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;
  const totalClicks = Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalImpressions = Math.max(totalClicks * 80, 1);
  const ctr = (totalClicks / totalImpressions) * 100;

  const samplePct = Math.min(100, (bench.sampleCount / 30) * 100);
  if (m.tacos > bench.averageTACOS * 1.1) {
    insights.push({
      text: `Your TACOS is ${m.tacos.toFixed(1)}%. Typical accounts in this dataset average ${bench.averageTACOS.toFixed(1)}%.`,
      confidence: samplePct,
    });
  }
  if (m.roas < bench.averageROAS * 0.8 && bench.averageROAS > 0) {
    insights.push({
      text: `Your ROAS is ${m.roas.toFixed(2)}×. Learned average is ${bench.averageROAS.toFixed(2)}× across ${bench.sampleCount} analyses.`,
      confidence: samplePct,
    });
  }
  const wasteCount = Object.values(store.keywordMetrics).filter(
    (k) => k.clicks >= WASTE_CLICKS_MIN && k.sales === 0
  ).length;
  if (wasteCount > 0 && learning.wastePatterns.length > 0) {
    const freq = learning.wastePatterns[0]?.frequency ?? 0;
    const conf = Math.min(95, 50 + freq * 2);
    insights.push({
      text: `In ${freq} prior analyses, keywords with 10+ clicks and no sales were consistently wasteful. You have ${wasteCount} such keywords.`,
      confidence: conf,
    });
  }
  return insights;
}
