'use client';

import { motion } from 'framer-motion';
import { caseStudies } from '@/data/case-studies';
import WorkCard from '@/components/work-card';

export default function WorkPageContent() {
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
            Work & Case Studies
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl">
            Selected projects in Amazon PPC, product launch, and marketplace growth.
          </p>
        </motion.header>

        <ul className="space-y-12" role="list">
          {caseStudies.map((study, i) => (
            <motion.li
              key={study.id}
              id={study.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <WorkCard caseStudy={study} variant="full" />
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
