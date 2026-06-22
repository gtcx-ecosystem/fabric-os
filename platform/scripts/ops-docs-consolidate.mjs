#!/usr/bin/env node
/** Consolidate ops domain markdown into docs/ per P35 + docs-operations-pack. */
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = process.cwd();

function ensureDir(rel) {
  mkdirSync(join(root, rel), { recursive: true });
}

function moveTree(fromRel, toRel) {
  const from = join(root, fromRel);
  const to = join(root, toRel);
  if (!existsSync(from)) return { moved: 0, skipped: true };
  ensureDir(toRel);
  let moved = 0;
  const walkMove = (srcDir, destDir) => {
    for (const e of readdirSync(srcDir, { withFileTypes: true })) {
      const src = join(srcDir, e.name);
      const dest = join(destDir, e.name);
      if (e.isDirectory()) {
        ensureDir(relative(root, dest));
        walkMove(src, dest);
      } else if (e.name.endsWith('.md')) {
        renameSync(src, dest);
        moved += 1;
      }
    }
  };
  walkMove(from, to);
  rmSync(from, { recursive: true, force: true });
  return { moved, skipped: false };
}

function moveFile(fromRel, toRel) {
  const from = join(root, fromRel);
  if (!existsSync(from)) return false;
  ensureDir(dirname(toRel));
  renameSync(from, join(root, toRel));
  return true;
}

const results = [];

// GTM + compliance: preserve folder tree under docs/roadmap/
results.push({
  label: 'gtm',
  ...moveTree('operations/gtm/narrative', 'docs/roadmap/gtm'),
});

results.push({
  label: 'compliance',
  ...moveTree('operations/compliance/narrative', 'docs/roadmap/compliance'),
});

// Security: one full doc → secas; stubs removed after README catalog (handled below)
if (moveFile('operations/security/narrative/bug-bounty-policy.md', 'docs/operations/secas/bug-bounty-policy.md')) {
  results.push({ label: 'bug-bounty-policy', moved: 1 });
}

const secDir = join(root, 'operations/security/narrative');
if (existsSync(secDir)) {
  let removed = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) {
        rmSync(p);
        removed += 1;
      }
    }
  };
  walk(secDir);
  rmSync(secDir, { recursive: true, force: true });
  results.push({ label: 'security-stubs-removed', removed });
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
