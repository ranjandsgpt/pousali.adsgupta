# Query Intelligence System

## Pipeline

```mermaid
graph TD
  UserQuestion --> QueryIntelligenceAgent
  QueryIntelligenceAgent --> IntentDetection
  QueryIntelligenceAgent --> CapabilityDetection
  CapabilityDetection --> MetricDiscovery
  MetricDiscovery --> AgentRouter
  AgentRouter --> SLM
  AgentRouter --> Gemini
  AgentRouter --> MetricsLibrary
  AgentRouter --> Tables
  SLM --> ResponseValidator
  Gemini --> ResponseValidator
  ResponseValidator --> CopilotUI
  CopilotUI --> CentralFeedbackAgent
```

## Intent Types

metric | formula | dataset | diagnostic | strategy | explanation | forecast | out_of_scope

## Capability

available | derivable | unknown | out_of_scope

## Agent Router

- **metric** → SLM calculation engine
- **formula** → metrics library (amazonMetricsLibrary)
- **dataset** → PremiumState tables
- **diagnostic / strategy** → Gemini
