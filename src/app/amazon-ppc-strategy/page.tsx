'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const sections = [
  { title: 'How Amazon PPC Works', description: 'Sponsored Products, Brands, and Display—how they interact, attribution windows, and how to allocate budget across the funnel.' },
  { title: 'Keyword Targeting Strategy', description: 'Choosing the right match types, negative keywords, and search term mining to capture intent without wasted spend.' },
  { title: 'Campaign Structuring', description: 'Portfolio structure by goal, product, and match type for clear reporting and scalable optimization.' },
  { title: 'Scaling Profitable Campaigns', description: 'When and how to increase budget and bids on winning campaigns while protecting ACOS and ROAS.' },
];

export default function AmazonPpcStrategyPage() {
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
            Amazon PPC Strategy
          </h1>
        </motion.header>

        <section aria-labelledby="sections-heading" className="mb-20">
          <h2 id="sections-heading" className="sr-only">Strategy overview</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
            {sections.map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6"
              >
                <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">{item.title}</h3>
                <p className="text-[var(--color-text-muted)] text-sm">{item.description}</p>
              </motion.li>
            ))}
          </ul>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-12 rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-8 text-center"
        >
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
          >
            Discuss PPC Strategy
          </Link>
        </motion.section>

        <p className="text-sm text-[var(--color-text-muted)]">
          <Link href="/work" className="text-cyan-500 hover:underline">Work</Link>
          {' · '}
          <Link href="/contact" className="text-cyan-500 hover:underline">Contact</Link>
        </p>
      </div>
    </div>
  );
}
