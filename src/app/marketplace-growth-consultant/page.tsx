import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title:
    'Marketplace Growth Consultant | Amazon, Walmart & Retail Media | Pousali Dasgupta',
  description:
    'Pousali Dasgupta is a marketplace growth consultant specialising in Amazon, Walmart, Google Shopping, and Retail Media. 10x ROI track record across D2C brands and agencies.',
  keywords: [
    'marketplace growth consultant',
    'Amazon growth consultant',
    'Walmart advertising consultant',
    'retail media consultant',
    'marketplace paid ads specialist',
    'Amazon PPC consultant',
    'ecommerce growth consultant',
    'marketplace leader',
    'accelerate marketplace growth',
    'marketplace ROI specialist',
    'brand manager Amazon',
    'marketplace advertising expert',
    'cross-marketplace growth',
    'marketplace consultancy',
  ],
  alternates: {
    canonical: 'https://pousali.adsgupta.com/marketplace-growth-consultant',
  },
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Pousali Dasgupta',
  jobTitle: 'Marketplace Growth Consultant',
  url: 'https://pousali.adsgupta.com',
  sameAs: ['https://www.linkedin.com/in/pousali-dasgupta/'],
  description:
    'Marketplace growth consultant specialising in Amazon, Walmart, Google Shopping, and Retail Media for D2C brands and agencies.',
};

export default function MarketplaceGrowthConsultantPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-8 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
            Marketplace Growth Consultant
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)]">
            As marketplaces mature, incremental growth no longer comes from turning a single PPC knob. It
            comes from orchestrating product, pricing, merchandising, and paid media across multiple
            platforms — while keeping TACoS in check and protecting profitability.
          </p>
          <p className="text-base md:text-lg text-[var(--color-text-muted)]">
            Pousali Dasgupta works with D2C brands and agencies as a marketplace growth consultant, designing
            architectures that treat Amazon, Walmart, Google Shopping, Bing, and Meta as a connected system
            rather than isolated channels.
          </p>
        </header>

        <section aria-labelledby="platforms-covered-heading" className="space-y-3">
          <h2
            id="platforms-covered-heading"
            className="text-2xl font-semibold text-[var(--color-text)]"
          >
            Platforms Covered
          </h2>
          <p className="text-sm md:text-base text-[var(--color-text-muted)]">
            Amazon · Walmart · Google Shopping · Bing Shopping · Meta (Facebook & Instagram) · Retail Media
            networks.
          </p>
        </section>

        <section aria-labelledby="methodology-heading" className="space-y-4">
          <h2
            id="methodology-heading"
            className="text-2xl font-semibold text-[var(--color-text)]"
          >
            Methodology
          </h2>
          <p className="text-sm md:text-base text-[var(--color-text-muted)]">
            Engagements typically begin with an audit of your existing marketplace footprint. Using the
            Amazon audit engine and a custom diagnostics layer for non-Amazon channels, we identify where
            spend is misallocated, where organic rank is fragile, and where structural issues in catalogue,
            pricing, or logistics are capping growth.
          </p>
          <p className="text-sm md:text-base text-[var(--color-text-muted)]">
            From there, we design a growth architecture: campaign structures that scale across marketplaces,
            TACoS guardrails, launch frameworks for new SKUs, and reporting that surfaces the few metrics
            leadership should actually watch. The goal is simple — compress the time between testing, learning,
            and scaling profitable channels.
          </p>
        </section>

        <section aria-labelledby="who-this-is-for-heading" className="space-y-4">
          <h2
            id="who-this-is-for-heading"
            className="text-2xl font-semibold text-[var(--color-text)]"
          >
            Who This Is For
          </h2>
          <ul className="space-y-2 text-sm md:text-base text-[var(--color-text-muted)] list-disc list-inside">
            <li>D2C brands plateauing on Amazon and looking to unlock the next growth wave.</li>
            <li>
              Agencies that want a marketplace architect to design frameworks their account managers can
              operate.
            </li>
            <li>
              Marketplace leaders who need a partner to translate board-level revenue targets into tactical ad
              playbooks.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-6 py-2.5 hover:bg-cyan-400 transition-colors"
          >
            Discuss a Marketplace Growth Engagement →
          </Link>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </div>
    </div>
  );
}

