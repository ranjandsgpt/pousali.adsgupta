'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { caseStudies } from '@/data/case-studies';
import WorkCard from '@/components/work-card';

export function CaseStudiesSection() {
  return (
    <section
      id="case-studies"
      aria-labelledby="case-studies-heading"
      className="px-6 md:px-12 py-20 md:py-28 max-w-[1200px] mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
      >
        <h2
          id="case-studies-heading"
          className="text-3xl md:text-4xl font-bold text-[var(--color-text)]"
        >
          Case Studies
        </h2>
        <Link
          href="/work"
          className="text-cyan-500 font-medium hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
        >
          View all case studies →
        </Link>
      </motion.div>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-8" role="list">
        {caseStudies.slice(0, 3).map((study, i) => (
          <motion.li
            key={study.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <WorkCard caseStudy={study} variant="compact" />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
