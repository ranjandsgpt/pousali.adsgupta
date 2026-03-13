import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Amazon Agency Audit Tool | Audit 10 Accounts in the Time It Takes to Do One',
  description:
    'Purpose-built for Amazon PPC agencies. Upload SP, SB, SD reports for multiple clients and get client-ready PDF and PPTX exports instantly. Zero reconciliation.',
  keywords: [
    'Amazon agency audit tool',
    'multi-account Amazon audit',
    'client-ready Amazon audit exports',
    'Amazon agency automation',
    'Amazon PPC agency tool',
    'bulk Amazon account audit',
    'Amazon account manager tool',
    'seller report reconciliation software',
    'agency Amazon reporting',
    'Amazon audit automation agency',
  ],
  alternates: {
    canonical: 'https://pousali.adsgupta.com/amazon-agency-audit-tool',
  },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Amazon Agency Audit Tool',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://pousali.adsgupta.com/amazon-agency-audit-tool',
  description:
    'Purpose-built for Amazon PPC agencies to audit multiple client accounts at once, reconcile SP, SB, SD, and Business Reports, and generate client-ready PDF and PPTX exports.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Person',
    name: 'Pousali Dasgupta',
    url: 'https://pousali.adsgupta.com',
  },
};

export default function AmazonAgencyAuditToolPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-8 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
            Amazon Agency Audit Tool
          </h1>
          <h2 className="text-lg md:text-2xl font-semibold text-[var(--color-text-muted)]">
            Audit 10 Client Accounts in the Time It Takes to Do One
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-muted)]">
            Your team spends 40+ hours a week manually reconciling Amazon reports. SP data doesn&apos;t
            match your internal tracking. Business Report totals don&apos;t match SP totals. Every client
            audit is a 4-hour spreadsheet exercise.
          </p>
          <p className="text-base md:text-lg text-[var(--color-text-muted)]">
            We built the tool that ends that.
          </p>
        </header>

        <section aria-labelledby="what-it-does-heading" className="space-y-4">
          <h2
            id="what-it-does-heading"
            className="text-2xl font-semibold text-[var(--color-text)]"
          >
            What It Does
          </h2>
          <ul className="space-y-3 text-sm md:text-base text-[var(--color-text-muted)] list-disc list-inside">
            <li>
              Multi-report ingestion: SP Advertised, SP Targeting, SP Search Term, Business Report — all in
              one upload.
            </li>
            <li>Instant ACOS, ROAS, TACoS with campaign-level breakdown.</li>
            <li>Waste keyword identification (spend with zero conversions).</li>
            <li>Cross-report reconciliation: flags when SP totals don&apos;t match.</li>
            <li>One-click PDF export: 8-page client-ready audit report.</li>
            <li>One-click PPTX export: 10-slide boardroom deck.</li>
          </ul>
        </section>

        <section aria-labelledby="how-it-works-heading" className="space-y-4">
          <h2
            id="how-it-works-heading"
            className="text-2xl font-semibold text-[var(--color-text)]"
          >
            3 Steps
          </h2>
          <ol className="space-y-3 text-sm md:text-base text-[var(--color-text-muted)] list-decimal list-inside">
            <li>
              <span className="font-semibold text-[var(--color-text)]">Upload your Amazon reports</span>{' '}
              — drag and drop up to 10 files per client across SP Advertised, SP Targeting, SP Search Term,
              and Business Report.
            </li>
            <li>
              <span className="font-semibold text-[var(--color-text)]">Let the AI validate and analyse</span>{' '}
              — the engine checks spend, sales, waste, and efficiency with cross-report reconciliation so you
              can trust every number.
            </li>
            <li>
              <span className="font-semibold text-[var(--color-text)]">
                Download a branded client-ready PDF or PPTX
              </span>{' '}
              — present the findings in a boardroom-friendly format without building a single slide by hand.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <Link
            href="/audit"
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-6 py-2.5 hover:bg-cyan-400 transition-colors"
          >
            Run Your First Audit Free →
          </Link>
          <p className="text-sm text-[var(--color-text-muted)]">
            New to Amazon advertising terminology?{' '}
            <Link href="/amazon-audit-glossary" className="text-cyan-400 hover:underline">
              See our Amazon Audit Glossary.
            </Link>
          </p>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </div>
    </div>
  );
}

