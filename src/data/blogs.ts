export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  date?: string;
}

export const blogs: BlogPost[] = [
  {
    id: '1',
    slug: 'scale-amazon-ads-without-increasing-acos',
    title: 'How to Scale Amazon Ads Without Increasing ACOS',
    description: 'Practical frameworks to grow ad spend while maintaining or improving advertising cost of sale.',
    category: 'Amazon PPC',
    readTime: '5 min read',
    date: '2024-01-15',
  },
  {
    id: '2',
    slug: 'tacos-framework-sustainable-growth',
    title: 'The TACoS Framework for Sustainable Growth',
    description: 'Using total advertising cost of sale as a north star metric for long-term brand health.',
    category: 'Strategy',
    readTime: '6 min read',
    date: '2024-02-01',
  },
  {
    id: '3',
    slug: 'keyword-harvesting-supplements',
    title: 'Keyword Harvesting Strategy for Supplements',
    description: 'How to mine search terms and expand keyword coverage in competitive supplement categories.',
    category: 'Keyword Strategy',
    readTime: '4 min read',
    date: '2024-02-20',
  },
  {
    id: '4',
    slug: 'amazon-ppc-mistakes',
    title: 'Amazon PPC Mistakes That Drain Your Budget',
    description: 'Common pitfalls in Sponsored Products, Brands, and Display campaigns and how to fix them.',
    category: 'Amazon PPC',
    readTime: '5 min read',
    date: '2024-03-01',
  },
  {
    id: '5',
    slug: 'reduce-tacos',
    title: 'How to Reduce TACoS Without Sacrificing Revenue',
    description: 'Tactics to improve advertising efficiency while protecting top-line growth.',
    category: 'Strategy',
    readTime: '6 min read',
    date: '2024-03-10',
  },
  {
    id: '6',
    slug: 'product-launch-ad-framework',
    title: 'Product Launch Ad Framework',
    description: 'A repeatable playbook for launching new products on Amazon with paid and organic levers.',
    category: 'Product Launch',
    readTime: '7 min read',
    date: '2024-03-25',
  },
];
