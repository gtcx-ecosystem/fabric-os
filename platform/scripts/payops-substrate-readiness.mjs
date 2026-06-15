#!/usr/bin/env node
/**
 * PayOps substrate readiness — SM populate script, handoffs, metering witness.
 * Usage: node payops-substrate-readiness.mjs [--write]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SUBSTRATE = join(ROOT, 'pm/payops-substrate-contract.json');
const POPULATE = join(ROOT, 'platform/scripts/staging/populate-payops-staging-sm.sh');
const HANDOFF = join(
  ROOT,
  'docs/operations/coordination/inbound/to-b/to-payops-fleet-substrate-migration-2026-06-15.md',
);
const METERING = join(ROOT, 'audit/evidence/payops-metering-rollup-latest.json');
const ESO_MANIFESTS = [
  'deploy/kubernetes/overlays/staging/terminal-os/external-secret-payops-stripe.yaml',
  'deploy/kubernetes/overlays/staging/compliance-os/external-secrets.yaml',
  'deploy/kubernetes/overlays/staging/sensei-os/external-secret-payops-stripe.yaml',
  'deploy/kubernetes/overlays/staging/nyota-ai/external-secret-payops-stripe.yaml',
];
const OUT = join(ROOT, 'audit/evidence/payops-substrate-readiness-latest.json');
const WRITE = process.argv.includes('--write');

function awsSecretExists(secretId) {
  const r = spawnSync(
    'aws',
    ['secretsmanager', 'describe-secret', '--secret-id', secretId, '--region', 'af-south-1'],
    { encoding: 'utf8' },
  );
  return r.status === 0;
}

const gates = {
  substrateContract: { ok: existsSync(SUBSTRATE) },
  populateScript: { ok: existsSync(POPULATE) },
  fleetHandoff: { ok: existsSync(HANDOFF) },
  meteringWitness: { ok: existsSync(METERING) },
  esoConsumerManifests: { ok: false, count: 0, paths: [] },
  smStripeStaging: { ok: false, advisory: true },
  smFlutterwaveStaging: { ok: false, advisory: true },
};

if (existsSync(SUBSTRATE)) {
  const sub = JSON.parse(readFileSync(SUBSTRATE, 'utf8'));
  const stripePath = sub.secretsManager?.stripe?.staging;
  const fwPath = sub.secretsManager?.flutterwave?.staging;
  if (stripePath) gates.smStripeStaging = { ok: awsSecretExists(stripePath), path: stripePath, advisory: true };
  if (fwPath) gates.smFlutterwaveStaging = { ok: awsSecretExists(fwPath), path: fwPath, advisory: true };
}

const esoPresent = ESO_MANIFESTS.filter((p) => existsSync(join(ROOT, p)));
gates.esoConsumerManifests = {
  ok: esoPresent.length === ESO_MANIFESTS.length,
  count: esoPresent.length,
  expected: ESO_MANIFESTS.length,
  paths: esoPresent,
};

const ok =
  gates.substrateContract.ok &&
  gates.populateScript.ok &&
  gates.fleetHandoff.ok &&
  gates.meteringWitness.ok &&
  gates.esoConsumerManifests.ok;

const witness = {
  schema: 'gtcx://fabric-os/payops-substrate-readiness/v1',
  checkedAt: new Date().toISOString(),
  opsLane: 'PayOps',
  gates,
  ok,
  note: 'SM existence advisory until Class A key populate — structural readiness passes without AWS',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const [k, v] of Object.entries(gates)) {
  const tag = v.advisory && !v.ok ? 'ADVISORY' : v.ok !== false ? 'OK' : 'FAIL';
  console.log(`${tag} ${k}${v.path ? ` (${v.path})` : ''}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — PayOps substrate readiness`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
