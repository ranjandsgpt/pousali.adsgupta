'use client';

import { useState, useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { useTabData } from '../tabs/useTabData';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import { DeepDivePanel } from '../tabs/DeepDivePanel';
import type { DeepDiveTableConfig } from '../tabs/types';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

/** Section 4: Critical Issues – module cards with Show Details (expand to full table). */
export default function CriticalIssuesSection() {
  const { state } = useAuditStore();
  const { store } = state;
  const { patterns, insightModules, currency } = useTabData('overview');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const criticalCards = useMemo(() => {
    const cards: Array<{
      id: string;
      title: string;
      description: string;
      estimatedImpact: string;
      deepDiveTable: DeepDiveTableConfig;
    }> = [];

    const criticalModule = insightModules.find((m) => m.id === 'critical');
    if (criticalModule?.deepDiveTable) {
      const rows = criticalModule.deepDiveTable.rows;
      const campaignRows = rows.filter((r) => r.type === 'Campaign');
      const keywordRows = rows.filter((r) => r.type === 'Keyword');
      const campaignImpact = campaignRows.reduce((s, r) => s + (Number(r.spend) || 0), 0);
      const keywordImpact = keywordRows.reduce((s, r) => s + (Number(r.spend) || 0), 0);

      if (campaignRows.length > 0) {
        cards.push({
          id: 'high-acos-campaigns',
          title: 'High ACOS campaigns',
          description: 'Campaigns above target ACOS. Reduce bids or add negatives.',
          estimatedImpact: campaignImpact > 0 ? `Est. wasted spend: ${formatCurrency(campaignImpact, store.currency)}` : '',
          deepDiveTable: {
            columns: [
              { key: 'type', label: 'Type' },
              { key: 'name', label: 'Campaign' },
              { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
              { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
              { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
              { key: 'action', label: 'Suggested Action' },
            ],
            rows: campaignRows.map((r) => ({ ...r, name: r.name })),
          },
        });
      }
      if (keywordRows.length > 0) {
        cards.push({
          id: 'bleeding-keywords',
          title: 'Keywords with spend but no sales',
          description: 'Bleeding keywords. Pause or add as negative.',
          estimatedImpact: keywordImpact > 0 ? `Est. wasted spend: ${formatCurrency(keywordImpact, store.currency)}` : '',
          deepDiveTable: {
            columns: [
              { key: 'type', label: 'Type' },
              { key: 'name', label: 'Keyword' },
              { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
              { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
              { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
              { key: 'action', label: 'Suggested Action' },
            ],
            rows: keywordRows.map((r) => ({ ...r, name: r.name })),
          },
        });
      }
    }

    const listingPatterns = patterns.filter((p) => p.problemTitle === 'Listing Conversion Problem');
    if (listingPatterns.length > 0) {
      const listingRows = listingPatterns.map((p) => ({
        entityName: p.entityName,
        metricValues: JSON.stringify(p.metricValues),
        action: p.recommendedAction,
      }));
      cards.push({
        id: 'listing-conversion',
        title: 'Low conversion (listing problem)',
        description: 'Improve listing conversion; check images and copy.',
        estimatedImpact: '',
        deepDiveTable: {
          columns: [
            { key: 'entityName', label: 'Keyword' },
            { key: 'metricValues', label: 'Metrics' },
            { key: 'action', label: 'Suggested Action' },
          ],
          rows: listingRows,
        },
      });
    }

    return cards;
  }, [store.currency, insightModules, patterns]);

  if (criticalCards.length === 0) return null;

  const sym = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';
  const totalWaste = criticalCards.reduce((sum, c) => {
    const spend = c.deepDiveTable.rows.reduce((s, r) => s + (Number(r.spend) || 0), 0);
    return sum + spend;
  }, 0);

  return (
    <section
      aria-labelledby="critical-issues-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-red-400 shrink-0" size={20} aria-hidden />
        <h2 id="critical-issues-heading" className="text-sm font-semibold text-[var(--color-text)]">
          4. Critical issues ({criticalCards.length})
        </h2>
        {totalWaste > 0 && (
          <span className="text-xs text-red-400 ml-auto">
            Total est. wasted: {sym}{totalWaste.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {criticalCards.map((card) => {
          const isOpen = expandedId === card.id;
          return (
            <div
              key={card.id}
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-red-500/30 text-red-200 mb-2">
                    Critical
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">{card.title}</h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{card.description}</p>
                  {card.estimatedImpact && (
                    <p className="mt-2 text-xs font-medium text-red-300">{card.estimatedImpact}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : card.id)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-white/15"
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Show Details
                </button>
              </div>
              {isOpen && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <DeepDivePanel title={card.title} table={card.deepDiveTable} currency={currency} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
