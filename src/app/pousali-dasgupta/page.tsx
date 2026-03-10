import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pousali Dasgupta | Ecommerce Growth Consultant',
  description:
    'Professional profile of Pousali Dasgupta, ecommerce growth consultant specializing in Amazon, Walmart marketplace growth, and Google Ads optimization.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com/pousali-dasgupta',
  },
  openGraph: {
    title: 'Pousali Dasgupta | Ecommerce Growth Consultant',
    description:
      'Ecommerce growth consultant helping brands scale through Amazon advertising, Walmart marketplace optimization, and Google Ads strategies.',
    url: 'https://pousali.adsgupta.com/pousali-dasgupta',
    siteName: 'Pousali Dasgupta',
    type: 'profile',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pousali Dasgupta | Ecommerce Growth Consultant',
    description:
      'Ecommerce growth consultant specializing in Amazon PPC, Walmart marketplace growth, and Google Ads optimization.',
    images: ['/og/default.png'],
  },
};

export default function PousaliProfilePage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-10 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
            Pousali Dasgupta — Ecommerce Growth Consultant
          </h1>
          <p className="text-[var(--color-text-muted)] text-base md:text-lg max-w-2xl">
            Pousali Dasgupta helps ecommerce brands optimize marketplace advertising across Amazon, Walmart and other ecommerce
            platforms through data-driven growth strategies.
          </p>
        </header>

        <section aria-labelledby="who-heading" className="space-y-3">
          <h2 id="who-heading" className="text-2xl font-semibold text-[var(--color-text)]">
            Who is Pousali Dasgupta
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Pousali Dasgupta is an ecommerce growth specialist focused on marketplace brands. She combines performance advertising,
            marketplace analytics and experimentation to help brands scale revenue while protecting profitability.
          </p>
        </section>

        <section aria-labelledby="experience-heading" className="space-y-3">
          <h2 id="experience-heading" className="text-2xl font-semibold text-[var(--color-text)]">
            Ecommerce Growth Experience
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Her experience spans full-funnel Amazon PPC programs, marketplace launch playbooks, campaign restructures and long-term
            TACOS control initiatives. Pousali has worked with marketplace-native brands as well as DTC and retail brands expanding
            into Amazon and Walmart.
          </p>
        </section>

        <section aria-labelledby="marketplace-heading" className="space-y-3">
          <h2 id="marketplace-heading" className="text-2xl font-semibold text-[var(--color-text)]">
            Marketplace Advertising Expertise
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Pousali focuses on marketplace advertising systems: precise keyword and product targeting, budget allocation, creative
            testing, and aligning on-page experience with ad traffic to improve conversion rates and customer lifetime value.
          </p>
        </section>

        <section aria-labelledby="amazon-heading" className="space-y-3">
          <h2 id="amazon-heading" className="text-2xl font-semibold text-[var(--color-text)]">
            Amazon Advertising Strategy
          </h2>
          <p className="text-[var(--color-text-muted)]">
            On Amazon, she designs account structures that separate prospecting, harvesting and scaling campaigns, pairs them with
            disciplined search term mining, and measures impact using ACOS, TACOS and contribution margin instead of vanity metrics.
          </p>
        </section>

        <section aria-labelledby="walmart-heading" className="space-y-3">
          <h2 id="walmart-heading" className="text-2xl font-semibold text-[var(--color-text)]">
            Walmart Marketplace Growth
          </h2>
          <p className="text-[var(--color-text-muted)]">
            For Walmart marketplace, Pousali helps brands localize assortments, align retail readiness with ad traffic, and build
            repeatable growth playbooks that complement Amazon rather than simply mirroring campaigns.
          </p>
        </section>

        <section aria-labelledby="google-heading" className="space-y-3">
          <h2 id="google-heading" className="text-2xl font-semibold text-[var(--color-text)]">
            Google Ads Optimization
          </h2>
          <p className="text-[var(--color-text-muted)]">
            With Google Ads, she emphasizes intent segmentation, product feed quality and landing page alignment, connecting upper
            funnel discovery with lower-funnel conversion and remarketing sequences.
          </p>
        </section>

        <section aria-labelledby="case-studies-heading" className="space-y-3">
          <h2 id="case-studies-heading" className="text-2xl font-semibold text-[var(--color-text)]">
            Case Studies
          </h2>
          <p className="text-[var(--color-text-muted)]">
            You can explore selected client outcomes and campaign frameworks in the{' '}
            <Link href="/case-studies" className="text-cyan-500 hover:underline">
              case studies
            </Link>{' '}
            section, which covers ACOS reduction, TACOS stabilization and scaling profitable search terms.
          </p>
        </section>

        <section aria-labelledby="contact-heading" className="space-y-3">
          <h2 id="contact-heading" className="text-2xl font-semibold text-[var(--color-text)]">
            Contact
          </h2>
          <p className="text-[var(--color-text-muted)]">
            To discuss working with{' '}
            <span className="font-semibold text-[var(--color-text)]">Pousali Dasgupta</span> on ecommerce growth, you can{' '}
            <Link href="/contact" className="text-cyan-500 hover:underline">
              request a consultation
            </Link>{' '}
            or review the{' '}
            <Link href="/services" className="text-cyan-500 hover:underline">
              services page
            </Link>{' '}
            for more detail.
          </p>
        </section>
      </div>
    </div>
  );
}

