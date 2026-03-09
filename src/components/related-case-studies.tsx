'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const cases = [
  { href: '/case-studies/omega-3-growth', title: 'Omega 3 Growth' },
  { href: '/case-studies/maca-root-launch', title: 'Maca Root Launch' },
  { href: '/case-studies/supplement-category-scaling', title: 'Supplement Scaling' },
];

export function RelatedCaseStudies() {
  return (
    <section aria-labelledby="related-case-studies-heading" className="mb-12">
      <h2 id="related-case-studies-heading" className="text-2xl font-bold text-[var(--color-text)] mb-6">
        Related Case Studies
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4" role="list">
        {cases.map((c, i) => (
          <motion.li
            key={c.href}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link
              href={c.href}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 hover:border-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <span className="font-medium text-[var(--color-text)]">{c.title}</span>
              <ArrowRight size={16} className="text-cyan-500" aria-hidden />
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
