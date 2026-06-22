#!/usr/bin/env node
/**
 * P45 — LegalOps lane harness (fabric-os owner).
 * Usage: node legalops-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const REGISTER = join(ROOT, 'machine/legal-friction-register.json');
const SPEC = join(ROOT, 'machine/spec/legalops-as-a-service.json');
const RUNBOOK = join(ROOT, 'docs/operations/legalops-as-a-service.md');
const MANIFEST = join(ROOT, 'operations/legal/manifest.json');
const OUT = join(ROOT, 'audit/evidence/legalops-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const gates = {
  spec: { ok: existsSync(SPEC) },
  runbook: { ok: existsSync(RUNBOOK) },
  frictionRegister: { ok: existsSync(REGISTER) },
  productManifest: { ok: existsSync(MANIFEST) },
  fleetProtocol: { ok: existsSync(join(BRIDGE, 'machine/spec/ecosystem-legal-program-protocol.json')) },
  fleetWitness: { ok: existsSync(join(BRIDGE, 'machine/ci/ops-lanes-100/legalops-fleet-latest.json')) },
};

if (gates.frictionRegister.ok) {
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  gates.opsLane = { ok: reg.opsLane === 'LegalOps' };
  gates.registerOwner = { ok: reg.registerOwner === 'fabric-os' && reg.owner === 'fabric-os' };
}

if (gates.spec.ok) {
  const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
  gates.specOwner = { ok: spec.owner === 'fabric-os' && spec.registerOwner === 'fabric-os' };
}

const ok = Object.values(gates).every((g) => g.ok);
const witness = {
  $schema: 'gtcx://fabric-os/legalops-check-witness/v1',
  updated: new Date().toISOString(),
  repo: 'fabric-os',
  lane: 'LegalOps',
  owner: 'fabric-os',
  gates,
  ok,
  fleetWitness: true,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  console.log('=== LegalOps check (fabric-os) ===\n');
  for (const [k, v] of Object.entries(gates)) console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'}`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(ok ? 0 : 1);
