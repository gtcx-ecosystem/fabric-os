#!/usr/bin/env node
/**
 * P53 — CommOps-as-a-Service harness (fabric-os).
 * Usage: node commops-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/evidence/commops-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const SPEC = join(ROOT, 'machine/spec/commops-as-a-service.json');
const SUBSTRATE = join(ROOT, 'machine/commops-substrate-contract.json');
const REGISTER = join(ROOT, 'machine/commops-friction-register.json');
const OPS = join(ROOT, 'docs/operations/commops-as-a-service.md');
const DELIV = join(ROOT, 'audit/evidence/commops-deliverability-latest.json');

function openP0() {
  if (!existsSync(REGISTER)) return { ok: false, count: -1, ids: [] };
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const open = (reg.items ?? []).filter((i) => i.priority === 'P0' && i.status === 'open');
  return { ok: true, count: open.length, ids: open.map((i) => i.id) };
}

function runDeliverability() {
  const r = spawnSync('pnpm', ['commops:deliverability:check'], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
  return { ok: (r.status ?? 1) === 0, exitCode: r.status ?? 1 };
}

const gates = {
  spec: { ok: existsSync(SPEC) },
  opsDoc: { ok: existsSync(OPS) },
  frictionRegister: { ok: existsSync(REGISTER) },
  substrateContract: { ok: existsSync(SUBSTRATE) },
  deliverabilityWitness: { ok: existsSync(DELIV) },
  openP0: openP0(),
};

let delivRun = { ok: false, skipped: true };
if (!gates.deliverabilityWitness.ok) {
  delivRun = runDeliverability();
  gates.deliverabilityCheck = delivRun;
}

const channelCount = existsSync(SUBSTRATE)
  ? JSON.parse(readFileSync(SUBSTRATE, 'utf8')).channels?.length ?? 0
  : 0;
gates.channelMatrix = { ok: channelCount >= 3, count: channelCount };

const requiredOk =
  gates.spec.ok &&
  gates.opsDoc.ok &&
  gates.frictionRegister.ok &&
  gates.substrateContract.ok &&
  gates.channelMatrix.ok &&
  (gates.deliverabilityWitness.ok || delivRun.ok);

const witness = {
  $schema: 'gtcx://fabric-os/commops-check-witness/v1',
  version: '1.0.0',
  updated: new Date().toISOString(),
  repo: 'fabric-os',
  lane: 'CommOps',
  protocolId: 'P53-COMMOPS-AS-A-SERVICE',
  gates,
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
  console.log('=== CommOps check ===\n');
  for (const [k, v] of Object.entries(gates)) {
    console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
  }
  console.log(`\n${requiredOk ? 'PASS' : 'FAIL'}`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(requiredOk ? 0 : 1);
