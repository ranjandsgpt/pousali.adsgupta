const expertiseItems = [
  'Amazon Sponsored Products, Brands & Display',
  'TACoS & ACOS Optimisation',
  'Walmart Connect PPC',
  'Google Shopping & Retail Media',
  'Bing Shopping Ads',
  'SP-API Integration & Automated Data Normalisation',
  'Cross-Marketplace Campaign Architecture',
  'Advertising Audit Automation',
  'FBA Fee Analysis & Profit Recovery',
  'Search Term Mining & Negative Keyword Management',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 space-y-16">
        <header className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)]">
            Marketplace Growth Architect | Amazon, Walmart & Retail Media
          </h1>
          <div className="space-y-4 text-lg text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
            <p>
              Pousali Dasgupta is a marketplace growth specialist with a track record of 10x ROI across Amazon,
              Walmart, Google Shopping, and Retail Media. With experience managing multi-marketplace accounts
              across the UK, US, and UAE, she specialises in building scalable advertising frameworks that
              improve TACoS, drive organic ranking, and create durable marketplace moats.
            </p>
            <p>
              Beyond advertising management, Pousali built and shipped an AI-powered Amazon advertising audit tool
              — a multi-agent platform that ingests SP, SB, SD, and Business Report data to produce instant ACOS,
              ROAS, and TACoS diagnostics, waste analysis, and CXO-grade PDF/PPTX exports.
            </p>
          </div>
        </header>

        <section aria-labelledby="expertise-heading" className="space-y-6">
          <h2
            id="expertise-heading"
            className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]"
          >
            Expertise
          </h2>
          <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expertiseItems.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-[var(--color-surface-elevated)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="built-with-heading" className="space-y-4">
          <h2
            id="built-with-heading"
            className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]"
          >
            Built With
          </h2>
          <p className="text-sm md:text-base text-[var(--color-text-muted)]">
            Next.js 14 (App Router) | TypeScript | React | Gemini API | Python (NumPy/Pandas) | Amazon SP-API
            compatible | pptxgenjs | pdfkit | IndexedDB | Vercel
          </p>
          <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-3xl">
            The audit engine uses a canonical aggregation pipeline with mathematical invariant verification. All
            metrics are computed from raw SP Advertised Product Report rows — never deduplicated, never
            estimated. Cross-report reconciliation validates SP, Targeting, and Search Term totals before any
            metric is surfaced.
          </p>
          <div className="pt-2">
            <a
              href="/sample-audit.pdf"
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-5 py-2.5 hover:bg-cyan-400 transition-colors"
            >
              Download Sample Audit PDF →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
