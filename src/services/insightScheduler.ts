/**
 * Phase 32 — Autonomous Insight Scheduler.
 * Schedules discovery tasks: after report upload, after rerun, optional daily batch.
 */

import type { MemoryStore } from '@/app/audit/utils/reportParser';
import { runAutonomousInsightAgent } from '@/agents/autonomousInsightAgent';
import type { DiscoveredInsight } from '@/agents/autonomousInsightAgent';

export type ScheduleTrigger = 'after_upload' | 'after_rerun' | 'batch';

let lastRun: { trigger: ScheduleTrigger; insights: DiscoveredInsight[] } | null = null;

export function runScheduledDiscovery(store: MemoryStore, trigger: ScheduleTrigger): DiscoveredInsight[] {
  const insights = runAutonomousInsightAgent(store);
  lastRun = { trigger, insights };
  return insights;
}

export function getLastDiscoveryRun(): typeof lastRun {
  return lastRun;
}
