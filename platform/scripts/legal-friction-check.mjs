#!/usr/bin/env node
/**
 * P45 — Legal-as-a-Service operational friction gate.
 * Parity harness with secas-friction-check depth.
 *
 * Usage: node platform/scripts/legal-friction-check.mjs [--write]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyExternalAssuranceLane } from './lib/assurance-lane-witness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const REGISTER = join(ROOT, 'machine/legal-friction-register.json');
const SOVEREIGN = join(ROOT, 'machine/sovereign-approval-register.json');
const MANIFEST = join(ROOT, 'operations/legal/manifest.json');
const OPS = join(ROOT, 'docs/operations/legalops-as-a-service.md');
const PARALLEL_WITNESS = join(ROOT, 'audit/evidence/secas-parallel-lane-check-latest.json');
const FLEET_WITNESS = join(BRIDGE, 'pm/ci/ecosystem-legal-program-latest.json');
const OUT = join(ROOT, 'audit/evidence/legal-friction-check-latest.json');
const WRITE = process.argv.includes('--write');

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const gates = {
  register: { ok: existsSync(REGISTER) },
  manifest: { ok: existsSync(MANIFEST) },
  opsDoc: { ok: existsSync(OPS) },
  opsLane: { ok: false },
  protocol: { ok: false },
  harnessDepth: { ok: false },
  sovereignCrosswalk: { ok: false, missing: [] },
  blocksIR: { ok: false },
  parallelLaneWitness: { ok: false },
  fleetLegalProgram: { ok: false },
  programItemClosed: { ok: false },
};

const reg = readJson(REGISTER);
if (reg) {
  gates.opsLane = { ok: reg.opsLane === 'LegalOps' && reg.owner === 'fabric-os' };
  gates.protocol = {
    ok: reg.protocol === 'P45-LEGAL-AS-A-SERVICE' && Boolean(reg.harness?.fabric),
  };
  gates.harnessDepth = {
    ok: Boolean(reg.harness?.fabric && reg.harness?.fleet && reg.harness?.parallelLane),
  };

  const items = reg.items ?? [];
  gates.blocksIR = { ok: items.every((i) => i.blocksIR !== true) };

  const sovereign = readJson(SOVEREIGN);
  const sovereignIds = new Set((sovereign?.items ?? []).map((i) => i.id));
  const classS = items.filter((i) => i.class === 'S');
  const missing = classS
    .filter((i) => i.sovereignId && !sovereignIds.has(i.sovereignId))
    .map((i) => i.id);
  gates.sovereignCrosswalk = { ok: missing.length === 0, missing };

  const program01 = items.find((i) => i.id === 'LEGAL-PROGRAM-01');
  gates.programItemClosed = {
    ok: program01?.status === 'closed' && program01?.executionStatus === 'done',
  };
}

const parallel = readJson(PARALLEL_WITNESS);
gates.parallelLaneWitness = { ok: parallel?.ok === true };

const fleet = readJson(FLEET_WITNESS);
gates.fleetLegalProgram = { ok: fleet?.ok === true };

const ok = Object.values(gates).every((g) => g.ok !== false);
const witness = applyExternalAssuranceLane({
  schema: 'gtcx://fabric-os/legal-friction-check/v1',
  protocol: 'P45-LEGAL-AS-A-SERVICE',
  storyId: 'LEGAL-PROGRAM-01',
  checkedAt: new Date().toISOString(),
  gates,
  itemCount: reg?.items?.length ?? 0,
  ok,
  blocksIR: false,
  blocksAnyRepo: false,
});

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const [k, v] of Object.entries(gates)) {
  const extra = v.missing?.length ? ` (${v.missing.join(', ')})` : '';
  console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${extra}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — LegalOps friction gates`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
