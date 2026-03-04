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
  title: {
    default: 'Pousali Dasgupta | Amazon Ads Specialist & Marketplace Growth Strategist',
    template: '%s | Pousali Dasgupta',
  },
  description:
    'I help brands scale on Amazon through data-driven advertising, listing optimization, and marketplace growth strategies. Amazon PPC, TACoS, ACOS optimization.',
  keywords: [
    'Amazon Ads',
    'Amazon PPC',
    'Marketplace Growth',
    'TACoS',
    'ACOS',
    'Listing Optimization',
    'Brand Performance',
  ],
  authors: [{ name: 'Pousali Dasgupta', url: 'https://pousali.adsgupta.com' }],
  creator: 'Pousali Dasgupta',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pousali.adsgupta.com',
    siteName: 'Pousali Dasgupta',
    title: 'Pousali Dasgupta | Amazon Ads Specialist & Marketplace Growth',
    description:
      'Data-driven Amazon advertising, listing optimization, and marketplace growth. US & UAE.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pousali Dasgupta | Amazon Ads & Marketplace Growth',
    description: 'Amazon PPC, TACoS, listing optimization, product launch strategy.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://pousali.adsgupta.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Pousali Dasgupta',
              url: 'https://pousali.adsgupta.com',
              jobTitle: 'Amazon Ads Specialist & Marketplace Growth Strategist',
              description:
                'I help brands scale on Amazon through data-driven advertising, listing optimization, and marketplace growth strategies.',
              sameAs: [
                'https://www.linkedin.com/in/pousalidasgupta',
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
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
