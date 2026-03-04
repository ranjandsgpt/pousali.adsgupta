'use client';

import { motion } from 'framer-motion';
import { blogs } from '@/data/blogs';
import BlogCard from '@/components/blog-card';

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
      </div>
    </div>
  );
}
