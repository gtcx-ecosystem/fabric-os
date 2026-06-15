#!/usr/bin/env node
/**
 * Fabric-owned Ops lanes — 11-pillar audit witness (7 lanes).
 * Usage: node fabric-ops-lanes-11pr-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateOpsLane } from '../../../bridge-os/platform/scripts/lib/ops-lane-11pr-eval.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const PROBES = join(BRIDGE, 'pm/spec/ops-lane-11pr-probes.json');
const OUT = join(ROOT, 'audit/evidence/fabric-ops-lanes-11pr-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const FABRIC_LANES = [
  'InfraOps',
  'DevOps',
  'SecOps',
  'EcosystemOps',
  'FinOps',
  'PayOps',
  'CommOps',
  'AIOps',
];

const probesDoc = JSON.parse(readFileSync(PROBES, 'utf8'));
const laneProbes = probesDoc.lanes ?? {};

const results = [];
let pass = 0;

for (const opsLane of FABRIC_LANES) {
  const probe = laneProbes[opsLane];
  if (!probe || probe.ownerRepo !== 'fabric-os') continue;

  let evalResult;
  if (probe.witnessPath && existsSync(join(ROOT, probe.witnessPath))) {
    const w = JSON.parse(readFileSync(join(ROOT, probe.witnessPath), 'utf8'));
    const foundationKeys = ['compliance', 'technicalExcellence', 'craft', 'worldClass', 'trustAndSafety'];
    const pillars = w.pillars ?? Object.entries(w.scores ?? {}).map(([id, s]) => ({
      id,
      score100: s.score ?? s.score100 ?? 0,
    }));
    const foundationComposite100 =
      w.foundationScore100 ??
      Math.round(
        foundationKeys.reduce((a, id) => {
          const p = pillars.find((x) => x.id === id);
          return a + (p?.score100 ?? p?.score ?? 0);
        }, 0) / foundationKeys.length,
      );
    evalResult = {
      opsLane,
      ownerRepo: 'fabric-os',
      source: 'native-witness',
      foundationComposite100,
      fullComposite100: w.fullComposite100 ?? foundationComposite100,
      foundationUnlocked: foundationComposite100 >= 85,
      ok: foundationComposite100 >= 85,
      pillars,
    };
  } else {
    evalResult = evaluateOpsLane({ ...probe, opsLane, owner: 'fabric-os' }, ROOT);
    evalResult.source = 'probes';
  }

  if (evalResult.ok) pass++;
  results.push(evalResult);
}

const witness = {
  $schema: 'gtcx://fabric-os/fabric-ops-lanes-11pr/v1',
  version: '1.0.0',
  updated: new Date().toISOString(),
  repo: 'fabric-os',
  probes: 'bridge-os/pm/spec/ops-lane-11pr-probes.json',
  pass,
  total: results.length,
  ok: pass === results.length,
  results,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  console.log('=== Fabric Ops lanes 11-pillar audit ===\n');
  for (const r of results) {
    console.log(
      `${r.ok ? 'OK' : 'FAIL'} ${r.opsLane} — F:${r.foundationComposite100} · 11PR:${r.fullComposite100 ?? '—'} [${r.source}]`,
    );
  }
  console.log(`\n${witness.ok ? 'PASS' : 'FAIL'} — ${pass}/${results.length}`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(witness.ok ? 0 : 1);
