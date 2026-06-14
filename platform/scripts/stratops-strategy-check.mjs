#!/usr/bin/env node
/**
 * StratOps — fleet strategy registry + north-star structural gate.
 * Usage: node stratops-strategy-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const OUT = join(ROOT, 'audit/evidence/stratops-strategy-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const PATHS = {
  strategyRegistry: join(BRIDGE, 'pm/spec/stratops-strategy-registry.json'),
  frictionRegister: join(BRIDGE, 'pm/spec/stratops-friction-register.json'),
  fleetGoals: join(BRIDGE, 'pm/spec/ecosystem-fleet-goals-registry.json'),
  goalOrientation: join(BRIDGE, 'pm/spec/goal-orientation-protocol.json'),
  liveProgrammes: join(BRIDGE, 'pm/spec/fleet-live-programmes.json'),
  executionEngine: join(BRIDGE, 'pm/spec/gtcx-execution-engine.json'),
  enterprisePilotDoD: join(BRIDGE, 'pm/spec/enterprise-pilot-dod.json'),
  opsDoc: join(ROOT, 'docs/operations/stratops-as-a-service.md'),
};

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const gates = {};

for (const [key, path] of Object.entries(PATHS)) {
  gates[key] = { ok: existsSync(path), path };
}

const strategyReg = readJson(PATHS.strategyRegistry);
gates.stratopsLane = {
  ok: strategyReg?.opsLane === 'StratOps',
  lane: strategyReg?.opsLane ?? null,
};

const frictionReg = readJson(PATHS.frictionRegister);
gates.frictionLane = {
  ok: frictionReg?.opsLane === 'StratOps',
  lane: frictionReg?.opsLane ?? null,
};

const fleetGoals = readJson(PATHS.fleetGoals);
gates.fleetNorthStar = {
  ok: Boolean(fleetGoals?.fleetNorthStar?.goal),
  goal: fleetGoals?.fleetNorthStar?.goal ?? null,
};

const programmes = readJson(PATHS.liveProgrammes);
const programmeCount = programmes?.programmes?.length ?? 0;
gates.liveProgrammes = {
  ok: programmeCount >= 5,
  count: programmeCount,
};

const programmeLaneMap = strategyReg?.programmeLaneMap ?? [];
const programmeIds = new Set((programmes?.programmes ?? []).map((p) => p.id));
const mappedCount = programmeLaneMap.filter((m) => programmeIds.has(m.programmeId)).length;
gates.programmeLaneMap = {
  ok: programmeLaneMap.length >= 5 && mappedCount >= 5,
  mapped: mappedCount,
  total: programmeLaneMap.length,
};

const pillars = strategyReg?.strategicPillars ?? {};
const requiredPillars = strategyReg?.strategicFocus?.pillars ?? [
  'growth',
  'scale',
  'economiesOfScale',
  'sustainability',
  'moats',
];
const pillarKeys = requiredPillars.filter((k) => Boolean(pillars[k]));
gates.strategicPillars = {
  ok: pillarKeys.length === requiredPillars.length,
  present: pillarKeys,
  required: requiredPillars,
};

const structuralOk = Object.values(gates).every((g) => g.ok);

const witness = {
  schema: 'gtcx://fabric-os/stratops-strategy-check/v1',
  opsLane: 'StratOps',
  checkedAt: new Date().toISOString(),
  owner: 'bridge-os',
  registerHost: 'bridge-os',
  gates,
  openFrictionP0: (frictionReg?.items ?? []).filter((i) => i.status === 'open' && i.priority === 'P0').length,
  openFrictionTotal: (frictionReg?.items ?? []).filter((i) => i.status === 'open').length,
  ok: structuralOk,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    const extra =
      v.lane != null ? ` (${v.lane})` : v.count != null ? ` (${v.count})` : v.goal ? ' (goal set)' : '';
    console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${extra}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — StratOps structural gates`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
