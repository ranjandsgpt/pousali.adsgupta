'use client';

import { useState, useMemo } from 'react';
import type { DeepDiveTableConfig } from './types';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import type { DetectedCurrency } from '../utils/currencyDetector';
export function DeepDivePanel({
  title,
  table,
  currency,
}: {
  title: string;
  table: DeepDiveTableConfig;
  currency: DetectedCurrency;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');

  const sortedAndFiltered = useMemo(() => {
    let list = [...table.rows];
    if (filter.trim()) {
      const q = filter.toLowerCase().trim();
      list = list.filter((row) =>
        table.columns.some((c) => {
          const v = row[c.key];
          return v != null && String(v).toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const an = typeof av === 'number' ? av : Number(av) || 0;
        const bn = typeof bv === 'number' ? bv : Number(bv) || 0;
        if (typeof av === 'number' || typeof bv === 'number' || !Number.isNaN(an) || !Number.isNaN(bn)) {
          const diff = an - bn;
          return sortDir === 'asc' ? diff : -diff;
        }
        const as = String(av ?? '');
        const bs = String(bv ?? '');
        const cmp = as.localeCompare(bs);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [table.rows, table.columns, filter, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[var(--color-surface)] overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-white/10">
        <input
          type="text"
          placeholder="Filter rows..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 min-w-[160px] rounded border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <span className="text-xs text-[var(--color-text-muted)]">
          {sortedAndFiltered.length} row{sortedAndFiltered.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[var(--color-surface-elevated)] border-b border-white/10 z-10">
            <tr>
              {table.columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-3 py-2 text-left font-medium text-[var(--color-text)] cursor-pointer hover:bg-white/5 ${c.align === 'right' ? 'text-right' : ''}`}
                  onClick={() => handleSort(c.key)}
                >
                  {c.label}
                  {sortKey === c.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((row, ri) => (
              <tr key={ri} className="border-b border-white/5 hover:bg-white/5">
                {table.columns.map((c) => {
                  const raw = row[c.key];
                  let cell: string | number = raw != null ? String(raw) : '—';
                  if (c.format === 'currency' && typeof raw === 'number')
                    cell = formatCurrency(raw, currency);
                  if (c.format === 'percent' && typeof raw === 'number')
                    cell = formatPercent(raw);
                  if (c.format === 'number' && typeof raw === 'number') cell = raw.toFixed(2);
                  return (
                    <td
                      key={c.key}
                      className={`px-3 py-2 text-[var(--color-text)] ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
