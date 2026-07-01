#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACT_REL = 'machine/spec/dslc-contract.json';
const SCHEMA_REL = 'machine/spec/dslc-release.schema.json';
const OUT = join(ROOT, 'audit/evidence/dslc-contract-check-latest.json');
const WRITE = process.argv.includes('--write');

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

const contract = readJson(CONTRACT_REL);
const schema = readJson(SCHEMA_REL);
const scripts = readJson('package.json')?.scripts ?? {};
const requiredCommands = {
  'dslc:contract:check': 'node platform/scripts/dslc-contract-check.mjs',
  'dslc:contract:check:write': 'node platform/scripts/dslc-contract-check.mjs --write',
  'dslc:release': 'node platform/scripts/dslc-release.mjs',
  'dslc:release:write': 'node platform/scripts/dslc-release.mjs --write',
  'dslc:test':
    'node --test platform/scripts/tests/dslc-contract-check.test.mjs platform/scripts/tests/dslc-release.test.mjs platform/scripts/tests/qasc-dslc-ship-fleet-parity.test.mjs',
};

const requiredLanes = ['deployment', 'sales', 'legal', 'communications'];
const controls = [
  {
    id: 'contract-schema',
    score100: contract?.$schema === 'gtcx://fabric-os/dslc-contract/v1' ? 100 : 0,
    evidence: contract?.$schema ?? 'missing',
  },
  {
    id: 'protocol-id',
    score100: contract?.protocolId === 'GTCX-DSLC-001' ? 100 : 0,
    evidence: contract?.protocolId ?? 'missing',
  },
  {
    id: 'qasc-boundary',
    score100:
      contract?.qascRelationship?.protocolId === 'GTCX-QASC-001' &&
      contract?.qascRelationship?.minimumScore100 === 100 &&
      contract?.qascRelationship?.minimumSignalLevel === 'L5'
        ? 100
        : 0,
    evidence: contract?.qascRelationship ?? null,
  },
  {
    id: 'four-lane-contract',
    score100: requiredLanes.every((lane) => (contract?.lanes?.[lane]?.controls?.length ?? 0) > 0)
      ? 100
      : 0,
    evidence: Object.fromEntries(
      requiredLanes.map((lane) => [lane, contract?.lanes?.[lane]?.controls?.length ?? 0])
    ),
  },
  {
    id: 'release-class-routing',
    score100:
      Object.keys(contract?.releaseClasses ?? {}).length >= 7 &&
      Object.values(contract?.releaseClasses ?? {}).every((entry) =>
        entry.requiredLanes.every((lane) => requiredLanes.includes(lane))
      )
        ? 100
        : 0,
    evidence: contract?.releaseClasses ?? null,
  },
  {
    id: 'authority-and-release-boundary',
    score100:
      /cannot make a legal determination/.test(contract?.decisionPolicy?.claimBoundary ?? '') &&
      /do not block an internal engineering deployment/.test(
        contract?.decisionPolicy?.releaseBoundary ?? ''
      )
        ? 100
        : 0,
    evidence: contract?.decisionPolicy ?? null,
  },
  {
    id: 'manifest-schema',
    score100:
      schema?.$id === 'gtcx://fabric-os/dslc-release-manifest/v1' &&
      requiredLanes.every((lane) => schema?.properties?.lanes?.properties?.[lane])
        ? 100
        : 0,
    evidence: SCHEMA_REL,
  },
  {
    id: 'command-surface',
    score100: Object.entries(requiredCommands).every(([name, command]) => scripts[name] === command)
      ? 100
      : 0,
    evidence: requiredCommands,
  },
  {
    id: 'protocol-artifacts',
    score100: [
      'docs/operations/runbooks/dslc-protocol.md',
      'docs/product/roadmap/features/FEAT-FABRIC-DSLC-PROTOCOL-ROLLOUT.md',
      'platform/scripts/dslc-release.mjs',
    ].every((rel) => existsSync(join(ROOT, rel)))
      ? 100
      : 0,
    evidence: 'DSLC runbook, rollout PRD, contract, schema, and release evaluator',
  },
];

const score100 = Math.round(
  controls.reduce((sum, control) => sum + control.score100, 0) / controls.length
);
const witness = {
  schema: 'gtcx://fabric-os/dslc-contract-check/v1',
  generatedAt: new Date().toISOString(),
  protocolId: contract?.protocolId ?? null,
  score100,
  benchmarkScore100: 100,
  controlsAtBenchmark: controls.filter((control) => control.score100 === 100).length,
  controlCount: controls.length,
  atBenchmark: score100 === 100,
  controls,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

console.log(`GTCX DSLC contract score: ${score100}/100`);
console.log(`controls at benchmark: ${witness.controlsAtBenchmark}/${witness.controlCount}`);
if (WRITE) console.log('witness=audit/evidence/dslc-contract-check-latest.json');

process.exit(witness.atBenchmark ? 0 : 1);
