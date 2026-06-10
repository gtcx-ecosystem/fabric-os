#!/usr/bin/env node
/**
 * P42 — Security-as-a-Service operational friction gate.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER = join(ROOT, 'pm/security-friction-register.json');
const ROADMAP = join(ROOT, 'pm/secas-roadmap.json');
const OPS = join(ROOT, 'docs/operations/security-as-a-service.md');
const OUT = join(ROOT, 'audit/evidence/secas-friction-check-latest.json');
const WRITE = process.argv.includes('--write');

const gates = {
  register: { ok: existsSync(REGISTER) },
  roadmap: { ok: existsSync(ROADMAP) },
  opsDoc: { ok: existsSync(OPS) },
  primaryRoadmap: { ok: false },
  openP0: { ok: true, count: 0 },
};

if (existsSync(ROADMAP)) {
  const rm = JSON.parse(readFileSync(ROADMAP, 'utf8'));
  gates.primaryRoadmap = { ok: rm.primaryRoadmap === true && rm.owner === 'gtcx-infrastructure' };
}
if (existsSync(REGISTER)) {
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const openP0 = (reg.items ?? []).filter((i) => i.priority === 'P0' && i.status === 'open');
  gates.openP0 = { ok: true, count: openP0.length, ids: openP0.map((i) => i.id) };
}

const ok = gates.register.ok && gates.roadmap.ok && gates.opsDoc.ok && gates.primaryRoadmap.ok;
const witness = {
  schema: 'gtcx://gtcx-infrastructure/secas-friction-check/v1',
  protocol: 'P42-SECURITY-AS-A-SERVICE',
  checkedAt: new Date().toISOString(),
  gates,
  openP0: gates.openP0.count ?? 0,
  ok,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
for (const [k, v] of Object.entries(gates)) {
  console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${v.count != null ? ` (${v.count})` : ''}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — SECaaS friction gates`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
