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
  title: 'Pousali Dasgupta | Ecommerce Growth Consultant',
  description:
    'Pousali Dasgupta is an ecommerce growth consultant specializing in marketplace advertising across Amazon, Walmart and Google Ads.',
  metadataBase: new URL('https://pousali.adsgupta.com'),
  openGraph: {
    title: 'Pousali Dasgupta | Ecommerce Growth Consultant',
    description:
      'Ecommerce growth consultant helping brands scale through Amazon advertising, Walmart marketplace optimization, and Google Ads strategies.',
    url: 'https://pousali.adsgupta.com',
    siteName: 'Pousali Dasgupta',
    type: 'website',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pousali Dasgupta | Ecommerce Growth Consultant',
    description:
      'Ecommerce growth consultant specializing in Amazon PPC, Walmart marketplace growth, and Google Ads optimization.',
    images: ['/og/default.png'],
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
              jobTitle: 'Ecommerce Growth Consultant',
              url: 'https://pousali.adsgupta.com',
              sameAs: ['https://www.linkedin.com/in/pousali-dasgupta/'],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'AdsGupta',
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
