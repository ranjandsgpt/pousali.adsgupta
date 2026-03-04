'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/data/blogs';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6 transition-colors hover:border-cyan-500/20"
    >
      <Link href={`/insights#${post.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)] rounded-2xl">
        <span className="text-xs font-medium uppercase tracking-wider text-cyan-500">
          {post.category}
        </span>
        <h3 className="mt-2 text-lg md:text-xl font-bold text-[var(--color-text)] group-hover:text-cyan-500 transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 text-[var(--color-text-muted)] text-sm line-clamp-2">
          {post.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">{post.readTime}</span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-500 group-hover:gap-2 transition-all">
            Read
            <ArrowRight size={14} aria-hidden />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
