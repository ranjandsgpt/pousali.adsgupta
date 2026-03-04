'use client';

import { motion } from 'framer-motion';
import { TrendingUp, FileSearch, Search, Rocket, Globe, LucideIcon } from 'lucide-react';
import { expertiseCards } from '@/data/expertise';
import type { ExpertiseCard as ExpertiseCardType } from '@/data/expertise';

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  FileSearch,
  Search,
  Rocket,
  Globe,
};

export function ExpertiseSection() {
  return (
    <section
      id="expertise"
      aria-labelledby="expertise-heading"
      className="px-6 md:px-12 py-20 md:py-28 max-w-[1200px] mx-auto"
    >
      <motion.h2
        id="expertise-heading"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-12"
      >
        Core Expertise
      </motion.h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
        {expertiseCards.map((card: ExpertiseCardType, i: number) => {
          const Icon = iconMap[card.icon] ?? TrendingUp;
          return (
            <motion.li
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6 transition-colors hover:border-cyan-500/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="text-lg font-bold text-[var(--color-text)]">
                  {card.title}
                </h3>
              </div>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                {card.description}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
