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
  title: 'Pousali Dasgupta | Amazon Ads Specialist',
  description:
    'Portfolio of Pousali Dasgupta, an Amazon Ads strategist specializing in PPC optimization, keyword strategy, and marketplace growth.',
  metadataBase: new URL('https://pousali.adsgupta.com'),
  openGraph: {
    title: 'Pousali Dasgupta | Amazon Ads Specialist',
    description:
      'Amazon advertising specialist helping brands grow through PPC optimization, keyword strategy and marketplace growth.',
    url: 'https://pousali.adsgupta.com',
    siteName: 'Pousali Dasgupta Portfolio',
    type: 'website',
    images: '/og/default.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pousali Dasgupta | Amazon Ads Specialist',
    description:
      'Amazon Ads specialist focused on ACOS optimization, PPC strategy and marketplace growth.',
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
              '@type': 'Person',
              name: 'Pousali Dasgupta',
              jobTitle: 'Amazon Ads Specialist',
              url: 'https://pousali.adsgupta.com',
              sameAs: ['https://www.linkedin.com/in/pousalidasgupta'],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'adsgupta',
              url: 'https://adsgupta.com',
              sameAs: ['https://www.linkedin.com/in/pousali-dasgupta/'],
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
