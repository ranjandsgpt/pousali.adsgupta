#!/usr/bin/env npx ts-node
/**
 * Update docs — scan codebase, generate docs, update diagrams, formulas, agent descriptions.
 * Run on git commit/push (see package.json "generate-docs" and husky/pre-commit if desired).
 */

import path from 'path';

async function main() {
  const root = path.resolve(__dirname, '..');
  process.chdir(root);

  const { runDocGenerator } = await import('../src/services/docGenerator');
  const { generateKnowledgeGraph } = await import('../src/services/knowledgeGraphGenerator');
  const { runDocsValidator } = await import('../src/services/docsValidator');
  const { runCodeIntelligenceDocEngine } = await import('../src/services/codeIntelligenceDocEngine');

  console.log('[updateDocs] Generating documentation...');
  const { files } = await runDocGenerator();
  console.log('[updateDocs] Generated', files.length, 'files');

  console.log('[updateDocs] Generating code intelligence docs...');
  const codeFiles = await runCodeIntelligenceDocEngine();
  console.log('[updateDocs] Code intelligence:', codeFiles.length, 'files');

  console.log('[updateDocs] Generating knowledge graph...');
  const graphPath = await generateKnowledgeGraph();
  console.log('[updateDocs] Wrote', graphPath);

  const validation = await runDocsValidator();
  if (!validation.passed) {
    console.error('[updateDocs] Validation errors:', validation.errors);
    process.exit(1);
  }
  if (validation.warnings.length) {
    console.warn('[updateDocs] Warnings:', validation.warnings);
  }
  console.log('[updateDocs] Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
