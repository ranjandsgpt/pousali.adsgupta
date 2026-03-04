export interface ExperienceItem {
  id: string;
  title: string;
  company?: string;
  period: string;
  description: string;
  highlights: string[];
}

export const experience: ExperienceItem[] = [
  {
    id: '1',
    title: 'Amazon Ads & PPC Strategy',
    period: 'Ongoing',
    description: 'Managing multi-marketplace Amazon advertising accounts across US and UAE.',
    highlights: [
      'Amazon Seller Central optimization',
      'ACOS & TACoS optimization',
      'Keyword harvesting & search term mining',
      'Brand store optimization',
    ],
  },
  {
    id: '2',
    title: 'Product Launch & Growth',
    period: 'Recent',
    description: 'Data-driven product launch and scaling strategies for supplements and CPG.',
    highlights: [
      'Product launch ad framework',
      'Listing optimization (A+ content, keywords)',
      'Conversion rate improvement',
      'Organic ranking strategies',
    ],
  },
  {
    id: '3',
    title: 'Marketplace Expansion',
    period: 'Ongoing',
    description: 'Scaling brands across marketplaces with sustainable advertising efficiency.',
    highlights: [
      'Multi-marketplace campaign structure',
      'TACoS framework for sustainable growth',
      'Revenue scaling without ACOS inflation',
      'Marketplace analytics & reporting',
    ],
  },
];
