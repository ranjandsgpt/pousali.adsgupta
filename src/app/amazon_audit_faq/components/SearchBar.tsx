'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { SIDEBAR_SECTIONS } from '../helpCenterSections';
import type { NavNode } from './SidebarNavigation';

const sectionsList = [...SIDEBAR_SECTIONS];
const defaultNavList: NavNode[] = SIDEBAR_SECTIONS.map((s) => ({ label: s.title, slug: s.slug }));

export function SearchBar({ navNodes }: { navNodes?: NavNode[] }) {
  const [q, setQ] = useState('');
  const list = navNodes && navNodes.length > 0 ? navNodes.filter((n) => n.slug) : defaultNavList;
  const [suggestions, setSuggestions] = useState<NavNode[]>([]);
  const router = useRouter();
  const searchFuse = useMemo(() => new Fuse(list, { keys: ['label', 'slug'], threshold: 0.3 }), [list]);

  const filteredSuggestions = useMemo(() => {
    const term = (q || '').trim();
    if (!term) return list;
    const results = searchFuse.search(term);
    return results.length > 0 ? results.map((r) => r.item) : list;
  }, [q, list, searchFuse]);

  const onSearch = useCallback(() => {
    const term = (q || '').trim().toLowerCase();
    if (!term) return;
    const match = filteredSuggestions[0] ?? list.find(
      (s) => s.slug.includes(term) || s.label.toLowerCase().includes(term)
    );
    if (match) router.push(`/amazon_audit_faq/${match.slug}`);
    else router.push(`/amazon_audit_faq/faq`);
  }, [q, router, filteredSuggestions, list]);

  const onFocus = useCallback(() => {
    setSuggestions(list);
  }, [list]);

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
            <li key={s.slug}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-white/5"
                onMouseDown={(e) => {
                  e.preventDefault();
                  router.push(`/amazon_audit_faq/${s.slug}`);
                  setSuggestions([]);
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
