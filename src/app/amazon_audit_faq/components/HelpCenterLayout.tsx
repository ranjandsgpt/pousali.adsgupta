'use client';

import type { ReactNode } from 'react';
import { SidebarNavigation } from './SidebarNavigation';
import { SearchBar } from './SearchBar';
import { Breadcrumbs } from './Breadcrumbs';
import Link from 'next/link';

import type { NavNode } from './SidebarNavigation';

export function HelpCenterLayout({
  children,
  breadcrumbs,
  relatedSlugs,
  navNodes,
}: {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  relatedSlugs?: string[];
  navNodes?: NavNode[];
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/amazon_audit_faq" className="font-semibold text-lg text-[var(--color-text)] hover:opacity-90">
            Amazon Audit Help Center
          </Link>
          <SearchBar navNodes={navNodes} />
        </div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div className="max-w-7xl mx-auto px-4 pb-2">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        ) : null}
      </header>
      <div className="max-w-7xl mx-auto w-full flex flex-1 px-4 py-6 gap-8">
        <aside className="w-56 shrink-0 hidden md:block sticky top-[120px] self-start">
          <SidebarNavigation navNodes={navNodes} />
        </aside>
        <main className="flex-1 min-w-0">
          {children}
          {relatedSlugs && relatedSlugs.length > 0 ? (
            <footer className="mt-12 pt-8 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">Related articles</h3>
              <ul className="flex flex-wrap gap-2">
                {relatedSlugs.map((slug) => (
                  <li key={slug}>
                    <Link href={`/amazon_audit_faq/${slug}`} className="text-sm text-[var(--color-accent)] hover:underline">
                      {slug.replace(/-/g, ' ')}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}
        </main>
      </div>
    </div>
  );
}
