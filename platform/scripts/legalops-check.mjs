#!/usr/bin/env node
/**
 * P45 — LegalOps lane harness (fabric-os owner).
 * Usage: node legalops-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyExternalAssuranceLane } from './lib/assurance-lane-witness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECOSYSTEM = join(ROOT, '..');
const REGISTER = join(ROOT, 'machine/legal-friction-register.json');
const SPEC = join(ROOT, 'machine/spec/legalops-as-a-service.json');
const MANIFEST = join(ROOT, 'operations/legal/manifest.json');
const OUT = join(ROOT, 'audit/evidence/legalops-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

/** PHASE-TAXONOMY: pm↔machine and ops↔operations path aliases. */
function pathAliases(rel) {
  const variants = [rel];
  if (rel.startsWith('operations/')) variants.push(`ops/${rel.slice('operations/'.length)}`);
  if (rel.startsWith('ops/')) variants.push(`operations/${rel.slice('ops/'.length)}`);
  if (rel.startsWith('machine/')) variants.push(`pm/${rel.slice('machine/'.length)}`);
  if (rel.startsWith('pm/')) variants.push(`machine/${rel.slice('pm/'.length)}`);
  return [...new Set(variants)];
}

function anyExists(repoRoot, rel) {
  return pathAliases(rel).some((variant) => existsSync(join(repoRoot, variant)));
}

function ecosystemRefExists(ref) {
  const [repo, ...rest] = ref.split('/');
  return anyExists(join(ECOSYSTEM, repo), rest.join('/'));
}

const spec = existsSync(SPEC) ? JSON.parse(readFileSync(SPEC, 'utf8')) : null;
const runbookRel = spec?.artifacts?.runbook ?? 'docs/operations/legalops-as-a-service.md';
const fleetProtocolRef =
  spec?.artifacts?.fleetProtocol ?? 'bridge-os/pm/spec/ecosystem-legal-program-protocol.json';
const fleetWitnessRef =
  spec?.artifacts?.fleetWitness ?? 'bridge-os/pm/ci/ops-lanes-100/legalops-fleet-latest.json';

const gates = {
  spec: { ok: existsSync(SPEC) },
  runbook: { ok: anyExists(ROOT, runbookRel) || anyExists(ROOT, 'docs/operations/runbooks/legalops-as-a-service.md') },
  frictionRegister: { ok: existsSync(REGISTER) },
  productManifest: { ok: anyExists(ROOT, 'operations/legal/manifest.json') },
  fleetProtocol: { ok: ecosystemRefExists(fleetProtocolRef) },
  fleetWitness: { ok: ecosystemRefExists(fleetWitnessRef) },
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
const witness = applyExternalAssuranceLane({
  $schema: 'gtcx://fabric-os/legalops-check-witness/v1',
  updated: new Date().toISOString(),
  repo: 'fabric-os',
  opsLane: 'LegalOps',
  owner: 'fabric-os',
  gates,
  ok,
  fleetWitness: true,
});

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
