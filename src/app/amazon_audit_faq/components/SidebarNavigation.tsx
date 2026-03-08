'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIDEBAR_SECTIONS } from '../helpCenterSections';

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {SIDEBAR_SECTIONS.map((section) => {
        const href = `/amazon_audit_faq/${section.slug}`;
        const isActive = pathname === href || pathname?.startsWith(href + '/');
        return (
          <Link
            key={section.id}
            href={href}
            className={`block px-3 py-2 rounded-lg text-sm ${
              isActive
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-medium'
                : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
            }`}
          >
            {section.title}
          </Link>
        );
      })}
    </nav>
  );
}
