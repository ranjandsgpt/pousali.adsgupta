/**
 * Dataset Schema Registry — All datasets available to Copilot.
 */

export interface DatasetSchema {
  id: string;
  fields: string[];
  metrics: string[];
}

export const SCHEMA_REGISTRY: DatasetSchema[] = [
  { id: 'campaigns', fields: ['campaignName', 'spend', 'sales', 'acos', 'roas', 'budget', 'clicks'], metrics: ['ROAS', 'ACOS', 'Ad Sales', 'Waste Spend'] },
  { id: 'searchTerms', fields: ['searchTerm', 'campaign', 'spend', 'sales', 'clicks', 'acos', 'roas'], metrics: ['CVR', 'Waste Spend', 'CPC'] },
  { id: 'keywords', fields: ['searchTerm', 'campaign', 'spend', 'sales', 'clicks'], metrics: ['ROAS', 'ACOS'] },
  { id: 'asins', fields: ['asin', 'sales', 'units', 'conversionRate'], metrics: ['CVR', 'TACOS'] },
  { id: 'charts', fields: ['id', 'title', 'type', 'dataset'], metrics: [] },
  { id: 'insights', fields: ['title', 'description', 'recommendedAction'], metrics: [] },
  { id: 'brandAnalysis', fields: ['brandedSales', 'genericSales', 'competitorSales'], metrics: ['Ad Sales', 'Store Sales'] },
];

export function getSchema(id: string): DatasetSchema | undefined {
  return SCHEMA_REGISTRY.find((s) => s.id === id);
}
