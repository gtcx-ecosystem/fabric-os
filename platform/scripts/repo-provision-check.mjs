#!/usr/bin/env node
/**
 * repo:provision:check — L0 eleven hubs + L1 required stubs (draft-final specs)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier } from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/repo-provision-latest.json');

const L0_HUBS = ['docs', 'agile', 'pm', 'agents', 'ops', 'audit', 'platform', 'workstream', 'archive', 'deploy', 'config'];

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function loadL1(id) {
  const local = join(REPO, `pm/spec/repo-provisioning/${id}.json`);
  const canon = join(REPO, `../canon-os/pm/spec/repo-provisioning/${id}.json`);
  const path = existsSync(local) ? local : canon;
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function hubProfile(repoName) {
  if (repoName === 'canon-os' || repoName === 'bridge-os' || repoName === 'baseline-os') return 'constitution-standards';
  if (repoName === 'agile-os') return 'referenceImpl';
  if (repoName === 'ecosystem-os') return 'fleet-documentation';
  return profileKeyFromTier(readProductTier(REPO));
}

function main() {
  const gates = [];
  const repoName = basename(REPO);
  const profile = hubProfile(repoName);

  for (const hub of L0_HUBS) {
    gates.push(gate(`L0:${hub}`, existsSync(join(REPO, hub)), hub));
  }

  gates.push(gate('L0:forbidden:agentic', !existsSync(join(REPO, 'agentic')), 'agentic/ absent'));

  const l1Checks = [
    { id: 'L1-workstream', files: ['workstream/README.md', 'workstream/FOLDER-SPEC.md', 'workstream/sprints/current.md'] },
    { id: 'L1-deploy', files: ['deploy/README.md', 'deploy/FOLDER-SPEC.md'] },
    { id: 'L1-archive', files: ['archive/README.md'] },
    {
      id: 'L1-config',
      files: ['config/README.md', 'config/FOLDER-SPEC.md', 'config/repo-kind.json', 'config/sor-map.json', 'config/governance-spine.json', 'config/baseline/baseline.config.json'],
    },
    { id: 'L1-agents', files: ['agents/README.md'] },
  ];

  for (const block of l1Checks) {
    const spec = loadL1(block.id);
    if (!spec) continue;
    for (const rel of block.files) {
      gates.push(gate(`L1:${rel}`, existsSync(join(REPO, rel)), rel));
    }
  }

  if (profile === 'constitution-standards') {
    gates.push(gate('hub:docs/governance', existsSync(join(REPO, 'docs/governance/README.md')), 'docs/governance/'));
  }

  const ok = gates.every((g) => g.ok);
  const witness = { schema: 'gtcx://canon-os/repo-provision-check/v1', repo: repoName, profile, at: new Date().toISOString(), ok, gates };

  if (WRITE) {
    mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
  }

  console.log('=== repo:provision:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  if (WRITE) console.log(`witness: ${WITNESS}`);
  process.exit(ok ? 0 : 1);
}

main();
