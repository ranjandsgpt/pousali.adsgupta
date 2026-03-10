'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { blogs } from '@/data/blogs';
import BlogCard from '@/components/blog-card';

const landingPages = [
  {
    href: '/amazon-ads-consultant',
    title: 'Amazon Ads Consultant',
    description: 'Helping brands scale through advanced Amazon PPC strategies, keyword research, and marketplace optimization.',
  },
  {
    href: '/amazon-ppc-strategy',
    title: 'Amazon PPC Strategy',
    description: 'How Amazon PPC works, keyword targeting, campaign structuring, and scaling profitable campaigns.',
  },
  {
    href: '/acos-optimization',
    title: 'Amazon ACOS Optimization',
    description: 'Understanding ACOS, reducing ACOS, campaign restructuring, and search term optimization.',
  },
];

export default function InsightsPageContent() {
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
            Insights
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl">
            Amazon marketing and advertising strategies, frameworks, and best practices—from{' '}
            <Link href="/amazon-ads-consultant" className="text-cyan-500 font-medium hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded">Amazon Ads consultant</Link>{' '}
            insights to <Link href="/amazon-ppc-strategy" className="text-cyan-500 font-medium hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded">Amazon PPC strategy</Link> and{' '}
            <Link href="/acos-optimization" className="text-cyan-500 font-medium hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded">ACOS optimization</Link>. Browse the full{' '}
            <Link href="/amazon-advertising-resources" className="text-cyan-500 font-medium hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded">Amazon advertising resources</Link>{' '}
            hub for guides and service pages, authored by{' '}
            <Link href="/pousali-dasgupta" className="text-cyan-500 font-semibold hover:text-cyan-400">
              Pousali Dasgupta
            </Link>
            .
          </p>
        </motion.header>

        <section aria-labelledby="author-heading" className="mb-16 rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6 md:p-8">
          <h2 id="author-heading" className="sr-only">Author</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Link href="/about" className="text-xl font-bold text-[var(--color-text)] hover:text-cyan-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded">
                Pousali Dasgupta
              </Link>
              <p className="text-sm font-medium text-cyan-500 mt-0.5">Amazon Ads Specialist</p>
              <p className="text-[var(--color-text-muted)] text-sm mt-2 max-w-xl">
                Helping brands grow through Amazon PPC optimization, marketplace analytics and data-driven advertising strategies.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="landing-pages-heading" className="mb-16">
          <h2 id="landing-pages-heading" className="text-2xl font-bold text-[var(--color-text)] mb-6">
            Amazon Ads resources
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
            {landingPages.map((page, i) => (
              <motion.li
                key={page.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Link
                  href={page.href}
                  className="group block rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6 transition-colors hover:border-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
                >
                  <h3 className="text-lg md:text-xl font-bold text-[var(--color-text)] group-hover:text-cyan-500 transition-colors">
                    {page.title}
                  </h3>
                  <p className="mt-2 text-[var(--color-text-muted)] text-sm line-clamp-2">
                    {page.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan-500 group-hover:gap-2 transition-all">
                    Read
                    <ArrowRight size={14} aria-hidden />
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="guides-heading" className="mb-16">
          <h2 id="guides-heading" className="text-2xl font-bold text-[var(--color-text)] mb-6">
            Amazon Advertising Guides
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
            <li><Link href="/amazon-ppc-management" className="text-cyan-500 hover:underline">Amazon PPC Management</Link></li>
            <li><Link href="/amazon-ppc-audit" className="text-cyan-500 hover:underline">Amazon PPC Audit</Link></li>
            <li><Link href="/amazon-keyword-research" className="text-cyan-500 hover:underline">Amazon Keyword Research</Link></li>
            <li><Link href="/reduce-amazon-acos" className="text-cyan-500 hover:underline">Reduce Amazon ACOS</Link></li>
            <li><Link href="/amazon-ppc-strategy" className="text-cyan-500 hover:underline">Amazon PPC Strategy</Link></li>
          </ul>
          <p className="mt-4 text-[var(--color-text-muted)]">
            <Link href="/tools" className="text-cyan-500 hover:underline">Explore upcoming Amazon advertising tools.</Link>
          </p>
        <section aria-labelledby="guides-heading" className="mb-16">
          <h2 id="guides-heading" className="text-2xl font-bold text-[var(--color-text)] mb-6">
            Amazon Advertising Guides
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
            <li><Link href="/amazon-ppc-management" className="text-cyan-500 hover:underline">Amazon PPC Management</Link></li>
            <li><Link href="/amazon-ppc-audit" className="text-cyan-500 hover:underline">Amazon PPC Audit</Link></li>
            <li><Link href="/amazon-keyword-research" className="text-cyan-500 hover:underline">Amazon Keyword Research</Link></li>
            <li><Link href="/reduce-amazon-acos" className="text-cyan-500 hover:underline">Reduce Amazon ACOS</Link></li>
            <li><Link href="/amazon-ppc-strategy" className="text-cyan-500 hover:underline">Amazon PPC Strategy</Link></li>
          </ul>
          <p className="mt-4 text-[var(--color-text-muted)]">
            <Link href="/tools" className="text-cyan-500 hover:underline">Explore upcoming Amazon advertising tools.</Link>
          </p>
        </section>

        </section>

        <section aria-labelledby="blog-heading">
          <h2 id="blog-heading" className="text-2xl font-bold text-[var(--color-text)] mb-6">
            Blog
          </h2>
          <ul
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
          >
            {blogs.map((post, i) => (
              <motion.li
                key={post.id}
                id={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <BlogCard post={post} />
              </motion.li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
