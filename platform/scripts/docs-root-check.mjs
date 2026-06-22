#!/usr/bin/env node
/**
 * docs:root:check — enforce machine/spec/docs-folders/00-docs-root.json
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier } from './lib/resolve-docs-pack.mjs';
import { isPointerReadme } from './lib/docs-folder-hygiene-gates.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-root-latest.json');

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function loadSpec() {
  const local = join(REPO, 'machine/spec/docs-folders/00-docs-root.json');
  const canon = join(REPO, '../canon-os/pm/spec/docs-folders/00-docs-root.json');
  const path = existsSync(local) ? local : canon;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isPointerFolder(absDir) {
  const readme = join(absDir, 'README.md');
  return existsSync(readme) && isPointerReadme(readme);
}

function main() {
  const gates = [];
  const spec = loadSpec();
  const repoName = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;
  const tier = profileKeyFromTier(readProductTier(REPO));
  const isHub = tier === 'constitution-standards' || repoName === 'canon-os';

  const allowed = new Set(spec.structure?.allowedChildFolders ?? []);
  if (isHub && spec.profileVariants?.['constitution-standards']?.extraAllowedChildFolders) {
    for (const x of spec.profileVariants['constitution-standards'].extraAllowedChildFolders) allowed.add(x);
  }
  const forbidden = new Set(spec.structure?.forbiddenChildFolders ?? []);

  const docsDir = join(REPO, 'docs');
  gates.push(gate('docs:present', existsSync(docsDir), 'docs/'));

  for (const f of spec.rootFiles?.allowlist ?? []) {
    gates.push(gate(`root-file:${f}`, existsSync(join(docsDir, f)), f));
  }

  if (!existsSync(docsDir)) {
    emit(gates, repoName);
    return;
  }

  const topDirs = readdirSync(docsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);

  const unknown = topDirs.filter((n) => {
    if (allowed.has(n)) return false;
    if (forbidden.has(n) && isPointerFolder(join(docsDir, n))) return false;
    return true;
  });
  gates.push(gate('top-level:allowed', unknown.length === 0, unknown.length ? `relocate: ${unknown.join(', ')}` : 'ok'));

  for (const name of forbidden) {
    const abs = join(docsDir, name);
    if (!existsSync(abs)) {
      gates.push(gate(`forbidden:absent:${name}`, true, 'absent'));
      continue;
    }
    if (isHub && name === 'governance') {
      gates.push(gate(`forbidden:hub-governance`, true, 'hub profile'));
      continue;
    }
    gates.push(gate(`forbidden:pointer:${name}`, isPointerFolder(abs), 'pointer-only or remove'));
  }

  emit(gates, repoName);
}

function emit(gates, repoName) {
  const ok = gates.every((g) => g.ok);
  const witness = { schema: 'gtcx://canon-os/docs-root-check/v1', repo: repoName, at: new Date().toISOString(), ok, gates };
  if (WRITE) {
    mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
  }
  console.log('=== docs:root:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  if (WRITE) console.log(`witness: ${WITNESS}`);
  process.exit(ok ? 0 : 1);
}

main();
