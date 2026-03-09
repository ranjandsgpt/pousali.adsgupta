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
            Amazon marketing and advertising strategies, frameworks, and best practices.
          </p>
        </motion.header>

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
