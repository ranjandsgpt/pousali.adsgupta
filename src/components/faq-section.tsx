'use client';

import { motion } from 'framer-motion';

export type FAQItem = { question: string; answer: string };

interface FAQSectionProps {
  id: string;
  headingId: string;
  title: string;
  items: FAQItem[];
  schema?: { '@context': string; '@type': string; mainEntity: Array<{ '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }> };
}

export function FAQSection({ id, headingId, title, items, schema }: FAQSectionProps) {
  return (
    <section aria-labelledby={headingId} className="mb-20" id={id}>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <h2
        id={headingId}
        className="text-2xl font-bold text-[var(--color-text)] mb-8"
      >
        {title}
      </h2>
      <ul className="space-y-6" role="list">
        {items.map((item, i) => (
          <motion.li
            key={item.question}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6"
          >
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
              {item.question}
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
              {item.answer}
            </p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
