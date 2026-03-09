'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { recordLearningSignal } from '@/agents/learningOptimizationAgent';
import { generateOverrideSuggestions, type FeedbackSnapshot, type OverrideSuggestion } from '@/services/feedbackLearningEngine';

export interface MetricFeedbackButtonsProps {
  metricId: string;
  value: string | number;
  artifactType?: 'metrics' | 'tables' | 'charts' | 'insights';
  onSubmitted?: () => void;
  /** Self-healing: when user marks metrics incorrect, Gemini suggests overrides. Parent applies and re-renders. */
  feedbackSnapshot?: FeedbackSnapshot;
  onOverrideSuggestion?: (suggestion: OverrideSuggestion) => void;
}

export function MetricFeedbackButtons({
  metricId,
  value,
  artifactType = 'metrics',
  onSubmitted,
  feedbackSnapshot,
  onOverrideSuggestion,
}: MetricFeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState<{ reasoning: string } | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);

  const submit = async (userFeedback: 'correct' | 'incorrect') => {
    if (feedback !== null) return;
    setFeedback(userFeedback);
    if (userFeedback === 'correct') {
      doPost('correct', undefined);
      return;
    }
    if (artifactType === 'metrics' && feedbackSnapshot && onOverrideSuggestion) {
      setOverrideLoading(true);
      try {
        const suggestion = await generateOverrideSuggestions(feedbackSnapshot);
        onOverrideSuggestion(suggestion);
        setOverrideMessage({ reasoning: suggestion.reasoning || 'Parsing corrections were applied.' });
        doPost('incorrect', undefined);
      } catch {
        setOverrideMessage({ reasoning: 'Could not get suggestions; you can still send feedback.' });
        setShowComment(true);
      } finally {
        setOverrideLoading(false);
      }
      return;
    }
    setShowComment(true);
  };

  const doPost = async (userFeedback: 'correct' | 'incorrect', commentText?: string) => {
    try {
      await fetch('/api/audit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricId,
          value,
          userFeedback,
          comment: (commentText ?? comment) || undefined,
          artifactType,
        }),
      });
      recordLearningSignal({
        type: userFeedback === 'correct' ? 'like' : 'dislike',
        entityId: metricId,
        payload: { artifactType, value },
        timestamp: Date.now(),
      });
      onSubmitted?.();
    } catch {
      setFeedback(null);
    }
  };

  const sendComment = async () => {
    if (feedback !== 'incorrect') return;
    await doPost('incorrect', comment || undefined);
    setShowComment(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        type="button"
        aria-label="Correct"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); submit('correct'); }}
        disabled={feedback !== null}
        className={`p-1 rounded border transition ${feedback === 'correct' ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-400' : 'border-white/20 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]'}`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        aria-label="Incorrect"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); void submit('incorrect'); }}
        disabled={feedback !== null || overrideLoading}
        className={`p-1 rounded border transition ${feedback === 'incorrect' ? 'bg-red-500/30 border-red-500/50 text-red-400' : 'border-white/20 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]'}`}
      >
        {overrideLoading ? <span className="w-3.5 h-3.5 inline-block border border-current border-t-transparent rounded-full animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />}
      </button>
      {showComment && feedback === 'incorrect' && !overrideMessage && (
        <span className="flex items-center gap-1 ml-1">
          <input
            type="text"
            placeholder="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-24 min-w-0 rounded border border-white/20 bg-black/30 px-1.5 py-0.5 text-xs text-[var(--color-text)]"
          />
          <button
            type="button"
            onClick={sendComment}
            className="text-xs text-sky-400 hover:underline"
          >
            Send
          </button>
        </span>
      )}
      {overrideMessage && (
        <div className="ml-2 mt-1 p-2 rounded border border-amber-500/30 bg-amber-500/10 text-xs text-[var(--color-text)] max-w-[280px]">
          <p className="font-medium text-amber-400/90">Gemini re-analyzed your report and corrected parsing logic. Does this look correct?</p>
          <p className="mt-1 text-[var(--color-text-muted)]">{overrideMessage.reasoning}</p>
        </div>
      )}
    </div>
  );
}
