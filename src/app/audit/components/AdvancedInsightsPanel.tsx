'use client';

import { useMemo, useState } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency } from '../utils/formatNumber';
import type { DetectedCurrency } from '../utils/currencyDetector';
import {
  computeAdvancedInsights,
  type AdvancedInsightsResult,
} from '../insights/advancedInsights';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  PieChart,
  Target,
  BarChart3,
  Layers,
  Zap,
  Shield,
} from 'lucide-react';

const SECTION_ICONS = {
  cannibalization: Target,
  negativeGap: AlertTriangle,
  portfolioRisk: PieChart,
  profitability: BarChart3,
  tacos: TrendingUp,
  complexity: Layers,
  traffic: Zap,
  strategy: Shield,
  leakage: AlertTriangle,
  saturation: TrendingUp,
  scale: TrendingUp,
};

export default function AdvancedInsightsPanel() {
  const { state } = useAuditStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    tacos: true,
    strategy: true,
    negativeGap: true,
  });

  const insights = useMemo(() => {
    if (!state.store.totalAdSpend && !state.store.totalStoreSales) return null;
    return computeAdvancedInsights(state.store);
  }, [state.store]);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  if (!insights) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Advanced Insights</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Upload reports to see insights derived from Search Term, Campaign, and Business data.</p>
      </section>
    );
  }

  const currency = state.store.currency;

  return (
    <section
      aria-labelledby="advanced-insights-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] overflow-hidden"
    >
      <h2 id="advanced-insights-heading" className="text-lg font-semibold text-[var(--color-text)] p-4 border-b border-white/10">
        Advanced Insights
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] px-4 pb-3">
        Derived from Search Term, Targeting, Campaign, and Business reports.
      </p>
      <div className="divide-y divide-white/10">
        <InsightSection
          id="tacos"
          title="True TACOS Decomposition"
          expanded={expanded.tacos}
          onToggle={() => toggle('tacos')}
          icon={SECTION_ICONS.tacos}
        >
          <TacosBlock data={insights.tacosDecomposition} />
        </InsightSection>
        <InsightSection
          id="strategy"
          title="Account Strategy Classification"
          expanded={expanded.strategy}
          onToggle={() => toggle('strategy')}
          icon={SECTION_ICONS.strategy}
        >
          <StrategyBlock data={insights.accountStrategy} />
        </InsightSection>
        <InsightSection
          id="negativeGap"
          title="Negative Keyword Gap"
          expanded={expanded.negativeGap}
          onToggle={() => toggle('negativeGap')}
          icon={SECTION_ICONS.negativeGap}
        >
          <NegativeGapBlock rows={insights.negativeKeywordGap} currency={currency} />
        </InsightSection>
        <InsightSection
          id="cannibalization"
          title="Match Type Cannibalization"
          expanded={expanded.cannibalization}
          onToggle={() => toggle('cannibalization')}
          icon={SECTION_ICONS.cannibalization}
        >
          <CannibalizationBlock rows={insights.matchTypeCannibalization} currency={currency} />
        </InsightSection>
        <InsightSection
          id="leakage"
          title="Search Term Leakage (Broad/Auto)"
          expanded={expanded.leakage}
          onToggle={() => toggle('leakage')}
          icon={SECTION_ICONS.leakage}
        >
          <LeakageBlock rows={insights.searchTermLeakage} currency={currency} />
        </InsightSection>
        <InsightSection
          id="profitability"
          title="Keyword Profitability Mapping"
          expanded={expanded.profitability}
          onToggle={() => toggle('profitability')}
          icon={SECTION_ICONS.profitability}
        >
          <ProfitabilityBlock quad={insights.keywordProfitability} currency={currency} />
        </InsightSection>
        <InsightSection
          id="portfolioRisk"
          title="Portfolio Risk (Concentration)"
          expanded={expanded.portfolioRisk}
          onToggle={() => toggle('portfolioRisk')}
          icon={SECTION_ICONS.portfolioRisk}
        >
          <PortfolioRiskBlock rows={insights.portfolioRisk} />
        </InsightSection>
        <InsightSection
          id="complexity"
          title="Campaign Structural Complexity"
          expanded={expanded.complexity}
          onToggle={() => toggle('complexity')}
          icon={SECTION_ICONS.complexity}
        >
          <ComplexityBlock data={insights.campaignComplexity} />
        </InsightSection>
        <InsightSection
          id="traffic"
          title="Traffic Efficiency Score"
          expanded={expanded.traffic}
          onToggle={() => toggle('traffic')}
          icon={SECTION_ICONS.traffic}
        >
          <TrafficBlock data={insights.trafficEfficiency} />
        </InsightSection>
        <InsightSection
          id="saturation"
          title="Keyword Saturation & Scale Readiness"
          expanded={expanded.saturation}
          onToggle={() => toggle('saturation')}
          icon={SECTION_ICONS.saturation}
        >
          <SaturationBlock
            saturationCount={insights.keywordSaturationCount}
            scaleReadinessPct={insights.scaleReadinessPct}
          />
        </InsightSection>
      </div>
    </section>
  );
}

