'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Linkedin, MessageCircle } from 'lucide-react';

export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="px-6 md:px-12 py-20 md:py-28 max-w-[1200px] mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-8 md:p-12"
      >
        <h2
          id="contact-heading"
          className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4"
        >
          Get in touch
        </h2>
        <p className="text-[var(--color-text-muted)] max-w-xl mb-8">
          For Amazon Ads consultancy, brand growth strategy, or speaking opportunities.
        </p>
        <ul className="flex flex-wrap gap-6" role="list">
          <li>
            <a
              href="mailto:hello@pousali.adsgupta.com"
              className="inline-flex items-center gap-3 text-[var(--color-text)] font-medium hover:text-cyan-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
            >
              <Mail size={20} aria-hidden />
              Email
            </a>
          </li>
          <li>
            <a
              href="https://linkedin.com/in/pousalidasgupta"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-[var(--color-text)] font-medium hover:text-cyan-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
            >
              <Linkedin size={20} aria-hidden />
              LinkedIn
            </a>
          </li>
          <li>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 text-[var(--color-text)] font-medium hover:text-cyan-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
            >
              <MessageCircle size={20} aria-hidden />
              Amazon consultancy
            </Link>
          </li>
        </ul>
      </motion.div>
    </section>
  );
}
