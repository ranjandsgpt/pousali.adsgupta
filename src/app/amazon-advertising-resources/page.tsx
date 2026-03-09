'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ConsultationCta } from '@/components/consultation-cta';

const resources = [
  { href: '/amazon-ppc-strategy', title: 'Amazon PPC Strategy', description: 'How Amazon PPC works, keyword targeting, campaign structuring, and scaling profitable campaigns.' },
  { href: '/amazon-ads-consultant', title: 'Amazon Ads Consultant', description: 'Helping brands scale through advanced Amazon PPC strategies, keyword research, and marketplace optimization.' },
  { href: '/amazon-ppc-management', title: 'Amazon PPC Management', description: 'End-to-end PPC management services to scale profitable campaigns, reduce ACOS and increase marketplace sales.' },
  { href: '/amazon-ppc-audit', title: 'Amazon PPC Audit', description: 'Professional PPC audits to identify wasted ad spend, optimize campaigns and improve advertising profitability.' },
  { href: '/amazon-keyword-research', title: 'Amazon Keyword Research', description: 'Keyword research strategy to identify high-converting search terms and improve product visibility.' },
  { href: '/reduce-amazon-acos', title: 'Reduce Amazon ACOS', description: 'How to reduce Amazon ACOS through campaign optimization, keyword strategy and bid management.' },
];

export default function AmazonAdvertisingResourcesPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">
            Amazon Advertising Resources
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Central hub for educational and service pages covering PPC strategy, ACOS optimization, keyword research and campaign management.
          </p>
        </motion.header>

        <section aria-labelledby="resources-heading" className="mb-20">
          <h2 id="resources-heading" className="text-2xl font-bold text-[var(--color-text)] mb-8">
            Resources
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
            {resources.map((item, i) => (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Link
                  href={item.href}
                  className="group block rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6 transition-colors hover:border-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <h3 className="text-lg font-bold text-[var(--color-text)] group-hover:text-cyan-500 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[var(--color-text-muted)] text-sm mb-4">
                    {item.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-500 group-hover:gap-2 transition-all">
                    Read more
                    <ArrowRight size={14} aria-hidden />
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>

        <div className="mb-12">
          <ConsultationCta />
        </div>
        <p className="text-center mb-12">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            Discuss Amazon Advertising Strategy
          </Link>
        </p>

        <p className="text-sm text-[var(--color-text-muted)]">
          <Link href="/insights" className="text-cyan-500 hover:underline">Insights</Link>
          {' · '}
          <Link href="/contact" className="text-cyan-500 hover:underline">Contact</Link>
        </p>
      </div>
    </div>
  );
}
