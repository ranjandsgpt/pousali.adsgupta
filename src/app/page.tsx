import Hero from '@/components/hero';
import Link from 'next/link';
import { AboutSection } from '@/components/about-section';
import { ExpertiseSection } from '@/components/expertise-section';
import { CaseStudiesSection } from '@/components/case-studies-section';
import { InsightsSection } from '@/components/insights-section';
import { ContactSection } from '@/components/contact-section';
import ProfitLeakageCalculator from '@/components/ProfitLeakageCalculator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pousali Dasgupta | Amazon & Marketplace Growth Specialist | 10x ROI',
  description:
    'Pousali Dasgupta helps brands achieve 10x marketplace ROI across Amazon, Walmart, and Retail Media. Amazon PPC strategy, advertising audit automation, and marketplace growth architecture.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com',
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="px-6 md:px-12 pt-6 pb-10 max-w-[1200px] mx-auto space-y-10">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-3">
            10x Marketplace Growth Across Amazon, Walmart & Retail Media
          </h1>
          <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-muted)] mb-4">
            Amazon PPC Strategy · Advertising Audit Automation · Multi-Marketplace Growth Architecture
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-3xl">
            Pousali Dasgupta is a marketplace growth specialist helping D2C brands and agencies accelerate revenue across Amazon,
            Walmart, Google Shopping, and Retail Media. From ACOS optimisation to full-funnel marketplace strategy — and the audit
            tool that powers it.
          </p>
        </header>

        <section
          aria-label="Persona call-to-actions"
          className="grid gap-4 md:gap-6 md:grid-cols-3"
        >
          <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                Running an Amazon Agency?
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Audit 10 client accounts in the time it takes to do one. Client-ready PDF exports in 60 seconds.
              </p>
            </div>
            <Link
              href="/amazon-agency-audit-tool"
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-4 py-2 mt-auto hover:bg-cyan-400 transition-colors"
            >
              See the Agency Tool →
            </Link>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                Losing Money on Amazon?
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                The average seller loses 1–3% of revenue to invisible leakages. Find yours instantly.
              </p>
            </div>
            <Link
              href="/amazon-profit-leakage-audit"
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-4 py-2 mt-auto hover:bg-cyan-400 transition-colors"
            >
              Find My Profit Leakage →
            </Link>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                Looking for a Marketplace Architect?
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                10x ROI track record. Built an AI-powered audit tool from scratch. Available for senior roles and partnerships.
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-4 py-2 mt-auto hover:bg-cyan-400 transition-colors"
            >
              View the Architecture →
            </Link>
          </article>
        </section>

        <section
          aria-label="Platforms"
          className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Driving growth across every major marketplace
          </p>
          <p className="text-sm md:text-base text-[var(--color-text)]">
            Amazon · Walmart · Google Shopping · Bing · Meta
          </p>
        </section>

        <section aria-labelledby="what-i-fix-heading" className="space-y-4">
          <h2
            id="what-i-fix-heading"
            className="text-2xl font-semibold text-[var(--color-text)]"
          >
            What I Fix
          </h2>
          <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'ACOS & TACOS Optimisation',
              'Wasted Ad Spend Recovery',
              'Inventory Reconciliation',
              'FBA Fee Overcharges',
              'Cross-Marketplace Expansion',
              'Advertising Audit Automation',
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-[var(--color-surface-elevated)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Profit leakage calculator">
          <ProfitLeakageCalculator />
        </section>

        <section aria-labelledby="pousali-faq-heading" className="mt-4 border-t border-white/10 pt-6">
          <h2 id="pousali-faq-heading" className="text-2xl font-semibold text-[var(--color-text)] mb-4">
            FAQs about Pousali Dasgupta
          </h2>
          <dl className="space-y-4 text-[var(--color-text-muted)]">
            <div>
              <dt className="font-semibold text-[var(--color-text)]">Who is Pousali Dasgupta?</dt>
              <dd>
                Pousali Dasgupta is a marketplace growth specialist focused on helping brands and agencies scale profitably across
                Amazon, Walmart, Google Shopping, and Retail Media.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text)]">What does Pousali Dasgupta specialize in?</dt>
              <dd>
                She specializes in Amazon PPC strategy, retail media architecture, ACOS and TACOS optimisation, and automated
                advertising audits powered by AI.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text)]">How can I work with Pousali Dasgupta?</dt>
              <dd>
                You can explore services on the{' '}
                <Link href="/services" className="text-cyan-500 hover:underline">
                  services page
                </Link>{' '}
                or request a consultation via the{' '}
                <Link href="/contact" className="text-cyan-500 hover:underline">
                  contact page
                </Link>
                .
              </dd>
            </div>
          </dl>
        </section>
      </section>
      <AboutSection />
      <ExpertiseSection />
      <CaseStudiesSection />
      <InsightsSection />
      <ContactSection />
    </>
  );
}
