/** Sidebar sections for the help center. Shared by docGenerator and client components. */

export const SIDEBAR_SECTIONS = [
  { id: 'getting-started', title: 'Getting Started', slug: 'getting-started' },
  { id: 'architecture', title: 'Platform Architecture', slug: 'architecture' },
  { id: 'agents', title: 'Agents & Intelligence', slug: 'agents' },
  { id: 'formulas', title: 'Metrics & Formulas', slug: 'formulas' },
  { id: 'charts', title: 'Charts & Visualizations', slug: 'charts' },
  { id: 'copilot', title: 'AI Copilot', slug: 'copilot' },
  { id: 'query-system', title: 'Query Intelligence', slug: 'query-system' },
  { id: 'brand-intelligence', title: 'Brand Intelligence', slug: 'brand-intelligence' },
  { id: 'export-system', title: 'Export System', slug: 'export-system' },
  { id: 'feedback', title: 'Feedback System', slug: 'feedback' },
  { id: 'security', title: 'Security & Validation', slug: 'security' },
  { id: 'troubleshooting', title: 'Troubleshooting', slug: 'troubleshooting' },
  { id: 'faq', title: 'FAQ', slug: 'faq' },
  { id: 'code', title: 'Code Explorer', slug: 'code' },
] as const;

export type HelpSectionSlug = (typeof SIDEBAR_SECTIONS)[number]['slug'];
