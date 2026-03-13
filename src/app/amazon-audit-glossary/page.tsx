import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Amazon Advertising Audit Glossary | ACOS, TACOS, ROAS & More',
  description:
    'Complete glossary of Amazon advertising audit terms. ACOS, TACOS, ROAS, wasted spend, profit leakage, inventory reconciliation, FBA reimbursements — defined clearly.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com/amazon-audit-glossary',
  },
};

const glossaryJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: 'Amazon Advertising Audit Glossary',
  url: 'https://pousali.adsgupta.com/amazon-audit-glossary',
};

interface GlossaryEntry {
  term: string;
  body: React.ReactNode;
}

const entries: GlossaryEntry[] = [
  {
    term: 'ACOS',
    body: (
      <>
        <p>
          Advertising Cost of Sales. ACOS is calculated as ad spend divided by ad-attributed sales. It tells
          you how much you spend in ads to generate one unit of revenue.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Core profitability metric for Amazon ads.
          Used to set bid and budget guardrails. See also TACoS and{' '}
          <Link href="/amazon-tacos-calculator" className="text-cyan-400 hover:underline">
            TACoS calculator
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    term: 'TACoS',
    body: (
      <>
        <p>
          Total Advertising Cost of Sales. TACoS is calculated as ad spend divided by total store sales
          (ad-attributed + organic). It reflects how dependent your revenue is on paid media.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> TACoS trend is a leading indicator of
          whether advertising is building organic momentum or just buying revenue.
        </p>
      </>
    ),
  },
  {
    term: 'ROAS',
    body: (
      <>
        <p>
          Return on Ad Spend. ROAS is calculated as ad-attributed sales divided by ad spend. It is the inverse
          of ACOS and is often expressed as a &quot;3.5x&quot; style multiple.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Easy for leadership teams to interpret when
          comparing channels and campaigns side-by-side.
        </p>
      </>
    ),
  },
  {
    term: 'CPC',
    body: (
      <>
        <p>
          Cost Per Click. The average amount you pay for a single click on your ad. Calculated as total spend
          divided by total clicks.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Rising CPC with flat conversion usually
          signals increasing competition or poor query-to-product fit.
        </p>
      </>
    ),
  },
  {
    term: 'CTR',
    body: (
      <>
        <p>
          Click-Through Rate. The percentage of impressions that turn into clicks. Calculated as clicks divided
          by impressions.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Indicates ad relevance and creative strength.
          Low CTR suggests weak targeting or uncompetitive creative.
        </p>
      </>
    ),
  },
  {
    term: 'CVR',
    body: (
      <>
        <p>
          Conversion Rate. The percentage of clicks that result in an order. On Amazon, CVR is usually
          calculated as orders divided by clicks.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Sensitive to pricing, reviews, content, and
          competition. High CVR supports higher bids.
        </p>
      </>
    ),
  },
  {
    term: 'Ad CVR vs Session CVR',
    body: (
      <>
        <p>
          Ad CVR uses ad clicks as the denominator, while Session CVR (from Business Reports) uses total
          sessions. The gap between the two highlights how efficiently paid traffic converts vs all traffic.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Large gaps can indicate targeting issues or
          misalignment between ad creative and product page.
        </p>
      </>
    ),
  },
  {
    term: 'Wasted Ad Spend',
    body: (
      <>
        <p>
          Ad spend that generates clicks but no attributed orders over the attribution window. Often sits in
          broad or auto campaigns with weak negative keyword coverage.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> First place to look when running a profit
          leakage audit. See Zero-Conversion Keywords.
        </p>
      </>
    ),
  },
  {
    term: 'Zero-Conversion Keywords',
    body: (
      <>
        <p>
          Search terms or targets that have generated clicks but zero orders over a meaningful sample size.
          Often symptomatic of poor query-to-product fit or low product page conversion.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Removing or negating these keywords usually
          yields instant ACOS improvement.
        </p>
      </>
    ),
  },
  {
    term: 'Search Term Report',
    body: (
      <>
        <p>
          Amazon report listing the actual customer search queries that triggered your ads, along with clicks,
          spend, and conversions.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Primary source for keyword mining and waste
          identification in any audit.
        </p>
      </>
    ),
  },
  {
    term: 'Targeting Report',
    body: (
      <>
        <p>
          Report that shows performance at the target level (keywords, ASINs, categories) rather than the raw
          search term level.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Helps identify underperforming targets even
          when individual search terms are noisy.
        </p>
      </>
    ),
  },
  {
    term: 'Advertised Product Report',
    body: (
      <>
        <p>
          SP Advertised Product Report summarises performance at the advertised ASIN-level. Each row represents
          an ASIN within a campaign.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Core input for the audit engine&apos;s
          canonical aggregation layer.
        </p>
      </>
    ),
  },
  {
    term: 'Business Report',
    body: (
      <>
        <p>
          Amazon Business Reports provide view and sales metrics at the ASIN level, including sessions, page
          views, and unit session percentage.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Used to reconcile organic vs ad-driven sales
          and validate ad attribution.
        </p>
      </>
    ),
  },
  {
    term: 'Organic Sales',
    body: (
      <>
        <p>
          Sales that occur without a direct ad click in the attribution window. Estimated as total store sales
          minus ad-attributed sales.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Organic sales share is the real measure of
          brand strength on Amazon.
        </p>
      </>
    ),
  },
  {
    term: 'Ad-Attributed Sales',
    body: (
      <>
        <p>
          Revenue credited to an ad click within the attribution window (usually 7 or 14 days depending on
          placement and ad type).
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Core input for ACOS and ROAS calculations.
        </p>
      </>
    ),
  },
  {
    term: 'Halo Sales (Other SKU Sales)',
    body: (
      <>
        <p>
          Sales attributed to an ad where the ordered ASIN is different from the advertised ASIN. Indicates
          basket-building and cross-selling effects.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Important for brands with strong catalogues
          where ads drive ecosystem rather than single SKU performance.
        </p>
      </>
    ),
  },
  {
    term: 'Breakeven ACOS',
    body: (
      <>
        <p>
          The highest ACOS at which you do not lose money on a sale. Calculated using product margin after all
          fees and cost of goods.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Essential for setting ACOS targets by SKU and
          avoiding silent margin erosion.
        </p>
      </>
    ),
  },
  {
    term: 'Impression Share',
    body: (
      <>
        <p>
          The percentage of available impressions your ads received for a given set of queries or placements.
          Often available in Sponsored Brands and Display reporting.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Indicates headroom for scaling spend on
          winning segments.
        </p>
      </>
    ),
  },
  {
    term: 'Top-of-Search Impression Share',
    body: (
      <>
        <p>
          The percentage of impressions your ads receive in the premium top-of-search placement vs other
          placements.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Critical for high-intent queries where top
          positions capture the majority of clicks.
        </p>
      </>
    ),
  },
  {
    term: 'Exact Match',
    body: (
      <>
        <p>
          Keyword match type where the customer search term must closely match your keyword to trigger an ad.
          Provides tight control over queries.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Backbone of mature campaign structures and
          hero keyword defence.
        </p>
      </>
    ),
  },
  {
    term: 'Broad Match',
    body: (
      <>
        <p>
          Match type that allows your ad to show on a wide variety of related searches, including synonyms and
          reordered terms.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Powerful for discovery, but dangerous without
          strong negative keyword hygiene.
        </p>
      </>
    ),
  },
  {
    term: 'Phrase Match',
    body: (
      <>
        <p>
          Match type where the customer search term must contain your keyword phrase in the same order, with
          words allowed before or after.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Balance between control and discovery when
          building out mid-funnel coverage.
        </p>
      </>
    ),
  },
  {
    term: 'Auto Campaign',
    body: (
      <>
        <p>
          Sponsored Products campaign type where Amazon automatically matches your ads to relevant search terms
          and products using its own signals.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Great for discovery, but must be paired with
          regular negative keyword pruning to avoid waste.
        </p>
      </>
    ),
  },
  {
    term: 'Match Type "-" (Auto in Targeting Report)',
    body: (
      <>
        <p>
          In Targeting Reports, a dash (&quot;-&quot;) often represents automatic targeting rather than a
          specific keyword match type.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Helps distinguish between manual and auto
          traffic when auditing performance.
        </p>
      </>
    ),
  },
  {
    term: 'Inventory Reconciliation',
    body: (
      <>
        <p>
          Process of comparing the units you shipped to Amazon with the units Amazon confirms receiving and
          holding in stock.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Identifies lost, damaged, or missing units
          eligible for reimbursement.
        </p>
      </>
    ),
  },
  {
    term: 'Lost and Damaged Units',
    body: (
      <>
        <p>
          FBA inventory that goes missing or is damaged within Amazon&apos;s fulfilment network. Typically
          surfaced through inventory adjustment and reconciliation reports.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> One of the most common sources of
          reimbursement in profit leakage audits.
        </p>
      </>
    ),
  },
  {
    term: 'Inbound Shipment Discrepancy',
    body: (
      <>
        <p>
          Difference between what you sent to Amazon and what Amazon recorded as received for a shipment or
          FBA inbound.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Each discrepancy may represent units you can
          reclaim through support cases.
        </p>
      </>
    ),
  },
  {
    term: 'Dimensional Weight',
    body: (
      <>
        <p>
          Weight used by Amazon to calculate fulfilment and storage fees when a product&apos;s size, not just
          scale weight, drives cost to ship.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Dimensional weight changes can quietly
          increase fees and erode margin.
        </p>
      </>
    ),
  },
  {
    term: 'Refund Administration Fee',
    body: (
      <>
        <p>
          Fee Amazon retains when a customer returns a product, typically 20% of the original referral fee.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Meaningful drag on profitability in high
          return-rate categories and must be accounted for in margin models.
        </p>
      </>
    ),
  },
  {
    term: 'FBA Reimbursement',
    body: (
      <>
        <p>
          Credit Amazon issues when it confirms responsibility for lost or damaged inventory, shipment
          discrepancies, or fee overcharges.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Recovering missed reimbursements is a direct
          profit lift with no incremental ad spend.
        </p>
      </>
    ),
  },
  {
    term: 'Amazon Settlement Report',
    body: (
      <>
        <p>
          Financial report that itemises charges, fees, refunds, and payouts at the transaction level.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Backbone for any deep profit leakage or fee
          accuracy audit.
        </p>
      </>
    ),
  },
  {
    term: 'Buy Box Percentage',
    body: (
      <>
        <p>
          Percentage of page views where your offer held the Buy Box for a given ASIN. Reported in Business
          Reports or Brand Analytics.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Low Buy Box percentage limits the ceiling of
          paid and organic sales.
        </p>
      </>
    ),
  },
  {
    term: 'Sessions vs Page Views',
    body: (
      <>
        <p>
          Sessions count unique visits over a period; page views count every time a page is loaded, including
          repeat views in a single session.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Understanding the difference helps interpret
          Business Report metrics correctly.
        </p>
      </>
    ),
  },
  {
    term: 'Unit Session Percentage',
    body: (
      <>
        <p>
          Business Report metric calculated as units ordered divided by sessions. Often used as a proxy for
          conversion rate on Amazon.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Key signal for listing health and price
          competitiveness.
        </p>
      </>
    ),
  },
  {
    term: 'Ordered Product Sales',
    body: (
      <>
        <p>
          Total sales derived from ordered units for a given ASIN or grouping, excluding cancellations and
          returns until they are processed.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Base figure for many performance and
          profitability calculations.
        </p>
      </>
    ),
  },
  {
    term: '7-Day Attribution Window',
    body: (
      <>
        <p>
          Common attribution window for Sponsored Products, counting orders that occur within seven days of an
          ad click.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Misunderstanding attribution windows leads to
          under- or over-crediting campaigns.
        </p>
      </>
    ),
  },
  {
    term: 'Sponsored Products (SP)',
    body: (
      <>
        <p>
          Keyword and product-targeted ads that promote individual listings within Amazon search results and
          product pages.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Foundation of most Amazon advertising
          programmes and the primary data source for the audit engine.
        </p>
      </>
    ),
  },
  {
    term: 'Sponsored Brands (SB)',
    body: (
      <>
        <p>
          Advertising format that promotes a brand and a collection of products, often appearing as banner
          placements at the top of search results.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Useful for branded search defence and
          mid-funnel category building.
        </p>
      </>
    ),
  },
  {
    term: 'Sponsored Display (SD)',
    body: (
      <>
        <p>
          Display-style ads that can appear on and off Amazon, targeting audiences based on shopping behaviour
          and product views.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Extends reach beyond search results and
          supports remarketing strategies.
        </p>
      </>
    ),
  },
  {
    term: 'Retail Media',
    body: (
      <>
        <p>
          Advertising run on retailer-owned media networks such as Amazon, Walmart Connect, or other
          marketplace platforms.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Increasingly central to modern shopper
          marketing strategies and budget allocation.
        </p>
      </>
    ),
  },
  {
    term: 'TACoS Trend',
    body: (
      <>
        <p>
          The directional change of TACoS over time. A falling TACoS with stable revenue implies organic
          growth; a rising TACoS may signal over-reliance on ads.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> One of the clearest indicators of whether your
          strategy is compounding or stalling.
        </p>
      </>
    ),
  },
  {
    term: 'SP-API',
    body: (
      <>
        <p>
          Selling Partner API. Amazon&apos;s official API for programmatic access to reports, orders,
          inventory, and advertising data.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Underpins automated reporting, audits, and
          custom tooling such as the audit engine.
        </p>
      </>
    ),
  },
  {
    term: 'Campaign Structure',
    body: (
      <>
        <p>
          The way campaigns, ad groups, and keywords are organised to reflect goals, product groupings, and
          budget constraints.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Strong structures make scaling, testing, and
          auditing dramatically easier.
        </p>
      </>
    ),
  },
  {
    term: 'Ad Group',
    body: (
      <>
        <p>
          Container within a campaign that holds a set of ads and targets. Often used to group closely related
          products or themes.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Determines how bids and budgets are applied to
          clusters of queries and products.
        </p>
      </>
    ),
  },
  {
    term: 'Portfolio',
    body: (
      <>
        <p>
          Amazon&apos;s way of grouping campaigns for budgeting and reporting purposes. Portfolios can be used
          to roll up spend by brand, region, or objective.
        </p>
        <p>
          <span className="font-semibold">Why it matters:</span> Helpful for structuring budgets across large
          multi-brand or multi-marketplace accounts.
        </p>
      </>
    ),
  },
];

export default function AmazonAuditGlossaryPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-8 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
            Amazon Advertising Audit Glossary
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)]">
            Clear definitions of the metrics and concepts that matter when auditing Amazon advertising
            performance — from ACOS and TACoS to inventory reconciliation and FBA reimbursements.
          </p>
        </header>

        <section className="space-y-6">
          {entries.map((entry) => (
            <article
              key={entry.term}
              className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 space-y-2"
            >
              <h3 className="text-lg font-semibold text-[var(--color-text)]">{entry.term}</h3>
              <div className="prose prose-invert prose-sm max-w-none space-y-2">
                {entry.body}
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            Ready to see these concepts applied to your own account?{' '}
            <Link href="/audit" className="text-cyan-400 hover:underline">
              Run the free Amazon audit.
            </Link>
          </p>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(glossaryJsonLd) }}
        />
      </div>
    </div>
  );
}

