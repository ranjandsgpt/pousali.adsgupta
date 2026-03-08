/**
 * Code Intelligence Documentation Engine — Generates deep explanations for functions, classes, APIs.
 * Scans: src/agents, src/services, src/lib, src/app/api.
 * Output: docs/generated/code-intelligence/*.md
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import path from 'path';

const ROOT = typeof process !== 'undefined' && process.cwd ? process.cwd() : path.resolve('.');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs', 'generated', 'code-intelligence');

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

function extractLeadingComment(content: string, beforeIndex: number): string {
  const slice = content.slice(0, beforeIndex);
  const match = slice.match(/\/\*\*?([\s\S]*?)\*\//);
  return match ? match[1].replace(/\s*\*\s?/g, ' ').trim() : '';
}

function extractExports(content: string): Array<{ name: string; kind: 'function' | 'class' | 'interface'; comment: string }> {
  const out: Array<{ name: string; kind: 'function' | 'class' | 'interface'; comment: string }> = [];
  const funcRe = /export\s+function\s+(\w+)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = funcRe.exec(content)) !== null) {
    out.push({ name: m[1], kind: 'function', comment: extractLeadingComment(content, m.index) });
  }
  const classRe = /export\s+class\s+(\w+)/g;
  while ((m = classRe.exec(content)) !== null) {
    out.push({ name: m[1], kind: 'class', comment: extractLeadingComment(content, m.index) });
  }
  const ifaceRe = /export\s+interface\s+(\w+)/g;
  while ((m = ifaceRe.exec(content)) !== null) {
    out.push({ name: m[1], kind: 'interface', comment: extractLeadingComment(content, m.index) });
  }
  return out;
}

async function listTsFiles(dir: string, base: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        out.push(...(await listTsFiles(full, base)));
      } else if (e.isFile() && e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) {
        out.push(path.relative(base, full));
      }
    }
  } catch {
    //
  }
  return out;
}

export async function runCodeIntelligenceDocEngine(): Promise<string[]> {
  await ensureDir(OUT);
  const written: string[] = [];

  const dirs = [
    path.join(SRC, 'agents'),
    path.join(SRC, 'services'),
    path.join(SRC, 'lib'),
    path.join(SRC, 'app', 'api'),
  ];

  for (const dir of dirs) {
    let files: string[] = [];
    try {
      files = await listTsFiles(dir, SRC);
    } catch {
      continue;
    }
    for (const rel of files) {
      const full = path.join(SRC, rel);
      const baseName = path.basename(rel, '.ts');
      const content = await readFile(full, 'utf-8').catch(() => '');
      const exports = extractExports(content);
      const firstBlock = content.match(/\/\*\*([\s\S]*?)\*\//)?.[1]?.trim() ?? '';
      const purpose = firstBlock.split('\n')[0]?.replace(/\s*\*\s?/g, '').trim() ?? '';

      const md = [
        `# ${baseName}\n`,
        `**Path:** \`${rel}\`\n`,
        `## Purpose\n\n${purpose || 'No description.'}\n`,
        `## Exports\n\n`,
        ...exports.map((e) => `- **${e.name}** (${e.kind})${e.comment ? ` — ${e.comment.slice(0, 120)}` : ''}\n`),
      ].join('');

      const outPath = path.join(OUT, `${baseName}.md`);
      await writeFile(outPath, md, 'utf-8');
      written.push(outPath);
    }
  }

  return written;
}
