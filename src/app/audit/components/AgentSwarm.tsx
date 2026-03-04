'use client';

const PLACEHOLDER_AGENTS = [
  'HeaderDiscoveryAgent',
  'CurrencyMappingAgent',
  'MathVerificationAgent',
  'TACOSCalculatorAgent',
  'BleedersDetectionAgent',
  'ASINProfitabilityAgent',
  'SearchTermsMapperAgent',
  'DateRangeValidatorAgent',
  'SpendAggregatorAgent',
  'SalesAttributionAgent',
  'ROASCalculatorAgent',
  'CampaignStructureAgent',
  'KeywordHarvestingAgent',
  'PlacementAnalyzerAgent',
  'ConversionTrackerAgent',
  'NegativeKeywordAgent',
  'BudgetPacingAgent',
  'TargetingAuditAgent',
  'ReportMergerAgent',
  'SchemaValidatorAgent',
  'NullHandlerAgent',
  'DuplicateResolverAgent',
  'CurrencyNormalizerAgent',
  'TimeZoneAgent',
  'MetricDerivationAgent',
  'OneSheetBuilderAgent',
  'ExportPrepAgent',
  'ChartDataAgent',
  'TableDataAgent',
];

interface AgentSwarmProps {
  isRunning: boolean;
}

export default function AgentSwarm({ isRunning }: AgentSwarmProps) {
  return (
    <section
      aria-labelledby="agent-swarm-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${isRunning ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'}`}
          aria-hidden
        />
        <h2
          id="agent-swarm-heading"
          className="text-lg font-semibold text-[var(--color-text)]"
        >
          Agent Swarm Running
        </h2>
        {!isRunning && (
          <span className="text-sm text-[var(--color-text-muted)]">Complete</span>
        )}
      </div>
      <div className="p-4 max-h-[280px] overflow-y-auto">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2" role="list">
          {PLACEHOLDER_AGENTS.map((name, i) => (
            <li
              key={name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm font-mono text-[var(--color-text-muted)]"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  isRunning ? 'bg-cyan-500/80' : 'bg-emerald-500/80'
                }`}
                aria-hidden
              />
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
