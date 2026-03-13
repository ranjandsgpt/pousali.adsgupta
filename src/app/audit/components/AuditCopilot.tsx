'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { usePendingCopilotQuestion } from '../context/PendingCopilotQuestionContext';
import { useValidatedArtifacts } from '../store/ValidatedArtifactsContext';
import { useDualEngine } from '../dualEngine/dualEngineContext';
import { useTabData } from '../tabs/useTabData';
import type { MemoryStore } from '../utils/reportParser';
import type {
  AuditContextInput,
  StoreSummarySnapshot,
  AgentSignalsSnapshot,
  VerifiedInsightSnapshot,
  ChartSignalsSnapshot,
} from '@/lib/copilot/contextBuilder';
import { runBrandIntelligence } from '@/agents/brandIntelligenceAgent';
import { appendTurn, createEmptyMemory, type ConversationMemory } from '@/lib/copilot/conversationMemory';
import type { CopilotResponseBody } from '@/app/api/copilot/route';
import { MessageCircle, Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { runDiagnosticEngines } from '../engines';
import { runProfitabilityAgent } from '../agents/profitabilityAgent';
import { runTrendAgent } from '../agents/trendAgent';
import { runPerformanceDriftAgent } from '../agents/performanceDriftAgent';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';
import type { OverrideState } from '@/services/overrideEngine';

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
  suggestedFollowUps?: string[];
  feedbackSent?: 'like' | 'dislike';
}

function buildStoreSummarySnapshot(store: MemoryStore, overrides?: OverrideState): StoreSummarySnapshot {
  const canonical = executeMetricEngineForStore(store, overrides);
  const totalClicks =
    canonical.totalClicks > 0
      ? canonical.totalClicks
      : store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const cpc = canonical.cpc > 0 ? canonical.cpc : totalClicks > 0 ? store.totalAdSpend / totalClicks : 0;
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
      matchType: k.matchType,
      spend: k.spend,
      sales: k.sales,
      clicks: k.clicks,
      acos: k.acos,
      roas: k.roas,
    }));

  return {
    metrics: {
      totalAdSpend: canonical.totalAdSpend,
      totalAdSales: canonical.totalAdSales,
      totalStoreSales: canonical.totalSales,
      totalSessions: store.totalSessions,
      totalClicks,
      totalOrders: canonical.totalOrders || store.totalOrders,
      buyBoxPercent: store.buyBoxPercent,
      roas: canonical.roas,
      acos: canonical.acos * 100,
      tacos: canonical.tacos * 100,
      cpc,
      currency: store.currency,
    },
    campaigns,
    keywords,
  };
}

const DEFAULT_ACCOUNT_ID = 'session';

function buildAgentSignalsFromStore(store: MemoryStore): AgentSignalsSnapshot {
  const diagnostics = runDiagnosticEngines(store);
  const profit = runProfitabilityAgent(store);
  const sym = store.currency === 'EUR' ? '€' : store.currency === 'GBP' ? '£' : '$';
  const snapshot: AgentSignalsSnapshot = {
    wasteSignals: {
      totalWasteSpend: diagnostics.waste.totalWasteSpend,
      wastePctOfTotalAdSpend: diagnostics.waste.wastePctOfTotalAdSpend,
      bleedingKeywordCount: diagnostics.waste.bleedingKeywords.length,
      summary: `${sym}${diagnostics.waste.totalWasteSpend.toFixed(2)} wasted spend across ${diagnostics.waste.bleedingKeywords.length} keywords with zero sales.`,
    },
    scalingSignals: {
      scalingKeywordCount: diagnostics.opportunity.scalingKeywords.length,
      scalingCampaignCount: diagnostics.opportunity.scalingCampaigns.length,
      avgRoas: diagnostics.opportunity.avgRoas,
      summary: `${diagnostics.opportunity.scalingKeywords.length} keywords and ${diagnostics.opportunity.scalingCampaigns.length} campaigns with ROAS above average ready to scale.`,
    },
    profitSignals: {
      breakEvenACOS: profit.metrics.breakEvenACOS,
      targetROAS: profit.metrics.targetROAS,
      lossCampaignCount: profit.losses.length,
      summary: `Break-even ACOS ${profit.metrics.breakEvenACOS.toFixed(1)}%; ${profit.losses.length} campaigns below target ROAS.`,
    },
  };

  try {
    const trend = runTrendAgent(DEFAULT_ACCOUNT_ID, 'total_ad_spend', 7);
    if (trend.growthRate !== 0 || trend.trendSlope !== 0) {
      snapshot.trendSignals = {
        trendSlope: trend.trendSlope,
        growthRate: trend.growthRate,
        summary: `Spend trend: ${(trend.growthRate * 100).toFixed(1)}% growth; slope ${trend.trendSlope.toFixed(2)}.`,
      };
    }
  } catch {
    // no historical data
  }

  try {
    const drift = runPerformanceDriftAgent(DEFAULT_ACCOUNT_ID, 14);
    if (drift.issues.length > 0) {
      snapshot.anomalySignals = {
        count: drift.driftedCampaigns.length + drift.driftedKeywords.length,
        summary: `${drift.issues.length} drift issue(s): ${drift.issues.slice(0, 2).join(' ')}`,
      };
    }
  } catch {
    // no historical data
  }

  return snapshot;
}

