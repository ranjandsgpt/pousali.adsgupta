/**
 * Phase 34 — Insight Knowledge Graph.
 * Connects metrics, insights, agents, datasets, and queries for deeper reasoning.
 */

export type NodeType = 'metric' | 'insight' | 'agent' | 'dataset' | 'query';

export interface KGNode {
  id: string;
  type: NodeType;
  label: string;
  props?: Record<string, unknown>;
}

export interface KGEdge {
  from: string;
  to: string;
  relation: 'feeds' | 'derives' | 'triggers' | 'uses' | 'answers';
}

const nodes: KGNode[] = [];
const edges: KGEdge[] = [];

export function addNode(node: KGNode): void {
  if (!nodes.find((n) => n.id === node.id)) nodes.push(node);
}

export function addEdge(edge: KGEdge): void {
  if (!edges.find((e) => e.from === edge.from && e.to === edge.to && e.relation === edge.relation)) {
    edges.push(edge);
  }
}

export function getNodesByType(type: NodeType): KGNode[] {
  return nodes.filter((n) => n.type === type);
}

export function getEdgesFrom(id: string): KGEdge[] {
  return edges.filter((e) => e.from === id);
}

export function getEdgesTo(id: string): KGEdge[] {
  return edges.filter((e) => e.to === id);
}

export function clearGraph(): void {
  nodes.length = 0;
  edges.length = 0;
}
