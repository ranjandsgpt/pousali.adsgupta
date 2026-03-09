import Hero from '@/components/hero';
import { AboutSection } from '@/components/about-section';
import { ExpertiseSection } from '@/components/expertise-section';
import { CaseStudiesSection } from '@/components/case-studies-section';
import { InsightsSection } from '@/components/insights-section';
import { ContactSection } from '@/components/contact-section';

export const metadata = {
  title: 'Pousali Dasgupta | Amazon Ads Consultant',
  description:
    'Amazon Ads consultant helping brands improve ACOS, scale PPC campaigns and grow marketplace revenue through data-driven PPC strategy.',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <ExpertiseSection />
      <CaseStudiesSection />
      <InsightsSection />
      <ContactSection />
    </>
  );
}
