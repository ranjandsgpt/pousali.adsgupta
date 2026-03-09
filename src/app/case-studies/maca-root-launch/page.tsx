'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function MacaRootLaunchCaseStudy() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">Maca Root Launch</h1>
          <p className="text-lg text-[var(--color-text-muted)]">Supplement category · Scale revenue without blowing ACOS</p>
        </motion.header>
        <section id="challenge" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Challenge</h2>
          <p className="text-[var(--color-text-muted)]">Scale revenue without blowing ACOS in a niche category.</p>
        </section>
        <section id="strategy" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Strategy</h2>
          <p className="text-[var(--color-text-muted)]">Keyword expansion, negative keyword refinement, and bid strategy aligned with TACoS targets.</p>
        </section>
        <section id="execution" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Execution</h2>
          <p className="text-[var(--color-text-muted)]">Incremental budget allocation and search term harvesting to scale winners and trim waste.</p>
        </section>
        <section id="results" className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Results</h2>
          <ul className="space-y-2 text-[var(--color-text-muted)]">
            <li><strong className="text-[var(--color-text)]">Revenue:</strong> 3.2x in 4 months</li>
            <li><strong className="text-[var(--color-text)]">TACoS:</strong> Reduced by 22%</li>
            <li><strong className="text-[var(--color-text)]">Conversion:</strong> Improved CVR</li>
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
