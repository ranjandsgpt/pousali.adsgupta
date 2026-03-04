export interface ExpertiseCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const expertiseCards: ExpertiseCard[] = [
  {
    id: '1',
    title: 'Amazon PPC',
    description: 'Sponsored Products, Brands, and Display campaigns with data-driven bidding and structure.',
    icon: 'TrendingUp',
  },
  {
    id: '2',
    title: 'Listing Optimization',
    description: 'Titles, bullets, A+ content, and backend keywords for discoverability and conversion.',
    icon: 'FileSearch',
  },
  {
    id: '3',
    title: 'Keyword & Search Term Strategy',
    description: 'Search term mining, keyword harvesting, and negative keyword management.',
    icon: 'Search',
  },
  {
    id: '4',
    title: 'Product Launch Strategy',
    description: 'Phased launch playbooks that balance paid and organic for sustainable growth.',
    icon: 'Rocket',
  },
  {
    id: '5',
    title: 'Marketplace Expansion',
    description: 'Multi-marketplace account structure and scaling across US, UAE, and more.',
    icon: 'Globe',
  },
];
