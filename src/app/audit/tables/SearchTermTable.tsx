'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import { classifyKeyword, type KeywordTag } from '../utils/keywordClassifier';

export type SuggestedAction = 'Scale' | 'Optimize' | 'Monitor' | 'Negative' | 'Test';

function getSuggestedAction(m: { clicks: number; sales: number; spend: number; acos: number; roas: number }): SuggestedAction {
  if (m.clicks >= 10 && m.sales === 0) return 'Negative';
  if (m.roas >= 4 && m.sales > 0 && m.spend >= 5) return 'Scale';
  if (m.clicks < 5 && m.spend < 5) return 'Test';
  if (m.acos > 25 && m.spend > 10 && m.sales > 0) return 'Optimize';
  return 'Monitor';
}

/** Section 37: Quality score from ROAS + ACOS weighting. Green >70, yellow 40–70, red <40. */
function getQualityScore(m: { acos: number; roas: number; sales: number }): number {
  if (m.sales === 0) return Math.min(100, m.roas * 5);
  const roasPart = Math.min(50, (m.roas / 10) * 50);
  const acosPart = Math.max(0, 50 - m.acos * 1.5);
  return Math.round(Math.min(100, Math.max(0, roasPart + acosPart)));
}

function QualityScoreBadge({ score }: { score: number }) {
  const status = score > 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
  const cls =
    status === 'green'
      ? 'bg-emerald-500/20 text-emerald-400'
      : status === 'yellow'
        ? 'bg-amber-500/20 text-amber-400'
        : 'bg-red-500/20 text-red-400';
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium tabular-nums ${cls}`}>{score}</span>;
}

export default function SearchTermTable() {
  const { state } = useAuditStore();
  const [brandNames] = useState('');
  const [competitorTerms] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'All' | KeywordTag>('All');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>('All');
  const [page, setPage] = useState(0);
  const ROWS_PER_PAGE = 100;

  const rows = useMemo(() => {
    const list = Object.values(state.store.keywordMetrics);
    const opts = {
      brandNames: brandNames ? brandNames.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      competitorTerms: competitorTerms ? competitorTerms.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    };
    return list.map((m) => ({
      ...m,
      tag: classifyKeyword(m.searchTerm, opts) as KeywordTag,
      action: getSuggestedAction(m),
      qualityScore: getQualityScore(m),
    }));
  }, [state.store.keywordMetrics, brandNames, competitorTerms]);

  const filteredRows = useMemo(() => {
    let out = rows;
    if (classificationFilter !== 'All') out = out.filter((r) => r.tag === classificationFilter);
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      out = out.filter(
        (r) =>
          (r.searchTerm ?? '').toLowerCase().includes(q) ||
          (r.campaign ?? '').toLowerCase().includes(q)
      );
    }
    if (matchTypeFilter !== 'All') out = out.filter((r) => (r.matchType ?? '').toLowerCase() === matchTypeFilter.toLowerCase());
    return out;
  }, [rows, classificationFilter, searchKeyword, matchTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedRows = useMemo(() => {
    const start = safePage * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, safePage]);

  const matchTypes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.matchType) set.add(r.matchType);
    });
    return Array.from(set).sort();
  }, [rows]);

  const exportCsv = () => {
    const headers = ['Search Term', 'Tag', 'Match Type', 'Campaign', 'Spend', 'Sales', 'ACOS', 'ROAS', 'Suggested Action'];
    const lines = [
      headers.join(','),
      ...filteredRows.map((r) =>
        [
          `"${(r.searchTerm ?? '').replace(/"/g, '""')}"`,
          r.tag,
          `"${(r.matchType ?? '').replace(/"/g, '""')}"`,
          `"${(r.campaign ?? '').replace(/"/g, '""')}"`,
          r.spend.toFixed(2),
          r.sales.toFixed(2),
          r.acos.toFixed(1),
          r.roas.toFixed(2),
          r.action,
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Search Term Performance (Pro Standard). Section 28–29: classification and suggested actions.
        </p>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Download size={16} aria-hidden />
          Export to CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">Keyword classification</span>
        {(['All', 'Branded', 'Competitor', 'Generic'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setClassificationFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              classificationFilter === f
                ? 'bg-blue-500/30 text-blue-300'
                : 'bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search term or campaign name..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] text-sm min-w-[200px] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label="Search keywords"
        />
        <select
          value={matchTypeFilter}
          onChange={(e) => setMatchTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-[var(--color-text)] text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label="Match type filter"
        >
          <option value="All">All match types</option>
          {matchTypes.map((mt) => (
            <option key={mt} value={mt}>{mt}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 pr-2 sm:pr-4">
        <table className="w-full text-sm min-w-[800px]" role="table" aria-label="Search term performance">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Search Term</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Tag</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Match Type</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Campaign</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Spend</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Sales</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)] min-w-[4rem]">ACOS</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)] min-w-[4rem]">ROAS</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--color-text)]">Quality Score</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)] min-w-[6rem]">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((r, i) => (
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
                <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">{formatPercent(r.acos)}</td>
                <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">{r.roas.toFixed(2)}×</td>
                <td className="px-4 py-2 text-center">
                  <QualityScoreBadge score={r.qualityScore} />
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <ActionBadge action={r.action} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2 text-sm text-[var(--color-text-muted)]">
          <span>
            Page {safePage + 1} of {totalPages} ({filteredRows.length.toLocaleString()} rows). Section 38: pagination for large data.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
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

function ActionBadge({ action }: { action: SuggestedAction }) {
  const styles: Record<SuggestedAction, string> = {
    Scale: 'bg-emerald-500/20 text-emerald-400',
    Optimize: 'bg-amber-500/20 text-amber-400',
    Monitor: 'bg-sky-500/20 text-sky-400',
    Negative: 'bg-red-500/20 text-red-400',
    Test: 'bg-purple-500/20 text-purple-400',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[action]}`}>
      {action}
    </span>
  );
}
