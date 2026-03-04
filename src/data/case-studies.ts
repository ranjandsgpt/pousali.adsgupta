export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  challenge: string;
  strategy: string;
  results: {
    metric: string;
    value: string;
  }[];
  category?: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: '1',
    slug: 'omega-3-product-launch',
    title: 'Omega 3 Product Launch',
    challenge: 'High ACOS and low organic visibility in a competitive supplement category.',
    strategy: 'Structured product launch with phased PPC (awareness → consideration → conversion), listing optimization, and search term harvesting.',
    results: [
      { metric: 'ACOS', value: '65% → 28%' },
      { metric: 'Revenue', value: '2.5x in 6 months' },
      { metric: 'Organic share', value: 'Significant improvement' },
    ],
    category: 'Supplement',
  },
  {
    id: '2',
    slug: 'maca-root-campaign',
    title: 'Maca Root Campaign',
    challenge: 'Scale revenue without blowing ACOS in a niche category.',
    strategy: 'Keyword expansion, negative keyword refinement, and bid strategy aligned with TACoS targets.',
    results: [
      { metric: 'Revenue', value: '3.2x in 4 months' },
      { metric: 'TACoS', value: 'Reduced by 22%' },
      { metric: 'Conversion', value: 'Improved CVR' },
    ],
    category: 'Supplement',
  },
  {
    id: '3',
    slug: 'supplement-category-growth',
    title: 'Supplement Category Growth',
    challenge: 'Improve overall advertising efficiency across a brand portfolio.',
    strategy: 'Portfolio-level TACoS targeting, campaign restructuring, and listing optimization across SKUs.',
    results: [
      { metric: 'TACoS', value: 'Improved by 35%' },
      { metric: 'ACOS', value: 'Stable while scaling' },
      { metric: 'Market share', value: 'Category share gain' },
    ],
    category: 'Supplement',
  },
];
