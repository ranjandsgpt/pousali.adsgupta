'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ConsultationCta } from '@/components/consultation-cta';

export default function AmazonPpcManagementPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">Amazon PPC Management</h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl">
            End-to-end PPC management: campaign management, bid optimization, keyword strategy and campaign scaling.
          </p>
        </motion.header>
        <section className="mb-12">
          <p className="text-[var(--color-text-muted)] mb-6">
            Scale profitable campaigns, reduce ACOS and increase marketplace sales with structured Amazon PPC management.
          </p>
          <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400">
            Contact for PPC Management Consultation
          </Link>
        </section>
        <div className="mb-12"><ConsultationCta /></div>
        <p className="text-sm text-[var(--color-text-muted)]">
          <Link href="/amazon-advertising-resources" className="text-cyan-500 hover:underline">Resources</Link>
          {' · '}
          <Link href="/contact" className="text-cyan-500 hover:underline">Contact</Link>
        </p>
      </div>
    </div>
  );
}
