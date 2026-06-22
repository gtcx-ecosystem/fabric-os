#!/usr/bin/env node
/**
 * P48 — FinOps-as-a-Service harness (fabric-os).
 * Usage: node finops-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const OUT = join(ROOT, 'audit/evidence/finops-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const SPEC = join(ROOT, 'machine/spec/finops-as-a-service.json');
const REGISTER = join(ROOT, 'machine/finops-friction-register.json');
const OPS = join(ROOT, 'docs/operations/finops-as-a-service.md');
const INFRA_WITNESS = join(ROOT, 'audit/evidence/infra-aws-cost-optimization-latest.json');

function openP0() {
  if (!existsSync(REGISTER)) return { ok: false, count: -1, ids: [] };
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const open = (reg.items ?? []).filter((i) => i.priority === 'P0' && i.status === 'open');
  return { ok: true, count: open.length, ids: open.map((i) => i.id) };
}

function runInfraAudit() {
  const r = spawnSync('pnpm', ['infra:cost:audit'], { cwd: ROOT, encoding: 'utf8', timeout: 120_000 });
  return { ok: (r.status ?? 1) === 0, exitCode: r.status ?? 1 };
}

const gates = {
  spec: { ok: existsSync(SPEC) },
  opsDoc: { ok: existsSync(OPS) },
  frictionRegister: { ok: existsSync(REGISTER) },
  policySoR: { ok: existsSync(join(BRIDGE, 'machine/spec/environment-cost-policy.json')) },
  governanceSoR: { ok: existsSync(join(BRIDGE, 'machine/spec/aws-cost-governance.json')) },
  infraWitness: { ok: existsSync(INFRA_WITNESS) },
  openP0: openP0(),
};

let infraAudit = { ok: false, skipped: true };
if (!gates.infraWitness.ok) {
  infraAudit = runInfraAudit();
  gates.infraCostAudit = infraAudit;
}

const requiredOk =
  gates.spec.ok &&
  gates.opsDoc.ok &&
  gates.frictionRegister.ok &&
  gates.policySoR.ok &&
  gates.governanceSoR.ok;

const witness = {
  $schema: 'gtcx://fabric-os/finops-check-witness/v1',
  version: '1.0.0',
  updated: new Date().toISOString(),
  repo: 'fabric-os',
  lane: 'FinOps',
  protocolId: 'P48-FINOPS-AS-A-SERVICE',
  gates,
  openP0: gates.openP0.count ?? 0,
  ok: requiredOk,
  fleetWitness: true,
  handoff: 'XR-BRIDGE-CORE-OPS-FABRIC-W1-001',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  console.log('=== FinOps check ===\n');
  for (const [k, v] of Object.entries(gates)) {
    console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
  }
  console.log(`\n${requiredOk ? 'PASS' : 'FAIL'}`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(requiredOk ? 0 : 1);
