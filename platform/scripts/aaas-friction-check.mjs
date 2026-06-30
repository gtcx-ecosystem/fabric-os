#!/usr/bin/env node
/**
 * AAAS — Audit-as-a-Service friction gate; delegates the scoring probe to the
 * bridge-os MPR engine.
 * Usage: node aaas-friction-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveOpsDoc } from './lib/path-aliases.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const MPR_ENGINE = join(BRIDGE, 'platform/scripts/ecosystem/run-mpr-repo-audit.mjs');
const REGISTER = join(ROOT, 'machine/audit-friction-register.json');
const ROADMAP = join(ROOT, 'machine/aaas-roadmap.json');
const OPS = join(ROOT, resolveOpsDoc(ROOT, 'audit-as-a-service.md'));
const MPR = join(ROOT, 'audit/evidence/mpr-repo-latest.json');
const HONESTY = join(ROOT, 'audit/evidence/aaas-honesty-gate-latest.json');
const OUT = join(ROOT, 'audit/evidence/aaas-friction-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const PROBE = !process.argv.includes('--structural-only');

const gates = {
  register: { ok: existsSync(REGISTER) },
  roadmap: { ok: existsSync(ROADMAP) },
  opsDoc: { ok: existsSync(OPS) },
  primaryRoadmap: { ok: false },
  mprProbe: { ok: false, exit: null, skipped: !PROBE },
  mprWitness: { ok: existsSync(MPR) },
  openP0: { ok: true, count: 0 },
};

if (existsSync(ROADMAP)) {
  const rm = JSON.parse(readFileSync(ROADMAP, 'utf8'));
  gates.primaryRoadmap = { ok: rm.primaryRoadmap === true && rm.owner === 'fabric-os' };
}
if (existsSync(REGISTER)) {
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const openP0 = (reg.items ?? []).filter((i) => i.priority === 'P0' && i.status === 'open');
  gates.openP0 = { ok: true, count: openP0.length, ids: openP0.map((i) => i.id) };
}

if (PROBE && existsSync(MPR_ENGINE)) {
  const args = [MPR_ENGINE, '--repo', 'fabric-os'];
  if (WRITE) args.push('--write');
  const audit = spawnSync('node', args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
  });
  const exit = audit.status ?? 1;
  gates.mprProbe = {
    ok: exit === 0 || exit === 2,
    exit,
    maturityBelowBenchmark: exit === 2,
    skipped: false,
  };
  gates.mprWitness = { ok: existsSync(MPR) };
}

if (existsSync(HONESTY)) {
  const honesty = JSON.parse(readFileSync(HONESTY, 'utf8'));
  gates.honestyGate = {
    ok: honesty.ok === true,
    blocking: false,
    coveragePct: honesty.coverage?.coveragePct ?? null,
    worstVerifiedFinding: honesty.worstVerifiedFinding,
    failures: honesty.failures,
  };
} else {
  gates.honestyGate = { ok: false, blocking: false, failures: ['missing-witness'] };
}

const structuralOk =
  gates.register.ok &&
  gates.roadmap.ok &&
  gates.opsDoc.ok &&
  gates.primaryRoadmap.ok &&
  (gates.mprProbe.skipped || gates.mprProbe.ok);

const witness = {
  schema: 'gtcx://fabric-os/aaas-friction-check/v1',
  initiative: 'INIT-GTCX-SERVICE-FABRIC',
  service: 'AAAS',
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  harness: 'bridge-os/audit:mpr:repo:run',
  gates,
  openP0: gates.openP0.count ?? 0,
  ok: structuralOk,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    const suffix = v.skipped ? ' (skipped)' : v.count != null ? ` (${v.count})` : '';
    console.log(`${v.ok !== false && !v.skipped ? 'OK' : v.skipped ? 'SKIP' : 'FAIL'} ${k}${suffix}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — AAAS friction gates`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
