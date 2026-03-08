# Agents & Intelligence
Auto-generated from `src/agents` and `src/app/audit/agents`.
## brandIntelligenceAgent
Brand Intelligence Agent — classify search terms into branded, competitor, or generic.
### Exports
- **runBrandIntelligence** — Classify each search term:
- **KeywordType** — Brand Intelligence Agent — classify search terms into branded, competitor, or generic.
- **SearchTermInput** — Brand Intelligence Agent — classify search terms into branded, competitor, or generic.
- **BrandAnalysisItem** — Brand Intelligence Agent — classify search terms into branded, competitor, or generic.
- **BrandAnalysisResult** — Brand Intelligence Agent — classify search terms into branded, competitor, or generic.

## cxoJudgeAgent
CXO Judge Agent — verify exports before download (Phase 9, 38).
### Exports
- **checkSlideDensity** — Phase 38 — Slide density: max words per slide.
- **checkColorContrast** — Phase 38 — Color contrast (WCAG-style: ensure foreground/background contrast).
- **checkChartReadability** — Phase 44 — Chart readability: axis overlap, legend overflow, density.
- **runCxoJudgeAgent** — Run CXO Judge: metric accuracy + Phase 38 visual audit (slideDensity, textOverflow, colorContrast, chartReadability).
- **CxoJudgeStatus** — CXO Judge Agent — verify exports before download (Phase 9, 38).
- **CxoJudgeResult** — CXO Judge Agent — verify exports before download (Phase 9, 38).
- **CxoJudgeOptions** — Narrative validation

## formulaRegistry
Formula Registry — Human-readable formulas for transparency (aligned with amazonMetricsLibrary).
### Exports
- **getFormulaForMetric** — Get formula explanation for a metric (e.g. ACOS, ROAS, total sales).
- **FormulaEntry** — Formula Registry — Human-readable formulas for transparency (aligned with amazonMetricsLibrary).

## modelSyncController
Model Sync Controller — synchronize SLM (charts/tables) + Gemini (narrative/insights) into unified PremiumState.
### Exports
- **syncModels** — Sync SLM + Gemini into a single PremiumState.
- **SlmData** — Model Sync Controller — synchronize SLM (charts/tables) + Gemini (narrative/insights) into unified PremiumState.
- **GeminiData** — Model Sync Controller — synchronize SLM (charts/tables) + Gemini (narrative/insights) into unified PremiumState.

## queryCapabilityRegistry
Query Capability Registry — Determine if the system can answer a question.
### Exports
- **detectIntent** — Detect intent from the user question.
- **detectCapability** — Determine capability: can we answer from audit data?
- **QueryCapability** — Query Capability Registry — Determine if the system can answer a question.
- **QueryIntent** — Query Capability Registry — Determine if the system can answer a question.
- **CapabilityResult** — Query Capability Registry — Determine if the system can answer a question.

## queryDecomposer
Query Decomposer — Break complex questions into smaller sub-queries.
### Exports
- **decomposeQuery** — Decompose a complex question into sub-queries for SLM or Gemini.
- **SubQuery** — Query Decomposer — Break complex questions into smaller sub-queries.
- **DecomposedQuery** — Query Decomposer — Break complex questions into smaller sub-queries.

## queryFallbackAgent
Query Fallback Agent — Structured response when question cannot be answered.
### Exports
- **getFallbackResponse** — Return a structured fallback message explaining what the system can answer.
- **FallbackResponse** — Query Fallback Agent — Structured response when question cannot be answered.

## queryGapRegistry
Query Gap Registry — Record frequently asked unsupported questions for future capability improvements.
### Exports
- **recordQueryGap** — Record an unsupported or out-of-scope question for future analysis.
- **getQueryGaps** — Get recorded gaps, sorted by frequency (desc).
- **getTopQueryGaps** — Get top N unsupported questions for capability planning.
- **QueryGapEntry** — Query Gap Registry — Record frequently asked unsupported questions for future capability improvements.

## queryIntelligenceAgent
Query Intelligence Agent — Orchestrates intent, capability, metric discovery, routing,
### Exports
- **runQueryIntelligenceAgent** — Run the full Query Intelligence pipeline:
- **validateResponseAgainstAudit** — Validate a numeric/claim response against audit data (storeSummary).
- **QueryIntelligenceResult** — Query Intelligence Agent — Orchestrates intent, capability, metric discovery, routing,
- **QueryIntelligenceInput** — Query Intelligence Agent — Orchestrates intent, capability, metric discovery, routing,

## queryInteractionStore
Query Interaction Store — Capture each Copilot query for Central Feedback Agent.
### Exports
- **recordQueryInteraction** — Query Interaction Store — Capture each Copilot query for Central Feedback Agent.
- **getQueryInteraction** — Query Interaction Store — Capture each Copilot query for Central Feedback Agent.
- **getRecentQueryInteractions** — Query Interaction Store — Capture each Copilot query for Central Feedback Agent.
- **QueryInteractionRecord** — Query Interaction Store — Capture each Copilot query for Central Feedback Agent.

