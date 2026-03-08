'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { SIDEBAR_SECTIONS } from '../helpCenterSections';

const sectionsList = [...SIDEBAR_SECTIONS];

const fuse = new Fuse(sectionsList, {
  keys: ['title', 'slug'],
  threshold: 0.3,
});

export function SearchBar() {
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<ReadonlyArray<(typeof SIDEBAR_SECTIONS)[number]>>([]);
  const router = useRouter();

  const filteredSuggestions = useMemo(() => {
    const term = (q || '').trim();
    if (!term) return sectionsList;
    const results = fuse.search(term);
    return results.length > 0 ? results.map((r) => r.item) : sectionsList;
  }, [q]);

  const onSearch = useCallback(() => {
    const term = (q || '').trim().toLowerCase();
    if (!term) return;
    const match = filteredSuggestions[0] ?? SIDEBAR_SECTIONS.find(
      (s) => s.slug.includes(term) || s.title.toLowerCase().includes(term)
    );
    if (match) router.push(`/amazon_audit_faq/${match.slug}`);
    else router.push(`/amazon_audit_faq/faq`);
  }, [q, router, filteredSuggestions]);

  const onFocus = useCallback(() => {
    setSuggestions(sectionsList);
  }, []);

  const onBlur = useCallback(() => {
    setTimeout(() => setSuggestions([]), 200);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Search help..."
          className="flex-1 px-3 py-2 bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] text-sm outline-none"
          aria-label="Search help center"
        />
        <button
          type="button"
          onClick={onSearch}
          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
      {(suggestions.length > 0 || q.trim()) && (
        <ul className="absolute top-full left-0 right-0 mt-1 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg z-30 max-h-64 overflow-auto">
          {(q.trim() ? filteredSuggestions : suggestions).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-white/5"
                onMouseDown={(e) => {
                  e.preventDefault();
                  router.push(`/amazon_audit_faq/${s.slug}`);
                  setSuggestions([]);
                }}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
