'use client';

import ReactMarkdown from 'react-markdown';

export function ArticleViewer({ content }: { content: string }) {
  return (
    <article className="prose prose-invert max-w-none prose-headings:text-[var(--color-text)] prose-p:text-[var(--color-text-muted)] prose-li:text-[var(--color-text-muted)] prose-strong:text-[var(--color-text)] prose-code:text-[var(--color-accent)] prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-pre:bg-[var(--color-surface)] prose-pre:border prose-pre:border-[var(--color-border)]">
      <ReactMarkdown
        components={{
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-white/10 px-1 rounded text-[var(--color-accent)]" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 overflow-x-auto my-4">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a href={href} className="text-[var(--color-accent)] hover:underline" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
