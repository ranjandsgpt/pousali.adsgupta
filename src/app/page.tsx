import Hero from '@/components/hero';
import Link from 'next/link';
import { AboutSection } from '@/components/about-section';
import { ExpertiseSection } from '@/components/expertise-section';
import { CaseStudiesSection } from '@/components/case-studies-section';
import { InsightsSection } from '@/components/insights-section';
import { ContactSection } from '@/components/contact-section';

export const metadata = {
  title: 'Pousali Dasgupta | Ecommerce Growth Specialist for Marketplace Brands',
  description:
    'Ecommerce growth specialist Pousali Dasgupta helps marketplace brands scale through Amazon PPC optimization, Walmart marketplace growth and Google Ads performance marketing.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com',
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="px-6 md:px-12 pt-6 pb-10 max-w-[1200px] mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
          Ecommerce Growth Specialist for Marketplace Brands
        </h1>
        <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-3xl mb-3">
          <Link href="/pousali-dasgupta" className="text-cyan-500 font-semibold hover:text-cyan-400">
            Pousali Dasgupta
          </Link>{' '}
          is an ecommerce growth consultant specializing in marketplace advertising, including Amazon PPC optimization, Walmart
          marketplace growth strategies, and Google Ads performance marketing.
        </p>
        <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-3xl mb-6">
          By combining data-driven campaign optimization with marketplace expansion strategies, Pousali Dasgupta helps ecommerce
          brands scale revenue, improve ACOS and TACOS, and build durable marketplace moats.
        </p>

        <section aria-labelledby="pousali-faq-heading" className="mt-8 border-t border-white/10 pt-6">
          <h2 id="pousali-faq-heading" className="text-2xl font-semibold text-[var(--color-text)] mb-4">
            FAQs about Pousali Dasgupta
          </h2>
          <dl className="space-y-4 text-[var(--color-text-muted)]">
            <div>
              <dt className="font-semibold text-[var(--color-text)]">Who is Pousali Dasgupta?</dt>
              <dd>
                Pousali Dasgupta is an ecommerce growth consultant focused on helping marketplace brands scale profitably through
                performance advertising and marketplace analytics.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text)]">What does Pousali Dasgupta specialize in?</dt>
              <dd>
                She specializes in Amazon PPC, Walmart marketplace growth and Google Ads optimization, with a focus on ACOS and
                TACOS control, search term mining and campaign structure.
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
          <script
            type="application/ld+json"
            // FAQ schema for homepage
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'Who is Pousali Dasgupta?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text:
                        'Pousali Dasgupta is an ecommerce growth consultant focused on helping marketplace brands scale profitably through performance advertising and marketplace analytics.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What does Pousali Dasgupta specialize in?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text:
                        'She specializes in Amazon PPC, Walmart marketplace growth and Google Ads optimization, with a focus on ACOS and TACOS control, search term mining and campaign structure.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'How can I work with Pousali Dasgupta?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text:
                        'You can explore services on the services page or request a consultation via the contact page on pousali.adsgupta.com.',
                    },
                  },
                ],
              }),
            }}
          />
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
