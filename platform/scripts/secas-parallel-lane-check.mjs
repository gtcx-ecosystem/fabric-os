#!/usr/bin/env node
/**
 * SECAS-S2-02 — parallel-lane messaging harness.
 * Ensures vendor assurance gates do not surface as product engineering blockers.
 *
 * Usage: node platform/scripts/secas-parallel-lane-check.mjs [--write]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const OUT = join(ROOT, 'audit/evidence/secas-parallel-lane-check-latest.json');
const WRITE = process.argv.includes('--write');

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const routing = readJson(join(BRIDGE, 'pm/spec/vendor-assurance-status-update-routing.json'));
const legalProtocol = readJson(join(BRIDGE, 'pm/spec/ecosystem-legal-program-protocol.json'));
const postLaunch = readJson(join(ROOT, 'ops/coordination/post-launch-external-gates.json'));
const internalHuman = readJson(join(ROOT, 'ops/coordination/internal-human-gates.json'));
const humanManifest = readJson(join(ROOT, 'ops/coordination/human-gates.manifest.json'));

const checks = {
  routingSpec: {
    ok: routing?.blocksIR === false && routing?.ownerRepo === 'fabric-os',
    detail: 'vendor-assurance-status-update-routing blocksIR:false',
  },
  legalProgramForbiddenP22: {
    ok: legalProtocol?.forbiddenInProductP22 === true,
    detail: 'ecosystem-legal-program-protocol forbids vendor gates in product P22',
  },
  fabricOwnerRouting: {
    ok: routing?.routing?.['fabric-os']?.parallelSovereignGates === 'include-with-explainer',
    detail: 'fabric-os includes Parallel sovereign gates section',
  },
  witnessReposOmit: {
    ok: ['bridge-os', 'agile-os', 'canon-os'].every(
      (repo) => routing?.routing?.[repo]?.parallelSovereignGates === 'omit',
    ),
    detail: 'witness repos omit vendor gates from Status Update',
  },
  postLaunchBlocksIR: {
    ok: (postLaunch?.gates ?? []).every((g) => g.blocksIR !== true),
    detail: 'post-launch-external-gates all blocksIR:false',
  },
  internalHumanBlocksIR: {
    ok: (internalHuman?.gates ?? []).every((g) => g.blocksIR !== true),
    detail: 'internal-human-gates all blocksIR:false',
  },
  manifestExplainer: {
    ok: Boolean(humanManifest?.gates?.some((g) => g.id === 'SECAS-S2-01-INGEST')),
    detail: 'SECAS-S2-01-INGEST in human-gates.manifest with explainer fields',
  },
  clarityFleetHead: {
    ok: existsSync(join(BRIDGE, 'platform/scripts/lib/build-fleet-clarity-report.mjs')),
    detail: 'fleet clarity labels assurance as parallel lane (not product head)',
  },
};

const failures = Object.entries(checks).filter(([, v]) => !v.ok);
const ok = failures.length === 0;

const witness = {
  schema: 'gtcx://fabric-os/secas-parallel-lane-check/v1',
  storyId: 'SECAS-S2-02',
  checkedAt: new Date().toISOString(),
  ok,
  checks,
  failures: failures.map(([k, v]) => ({ id: k, detail: v.detail })),
  messaging: {
    productTeams: 'Engineering continues — vendor/legal gates are Parallel sovereign gates (blocksIR:false)',
    fabricOs: 'List under ### Parallel sovereign gates with What/Why/Implication — never Approval needed one-liners',
    witnessRepos: 'Omit vendor gates; use fleetOwnerRedirect to fabric-os',
  },
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const [k, v] of Object.entries(checks)) {
  console.log(`${v.ok ? 'OK' : 'FAIL'} ${k} — ${v.detail}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — parallel-lane messaging`);
if (WRITE) console.log(`witness: ${OUT.slice(ROOT.length + 1)}`);
process.exit(ok ? 0 : 1);
