'use client';

import { motion } from 'framer-motion';

export default function ToolsPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">Amazon Advertising Tools</h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl">
            This section will host tools such as: Amazon PPC audit tools, keyword opportunity analyzers, campaign performance dashboards.
          </p>
        </motion.header>
        <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">Tools coming soon.</p>
        </section>
      </div>
    </div>
  );
}
