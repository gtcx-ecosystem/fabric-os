#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACT_REL = 'machine/spec/qasc-contract.json';
const OUT = join(ROOT, 'audit/evidence/qasc-contract-check-latest.json');
const WRITE = process.argv.includes('--write');

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

const contract = readJson(CONTRACT_REL);
const auditRequirements = readJson('machine/spec/qasc-audit-requirements.json');
const pkg = readJson('package.json');
const scripts = pkg?.scripts ?? {};
const repos = contract?.fleet?.repos ?? [];
const requiredCommands = {
  'qasc:repo': 'node platform/scripts/qasc-repo.mjs',
  'qasc:repo:write': 'node platform/scripts/qasc-repo.mjs --write',
  'qasc:score': 'node platform/scripts/qasc-score.mjs',
  'qasc:loop': 'node platform/scripts/qasc-loop-run.mjs',
  'qasc:loop:write': 'node platform/scripts/qasc-loop-run.mjs --write',
  'qasc:fleet': 'node platform/scripts/qasc-fleet.mjs',
  'qasc:fleet:write': 'node platform/scripts/qasc-fleet.mjs --write',
  'qasc:fleet:strict': 'node platform/scripts/qasc-fleet.mjs --strict',
};

const controls = [
  {
    id: 'contract-schema',
    score100: contract?.$schema === 'gtcx://fabric-os/qasc-contract/v1' ? 100 : 0,
    evidence: contract?.$schema ?? 'missing',
  },
  {
    id: 'protocol-id',
    score100: contract?.protocolId === 'GTCX-QASC-001' ? 100 : 0,
    evidence: contract?.protocolId ?? 'missing',
  },
  {
    id: 'benchmarks',
    score100: Object.values(contract?.benchmarks ?? {}).every((value) => value === 100 || value === 'L5') ? 100 : 0,
    evidence: contract?.benchmarks ?? null,
  },
  {
    id: 'fleet-denominator',
    score100: repos.length === 20 && new Set(repos).size === 20 ? 100 : 0,
    evidence: { repoCount: repos.length, uniqueRepoCount: new Set(repos).size },
  },
  {
    id: 'required-controls',
    score100: (contract?.requiredControls?.length ?? 0) >= 20 ? 100 : 0,
    evidence: { controlCount: contract?.requiredControls?.length ?? 0, minimum: 20 },
  },
  {
    id: 'agile-production-package-controls',
    score100: [
      'Product-intent source',
      'Machine-readable standardization',
      'Forensic spec',
      'Package MPR',
      'Package SIGNAL',
      'Production spec package',
      'Scrum handoff',
      'Backlog compatibility only',
    ].every((name) => contract?.requiredControls?.includes(name))
      && auditRequirements?.principle?.includes('production-package workflow')
      && auditRequirements?.globalControls?.some((control) => control.id === 'backlog-compatibility-only')
      ? 100
      : 0,
    evidence: {
      auditRequirementsRef: contract?.auditRequirementsRef ?? null,
      addedControlCount: auditRequirements?.qascScorerRequiredAdditions?.length ?? 0,
    },
  },
  {
    id: 'command-surface',
    score100: Object.entries(requiredCommands).every(([name, command]) => scripts[name] === command) ? 100 : 0,
    evidence: requiredCommands,
  },
  {
    id: 'legacy-command-scrub',
    score100: Object.keys(scripts).some((name) => name.startsWith('repo-cleanup:mpr-signal')) ? 0 : 100,
    evidence: Object.keys(scripts).filter((name) => name.startsWith('repo-cleanup:mpr-signal')),
  },
  {
    id: 'protocol-artifacts',
    score100: [
      'docs/operations/runbooks/qasc-protocol.md',
      'platform/scripts/qasc-repo.mjs',
      'platform/scripts/qasc-loop-run.mjs',
      'platform/scripts/qasc-fleet.mjs',
      'platform/scripts/lib/qasc-loop.mjs',
    ].every((rel) => existsSync(join(ROOT, rel))) ? 100 : 0,
    evidence: 'QASC runbook, repository scorer, loop, fleet runner, and loop library',
  },
  {
    id: 'security-compliance-enforcement',
    score100: (contract?.enforcementModel?.alwaysEnforced?.length ?? 0) >= 4 ? 100 : 0,
    evidence: contract?.enforcementModel?.alwaysEnforced ?? [],
  },
  {
    id: 'external-assurance-boundary',
    score100: /blocksProductRelease=true/.test(contract?.enforcementModel?.releaseBoundary ?? '')
      && /cannot claim an external certification/.test(contract?.enforcementModel?.claimBoundary ?? '')
      ? 100
      : 0,
    evidence: {
      releaseBoundary: contract?.enforcementModel?.releaseBoundary ?? null,
      claimBoundary: contract?.enforcementModel?.claimBoundary ?? null,
    },
  },
];

const score100 = Math.round(controls.reduce((sum, control) => sum + control.score100, 0) / controls.length);
const witness = {
  schema: 'gtcx://fabric-os/qasc-contract-check/v1',
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

console.log(`GTCX QASC contract score: ${score100}/100`);
console.log(`controls at benchmark: ${witness.controlsAtBenchmark}/${witness.controlCount}`);
if (WRITE) console.log('witness=audit/evidence/qasc-contract-check-latest.json');

process.exit(witness.atBenchmark ? 0 : 1);