function buildVerifiedInsightsFromValidated(
  insights: { id: string; title: string; description: string }[],
  confidence: { insights: { score: number; source: 'slm' | 'gemini' } } | null
): VerifiedInsightSnapshot[] {
  if (!insights.length) return [];
  return insights.map((i) => ({
    insight: `${i.title}: ${i.description}`,
    verificationScore: confidence?.insights?.score ?? 0.9,
    sourceEngine: (confidence?.insights?.source ?? 'slm') as 'slm' | 'gemini',
  }));
}

function buildChartSignalsFromStore(store: MemoryStore): ChartSignalsSnapshot {
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.spend > 0);
  const kws = Object.values(store.keywordMetrics).filter((k) => k.sales > 0);
  const avgRoas = store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0;
  const lowRoasCount = kws.filter((k) => k.roas < avgRoas * 0.5).length;
  const highRoasCampaigns = campaigns.filter((c) => c.sales / c.spend > avgRoas).length;
  return {
    keywordScatter: `Most keywords in low-ROAS territory; ${lowRoasCount} below half of account ROAS.`,
    campaignROASDistribution: `${highRoasCampaigns} campaigns above account ROAS; use for scaling.`,
    salesBreakdown: `Total ad sales ${store.totalAdSales.toFixed(0)}; store sales ${(store.totalStoreSales || store.storeMetrics.totalSales).toFixed(0)}.`,
  };
}

export default function AuditCopilot() {
  const { state } = useAuditStore();
  const { validated } = useValidatedArtifacts();
  const dualEngine = useDualEngine();
  const { pendingQuestion, setPendingQuestion } = usePendingCopilotQuestion();
  const { patterns, opportunities } = useTabData('gemini-insights');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationMemory, setConversationMemory] = useState<ConversationMemory>(createEmptyMemory());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingQuestion) {
      setInput(pendingQuestion);
      setPendingQuestion(null);
    }
  }, [pendingQuestion, setPendingQuestion]);

  const store = state.store;
  const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;

  const buildPayload = useCallback((): AuditContextInput => {
    const overrides = state.learnedOverrides?.overrides;
    const storeSummary = buildStoreSummarySnapshot(store, overrides);
    const searchTerms = storeSummary.keywords.map((k) => ({
      searchTerm: k.searchTerm,
      sales: k.sales,
      spend: k.spend,
      orders: 0,
    }));
    const brandResult = runBrandIntelligence(searchTerms, [], []);
    const brandMetrics = {
      brandedSales: brandResult.brandedSales,
      genericSales: brandResult.genericSales,
      competitorSales: brandResult.competitorSales,
    };
    const activeOverrides = state.learnedOverrides
      ? {
          reasoning: state.learnedOverrides.reasoning,
          sanitizeCurrency: state.learnedOverrides.overrides.sanitizeCurrency,
          preferredReport: state.learnedOverrides.overrides.preferredReport,
          overrideSalesColumn: state.learnedOverrides.overrides.overrideSalesColumn,
        }
      : undefined;
    return {
      metrics: validated.metrics,
      tables: validated.tables,
      charts: validated.charts,
      insights: validated.insights,
      storeSummary,
      patterns,
      opportunities,
      agentSignals: buildAgentSignalsFromStore(store),
      verifiedInsights: buildVerifiedInsightsFromValidated(validated.insights, validated.artifactConfidence),
      chartSignals: buildChartSignalsFromStore(store),
      conversationMemory: conversationMemory.turns.length > 0 ? conversationMemory : undefined,
      brandMetrics,
      activeOverrides,
    };
  }, [store, state.learnedOverrides, validated, patterns, opportunities, conversationMemory]);

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

        const answer = data.answer || 'No response.';
        setMessages((prev) => [
          ...prev,
          {
            id: data.responseId ?? crypto.randomUUID(),
            role: 'assistant',
            content: answer,
            validated: data.validated,
            suggestedFollowUps: data.suggestedFollowUps,
          },
        ]);
        setConversationMemory((mem) =>
          appendTurn(mem, q, answer, { campaigns: [], keywords: [] })
        );
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

  const sendFeedback = useCallback(
    async (messageId: string, content: string, feedbackType: 'like' | 'dislike') => {
      try {
        await fetch('/api/audit-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artifactType: 'copilot_response',
            artifactId: messageId,
            value: content.slice(0, 500),
            feedbackType,
          }),
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, feedbackSent: feedbackType } : m))
        );
      } catch {
        // ignore
      }
    },
    []
  );

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
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-[var(--color-text-muted)]">Helpful?</span>
                  <button
                    type="button"
                    onClick={() => sendFeedback(msg.id, msg.content, 'like')}
                    disabled={msg.feedbackSent !== undefined}
                    className={`p-1 rounded ${msg.feedbackSent === 'like' ? 'bg-emerald-500/30 text-emerald-400' : 'hover:bg-white/10'} disabled:opacity-50`}
                    aria-label="Like"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sendFeedback(msg.id, msg.content, 'dislike')}
                    disabled={msg.feedbackSent !== undefined}
                    className={`p-1 rounded ${msg.feedbackSent === 'dislike' ? 'bg-red-500/30 text-red-400' : 'hover:bg-white/10'} disabled:opacity-50`}
                    aria-label="Dislike"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1 w-full mt-1">
                      {msg.suggestedFollowUps.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestion(s)}
                          className="px-2 py-0.5 rounded bg-white/5 border border-[var(--color-border)] text-xs hover:bg-white/10"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
