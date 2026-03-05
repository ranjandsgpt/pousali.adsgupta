'use client';

import { useState, useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { useTabData } from '../tabs/useTabData';
import { formatCurrency } from '../utils/formatNumber';
import { DeepDivePanel } from '../tabs/DeepDivePanel';
import type { DeepDiveTableConfig } from '../tabs/types';
import { Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';

/** Section 5: Optimization Opportunities – module cards with Show Details. */
export default function OptimizationOpportunitiesSection() {
  const { state } = useAuditStore();
  const { store } = state;
  const { opportunities, insightModules, currency } = useTabData('overview');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const opportunityCards = useMemo(() => {
    const cards: Array<{
      id: string;
      title: string;
      description: string;
      estimatedIncremental: string;
      deepDiveTable: DeepDiveTableConfig;
    }> = [];

    const oppModule = insightModules.find((m) => m.id === 'opportunities');
    if (oppModule?.deepDiveTable) {
      const rows = oppModule.deepDiveTable.rows;
      const campaignRows = rows.filter((r) => r.type === 'Campaign');
      const keywordRows = rows.filter((r) => r.type === 'Keyword');
      const keywordIncremental = keywordRows.reduce((s, r) => s + (Number(r.sales) || 0) * 0.2, 0);
      const campaignIncremental = campaignRows.reduce((s, r) => s + (Number(r.sales) || 0) * 0.15, 0);

      if (keywordRows.length > 0) {
        cards.push({
          id: 'high-roas-keywords',
          title: 'High ROAS / low spend keywords',
          description: 'Scale bids or budget on these keywords.',
          estimatedIncremental: keywordIncremental > 0 ? `Est. incremental revenue: ${formatCurrency(keywordIncremental, store.currency)}` : '',
          deepDiveTable: {
            columns: [
              { key: 'type', label: 'Type' },
              { key: 'name', label: 'Keyword' },
              { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
              { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
              { key: 'roas', label: 'ROAS', align: 'right' },
              { key: 'action', label: 'Suggested Action' },
            ],
            rows: keywordRows.map((r) => ({ ...r, name: r.name })),
          },
        });
      }
      if (campaignRows.length > 0) {
        cards.push({
          id: 'high-roas-campaigns',
          title: 'High ROAS campaigns with low spend',
          description: 'Increase budget to scale these campaigns.',
          estimatedIncremental: campaignIncremental > 0 ? `Est. incremental revenue: ${formatCurrency(campaignIncremental, store.currency)}` : '',
          deepDiveTable: {
            columns: [
              { key: 'type', label: 'Type' },
              { key: 'name', label: 'Campaign' },
              { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
              { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
              { key: 'roas', label: 'ROAS', align: 'right' },
              { key: 'action', label: 'Suggested Action' },
            ],
            rows: campaignRows.map((r) => ({ ...r, name: r.name })),
          },
        });
      }
    }

    const underfunded = Object.values(store.campaignMetrics).filter(
      (m) => m.budget > 0 && m.spend < m.budget * 0.8
    );
    if (underfunded.length > 0) {
      const inc = underfunded.reduce((s, m) => s + (m.budget - m.spend) * 0.5, 0);
      cards.push({
        id: 'underfunded-campaigns',
        title: 'Underfunded campaigns',
        description: 'Campaigns spending below budget with headroom to scale.',
        estimatedIncremental: inc > 0 ? `Est. incremental revenue: ${formatCurrency(inc, store.currency)}` : '',
        deepDiveTable: {
          columns: [
            { key: 'campaignName', label: 'Campaign' },
            { key: 'budget', label: 'Budget', align: 'right', format: 'currency' },
            { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
            { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
            { key: 'action', label: 'Suggested Action' },
          ],
          rows: underfunded.map((c) => ({
            campaignName: c.campaignName,
            budget: c.budget,
            spend: c.spend,
            sales: c.sales,
            action: 'Increase daily budget',
          })),
        },
      });
    }

    return cards;
  }, [store, insightModules]);

  if (opportunityCards.length === 0) return null;

  return (
    <section
      aria-labelledby="optimization-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-emerald-400 shrink-0" size={20} aria-hidden />
        <h2 id="optimization-heading" className="text-sm font-semibold text-[var(--color-text)]">
          5. Optimization opportunities ({opportunityCards.length})
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opportunityCards.map((card) => {
          const isOpen = expandedId === card.id;
          return (
            <div
              key={card.id}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-emerald-500/30 text-emerald-200 mb-2">
                    Opportunity
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">{card.title}</h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{card.description}</p>
                  {card.estimatedIncremental && (
                    <p className="mt-2 text-xs font-medium text-emerald-300">{card.estimatedIncremental}</p>
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
