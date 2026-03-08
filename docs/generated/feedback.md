# Feedback System

## Central Feedback Agent

Aggregates feedback (like/dislike, correct/incorrect) from Copilot, metrics, insights. Detects repeated corrections and builds prompt context for engines.

## Query Interaction Store

Each Copilot response is stored with `responseId`, `question`, `intent`, `capability`, `answer`. When user sends feedback with `responseId`, the full interaction is linked.

## Human Feedback Agent

Analyzes incorrect feedback and produces a prompt snippet for SLM/Gemini to re-verify metrics.
