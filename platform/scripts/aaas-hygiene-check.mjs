#!/usr/bin/env node
/**
 * AAAS — fleet hygiene / closed-specs enforcement (AaaS-lane lock-in).
 *
 * Runs the canon-os docs-folder-hygiene checker (which includes the closed-specs
 * keystone) across every repo bound by the AaaS contract, records a witness, and
 * fails (exit 1) under --strict if any bound repo drifts. This is the centralized
 * lock-in: drift surfaces in the AaaS lane that fabric-os runs on cadence.
 * (The per-repo pre-commit hard-gate is owned by canon-os/bridge-os.)
 *
 * Usage: node aaas-hygiene-check.mjs [--strict] [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const BINDINGS = join(ROOT, 'machine/fleet-audit-contracts.json');
const CHECKER = join(FLEET, 'canon-os/platform/scripts/fleet-docs-folder-hygiene-check.mjs');
const STRICT = process.argv.includes('--strict');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

function checkRepo(repo) {
  // Delegate to the canon-os checker (SoR for folder-hygiene + closed-specs).
  const res = spawnSync('node', [CHECKER, '--repo', repo], { cwd: join(FLEET, 'canon-os'), encoding: 'utf8' });
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  const m = out.match(/([A-Z]+)\s+[\w-]+\s+—\s+(\w+)\s+docs:folder-hygiene:check\s+\((\d+)\/(\d+)\)/);
  const passN = m ? Number(m[3]) : null;
  const total = m ? Number(m[4]) : null;
  const clean = m ? m[2] !== 'FAIL' && passN === total : res.status === 0;
  return { repo, passN, total, clean };
}

function main() {
  const bindings = readJson(BINDINGS);
  if (!bindings || !existsSync(CHECKER)) {
    console.error('missing bindings or canon-os checker (is canon-os a sibling?)');
    process.exit(2);
  }
  const repos = (bindings.repos ?? []).map((b) => b.repo);
  const results = repos.map((r) => (existsSync(join(FLEET, r)) ? checkRepo(r) : { repo: r, absent: true, clean: false }));
  const clean = results.filter((r) => r.clean).length;
  const drift = results.filter((r) => !r.clean && !r.absent);

  const witness = {
    schema: 'gtcx://fabric-os/aaas-hygiene-check/v1',
    provider: 'fabric-os',
    checkedAt: new Date().toISOString(),
    delegatesTo: 'canon-os/platform/scripts/fleet-docs-folder-hygiene-check.mjs',
    clean,
    total: results.length,
    drift: drift.map((r) => ({ repo: r.repo, score: r.passN != null ? `${r.passN}/${r.total}` : 'fail' })),
  };

  if (WRITE) {
    const dir = join(ROOT, 'audit/evidence');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'aaas-hygiene-check-latest.json'), JSON.stringify(witness, null, 2) + '\n');
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`AAAS hygiene/closed-specs — ${clean}/${results.length} repos clean${STRICT ? ' (strict)' : ''}`);
    for (const r of drift) console.log(`  DRIFT ${r.repo.padEnd(15)} ${r.passN != null ? r.passN + '/' + r.total : 'fail'}`);
    if (WRITE) console.log('witness: audit/evidence/aaas-hygiene-check-latest.json');
  }
  process.exit(STRICT && drift.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
