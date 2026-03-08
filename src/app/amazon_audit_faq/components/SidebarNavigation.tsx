'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIDEBAR_SECTIONS } from '../helpCenterSections';

export interface NavNode {
  label: string;
  slug: string;
}

export function SidebarNavigation({ navNodes }: { navNodes?: NavNode[] }) {
  const pathname = usePathname();
  const items = navNodes && navNodes.length > 0
    ? navNodes.filter((n) => n.slug)
    : SIDEBAR_SECTIONS.map((s) => ({ label: s.title, slug: s.slug }));

  return (
    <nav className="space-y-1">
      {items.map((node) => {
        const href = `/amazon_audit_faq/${node.slug}`;
        const isActive = pathname === href || pathname?.startsWith(href + '/');
        return (
          <Link
            key={node.slug}
            href={href}
            className={`block px-3 py-2 rounded-lg text-sm ${
              isActive
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-medium'
                : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
            }`}
          >
            {node.label}
          </Link>
        );
      })}
    </nav>
  );
}
