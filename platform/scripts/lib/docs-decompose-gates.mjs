/**
 * Shared narrative vs pointer detection for docs layer decompose gates.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const DECOMPOSE_EXEMPT_FILES = new Set(['README.md', 'FOLDER-SPEC.md', 'index.md', 'scorecard.md']);
export const DECOMPOSE_EXEMPT_DIRS = new Set(['agentic', 'roadmap', '.git']);

export function isPointerStub(filePath) {
  if (!existsSync(filePath)) return false;
  const text = readFileSync(filePath, 'utf8');
  if (!text.startsWith('---')) return false;
  const fmEnd = text.indexOf('---', 3);
  const fm = fmEnd > 0 ? text.slice(0, fmEnd + 3) : text.slice(0, 400);
  return /status:\s*pointer/i.test(fm) || /\*\*Canonical SoR:\*\*/.test(text);
}

export function countNarrativeMarkdown(dir, { exemptDirs = DECOMPOSE_EXEMPT_DIRS } = {}) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (exemptDirs.has(e.name)) continue;
        walk(p);
        continue;
      }
      if (!e.name.endsWith('.md') || DECOMPOSE_EXEMPT_FILES.has(e.name)) continue;
      if (isPointerStub(p)) continue;
      n += 1;
    }
  };
  walk(dir);
  return n;
}

export function hasNarrativeInPath(repoRoot, pattern) {
  const rel = pattern.replace(/\/$/, '');
  return countNarrativeMarkdown(join(repoRoot, rel)) > 0;
}

export function looseMarkdownAtRoot(dir, allowed = ['README.md', 'FOLDER-SPEC.md', 'scorecard.md']) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && !allowed.includes(e.name))
    .map((e) => join(dir, e.name))
    .filter((p) => !isPointerStub(p))
    .map((p) => p.split('/').pop());
}