## queryRouter
Agent-layer Query Router — Route queries to SLM, Gemini, metrics library, or dataset handlers.
### Exports
- **routeToAgent** — Route based on intent and capability to the appropriate agent/engine.
- **AgentRouteTarget** — Agent-layer Query Router — Route queries to SLM, Gemini, metrics library, or dataset handlers.
- **AgentRouteResult** — Agent-layer Query Router — Route queries to SLM, Gemini, metrics library, or dataset handlers.

## structuredInsightsAgent
Structured Insights Agent — convert raw audit data into consulting intelligence tables.
### Exports
- **generateAccountPerformanceSummary** — Structured Insights Agent — convert raw audit data into consulting intelligence tables.
- **generateCampaignTypeBreakdown** — Structured Insights Agent — convert raw audit data into consulting intelligence tables.
- **generateMatchTypePerformance** — Structured Insights Agent — convert raw audit data into consulting intelligence tables.
- **generateTopAsins** — Structured Insights Agent — convert raw audit data into consulting intelligence tables.
- **generateBottomAsins** — Structured Insights Agent — convert raw audit data into consulting intelligence tables.
- **generateLowCvrAsins** — Structured Insights Agent — convert raw audit data into consulting intelligence tables.
- **generateSearchQueryConversionGaps** — Structured Insights Agent — convert raw audit data into consulting intelligence tables.
- **generateActionPlan** — Structured Insights Agent — convert raw audit data into consulting intelligence tables.
- **runStructuredInsightsAgent** — Run all structured insight generators and merge into StructuredInsights.

## zenithExportOrchestrator
Zenith Export Orchestrator — unify SLM + Gemini into PremiumState.
### Exports
- **runZenithExportOrchestrator** — Build PremiumState from store + Gemini/SLM artifacts.
- **ZenithOrchestratorInput** — Zenith Export Orchestrator — unify SLM + Gemini into PremiumState.

## zenithTypes
Zenith CXO Export — PremiumState and related types.
### Exports
- **VerifiedMetric** — Zenith CXO Export — PremiumState and related types.
- **VerifiedInsight** — Zenith CXO Export — PremiumState and related types.
- **ChartSource** — Zenith CXO Export — PremiumState and related types.
- **ChartSpec** — Zenith CXO Export — PremiumState and related types.
- **ChartSourceRecord** — Chart source priority: SLM → Gemini → Python
- **TableSpec** — Chart source priority: SLM → Gemini → Python
- **CampaignAnalysisItem** — Chart source priority: SLM → Gemini → Python
- **KeywordAnalysisItem** — Chart source priority: SLM → Gemini → Python
- **WasteAnalysisItem** — Chart source priority: SLM → Gemini → Python
- **ProfitabilitySnapshot** — Chart source priority: SLM → Gemini → Python
- **BrandKeywordType** — Brand Intelligence: per-term classification and aggregate sales by type.
- **BrandAnalysisItem** — Brand Intelligence: per-term classification and aggregate sales by type.
- **BrandAnalysisResult** — Brand Intelligence: per-term classification and aggregate sales by type.
- **StructuredInsightSection** — Brand Intelligence: per-term classification and aggregate sales by type.
- **StructuredInsights** — Structured intelligence (Phase 19–20).

## agents.test
Unit tests for Multi-Agent Validation Architecture.

## centralFeedbackAgent
Central Feedback Agent — Aggregate feedback, detect repeated errors, generate correction signals.
### Exports
- **runCentralFeedbackAgent** — Aggregate feedback and detect patterns (e.g. ACOS frequently marked incorrect).
- **CentralFeedbackAnalysis** — Central Feedback Agent — Aggregate feedback, detect repeated errors, generate correction signals.

## dataConsistencyAgent
Phase 4 — Data Consistency Agent.
### Exports
- **runDataConsistencyAgent** — Set when reference library formula disagrees with system (>3% deviation).
- **DerivedCheck** — Spec: validation tolerance 3% (reference and SLM/Gemini comparison).
- **DataConsistencyResult** — Set when reference library formula disagrees with system (>3% deviation).

## dataReconciliationEngine
Phase 5 — Data Reconciliation Engine (CFO Agent).
### Exports
- **runDataReconciliationEngine** — When reconciliation failed: recommend SLM recompute and/or Gemini raw-report analysis.
- **ReconciliationCheck** — Phase 5 — Data Reconciliation Engine (CFO Agent).
- **DataReconciliationResult** — Phase 5 — Data Reconciliation Engine (CFO Agent).

