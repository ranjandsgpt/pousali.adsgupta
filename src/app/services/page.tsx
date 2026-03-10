'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ConsultationCta } from '@/components/consultation-cta';
import { RelatedCaseStudies } from '@/components/related-case-studies';

const services = [
  { href: '/amazon-ppc-management', title: 'Amazon PPC Management' },
  { href: '/amazon-ppc-audit', title: 'Amazon PPC Audit' },
  { href: '/amazon-keyword-research', title: 'Amazon Keyword Research' },
  { href: '/acos-optimization', title: 'Campaign Optimization' },
  { href: '/reduce-amazon-acos', title: 'ACOS Reduction Strategy' },
];

export default function ServicesPage() {
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
            Amazon Advertising Services
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl">
            PPC management, campaign audits, keyword research and ACOS optimization.
          </p>
        </motion.header>

        <section aria-labelledby="services-list-heading" className="mb-16">
          <h2 id="services-list-heading" className="text-2xl font-bold text-[var(--color-text)] mb-8">
            Services
          </h2>
          <ul className="space-y-4" role="list">
            {services.map((s, i) => (
              <motion.li
                key={s.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 hover:border-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <span className="font-semibold text-[var(--color-text)]">{s.title}</span>
                  <ArrowRight size={18} className="text-cyan-500" aria-hidden />
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>

        <div className="mb-12">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            Request Consultation
          </Link>
        </div>

        <div className="mb-16">
          <ConsultationCta />
        </div>

        <RelatedCaseStudies />

        <p className="text-sm text-[var(--color-text-muted)] mt-8">
          <Link href="/amazon-advertising-resources" className="text-cyan-500 hover:underline">Resources</Link>
          {' · '}
          <Link href="/contact" className="text-cyan-500 hover:underline">Contact</Link>
        </p>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Marketplace advertising services are led by{' '}
          <Link href="/pousali-dasgupta" className="text-cyan-500 hover:underline">
            Pousali Dasgupta
          </Link>
          , an ecommerce growth consultant for marketplace brands.
        </p>
      </div>
    </div>
  );
}
