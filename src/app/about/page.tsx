'use client';

import { motion } from 'framer-motion';
import { experience } from '@/data/experience';

const skills = [
  'Amazon Ads',
  'PPC strategy',
  'Search term mining',
  'Product launch strategy',
  'Marketplace analytics',
];

export default function AboutPage() {
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
            About
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Professional bio focused on Amazon advertising and brand growth. I help
            brands scale on Amazon through data-driven advertising, listing
            optimization, and marketplace growth strategies across US and UAE.
          </p>
        </motion.header>

        <section aria-labelledby="skills-heading" className="mb-20">
          <h2
            id="skills-heading"
            className="text-2xl font-bold text-[var(--color-text)] mb-8"
          >
            Skills
          </h2>
          <ul className="flex flex-wrap gap-3" role="list">
            {skills.map((skill, i) => (
              <motion.li
                key={skill}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-sm font-medium"
              >
                {skill}
              </motion.li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="experience-heading">
          <h2
            id="experience-heading"
            className="text-2xl font-bold text-[var(--color-text)] mb-8"
          >
            Experience
          </h2>
          <ul className="space-y-0" role="list">
            {experience.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative pl-8 pb-12 last:pb-0"
              >
                <span
                  className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-cyan-500"
                  aria-hidden
                />
                <span
                  className="absolute left-[5px] top-6 bottom-0 w-px bg-white/10"
                  aria-hidden
                />
                <div className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-cyan-500 mb-1">
                    {item.period}
                  </p>
                  <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[var(--color-text-muted)] text-sm mb-4">
                    {item.description}
                  </p>
                  <ul className="space-y-1">
                    {item.highlights.map((h) => (
                      <li
                        key={h}
                        className="text-sm text-[var(--color-text-muted)] flex items-start gap-2"
                      >
                        <span className="text-cyan-500 mt-1.5 shrink-0">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
