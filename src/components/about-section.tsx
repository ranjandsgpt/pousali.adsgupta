'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const bioParagraphs = [
  <>I help brands scale on Amazon as an <Link href="/amazon-ads-consultant" className="text-cyan-500 font-medium hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded">Amazon Ads consultant</Link>, through data-driven advertising, listing optimization, and marketplace growth strategies.</>,
  <>With experience managing multi-marketplace accounts across US and UAE, I specialize in building scalable advertising frameworks that improve TACoS, ACOS, and organic ranking.</>,
];

export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="px-6 md:px-12 py-20 md:py-28 max-w-[1200px] mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl"
      >
        <h2
          id="about-heading"
          className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-6"
        >
          About
        </h2>
        <div className="space-y-4 text-[var(--color-text-muted)] leading-relaxed">
          {bioParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/about"
            className="inline-block mt-6 text-cyan-500 font-medium hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
          >
            Learn more about me →
          </Link>
        </motion.span>
      </motion.div>
    </section>
  );
}
