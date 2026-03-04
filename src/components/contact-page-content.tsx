'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Linkedin, MessageCircle } from 'lucide-react';

export default function ContactPageContent() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">
            Contact
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl">
            For Amazon Ads consultancy, brand growth strategy, or speaking opportunities.
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-8 md:p-12 max-w-2xl"
        >
          <h2 className="sr-only">Contact options</h2>
          <ul className="space-y-6" role="list">
            <li>
              <a
                href="mailto:hello@pousali.adsgupta.com"
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20">
                  <Mail size={24} aria-hidden />
                </span>
                <div>
                  <span className="font-semibold text-[var(--color-text)] block">
                    Email
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    hello@pousali.adsgupta.com
                  </span>
                </div>
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/pousalidasgupta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20">
                  <Linkedin size={24} aria-hidden />
                </span>
                <div>
                  <span className="font-semibold text-[var(--color-text)] block">
                    LinkedIn
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Connect for professional updates
                  </span>
                </div>
              </a>
            </li>
            <li>
              <Link
                href="/contact#consultation"
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20">
                  <MessageCircle size={24} aria-hidden />
                </span>
                <div>
                  <span className="font-semibold text-[var(--color-text)] block">
                    Amazon consultancy
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Strategy, audits, and ongoing management
                  </span>
                </div>
              </Link>
            </li>
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
