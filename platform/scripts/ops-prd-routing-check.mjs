#!/usr/bin/env node
/**
 * OPS-PRD-ROUTING-001 — validate ops lane PRD/spec routing matrix vs fleet registry.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
function firstExisting(...paths) {
  return paths.find((p) => existsSync(p)) ?? paths[0];
}

const MATRIX = firstExisting(
  join(ROOT, 'machine/spec/ops-lane-prd-routing-matrix.json'),
  join(ROOT, 'pm/spec/ops-lane-prd-routing-matrix.json'),
);
const REGISTRY = join(BRIDGE, 'pm/spec/ops-programs-registry.json');
const WRITE = process.argv.includes('--write');
const OUT = join(ROOT, 'audit/evidence/ops-prd-routing-check-latest.json');

const REQUIRED_FIELDS = [
  'opsLane',
  'ownerRepo',
  'initiativeRef',
  'prdRef',
  'witnessRef',
  'status',
];

function loadJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main() {
  const matrix = loadJson(MATRIX);
  const registry = loadJson(REGISTRY);
  const errors = [];

  if (!matrix?.rows?.length) {
    errors.push(`matrix missing or empty — ${MATRIX}`);
  }
  if (!registry?.lanes?.length) {
    errors.push('ops-programs-registry missing');
  }

  const activeRegistryLanes = (registry?.lanes ?? []).filter(
    (l) => l.status !== 'legacy' && !l.mergedInto,
  );
  const matrixByLane = new Map((matrix?.rows ?? []).map((r) => [r.opsLane, r]));

  for (const lane of activeRegistryLanes) {
    const row = matrixByLane.get(lane.opsLane);
    if (!row) {
      errors.push(`missing matrix row for ops lane ${lane.opsLane}`);
      continue;
    }
    for (const field of REQUIRED_FIELDS) {
      if (!row[field]) errors.push(`${lane.opsLane}: missing ${field}`);
    }
    if (row.ownerRepo && lane.owner && row.ownerRepo !== lane.owner) {
      errors.push(`${lane.opsLane}: ownerRepo ${row.ownerRepo} != registry owner ${lane.owner}`);
    }
  }

  const daas = matrixByLane.get('InfraOps');
  const secas = matrixByLane.get('SecOps');
  if (!daas?.prdRef) errors.push('InfraOps/DaaS prdRef required (seeded first)');
  if (!secas?.prdRef) errors.push('SecOps/SECaaS prdRef required (seeded first)');

  const ok = errors.length === 0;
  console.log('=== ops-prd-routing:check ===\n');
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${matrix?.rows?.length ?? 0} lanes in matrix`);
  for (const e of errors) console.log(`  · ${e}`);

  const witness = {
    schema: 'gtcx://fabric-os/ops-prd-routing-check/v1',
    storyId: 'OPS-PRD-ROUTING-001',
    checkedAt: new Date().toISOString(),
    ok,
    laneCount: matrix?.rows?.length ?? 0,
    registryLaneCount: activeRegistryLanes.length,
    errors,
  };

  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
    console.log(`\nwitness: audit/evidence/ops-prd-routing-check-latest.json`);
  }

  process.exit(ok ? 0 : 1);
}

main();
