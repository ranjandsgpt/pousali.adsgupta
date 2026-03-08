'use client';

import Link from 'next/link';

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
      <Link href="/amazon_audit_faq" className="hover:text-[var(--color-text)]">
        Help
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span aria-hidden>/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--color-text)]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-text)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
