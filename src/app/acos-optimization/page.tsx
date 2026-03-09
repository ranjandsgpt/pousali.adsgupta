'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FAQSection } from '@/components/faq-section';
import { LandingCtaSection } from '@/components/landing-cta-section';
import { ConsultationCta } from '@/components/consultation-cta';
import { RelatedCaseStudies } from '@/components/related-case-studies';
import type { FAQItem } from '@/components/faq-section';

const sections = [
  { title: 'Understanding ACOS', description: 'Advertising Cost of Sales—what it measures, how it differs from TACoS, and when to optimize for each.' },
  { title: 'How to Reduce ACOS', description: 'Bid and budget adjustments, negative keywords, and placement strategy to lower cost per sale without losing volume.' },
  { title: 'Campaign Restructuring', description: 'Reorganizing campaigns by performance and intent to isolate winners and cut waste.' },
  { title: 'Search Term Optimization', description: 'Using search term reports to add negatives, harvest winners, and improve match-type allocation.' },
];

const faqItems: FAQItem[] = [
  {
    question: 'What is ACOS and why does it matter?',
    answer:
      'ACOS (Advertising Cost of Sales) is ad spend divided by attributed sales. It shows how efficiently ads drive sales; lower ACOS with stable or growing revenue usually means better profitability.',
  },
  {
    question: 'How can I reduce my Amazon ACOS?',
    answer:
      'Reduce ACOS through smarter bids and budgets, negative keywords, placement adjustments, and campaign restructuring so high performers get more budget and underperformers are trimmed.',
  },
  {
    question: 'What is the difference between ACOS and TACoS?',
    answer:
      'ACOS measures paid advertising efficiency; TACoS includes total marketing cost (including promotions, deals) vs. total revenue. Both matter—optimize ACOS for paid efficiency and TACoS for overall margin.',
  },
  {
    question: 'How long does ACOS optimization take?',
    answer:
      'Initial changes can show impact in 2–4 weeks. Sustained improvement depends on account size, competition, and consistent optimization; many accounts see meaningful results within 1–3 months.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

export default function AcosOptimizationPage() {
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
            Amazon ACOS Optimization
          </h1>
        </motion.header>

        <section aria-labelledby="sections-heading" className="mb-20">
          <h2
            id="sections-heading"
            className="sr-only"
          >
            Optimization overview
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
            {sections.map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6"
              >
                <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
                  {item.title}
                </h3>
                <p className="text-[var(--color-text-muted)] text-sm">
                  {item.description}
                </p>
              </motion.li>
            ))}
          </ul>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-12 rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-8 text-center"
        >
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
          >
            Optimize Your Campaigns
          </Link>
        </motion.section>

        <FAQSection
          id="faq"
          headingId="faq-heading"
          title="Frequently Asked Questions"
          items={faqItems}
          schema={faqSchema}
        />

        <LandingCtaSection />

        <div className="mb-12"><ConsultationCta /></div>
        <RelatedCaseStudies />

        <p className="text-sm text-[var(--color-text-muted)]">
          <Link href="/work" className="text-cyan-500 hover:underline">Work</Link>
          {' · '}
          <Link href="/contact" className="text-cyan-500 hover:underline">Contact</Link>
        </p>
      </div>
    </div>
  );
}
