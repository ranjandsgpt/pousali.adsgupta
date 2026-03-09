'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SupplementCategoryScalingCaseStudy() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">Supplement Category Scaling</h1>
          <p className="text-lg text-[var(--color-text-muted)]">Portfolio-level efficiency and category share gain</p>
        </motion.header>
        <section id="challenge" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Challenge</h2>
          <p className="text-[var(--color-text-muted)]">Improve overall advertising efficiency across a brand portfolio.</p>
        </section>
        <section id="strategy" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Strategy</h2>
          <p className="text-[var(--color-text-muted)]">Portfolio-level TACoS targeting, campaign restructuring, and listing optimization across SKUs.</p>
        </section>
        <section id="execution" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Execution</h2>
          <p className="text-[var(--color-text-muted)]">Unified reporting, campaign consolidation and consistent optimization cadence across the portfolio.</p>
        </section>
        <section id="results" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Results</h2>
          <ul className="space-y-2 text-[var(--color-text-muted)]">
            <li><strong className="text-[var(--color-text)]">TACoS:</strong> Improved by 35%</li>
            <li><strong className="text-[var(--color-text)]">ACOS:</strong> Stable while scaling</li>
            <li><strong className="text-[var(--color-text)]">Market share:</strong> Category share gain</li>
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
