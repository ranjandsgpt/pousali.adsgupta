'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FileDown, Mail } from 'lucide-react';

interface HeroProps {
  name?: string;
  title?: string;
  intro?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  tertiaryCta?: { label: string; href: string };
}

const defaultProps: Required<HeroProps> = {
  name: 'Pousali Dasgupta',
  title: 'Amazon Ads Specialist · Marketplace Growth Strategist · Brand Performance Optimizer',
  intro:
    'I help brands scale on Amazon through data-driven advertising, listing optimization, and marketplace growth strategies. Multi-marketplace experience across US and UAE.',
  primaryCta: { label: 'View Work', href: '/work' },
  secondaryCta: { label: 'Download Resume', href: '#contact' },
  tertiaryCta: { label: 'Contact', href: '/contact' },
};

export default function Hero({
  name = defaultProps.name,
  title = defaultProps.title,
  intro = defaultProps.intro,
  primaryCta = defaultProps.primaryCta,
  secondaryCta = defaultProps.secondaryCta,
  tertiaryCta = defaultProps.tertiaryCta,
}: HeroProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 pt-28 pb-20 max-w-[1200px] mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-6"
      >
        <h1
          id="hero-heading"
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text)] max-w-3xl"
        >
          {name}
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl font-medium">
          {title}
        </p>
        <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
          {intro}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-wrap gap-4 pt-4"
        >
          <Link
            href={primaryCta.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            {primaryCta.label}
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link
            href={secondaryCta.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--color-text-muted)]/30 text-[var(--color-text)] font-medium hover:border-cyan-500/50 hover:text-cyan-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            <FileDown size={18} aria-hidden />
            {secondaryCta.label}
          </Link>
          <Link
            href={tertiaryCta.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[var(--color-text-muted)] font-medium hover:text-cyan-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            <Mail size={18} aria-hidden />
            {tertiaryCta.label}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
