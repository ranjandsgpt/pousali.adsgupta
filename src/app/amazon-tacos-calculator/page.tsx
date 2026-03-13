import type { Metadata } from 'next';
import TacosCalculator from '@/components/TacosCalculator';

export const metadata: Metadata = {
  title: 'Free Amazon TACoS Calculator | Total Advertising Cost of Sales',
  description:
    'Calculate Amazon TACoS instantly. Input ad spend, ad sales, and total store sales to get TACoS, ACOS, ROAS, and organic sales percentage. Free, no signup.',
  keywords: [
    'Amazon TACoS calculator',
    'total advertising cost of sales',
    'TACoS vs ACOS Amazon',
    'Amazon TACoS formula',
    'how to calculate TACoS Amazon',
    'TACOS ACOS ROAS calculator',
  ],
  alternates: {
    canonical: 'https://pousali.adsgupta.com/amazon-tacos-calculator',
  },
};

export default function AmazonTacosCalculatorPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-8 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
            Free Amazon TACoS Calculator
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)]">
            Use this TACoS calculator to understand how your ad spend, ad-attributed sales, and total store
            sales work together. See ACOS, TACoS, ROAS, and the share of your revenue that is organic.
          </p>
        </header>

        <TacosCalculator />

        <section aria-labelledby="tacos-explainer-heading" className="space-y-3">
          <h2
            id="tacos-explainer-heading"
            className="text-2xl font-semibold text-[var(--color-text)]"
          >
            What Does Your TACoS Tell You?
          </h2>
          <p className="text-sm md:text-base text-[var(--color-text-muted)]">
            If your TACoS is falling over time while ACOS stays flat, your organic sales are growing — a sign
            that advertising is building brand momentum rather than just buying revenue.
          </p>
          <p className="text-sm md:text-base text-[var(--color-text-muted)]">
            A high TACoS with a low ACOS means most of your sales are organic — advertising is efficient but
            not the growth driver.
          </p>
          <p className="text-sm md:text-base text-[var(--color-text-muted)]">
            A high TACoS with a high ACOS means advertising is expensive and not well supported by organic
            sales — the most dangerous position.
          </p>
        </section>
      </div>
    </div>
  );
}

