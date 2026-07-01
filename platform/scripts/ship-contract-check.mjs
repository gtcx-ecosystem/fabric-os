#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACT_REL = 'machine/spec/ship-contract.json';
const SCHEMA_REL = 'machine/spec/ship-release.schema.json';
const OUT = join(ROOT, 'audit/evidence/ship-contract-check-latest.json');
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
const requiredPillars = ['sealed', 'hardened', 'institutionalized', 'provisioned'];
const requiredCommands = {
  'ship:contract:check': 'node platform/scripts/ship-contract-check.mjs',
  'ship:contract:check:write': 'node platform/scripts/ship-contract-check.mjs --write',
  'ship:release': 'node platform/scripts/ship-release.mjs',
  'ship:release:write': 'node platform/scripts/ship-release.mjs --write',
  'ship:test':
    'node --test platform/scripts/tests/ship-contract-check.test.mjs platform/scripts/tests/ship-release.test.mjs platform/scripts/tests/qasc-dslc-ship-fleet-parity.test.mjs',
};

const controls = [
  {
    id: 'contract-schema',
    score100: contract?.$schema === 'gtcx://fabric-os/ship-contract/v1' ? 100 : 0,
    evidence: contract?.$schema ?? 'missing',
  },
  {
    id: 'protocol-id',
    score100: contract?.protocolId === 'GTCX-SHIP-001' ? 100 : 0,
    evidence: contract?.protocolId ?? 'missing',
  },
  {
    id: 'post-dslc-boundary',
    score100:
      contract?.dslcRelationship?.protocolId === 'GTCX-DSLC-001' &&
      contract?.dslcRelationship?.minimumDecision === 'ready' &&
      contract?.dslcRelationship?.minimumScore100 === 100 &&
      /final release-management check after DSLC/.test(
        contract?.decisionPolicy?.postDslcBoundary ?? ''
      )
        ? 100
        : 0,
    evidence: {
      dslcRelationship: contract?.dslcRelationship ?? null,
      postDslcBoundary: contract?.decisionPolicy?.postDslcBoundary ?? null,
    },
  },
  {
    id: 'qasc-relationship',
    score100:
      contract?.qascRelationship?.protocolId === 'GTCX-QASC-001' &&
      contract?.qascRelationship?.minimumScore100 === 100 &&
      contract?.qascRelationship?.minimumSignalLevel === 'L5'
        ? 100
        : 0,
    evidence: contract?.qascRelationship ?? null,
  },
  {
    id: 'four-pillar-contract',
    score100: requiredPillars.every(
      (pillar) => (contract?.pillars?.[pillar]?.controls?.length ?? 0) >= 4
    )
      ? 100
      : 0,
    evidence: Object.fromEntries(
      requiredPillars.map((pillar) => [pillar, contract?.pillars?.[pillar]?.controls?.length ?? 0])
    ),
  },
  {
    id: 'release-class-routing',
    score100:
      Object.keys(contract?.releaseClasses ?? {}).length >= 7 &&
      Object.values(contract?.releaseClasses ?? {}).every((entry) =>
        entry.requiredPillars.every((pillar) => requiredPillars.includes(pillar))
      )
        ? 100
        : 0,
    evidence: contract?.releaseClasses ?? null,
  },
  {
    id: 'authority-and-claim-boundary',
    score100:
      /agent cannot synthesize a legal signature/.test(
        contract?.decisionPolicy?.claimBoundary ?? ''
      ) &&
      /same actor must not both originate and sovereignly approve/.test(
        contract?.decisionPolicy?.segregationOfDuties ?? ''
      )
        ? 100
        : 0,
    evidence: contract?.decisionPolicy ?? null,
  },
  {
    id: 'manifest-schema',
    score100:
      schema?.$id === 'gtcx://fabric-os/ship-release-manifest/v1' &&
      requiredPillars.every((pillar) => schema?.properties?.pillars?.properties?.[pillar])
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
      'docs/operations/runbooks/ship-protocol.md',
      'docs/product/roadmap/features/FEAT-FABRIC-SHIP-PROTOCOL-ROLLOUT.md',
      'platform/scripts/ship-release.mjs',
      'machine/ship/releases/REL-FABRIC-DSLC-001/manifest.json',
    ].every((rel) => existsSync(join(ROOT, rel)))
      ? 100
      : 0,
    evidence: 'SHIP runbook, rollout PRD, contract, schema, evaluator, and release manifest',
  },
];

const score100 = Math.round(
  controls.reduce((sum, control) => sum + control.score100, 0) / controls.length
);
const witness = {
  schema: 'gtcx://fabric-os/ship-contract-check/v1',
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

console.log(`GTCX SHIP contract score: ${score100}/100`);
console.log(`controls at benchmark: ${witness.controlsAtBenchmark}/${witness.controlCount}`);
if (WRITE) console.log('witness=audit/evidence/ship-contract-check-latest.json');

process.exit(witness.atBenchmark ? 0 : 1);