## evidenceEngineAgent
Evidence Engine Agent — validates that every generated insight is supported by real dataset rows.
### Exports
- **verifyInsightWithEvidence** — Verify a single insight against the normalized dataset.
- **runEvidenceEngineAgent** — Run Evidence Engine on all insights from SLM and Gemini.

## humanFeedbackAgent
Phase 2: Human Feedback Learning Agent.
### Exports
- **runHumanFeedbackAgent** — Analyze incorrect feedback and produce suggested actions + prompt snippet for engines.
- **getFeedbackContextForEngines** — Call before SLM/Gemini runs to inject feedback context (e.g. into verify_slm or structured prompt).
- **HumanFeedbackAnalysis** — Phase 2: Human Feedback Learning Agent.

## index
Multi-Agent Validation Architecture.

## ingestionAgent
Ingestion Agent — Guild 1. Sanitize raw CSV/XLSX: currency, decimals, percentages, missing values.
### Exports
- **runIngestionAgent** — Run ingestion: normalize raw report values into sanitizedReports.

## mathematicalAuditorAgent
Mathematical Auditor — Guild 2. Verify financial integrity (e.g. Sum(SearchTermSpend) == CampaignSpend).
### Exports
- **runMathematicalAuditorAgent** — Mathematical Auditor — Guild 2. Verify financial integrity (e.g. Sum(SearchTermSpend) == CampaignSpend).

## multiAgentPipeline
Multi-Agent Validation Pipeline.
### Exports
- **runMultiAgentPipeline** — Run all validation agents. Recovered fields are approved only if
- **MultiAgentResult** — Multi-Agent Validation Pipeline.

## performanceDriftAgent
Phase 4: Performance Drift Agent — detects drift in campaign/keyword performance over time.
### Exports
- **runPerformanceDriftAgent** — Phase 4: Performance Drift Agent — detects drift in campaign/keyword performance over time.
- **DriftResult** — Phase 4: Performance Drift Agent — detects drift in campaign/keyword performance over time.

## profitabilityAgent
Phase 5: Profit Engine — Gross Profit, Net Profit, Contribution Margin, Break Even ACOS, Target ROAS.
### Exports
- **computeProfitMetrics** — Phase 5: Profit Engine — Gross Profit, Net Profit, Contribution Margin, Break Even ACOS, Target ROAS.
- **runProfitabilityAgent** — Phase 5: Profit Engine — Gross Profit, Net Profit, Contribution Margin, Break Even ACOS, Target ROAS.
- **ProfitInputs** — Phase 5: Profit Engine — Gross Profit, Net Profit, Contribution Margin, Break Even ACOS, Target ROAS.
- **ProfitMetrics** — Phase 5: Profit Engine — Gross Profit, Net Profit, Contribution Margin, Break Even ACOS, Target ROAS.
- **LossCampaign** — Phase 5: Profit Engine — Gross Profit, Net Profit, Contribution Margin, Break Even ACOS, Target ROAS.

## schemaGuardAgent
Schema Guard Agent — Guild 1. Prevent incorrect report mapping; validate required fields; map header aliases.
### Exports
- **runSchemaGuardAgent** — Run Schema Guard during ingestion: match headers to schema graph, detect missing/unmapped,
- **isSchemaGuardConfidenceLow** — Return whether schema guard confidence is below threshold (use Gemini fallback).

## schemaIntelligenceAgent
Phase 2 — Schema Intelligence Agent.
### Exports
- **runSchemaIntelligenceAgent** — Compare report headers with known schemas; compute per-metric and overall confidence.
- **SchemaMappingResult** — Phase 2 — Schema Intelligence Agent.
- **SchemaIntelligenceResult** — Phase 2 — Schema Intelligence Agent.
- **GeminiSchemaInference** — Gemini inference for a single header: canonical metric and confidence (0–1).

## seasonalityAgent
Phase 4: Seasonality Agent.
### Exports
- **runSeasonalityAgent** — Phase 4: Seasonality Agent.
- **SeasonalityResult** — Phase 4: Seasonality Agent.

## statisticalValidatorAgent
Phase 3 — Statistical Validator Agent.
### Exports
- **runStatisticalValidatorAgent** — When validation did not pass: recommend escalating to Gemini for analysis.
- **ValidationRule** — Phase 3 — Statistical Validator Agent.
- **StatisticalValidationResult** — Phase 3 — Statistical Validator Agent.

## trafficIntentAgent
Traffic & Intent Agent — Guild 2. Intent signals from search terms; IntentStrengthIndex = CTRCVR; behavioral clusters.
### Exports
- **runTrafficIntentAgent** — Intent strength proxy: ROAS

## trendAgent
Phase 4: Trend Agent.
### Exports
- **runTrendAgent** — Phase 4: Trend Agent.

