'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Omega3GrowthCaseStudy() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">Omega 3 Growth</h1>
          <p className="text-lg text-[var(--color-text-muted)]">Supplement category · ACOS reduction and revenue growth</p>
        </motion.header>
        <section id="challenge" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Challenge</h2>
          <p className="text-[var(--color-text-muted)]">High ACOS and low organic visibility in a competitive supplement category.</p>
        </section>
        <section id="strategy" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Strategy</h2>
          <p className="text-[var(--color-text-muted)]">Structured product launch with phased PPC (awareness → consideration → conversion), listing optimization, and search term harvesting.</p>
        </section>
        <section id="execution" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Execution</h2>
          <p className="text-[var(--color-text-muted)]">Campaign structure by funnel stage, continuous search term mining, and bid adjustments aligned to ACOS targets.</p>
        </section>
        <section id="results" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Results</h2>
          <ul className="space-y-2 text-[var(--color-text-muted)]">
            <li><strong className="text-[var(--color-text)]">ACOS:</strong> 65% → 28%</li>
            <li><strong className="text-[var(--color-text)]">Revenue:</strong> 2.5x in 6 months</li>
            <li><strong className="text-[var(--color-text)]">Organic share:</strong> Significant improvement</li>
          </ul>
        </section>
        <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400">Discuss your goals</Link>
        <p className="mt-8 text-sm text-[var(--color-text-muted)]">
          <Link href="/case-studies" className="text-cyan-500 hover:underline">All case studies</Link>
          {' · '}
          <Link href="/work" className="text-cyan-500 hover:underline">Work</Link>
        </p>
      </div>
    </div>
  );
}
