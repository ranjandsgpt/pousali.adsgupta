'use client';

import { useTabData } from '../tabs/useTabData';
import { InsightModuleCard } from '../tabs/InsightModuleCard';
import { DeepDivePanel } from '../tabs/DeepDivePanel';
import { BarChart3 } from 'lucide-react';

/** Section 6: Diagnostic modules – Keyword Performance, Campaign Budget, ASIN Profitability, etc. */
export default function DiagnosticModulesSection() {
  const overview = useTabData('overview');
  const kw = useTabData('keywords-search-terms');
  const camp = useTabData('campaigns-budget');
  const waste = useTabData('waste-bleed');
  const asins = useTabData('asins-products');
  const profit = useTabData('profitability-inventory');
  const insights = useTabData('insights-reports');

  const overviewDiagnosticOnly = overview.insightModules.filter(
    (m) => m.id !== 'critical' && m.id !== 'opportunities'
  );
  const allModules = [
    ...overviewDiagnosticOnly,
    ...waste.insightModules,
    ...kw.insightModules,
    ...camp.insightModules,
    ...asins.insightModules,
    ...profit.insightModules,
    ...insights.insightModules,
  ];

  const deduped = allModules.filter((m, i) => allModules.findIndex((x) => x.id === m.id) === i);

  if (deduped.length === 0) return null;

  return (
    <section
      aria-labelledby="diagnostic-modules-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="text-sky-400 shrink-0" size={20} aria-hidden />
        <h2 id="diagnostic-modules-heading" className="text-sm font-semibold text-[var(--color-text)]">
          6. Diagnostic modules
        </h2>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        Keyword performance, campaign budget efficiency, ASIN profitability, search term leakage, bid efficiency. Expand for full data tables.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deduped.map((mod) => (
          <InsightModuleCard key={mod.id} module={mod}>
            {mod.deepDiveTable && (
              <DeepDivePanel
                title={mod.title}
                table={mod.deepDiveTable}
                currency={kw.currency}
              />
            )}
          </InsightModuleCard>
        ))}
      </div>
    </section>
  );
}
