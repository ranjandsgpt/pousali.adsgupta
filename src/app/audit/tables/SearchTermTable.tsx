'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import { classifyKeyword, type KeywordTag } from '../utils/keywordClassifier';

export default function SearchTermTable() {
  const { state } = useAuditStore();
  const [brandNames] = useState(''); // Optional: could be from settings
  const [competitorTerms] = useState('');

  const rows = useMemo(() => {
    const list = Object.values(state.store.keywordMetrics);
    const opts = {
      brandNames: brandNames ? brandNames.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      competitorTerms: competitorTerms ? competitorTerms.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    };
    return list.map((m) => ({
      ...m,
      tag: classifyKeyword(m.searchTerm, opts) as KeywordTag,
    }));
  }, [state.store.keywordMetrics, brandNames, competitorTerms]);

  const exportCsv = () => {
    const headers = ['Search Term', 'Tag', 'Match Type', 'Campaign', 'Spend', 'Sales', 'ACOS', 'ROAS'];
    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${(r.searchTerm ?? '').replace(/"/g, '""')}"`,
          r.tag,
          `"${(r.matchType ?? '').replace(/"/g, '""')}"`,
          `"${(r.campaign ?? '').replace(/"/g, '""')}"`,
          r.spend.toFixed(2),
          r.sales.toFixed(2),
          r.acos.toFixed(1),
          r.roas.toFixed(2),
        ].join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search-term-performance-negative-keywords.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currency = state.store.currency;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[var(--color-text-muted)] text-sm">
        No search term data. Upload advertising reports to see keyword performance.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Search Term Performance (Pro Standard). Tagged by Classifier Agent: Branded / Competitor / Generic.
        </p>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-500 text-sm font-medium hover:bg-cyan-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <Download size={16} aria-hidden />
          Export to CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm" role="table" aria-label="Search term performance">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Search Term</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Tag</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Match Type</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Campaign</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Spend</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Sales</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">ACOS</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-2 text-[var(--color-text)] max-w-[200px] truncate" title={r.searchTerm}>
                  {r.searchTerm || '—'}
                </td>
                <td className="px-4 py-2">
                  <TagBadge tag={r.tag} />
                </td>
                <td className="px-4 py-2 text-[var(--color-text-muted)]">{r.matchType || '—'}</td>
                <td className="px-4 py-2 text-[var(--color-text-muted)] max-w-[150px] truncate" title={r.campaign}>
                  {r.campaign || '—'}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {currency ? formatCurrency(r.spend, currency) : r.spend.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {currency ? formatCurrency(r.sales, currency) : r.sales.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{formatPercent(r.acos)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.roas.toFixed(2)}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagBadge({ tag }: { tag: KeywordTag }) {
  const styles: Record<KeywordTag, string> = {
    Branded: 'bg-emerald-500/20 text-emerald-400',
    Competitor: 'bg-amber-500/20 text-amber-400',
    Generic: 'bg-white/10 text-[var(--color-text-muted)]',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[tag]}`}>
      {tag}
    </span>
  );
}
