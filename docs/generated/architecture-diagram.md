# Architecture Diagram

```mermaid
graph TD
  User --> UploadReports
  UploadReports --> DataNormalization
  DataNormalization --> AuditStore
  AuditStore --> Agents
  Agents --> Insights
  Insights --> Charts
  Charts --> Copilot
  Copilot --> ExportPipeline
  ExportPipeline --> PDF
  ExportPipeline --> PPTX
```
