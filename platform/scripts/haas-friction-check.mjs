#!/usr/bin/env node
/**
 * HAAS — Hygiene-as-a-Service friction register gate.
 * Usage: node haas-friction-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER = join(ROOT, 'machine/hygiene-friction-register.json');
const ROADMAP = join(ROOT, 'machine/haas-roadmap.json');
const OPS = join(ROOT, 'docs/operations/hygiene-as-a-service.md');
const OUT = join(ROOT, 'audit/evidence/haas-friction-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const gates = {
  register: { ok: existsSync(REGISTER) },
  roadmap: { ok: existsSync(ROADMAP) },
  opsDoc: { ok: existsSync(OPS) },
  primaryRoadmap: { ok: false },
  workspaceHygiene: { ok: false, exit: null },
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

const hygiene = spawnSync('pnpm', ['check:workspace-root-cleanliness:strict'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: false,
});
gates.workspaceHygiene = { ok: hygiene.status === 0, exit: hygiene.status ?? 1 };

const structuralOk =
  gates.register.ok &&
  gates.roadmap.ok &&
  gates.opsDoc.ok &&
  gates.primaryRoadmap.ok &&
  gates.workspaceHygiene.ok;

const witness = {
  schema: 'gtcx://fabric-os/haas-friction-check/v1',
  initiative: 'INIT-GTCX-SERVICE-FABRIC',
  service: 'HAAS',
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
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
    console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${v.count != null ? ` (${v.count})` : ''}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — HaaS friction gates`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
