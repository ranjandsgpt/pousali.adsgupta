/**
 * Phase 5: Profit Engine — Gross Profit, Net Profit, Contribution Margin, Break Even ACOS, Target ROAS.
 * ProfitabilityAgent: detect loss campaigns, recommend bid adjustments, margin impact.
 */

import type { MemoryStore } from '../utils/reportParser';

export interface ProfitInputs {
  cogs?: number;
  fbaFees?: number;
  referralFees?: number;
  adSpend: number;
  unitsSold: number;
  totalSales: number;
}

export interface ProfitMetrics {
  grossProfit: number;
  netProfit: number;
  contributionMargin: number;
  breakEvenACOS: number;
  targetROAS: number;
}

export interface LossCampaign {
  campaignName: string;
  spend: number;
  sales: number;
  roas: number;
  breakEvenROAS: number;
  recommendation: string;
}

export function computeProfitMetrics(input: ProfitInputs): ProfitMetrics {
  const { cogs = 0, fbaFees = 0, referralFees = 0, adSpend, totalSales } = input;
  const grossProfit = totalSales - cogs;
  const netProfit = totalSales - cogs - fbaFees - referralFees - adSpend;
  const contributionMargin = totalSales > 0 ? (grossProfit - adSpend) / totalSales : 0;
  const breakEvenACOS = grossProfit > 0 ? (adSpend / grossProfit) * 100 : 0;
  const targetROAS = adSpend > 0 && grossProfit > 0 ? grossProfit / adSpend : 0;
  return { grossProfit, netProfit, contributionMargin, breakEvenACOS, targetROAS };
}

export function runProfitabilityAgent(store: MemoryStore, profitInputs?: Partial<ProfitInputs>): { losses: LossCampaign[]; metrics: ProfitMetrics } {
  const inputs: ProfitInputs = {
    adSpend: store.totalAdSpend,
    unitsSold: store.totalUnitsOrdered,
    totalSales: store.totalStoreSales || store.storeMetrics.totalSales,
    ...profitInputs,
  };
  const metrics = computeProfitMetrics(inputs);
  const losses: LossCampaign[] = [];
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.spend > 0);
  for (const c of campaigns) {
    const roas = c.sales > 0 ? c.sales / c.spend : 0;
    if (metrics.breakEvenACOS > 0 && metrics.targetROAS > 0 && roas < metrics.targetROAS) {
      losses.push({
        campaignName: c.campaignName || '—',
        spend: c.spend,
        sales: c.sales,
        roas,
        breakEvenROAS: metrics.targetROAS,
        recommendation: 'Reduce bids or pause; ROAS below break-even.',
      });
    }
  }
  return { losses, metrics };
}
