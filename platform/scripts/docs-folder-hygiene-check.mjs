#!/usr/bin/env node
/**
 * W13 — docs folder hygiene check (sprawl + legacy forbidden folders)
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  checkDuplicateSpecsTree,
  checkForbiddenAbsentUnderDocs,
  checkForbiddenLegacyFolders,
  checkLayerRootSprawl,
  gate,
  loadHygienePolicy,
  sprawlMetrics,
} from './lib/docs-folder-hygiene-gates.mjs';

const repoRoot = process.argv.includes('--repo')
  ? join(process.cwd(), process.argv[process.argv.indexOf('--repo') + 1])
  : process.cwd();
const write = process.argv.includes('--write');
const strict = process.argv.includes('--strict');

const policy = loadHygienePolicy(repoRoot);
if (!policy) {
  console.error('docs-folder-hygiene-policy.json not found');
  process.exit(1);
}

const gates = [];
gates.push(gate('policy:present', !!policy && !!policy.updated, policy?.updated ?? 'missing'));

if (!existsSync(join(repoRoot, 'docs'))) {
  gates.push(gate('docs:present', false, 'no docs/'));
} else {
  gates.push(gate('docs:present', true));
  checkForbiddenAbsentUnderDocs(policy, repoRoot, gates);
  checkForbiddenLegacyFolders(policy, repoRoot, gates);
  checkLayerRootSprawl(policy, repoRoot, gates);
  checkDuplicateSpecsTree(repoRoot, gates);
}

const metrics = sprawlMetrics(repoRoot);
const failed = gates.filter((g) => !g.ok);
const pass = failed.length === 0;

const witness = {
  schema: 'gtcx://canon-os/docs-folder-hygiene-witness/v1',
  generatedAt: new Date().toISOString(),
  repo: repoRoot.split('/').pop(),
  policyUpdated: policy.updated,
  pass,
  strict,
  metrics,
  gates,
  failed: failed.map((g) => g.id),
};

if (write) {
  const out = join(repoRoot, 'audit/evidence/docs-folder-hygiene-latest.json');
  writeFileSync(out, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const g of gates) {
  console.log(`${g.ok ? 'PASS' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
}
if (metrics.totalMd) {
  console.log(`\nmetrics: ${metrics.totalMd} md under docs/`);
  for (const f of metrics.topLevelFolders ?? []) {
    console.log(`  ${f.name}: ${f.mdCount} md (${f.looseRoot} loose at root)`);
  }
}

console.log(`\n${pass ? 'PASS' : 'FAIL'} docs:folder-hygiene:check (${gates.length - failed.length}/${gates.length})`);
process.exit(strict && !pass ? 1 : pass ? 0 : strict ? 1 : 0);
