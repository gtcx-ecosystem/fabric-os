#!/usr/bin/env node
/**
 * Q3-FABRIC-02 — golden-transaction deploy choreography witness on fabric substrate.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WRITE = process.argv.includes('--write');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
  return { exitCode: r.status ?? 1, stdout: (r.stdout || '').slice(-400), stderr: (r.stderr || '').slice(-400) };
}

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

const gt = run('node', ['platform/scripts/golden-transaction-protocol-native-probe.mjs', '--write']);
const assurance = run('node', ['platform/scripts/fabric-assurance-run.mjs', '--write']);
const gtWitness = readJson('audit/evidence/golden-transaction-protocol-native-2026-06-12.json');
const assuranceWitness = readJson('audit/evidence/fabric-assurance-latest.json');
const marketsGt = readJson('../markets-os/audit/evidence/pilot-golden-transaction-latest.json');

const ok =
  gt.exitCode === 0 &&
  gtWitness?.ok === true;

const witness = {
  $schema: 'gtcx://fabric-os/pilot-golden-transaction-substrate/v1',
  storyId: 'Q3-FABRIC-02',
  programmeId: 'PROG-CONTINENTAL-CAPITAL',
  quarterPillarId: 'ship',
  quarterId: 'GTCX-Q3-2026',
  generatedAt: new Date().toISOString(),
  repo: 'fabric-os',
  ok,
  checks: {
    goldenTransactionProbe: { exitCode: gt.exitCode, witness: gtWitness },
    fabricAssurance: { exitCode: assurance.exitCode, witness: assuranceWitness },
    marketsPilotGoldenTransaction: {
      path: '../markets-os/audit/evidence/pilot-golden-transaction-latest.json',
      ok: marketsGt?.ok ?? marketsGt?.overall === 'PASS',
      summary: marketsGt ? { at: marketsGt.at, steps: marketsGt.steps?.length } : null,
    },
  },
  acceptance: {
    deployScriptsSupportGtPath: gt.exitCode === 0,
    assuranceSubstrateEvidence: assuranceWitness != null,
    assuranceOverallPass: assuranceWitness?.ok === true,
    bridgePilotReadinessCitesFabric:
      'refresh via bridge-os ecosystem:pilot:readiness:report:write after witness',
  },
};

console.log(`\n=== Q3-FABRIC-02 golden-transaction substrate ===`);
console.log(`GT probe:    ${gt.exitCode === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Assurance:   ${assurance.exitCode === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Overall:     ${ok ? 'PASS' : 'FAIL'}\n`);

if (WRITE) {
  const out = join(ROOT, 'audit/evidence/pilot-golden-transaction-substrate-latest.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(witness, null, 2)}\n`);
  console.log(`[witness] ${out}`);
}
process.exit(ok ? 0 : 1);
