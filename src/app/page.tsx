import Hero from '@/components/hero';
import { AboutSection } from '@/components/about-section';
import { ExpertiseSection } from '@/components/expertise-section';
import { CaseStudiesSection } from '@/components/case-studies-section';
import { InsightsSection } from '@/components/insights-section';
import { ContactSection } from '@/components/contact-section';

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
