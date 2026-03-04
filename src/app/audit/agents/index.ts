/**
 * Agent definitions / orchestration. Plug in when implementing swarm logic.
 * Agents: HeaderDiscovery, CurrencyMapping, MathVerification, etc.
 */
export const AGENT_IDS = [
  'HeaderDiscoveryAgent',
  'CurrencyMappingAgent',
  'MathVerificationAgent',
] as const;
