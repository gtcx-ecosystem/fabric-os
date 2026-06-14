#!/usr/bin/env node
/**
 * SECAS-S4-02 — fleet supply-chain security structural gate.
 * Usage: node secas-supply-chain-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECOSYSTEM = join(ROOT, '..');
const REGISTER = join(ROOT, 'pm/security-friction-register.json');
const FRICTION_ID = 'SEC-SUPPLY-01';
const OUT = join(ROOT, 'audit/evidence/secas-supply-chain-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const PROBE_REPOS = ['fabric-os', 'markets-os', 'compliance-os', 'terminal-os'];

function repoRoot(repo) {
  return join(ECOSYSTEM, repo);
}

function hasPackageJson(repo) {
  return existsSync(join(repoRoot(repo), 'package.json'));
}

const gates = {};
gates.frictionItem = { ok: false };
if (existsSync(REGISTER)) {
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const item = (reg.items ?? []).find((i) => i.id === FRICTION_ID);
  gates.frictionItem = { ok: Boolean(item), status: item?.status ?? null, storyId: item?.storyId ?? null };
}

const repoProbe = PROBE_REPOS.map((repo) => ({
  repo,
  present: existsSync(repoRoot(repo)),
  packageJson: hasPackageJson(repo),
}));
gates.repoProbe = {
  ok: repoProbe.filter((r) => r.present && r.packageJson).length >= 3,
  repos: repoProbe,
};

gates.ciPolicy = {
  ok: existsSync(join(ROOT, '.github/workflows')) || existsSync(join(ROOT, 'platform/tools/platform/scripts/validate-all.mjs')),
  note: 'Full Trivy/Semgrep fleet rollup queued — structural probe only',
};

const structuralOk = gates.frictionItem.ok && gates.repoProbe.ok;

const witness = {
  schema: 'gtcx://fabric-os/secas-supply-chain-check/v1',
  storyId: 'SECAS-S4-02',
  frictionId: FRICTION_ID,
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  gates,
  ok: structuralOk,
  phase: 'structural',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${v.status ? ` (${v.status})` : ''}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — SECAS-S4-02 supply-chain (structural)`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
