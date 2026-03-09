'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const sections = [
  { title: 'Amazon PPC Management', description: 'End-to-end management of Sponsored Products, Brands, and Display campaigns to maximize ROAS and scale profitably.' },
  { title: 'Campaign Optimization', description: 'Data-driven bid and budget adjustments, placement strategy, and creative testing to improve performance.' },
  { title: 'Keyword Strategy', description: 'Research, harvesting, and structure for exact, phrase, and broad match to capture demand without waste.' },
  { title: 'Product Launch Support', description: 'Launch playbooks combining paid and organic levers to build velocity and rank for target keywords.' },
];

export default function AmazonAdsConsultantPage() {
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
            Amazon Ads Consultant
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Helping brands scale through advanced Amazon PPC strategies, keyword research, and marketplace optimization.
          </p>
        </motion.header>

        <section aria-labelledby="what-i-do-heading" className="mb-20">
          <h2
            id="what-i-do-heading"
            className="text-2xl font-bold text-[var(--color-text)] mb-8"
          >
            What I Do
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
            {sections.map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6"
              >
                <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
                  {item.title}
                </h3>
                <p className="text-[var(--color-text-muted)] text-sm">
                  {item.description}
                </p>
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
            Contact for Amazon Ads Consultation
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
