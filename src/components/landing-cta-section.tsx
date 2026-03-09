'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function LandingCtaSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className="mb-12 rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-8 md:p-10 text-center"
      aria-labelledby="cta-heading"
    >
      <h2 id="cta-heading" className="text-2xl font-bold text-[var(--color-text)] mb-4">
        Scale Your Amazon Advertising
      </h2>
      <p className="text-[var(--color-text-muted)] max-w-xl mx-auto mb-6">
        Work with an Amazon advertising specialist to improve ACOS, grow sales and optimize campaign performance.
      </p>
      <Link
        href="/contact"
        className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
      >
        Contact for Consultation
      </Link>
    </motion.section>
  );
}