function InsightSection({
  id,
  title,
  expanded,
  onToggle,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        aria-expanded={expanded}
        aria-controls={`panel-${id}`}
      >
        {expanded ? <ChevronDown size={18} className="shrink-0" /> : <ChevronRight size={18} className="shrink-0" />}
        <Icon size={18} className="shrink-0 text-cyan-400/80" />
        {title}
      </button>
      <div id={`panel-${id}`} hidden={!expanded} className="px-4 pb-4 pt-0">
        {expanded && <div className="pl-8 text-sm">{children}</div>}
      </div>
    </div>
  );
}

function TacosBlock({ data }: { data: AdvancedInsightsResult['tacosDecomposition'] }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-[var(--color-text-muted)]">
      <div><span className="text-[var(--color-text)]">True TACOS</span> {data.trueTacos.toFixed(1)}%</div>
      <div><span className="text-[var(--color-text)]">Direct TACOS</span> (ad spend/ad sales) {data.directTacos.toFixed(1)}%</div>
      <div><span className="text-[var(--color-text)]">Blended TACOS</span> {data.blendedTacos.toFixed(1)}%</div>
      <div><span className="text-[var(--color-text)]">Organic share</span> {data.organicSharePct.toFixed(1)}%</div>
      <div><span className="text-[var(--color-text)]">Ad sales share</span> {data.adSalesSharePct.toFixed(1)}%</div>
    </div>
  );
}

function StrategyBlock({ data }: { data: AdvancedInsightsResult['accountStrategy'] }) {
  return (
    <div className="space-y-1">
      <p className="font-medium text-cyan-400">{data.strategy}</p>
      <p className="text-[var(--color-text-muted)]">{data.reasoning}</p>
      <p className="text-xs text-[var(--color-text-muted)]">Confidence: {data.confidence}%</p>
    </div>
  );
}

