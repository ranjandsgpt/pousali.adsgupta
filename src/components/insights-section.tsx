'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { blogs } from '@/data/blogs';
import BlogCard from '@/components/blog-card';

export function InsightsSection() {
  const featured = blogs.slice(0, 3);
  return (
    <section
      id="insights"
      aria-labelledby="insights-heading"
      className="px-6 md:px-12 py-20 md:py-28 max-w-[1200px] mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
      >
        <h2
          id="insights-heading"
          className="text-3xl md:text-4xl font-bold text-[var(--color-text)]"
        >
          Insights
        </h2>
        <Link
          href="/insights"
          className="text-cyan-500 font-medium hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
        >
          View all insights →
        </Link>
      </motion.div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
        {featured.map((post, i) => (
          <motion.li
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <BlogCard post={post} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
