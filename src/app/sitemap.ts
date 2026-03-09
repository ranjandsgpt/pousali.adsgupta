import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://pousali.adsgupta.com',
      lastModified: new Date(),
    },
    {
      url: 'https://pousali.adsgupta.com/about',
      lastModified: new Date(),
    },
    {
      url: 'https://pousali.adsgupta.com/work',
      lastModified: new Date(),
    },
    {
      url: 'https://pousali.adsgupta.com/insights',
      lastModified: new Date(),
    },
    {
      url: 'https://pousali.adsgupta.com/contact',
      lastModified: new Date(),
    },
    {
      url: 'https://pousali.adsgupta.com/amazon-ads-consultant',
      lastModified: new Date(),
    },
    {
      url: 'https://pousali.adsgupta.com/amazon-ppc-strategy',
      lastModified: new Date(),
    },
    {
      url: 'https://pousali.adsgupta.com/acos-optimization',
      lastModified: new Date(),
    },
  ];
}
