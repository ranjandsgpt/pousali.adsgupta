'use client';

/**
 * Phase 2: Universal report compiler (read-only helper).
 *
 * IMPORTANT: This file does NOT change the ingestion or aggregation logic.
 * It builds a unified, analytics-friendly view on top of the existing
 * MemoryStore structure so downstream modules can consume a single schema.
 */

import type { MemoryStore } from './reportParser';

export interface NormalizedRecord {
  campaignName: string;
  keyword: string;
  searchTerm: string;
  asin?: string;
  sku?: string;
  spend: number;
  sales: number;
  orders?: number;
  clicks: number;
  impressions?: number;
  sessions?: number;
  buyBoxPct?: number;
}

/**
 * Build a unified dataset from the current MemoryStore.
 *
 * - Uses keywordMetrics as the primary grain (campaign + search term + match type + ASIN)
 * - Enriches with ASIN-level and campaign-level context when available
 * - Leaves fields undefined when the underlying engine does not track them at that granularity
 */
export function buildUnifiedDataset(store: MemoryStore): NormalizedRecord[] {
  const asinIndex = store.asinMetrics;
  const campaignIndex = store.campaignMetrics;

  const rows: NormalizedRecord[] = [];

  for (const kw of Object.values(store.keywordMetrics)) {
    const campaignName = kw.campaign || '_unknown_';
    const asin = kw.asin;

    const asinMetrics = asin ? asinIndex[asin] : undefined;
    const campaignMetrics = campaignIndex[campaignName];

    rows.push({
      campaignName,
      keyword: kw.searchTerm,
      searchTerm: kw.searchTerm,
      asin,
      // SKU is not preserved at this aggregation level – leave undefined.
      sku: undefined,
      spend: kw.spend,
      sales: kw.sales,
      // Orders and impressions are not tracked per keyword in the current engine.
      // We intentionally leave them undefined rather than fabricating values.
      orders: undefined,
      clicks: kw.clicks,
      impressions: undefined,
      sessions: asinMetrics?.sessions,
      buyBoxPct: asinMetrics?.buyBoxPercent ?? (store.buyBoxPercent || undefined),
    });
  }

  return rows;
}

