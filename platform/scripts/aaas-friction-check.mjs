#!/usr/bin/env node
/**
 * AAAS — Audit-as-a-Service friction gate; delegates five-core probe to bridge-os harness.
 * Usage: node aaas-friction-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const REGISTER = join(ROOT, 'pm/audit-friction-register.json');
const ROADMAP = join(ROOT, 'pm/aaas-roadmap.json');
const OPS = join(ROOT, 'docs/operations/audit-as-a-service.md');
const COMPOSITE = join(ROOT, 'audit/evidence/composite-audit-latest.json');
const OUT = join(ROOT, 'audit/evidence/aaas-friction-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const PROBE = !process.argv.includes('--structural-only');

const gates = {
  register: { ok: existsSync(REGISTER) },
  roadmap: { ok: existsSync(ROADMAP) },
  opsDoc: { ok: existsSync(OPS) },
  primaryRoadmap: { ok: false },
  fiveCoreProbe: { ok: false, exit: null, skipped: !PROBE },
  compositeWitness: { ok: existsSync(COMPOSITE) },
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

if (PROBE && existsSync(join(BRIDGE, 'platform/scripts/ecosystem/run-five-core-audit.mjs'))) {
  const args = ['audit:five-core:run', '--', '--repo', 'fabric-os', '--probes-only'];
  if (WRITE) args.push('--write');
  const audit = spawnSync('pnpm', args, {
    cwd: BRIDGE,
    encoding: 'utf8',
    shell: false,
  });
  gates.fiveCoreProbe = { ok: audit.status === 0, exit: audit.status ?? 1, skipped: false };
  gates.compositeWitness = { ok: existsSync(COMPOSITE) };
}

const structuralOk =
  gates.register.ok &&
  gates.roadmap.ok &&
  gates.opsDoc.ok &&
  gates.primaryRoadmap.ok &&
  (gates.fiveCoreProbe.skipped || gates.fiveCoreProbe.ok);

const witness = {
  schema: 'gtcx://fabric-os/aaas-friction-check/v1',
  initiative: 'INIT-GTCX-SERVICE-FABRIC',
  service: 'AAAS',
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  harness: 'bridge-os/audit:five-core:run',
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
