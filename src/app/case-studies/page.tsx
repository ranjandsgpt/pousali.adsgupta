'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const studies = [
  { href: '/case-studies/omega-3-growth', title: 'Omega 3 Growth', summary: 'ACOS reduction and revenue growth in supplement category.' },
  { href: '/case-studies/maca-root-launch', title: 'Maca Root Launch', summary: 'Product launch and scale without blowing ACOS.' },
  { href: '/case-studies/supplement-category-scaling', title: 'Supplement Category Scaling', summary: 'Portfolio-level TACoS and category share gain.' },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">Amazon Advertising Case Studies</h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl">Selected projects in Amazon PPC, product launch and marketplace growth.</p>
        </motion.header>
        <section aria-labelledby="case-studies-heading">
          <h2 id="case-studies-heading" className="text-2xl font-bold text-[var(--color-text)] mb-8">Case Studies</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
            {studies.map((s, i) => (
              <motion.li key={s.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }}>
                <Link href={s.href} className="group block rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6 hover:border-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                  <h3 className="text-lg font-bold text-[var(--color-text)] group-hover:text-cyan-500 mb-2">{s.title}</h3>
                  <p className="text-[var(--color-text-muted)] text-sm mb-4">{s.summary}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-500"><span>Read case study</span><ArrowRight size={14} aria-hidden /></span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
        <p className="mt-12 text-sm text-[var(--color-text-muted)]">
          <Link href="/work" className="text-cyan-500 hover:underline">Work</Link>
          {' · '}
          <Link href="/contact" className="text-cyan-500 hover:underline">Contact</Link>
          {' · '}
          <Link href="/pousali-dasgupta" className="text-cyan-500 hover:underline">Pousali Dasgupta</Link>
        </p>
      </div>
    </div>
  );
}
