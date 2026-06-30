#!/usr/bin/env node
/**
 * INIT-FLEET-OPS-ASSURANCE-PROGRAM — master operational QA harness.
 * Rolls up central assurance, maturity lanes, ops routing, legal friction,
 * and bridge ops-lanes-100 seal.
 *
 * Usage: node platform/scripts/fleet-ops-assurance-check.mjs [--write] [--skip-bridge]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { applyExternalAssuranceLane } from './lib/assurance-lane-witness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
function firstExisting(...paths) {
  return paths.find((p) => existsSync(p)) ?? paths[0];
}

const SPEC = firstExisting(
  join(ROOT, 'machine/spec/fleet-ops-assurance-program.json'),
  join(ROOT, 'pm/spec/fleet-ops-assurance-program.json'),
);
const OUT = join(ROOT, 'audit/evidence/fleet-ops-assurance-check-latest.json');
const WRITE = process.argv.includes('--write');
const SKIP_BRIDGE = process.argv.includes('--skip-bridge');

function readJson(p) {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function runPnpm(cwd, script) {
  const r = spawnSync('pnpm', [script], { cwd, encoding: 'utf8', shell: true, timeout: 180_000 });
  return { ok: r.status === 0, exitCode: r.status ?? 1, script };
}

function witnessOk(relFromBridge) {
  const w = readJson(join(BRIDGE, relFromBridge));
  if (!w) return false;
  return w.ok === true || w.overall === 'PASS' || w.pass === true;
}

const spec = readJson(SPEC);
const checks = {};

checks.programSpec = { ok: Boolean(spec?.id === 'PROG-FLEET-OPS-ASSURANCE') };
checks.centralAssurance = runPnpm(ROOT, 'central-assurance:check');
checks.maturityLane = runPnpm(ROOT, 'maturity-lane:check');
checks.opsRouting = runPnpm(ROOT, 'ops-prd-routing:check');
checks.legalFriction = runPnpm(ROOT, 'legal:friction:check');
checks.legalOps = runPnpm(ROOT, 'legalops:check');

const legalReg = readJson(join(ROOT, 'machine/legal-friction-register.json'));
checks.legalProgram01Closed = {
  ok: (legalReg?.items ?? []).find((i) => i.id === 'LEGAL-PROGRAM-01')?.status === 'closed',
};

const friction = readJson(join(ROOT, 'machine/fleet-ops-friction-register.json'));
checks.frictionRegister = { ok: Boolean(friction?.items?.length) };
checks.frictionBlocksIR = {
  ok: (friction?.items ?? []).every((i) => i.blocksIR !== true),
};

if (!SKIP_BRIDGE) {
  checks.bridgeOpsLanes100 = {
    ok: witnessOk('pm/ci/ops-lanes-100/rollup-latest.json'),
    note: 'rollup witness — live ecosystem:ops-lanes-100:check may be slow; refresh via bridge',
  };
  checks.bridgeLegalProgram = runPnpm(BRIDGE, 'ecosystem:legal-program:check');
  checks.bridgeComplianceOps = {
    ok: witnessOk('pm/ci/complianceops-fleet-latest.json'),
    note: 'fleet witness rollup — FOAP-009 tracks live complianceops:check uplift',
  };
  checks.opsLanes100Witness = {
    ok: witnessOk('pm/ci/ops-lanes-100/rollup-latest.json'),
  };
  checks.legalOpsFleetWitness = {
    ok: witnessOk('pm/ci/ops-lanes-100/legalops-fleet-latest.json'),
  };
}

const ok = Object.values(checks).every((c) => c.ok);

const witness = applyExternalAssuranceLane({
  schema: 'gtcx://fabric-os/fleet-ops-assurance-check/v1',
  storyId: 'FOAP-007',
  initiative: 'INIT-FLEET-OPS-ASSURANCE-PROGRAM',
  programId: 'PROG-FLEET-OPS-ASSURANCE',
  checkedAt: new Date().toISOString(),
  ok,
  checks: Object.fromEntries(
    Object.entries(checks).map(([k, v]) => [k, { ok: v.ok, exitCode: v.exitCode, script: v.script }]),
  ),
  activeMilestone: spec?.activeMilestone,
  headStoryId: spec?.headStoryId,
  blocksIR: false,
  blocksGtmStage: false,
  dealQualificationOnly: true,
  note: 'Fleet ops assurance operational rollup — parallel to product engineering',
});

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

console.log('=== fleet-ops-assurance:check ===\n');
for (const [k, v] of Object.entries(checks)) {
  const detail = v.script ? ` (${v.script} exit ${v.exitCode ?? '—'})` : '';
  console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${detail}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — fleet-ops-assurance:check`);
if (WRITE) console.log(`witness: ${OUT.slice(ROOT.length + 1)}`);
process.exit(ok ? 0 : 1);
