'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import type { CaseStudy } from '@/data/case-studies';

interface WorkCardProps {
  caseStudy: CaseStudy;
  variant?: 'compact' | 'full';
}

export default function WorkCard({ caseStudy, variant = 'compact' }: WorkCardProps) {
  const [expanded, setExpanded] = useState(false);

  const content = (
    <motion.article
      layout
      initial={false}
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6 md:p-8 transition-colors hover:border-cyan-500/20"
    >
      <div className="flex flex-col gap-4">
        {caseStudy.category && (
          <span className="text-xs font-medium uppercase tracking-wider text-cyan-500">
            {caseStudy.category}
          </span>
        )}
        <h3 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">
          {caseStudy.title}
        </h3>
        <p className="text-[var(--color-text-muted)] text-sm md:text-base">
          {caseStudy.challenge}
        </p>
        <AnimatePresence mode="wait">
          {expanded || variant === 'full' ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text)] mb-1">
                  Strategy
                </h4>
                <p className="text-[var(--color-text-muted)] text-sm">
                  {caseStudy.strategy}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
                  Results
                </h4>
                <ul className="flex flex-wrap gap-3">
                  {caseStudy.results.map((r) => (
                    <li
                      key={r.metric}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-sm font-medium"
                    >
                      <span className="text-[var(--color-text-muted)]">{r.metric}:</span>
                      <span>{r.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {variant === 'compact' && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 text-sm font-medium text-cyan-500 hover:text-cyan-400 mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
            aria-expanded={expanded}
          >
            {expanded ? 'Show less' : 'View strategy & results'}
            <ChevronDown
              size={16}
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        )}
        {variant === 'full' && (
          <Link
            href={`/work#${caseStudy.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-500 hover:text-cyan-400 mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
          >
            Read full case study
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        )}
      </div>
    </motion.article>
  );

  return variant === 'compact' ? content : content;
}
