'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { useValidatedArtifacts } from '../store/ValidatedArtifactsContext';
import { useTabData } from '../tabs/useTabData';
import type { MemoryStore } from '../utils/reportParser';
import type { AuditContextInput, StoreSummarySnapshot } from '@/lib/copilot/contextBuilder';
import type { CopilotResponseBody } from '@/app/api/copilot/route';
import { MessageCircle, Send, Loader2 } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Why is ACOS so high?',
  'Which campaigns should I pause?',
  'Where am I wasting budget?',
  'Which keywords should I scale?',
  'What are the top risks?',
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  validated?: boolean;
}

function buildStoreSummarySnapshot(store: MemoryStore): StoreSummarySnapshot {
  const m = store.storeMetrics;
  const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const cpc = totalClicks > 0 ? store.totalAdSpend / totalClicks : 0;
  const campaigns = Object.values(store.campaignMetrics)
    .filter((c) => c.campaignName)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 50)
    .map((c) => ({
      campaignName: c.campaignName || '',
      spend: c.spend,
      sales: c.sales,
      acos: c.acos,
      budget: c.budget,
    }));
  const keywords = Object.values(store.keywordMetrics)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 80)
    .map((k) => ({
      searchTerm: k.searchTerm,
      campaign: k.campaign || '',
      spend: k.spend,
      sales: k.sales,
      clicks: k.clicks,
      acos: k.acos,
      roas: k.roas,
    }));

  return {
    metrics: {
      totalAdSpend: store.totalAdSpend,
      totalAdSales: store.totalAdSales,
      totalStoreSales: store.totalStoreSales || m.totalSales,
      totalSessions: store.totalSessions,
      totalClicks,
      totalOrders: store.totalOrders,
      buyBoxPercent: store.buyBoxPercent,
      roas: m.roas,
      acos: store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : 0,
      tacos: m.tacos,
      cpc,
      currency: store.currency,
    },
    campaigns,
    keywords,
  };
}

export default function AuditCopilot() {
  const { state } = useAuditStore();
  const { validated } = useValidatedArtifacts();
  const { patterns, opportunities } = useTabData('gemini-insights');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const store = state.store;
  const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;

  const buildPayload = useCallback((): AuditContextInput => {
    const storeSummary = buildStoreSummarySnapshot(store);
    return {
      metrics: validated.metrics,
      tables: validated.tables,
      charts: validated.charts,
      insights: validated.insights,
      storeSummary,
      patterns,
      opportunities,
    };
  }, [store, validated, patterns, opportunities]);

  const sendMessage = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || loading) return;

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: q }]);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            auditContextInput: buildPayload(),
          }),
        });
        const data = (await res.json()) as CopilotResponseBody & { error?: string };

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: data.error || 'Request failed. Please try again.',
              validated: false,
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.answer || 'No response.',
            validated: data.validated,
          },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'AI insights temporarily unavailable — please try again.',
            validated: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, buildPayload]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (q: string) => {
    sendMessage(q);
  };

  if (!hasData) {
    return (
      <section
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        aria-label="AI Audit Copilot"
      >
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">AI Audit Copilot</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Upload reports and run an audit to ask questions about your account.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden flex flex-col"
      aria-label="AI Audit Copilot"
    >
      <header className="flex items-center gap-2 p-3 border-b border-[var(--color-border)]">
        <MessageCircle className="w-5 h-5 text-indigo-400" aria-hidden />
        <h3 className="text-sm font-semibold text-[var(--color-text)]">AI Audit Copilot</h3>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-[200px] max-h-[320px] p-3 space-y-3"
      >
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-text-muted)]">Ask about your audit. For example:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSuggestion(q)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-[var(--color-text)] text-xs hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-500/20 text-[var(--color-text)]'
                  : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)]'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.role === 'assistant' && msg.validated === false && (
                <p className="text-xs text-amber-400 mt-1">Response could not be verified against audit data.</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              <span>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--color-border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your audit…"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            disabled={loading}
            aria-label="Question"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-indigo-500/80 hover:bg-indigo-500 text-white p-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </section>
  );
}
