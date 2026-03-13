import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pousali Dasgupta | Amazon & Marketplace Growth Specialist | 10x ROI',
  description:
    'Pousali Dasgupta helps brands achieve 10x marketplace ROI across Amazon, Walmart, and Retail Media. Amazon PPC strategy, advertising audit automation, and marketplace growth architecture.',
  metadataBase: new URL('https://pousali.adsgupta.com'),
  openGraph: {
    title: 'Pousali Dasgupta | Amazon & Marketplace Growth Specialist | 10x ROI',
    description:
      'Pousali Dasgupta helps brands achieve 10x marketplace ROI across Amazon, Walmart, and Retail Media. Amazon PPC strategy, advertising audit automation, and marketplace growth architecture.',
    url: 'https://pousali.adsgupta.com',
    siteName: 'Pousali Dasgupta',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pousali Dasgupta | Amazon & Marketplace Growth Specialist | 10x ROI',
    description:
      'Pousali Dasgupta helps brands achieve 10x marketplace ROI across Amazon, Walmart, and Retail Media. Amazon PPC strategy, advertising audit automation, and marketplace growth architecture.',
    images: ['/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://pousali.adsgupta.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="GOOGLE_VERIFICATION_CODE" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Person',
                  '@id': 'https://pousali.adsgupta.com/#person',
                  name: 'Pousali Dasgupta',
                  jobTitle: 'Amazon & Marketplace Growth Specialist',
                  url: 'https://pousali.adsgupta.com',
                  sameAs: ['https://www.linkedin.com/in/pousali-dasgupta/'],
                  description:
                    'Marketplace growth architect specialising in Amazon, Walmart, and Retail Media with a 10x ROI track record and an AI-powered advertising audit platform.',
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://pousali.adsgupta.com/#website',
                  url: 'https://pousali.adsgupta.com',
                  name: 'Pousali Dasgupta | Amazon & Marketplace Growth',
                  description:
                    'Amazon PPC strategy, advertising audit automation, and marketplace growth architecture across Amazon, Walmart, and Retail Media.',
                  publisher: {
                    '@id': 'https://pousali.adsgupta.com/#person',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://pousali.adsgupta.com/#audit-software',
                  name: 'Amazon Advertising Audit Tool',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web',
                  url: 'https://pousali.adsgupta.com/audit',
                  description:
                    'Free Amazon advertising audit tool that ingests SP, SB, SD, and Business Report data to surface ACOS, ROAS, TACoS diagnostics and profit leakage in seconds.',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  creator: {
                    '@id': 'https://pousali.adsgupta.com/#person',
                  },
                },
                {
                  '@type': 'FAQPage',
                  '@id': 'https://pousali.adsgupta.com/#faq',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'Who is Pousali Dasgupta?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text:
                          'Pousali Dasgupta is a marketplace growth specialist focused on helping brands and agencies scale profitably across Amazon, Walmart, Google Shopping, and Retail Media.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What does the Amazon advertising audit tool do?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text:
                          'The audit tool ingests Amazon SP, SB, SD, and Business Report data to detect ACOS, ROAS, and TACoS issues, wasted ad spend, and profit leakages, generating board-ready PDF and PPTX exports in under a minute.',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)] font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-black focus:rounded focus:outline-none"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
