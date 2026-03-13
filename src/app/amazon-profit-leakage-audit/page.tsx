import type { Metadata } from 'next';
import ProfitLeakageCalculator from '@/components/ProfitLeakageCalculator';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Amazon Profit Leakage Audit | Find Your Hidden Losses in 60 Seconds',
  description:
    'Upload your Amazon reports and find exactly where you are losing money. FBA fee discrepancies, wasted ad spend, zero-conversion keywords, ACOS overruns — identified instantly.',
  keywords: [
    'Amazon profit leakage audit',
    'FBA reimbursement finder',
    'Amazon seller fee transparency',
    'hidden Amazon fees finder',
    'Amazon FBA fee overcharge',
    'Amazon settlement discrepancy',
    'zero conversion keywords Amazon',
    'Amazon wasted spend finder',
    'Amazon refund administration fee',
    'inventory reconciliation Amazon',
    'lost damaged units FBA',
    'inbound shipment errors Amazon',
  ],
  alternates: {
    canonical: 'https://pousali.adsgupta.com/amazon-profit-leakage-audit',
  },
};

export default function AmazonProfitLeakageAuditPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1000px] mx-auto px-6 md:px-8 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
            Amazon Profit Leakage Audit
          </h1>
          <h2 className="text-lg md:text-2xl font-semibold text-[var(--color-text-muted)]">
            Find Your Hidden Losses in 60 Seconds
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-muted)]">
            The average Amazon seller loses 1–3% of revenue to invisible leakages every month. Most never
            find them because Amazon&apos;s reports are too fragmented to read without automation.
          </p>
        </header>

        <ProfitLeakageCalculator />

        <section aria-labelledby="what-we-look-for-heading" className="space-y-5">
          <h2
            id="what-we-look-for-heading"
            className="text-2xl font-semibold text-[var(--color-text)]"
          >
            What We Look For
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Wasted Ad Spend</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Search terms that received clicks but generated zero sales. Your budget funds Amazon&apos;s
                algorithm, not your revenue. Found in: SP Search Term Report.
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Stat: Average account: 18% of ad spend on zero-conversion terms.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">ACOS Overrun</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Campaigns running above breakeven ACOS silently erode margin with every click. Found in: SP
                Advertised Product Report.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Inventory Reconciliation Errors</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                FBA units Amazon confirmed receiving vs units you actually sent. Discrepancies are
                reimbursable — but only if you identify them. Found in: FBA Reconciliation Report.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Inbound Shipment Discrepancies</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                What you sent and what Amazon checked in are routinely different. Each unit discrepancy is a
                reimbursement claim waiting to be filed. Found in: Shipment Report.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                FBA Dimensional Weight Changes
              </h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Amazon periodically reweighs and recalculates FBA fulfilment and storage fees. Overcharges
                happen and go unnoticed without systematic checking.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Refund Administration Fee</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                When a customer returns a product, Amazon retains 20% of the referral fee as a refund
                administration charge. Most sellers never track this at scale.
              </p>
            </article>
          </div>
        </section>

        <section className="space-y-3">
          <Link
            href="/audit"
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-6 py-2.5 hover:bg-cyan-400 transition-colors"
          >
            Find My Profit Leakages Now →
          </Link>
        </section>
      </div>
    </div>
  );
}