function NegativeGapBlock({
  rows,
  currency,
}: { rows: AdvancedInsightsResult['negativeKeywordGap']; currency: DetectedCurrency }) {
  if (rows.length === 0) {
    return <p className="text-[var(--color-text-muted)]">No high-spend zero-conversion terms in this dataset.</p>;
  }
  return (
    <div className="space-y-1">
      <p className="text-xs text-[var(--color-text-muted)]">Search terms with 5+ clicks, 0 sales — add as negatives where appropriate.</p>
      <div className="overflow-x-auto pr-2 max-h-48 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[var(--color-text-muted)]">
              <th className="pb-1 pr-2">Search Term</th>
              <th className="pb-1 text-right">Spend</th>
              <th className="pb-1">Match Type</th>
            </tr>
          </thead>
          <tbody className="text-[var(--color-text)]">
            {rows.slice(0, 15).map((r, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-0.5 pr-2 truncate max-w-[180px]" title={r.searchTerm}>{r.searchTerm || '—'}</td>
                <td className="py-0.5 text-right tabular-nums">{currency ? formatCurrency(r.spend, currency) : r.spend.toFixed(2)}</td>
                <td className="py-0.5">{r.matchType || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CannibalizationBlock({
  rows,
  currency,
}: { rows: AdvancedInsightsResult['matchTypeCannibalization']; currency: DetectedCurrency }) {
  if (rows.length === 0) {
    return <p className="text-[var(--color-text-muted)]">No clear broad-exact cannibalization detected for same keywords.</p>;
  }
  const sym = currency ? formatCurrency(0, currency).replace('0.00', '') : '$';
  return (
    <ul className="space-y-2">
      {rows.slice(0, 10).map((r, i) => (
        <li key={i} className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-xs">
          <span className="font-medium text-[var(--color-text)]">{r.keyword}</span>
          <span className="text-[var(--color-text-muted)]"> — Exact CPC {sym}{r.exactCpc.toFixed(2)}, Broad {sym}{r.broadCpc.toFixed(2)}. {r.message}</span>
        </li>
      ))}
    </ul>
  );
}

function LeakageBlock({
  rows,
  currency,
}: { rows: AdvancedInsightsResult['searchTermLeakage']; currency: DetectedCurrency }) {
  if (rows.length === 0) {
    return <p className="text-[var(--color-text-muted)]">No broad/auto terms with significant spend in this dataset.</p>;
  }
  return (
    <div className="overflow-x-auto pr-2 max-h-48 overflow-y-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[var(--color-text-muted)]">
            <th className="pb-1 pr-2">Search Term</th>
            <th className="pb-1">Match Type</th>
            <th className="pb-1 text-right">Spend</th>
          </tr>
        </thead>
        <tbody className="text-[var(--color-text)]">
          {rows.slice(0, 15).map((r, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="py-0.5 pr-2 truncate max-w-[160px]" title={r.searchTerm}>{r.searchTerm || '—'}</td>
              <td className="py-0.5">{r.matchType || '—'}</td>
              <td className="py-0.5 text-right tabular-nums">{currency ? formatCurrency(r.spend, currency) : r.spend.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">Terms triggering from broad/auto; consider adding as targets or negatives.</p>
    </div>
  );
}

function ProfitabilityBlock({
  quad,
  currency,
}: { quad: AdvancedInsightsResult['keywordProfitability']; currency: DetectedCurrency }) {
  const fmt = (n: number) => (currency ? formatCurrency(n, currency) : n.toFixed(2));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
        <p className="font-medium text-emerald-400 mb-1">Scale ({quad.scale.length})</p>
        <ul className="space-y-0.5 text-[var(--color-text-muted)]">
          {quad.scale.slice(0, 5).map((k, i) => (
            <li key={i}>{k.searchTerm.slice(0, 30)} — ROAS {k.roas.toFixed(1)}×, spend {fmt(k.spend)}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
        <p className="font-medium text-amber-400 mb-1">Optimize ({quad.optimize.length})</p>
        <ul className="space-y-0.5 text-[var(--color-text-muted)]">
          {quad.optimize.slice(0, 5).map((k, i) => (
            <li key={i}>{k.searchTerm.slice(0, 30)} — ACOS {k.acos.toFixed(0)}%, spend {fmt(k.spend)}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 p-2">
        <p className="font-medium text-sky-400 mb-1">Monitor ({quad.monitor.length})</p>
        <ul className="space-y-0.5 text-[var(--color-text-muted)]">
          {quad.monitor.slice(0, 5).map((k, i) => (
            <li key={i}>{k.searchTerm.slice(0, 30)} — spend {fmt(k.spend)}, sales {fmt(k.sales)}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2">
        <p className="font-medium text-red-400 mb-1">Pause ({quad.pause.length})</p>
        <ul className="space-y-0.5 text-[var(--color-text-muted)]">
          {quad.pause.slice(0, 5).map((k, i) => (
            <li key={i}>{k.searchTerm.slice(0, 30)} — spend {fmt(k.spend)}, {k.clicks} clicks, 0 sales</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PortfolioRiskBlock({ rows }: { rows: AdvancedInsightsResult['portfolioRisk'] }) {
  const byType = { keyword: rows.filter((r) => r.type === 'keyword').slice(0, 5), campaign: rows.filter((r) => r.type === 'campaign').slice(0, 5), asin: rows.filter((r) => r.type === 'asin').slice(0, 5) };
  return (
    <div className="space-y-3 text-xs">
      <p className="text-[var(--color-text-muted)]">Top 10 cumulative share of spend (keywords, campaigns) and ad sales (ASINs).</p>
      <div>
        <p className="font-medium text-[var(--color-text)] mb-1">Keywords (spend share)</p>
        <ul className="space-y-0.5 text-[var(--color-text-muted)]">
          {byType.keyword.map((r, i) => (
            <li key={i}>{r.name} — {r.sharePct.toFixed(1)}% cum.</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium text-[var(--color-text)] mb-1">Campaigns (spend share)</p>
        <ul className="space-y-0.5 text-[var(--color-text-muted)]">
          {byType.campaign.map((r, i) => (
            <li key={i}>{r.name} — {r.sharePct.toFixed(1)}% cum.</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium text-[var(--color-text)] mb-1">ASINs (ad sales share)</p>
        <ul className="space-y-0.5 text-[var(--color-text-muted)]">
          {byType.asin.map((r, i) => (
            <li key={i}>{r.name} — {r.sharePct.toFixed(1)}% cum.</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ComplexityBlock({ data }: { data: AdvancedInsightsResult['campaignComplexity'] }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm text-[var(--color-text-muted)]">
      <div>Campaigns</div><div className="text-[var(--color-text)] tabular-nums">{data.campaignCount}</div>
      <div>Total keywords</div><div className="text-[var(--color-text)] tabular-nums">{data.totalKeywords}</div>
      <div>Keywords per campaign</div><div className="text-[var(--color-text)] tabular-nums">{data.keywordsPerCampaign}</div>
      <div>Duplicate keyword bases</div><div className="text-[var(--color-text)] tabular-nums">{data.duplicateKeywordCount}</div>
      <div>Match type overlap</div><div className="text-[var(--color-text)] tabular-nums">{data.matchTypeOverlapCount}</div>
      <div>Structure score</div><div className="text-[var(--color-text)]">{data.scoreLabel} ({data.scorePct.toFixed(0)}%)</div>
    </div>
  );
}

function TrafficBlock({ data }: { data: AdvancedInsightsResult['trafficEfficiency'] }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-[var(--color-text)]"><span className="text-cyan-400">{data.label}</span> — {data.scorePct}%</p>
      <p className="text-[var(--color-text-muted)]">Clicks: {data.totalClicks.toLocaleString()} → Orders: {data.totalOrders}. Click-to-order rate: {data.clickToSaleRatePct.toFixed(2)}%.</p>
    </div>
  );
}

function SaturationBlock({ saturationCount, scaleReadinessPct }: { saturationCount: number; scaleReadinessPct: number }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-[var(--color-text)]"><span className="text-[var(--color-text-muted)]">Keyword saturation (high spend, low ROAS):</span> {saturationCount} keywords</p>
      <p className="text-[var(--color-text)]"><span className="text-[var(--color-text-muted)]">Portfolio scaling score:</span> <span className="text-cyan-400 font-medium">{scaleReadinessPct}%</span> scale readiness</p>
    </div>
  );
}
