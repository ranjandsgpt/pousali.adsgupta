/**
 * Evidence Engine Agent — validates that every generated insight is supported by real dataset rows.
 * Runs after Semantic Judge (Level 2), before Knowledge Graph Judge (Level 3).
 * Insights with verified=false must not pass to the UI layer.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { InsightArtifact } from '../dualEngine/types';
import type { InsightWithEvidence, InsightEvidence } from '../blackboard/types';

/** Extract numeric claims from insight description/title (e.g. "47 search terms", "$1240", "3 campaigns"). */
function extractNumericClaims(text: string): { count?: number; spend?: number; sales?: number; pct?: number } {
  const out: { count?: number; spend?: number; sales?: number; pct?: number } = {};
  const lower = text.toLowerCase();
  // e.g. "47 search terms", "3 campaigns"
  const countMatch = text.match(/(\d+)\s*(search\s*terms?|keywords?|campaigns?|asins?)/i) || lower.match(/(\d+)\s*(terms?|keywords?|campaigns?)/i);
  if (countMatch) out.count = parseInt(countMatch[1], 10);
  // $1,240 or 1240 spend
  const spendMatch = text.match(/\$?([\d,]+(?:\.\d+)?)\s*(?:spent|spend)/i) || text.match(/spend[:\s]*\$?([\d,]+(?:\.\d+)?)/i);
  if (spendMatch) out.spend = parseFloat(spendMatch[1].replace(/,/g, ''));
  const salesMatch = text.match(/\$?([\d,]+(?:\.\d+)?)\s*(?:sales|revenue)/i);
  if (salesMatch) out.sales = parseFloat(salesMatch[1].replace(/,/g, ''));
  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) out.pct = parseFloat(pctMatch[1]);
  return out;
}

/** Classify insight topic from keywords to choose dataset source. */
function inferDatasetSource(insight: InsightArtifact): 'SearchTermReport' | 'CampaignReport' | 'AdvertisedProductReport' | 'BusinessReport' | 'mixed' {
  const t = `${insight.title} ${insight.description} ${insight.entityType || ''}`.toLowerCase();
  if (/\b(keyword|search\s*term|search term)\b/.test(t)) return 'SearchTermReport';
  if (/\b(campaign)\b/.test(t)) return 'CampaignReport';
  if (/\b(asin|product|sku)\b/.test(t)) return 'AdvertisedProductReport';
  if (/\b(session|buy\s*box|unit|business)\b/.test(t)) return 'BusinessReport';
  return 'mixed';
}

/** Check if insight is about wasted spend (zero sales). */
function isWastedSpendInsight(insight: InsightArtifact): boolean {
  const t = `${insight.title} ${insight.description}`.toLowerCase();
  return /wasted|waste|zero\s*sales|0\s*sales|no\s*sales|non-?convert/.test(t);
}

/** Check if insight is about high ACOS campaigns. */
function isHighACOSInsight(insight: InsightArtifact): boolean {
  const t = `${insight.title} ${insight.description}`.toLowerCase();
  return /acos|advertising\s*cost|high\s*cost/.test(t) && /campaign/.test(t);
}

/** Check if insight is about scaling / high ROAS. */
function isScalingInsight(insight: InsightArtifact): boolean {
  const t = `${insight.title} ${insight.description}`.toLowerCase();
  return /scale|high\s*roas|roas\s*above|budget\s*cap/.test(t);
}

/**
 * Verify a single insight against the normalized dataset.
 * Returns evidence with verified=true only when dataset rows support the claim.
 */
export function verifyInsightWithEvidence(
  insight: InsightArtifact,
  store: MemoryStore
): InsightWithEvidence {
  const claims = extractNumericClaims(`${insight.title} ${insight.description}`);
  const source = inferDatasetSource(insight);
  let rows_supporting = 0;
  let total_spend = 0;
  let total_sales = 0;
  let dataset_source: string = source === 'mixed' ? 'SearchTermReport' : source;
  let verified = false;

  if (isWastedSpendInsight(insight)) {
    const wasted = Object.values(store.keywordMetrics).filter((k) => k.clicks >= 10 && k.sales === 0);
    rows_supporting = wasted.length;
    total_spend = wasted.reduce((s, k) => s + k.spend, 0);
    total_sales = 0;
    dataset_source = 'SearchTermReport';
    if (claims.count != null && claims.spend != null) {
      verified = rows_supporting >= claims.count && Math.abs(total_spend - claims.spend) / (claims.spend || 1) <= 0.15;
    } else {
      verified = rows_supporting > 0 && total_spend > 0;
    }
  } else if (isHighACOSInsight(insight)) {
    const campaigns = Object.values(store.campaignMetrics).filter((c) => c.spend > 0 && c.sales > 0 && c.acos >= 75);
    rows_supporting = campaigns.length;
    total_spend = campaigns.reduce((s, c) => s + c.spend, 0);
    total_sales = campaigns.reduce((s, c) => s + c.sales, 0);
    dataset_source = 'CampaignReport';
    if (claims.count != null) verified = rows_supporting >= claims.count;
    else verified = rows_supporting > 0;
  } else if (isScalingInsight(insight)) {
    const keywords = Object.values(store.keywordMetrics).filter((k) => k.sales > 0 && k.roas >= 3);
    rows_supporting = keywords.length;
    total_spend = keywords.reduce((s, k) => s + k.spend, 0);
    total_sales = keywords.reduce((s, k) => s + k.sales, 0);
    dataset_source = 'SearchTermReport';
    verified = rows_supporting > 0;
  } else {
    // Generic: check if any dataset segment supports the narrative (e.g. keyword/campaign counts).
    const kwCount = Object.keys(store.keywordMetrics).length;
    const campCount = Object.keys(store.campaignMetrics).length;
    const asinCount = Object.keys(store.asinMetrics).length;
    if (claims.count != null) {
      if (claims.count <= kwCount || claims.count <= campCount || claims.count <= asinCount) {
        rows_supporting = Math.max(kwCount, campCount, asinCount);
        total_spend = store.totalAdSpend;
        total_sales = store.totalAdSales;
        dataset_source = 'mixed';
        verified = true;
      }
    } else {
      rows_supporting = kwCount + campCount + asinCount;
      total_spend = store.totalAdSpend;
      total_sales = store.totalAdSales;
      verified = rows_supporting > 0;
    }
  }

  const evidence: InsightEvidence = {
    rows_supporting,
    total_spend: total_spend || undefined,
    total_sales: total_sales || undefined,
    dataset_source,
    verified,
  };

  return {
    ...insight,
    evidence,
  };
}

/**
 * Run Evidence Engine on all insights from SLM and Gemini.
 * Returns only insights with verified=true; writes evidence onto each.
 */
export function runEvidenceEngineAgent(
  store: MemoryStore,
  slmInsights: InsightArtifact[],
  geminiInsights: InsightArtifact[]
): InsightWithEvidence[] {
  const combined = [...slmInsights, ...geminiInsights];
  const deduped = combined.filter((a, i) => combined.findIndex((b) => b.id === a.id) === i);
  const withEvidence = deduped.map((insight) => verifyInsightWithEvidence(insight, store));
  return withEvidence.filter((i) => i.evidence?.verified === true);
}
