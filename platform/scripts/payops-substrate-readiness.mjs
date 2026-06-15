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
const PRIMARY_FLUTTERWAVE_MANIFESTS = [
  'deploy/kubernetes/overlays/staging/terminal-os/external-secret-payops-flutterwave.yaml',
  'deploy/kubernetes/overlays/staging/compliance-os/external-secrets.yaml',
  'deploy/kubernetes/overlays/staging/sensei-os/external-secret-payops-flutterwave.yaml',
  'deploy/kubernetes/overlays/staging/nyota-ai/external-secret-payops-flutterwave.yaml',
  'deploy/kubernetes/overlays/staging/griot-ai/external-secrets-payops.yaml',
];
const SECONDARY_STRIPE_MANIFESTS = [
  'deploy/kubernetes/overlays/staging/terminal-os/external-secret-payops-stripe.yaml',
  'deploy/kubernetes/overlays/staging/compliance-os/external-secrets.yaml',
  'deploy/kubernetes/overlays/staging/sensei-os/external-secret-payops-stripe.yaml',
  'deploy/kubernetes/overlays/staging/nyota-ai/external-secret-payops-stripe.yaml',
  'deploy/kubernetes/overlays/staging/griot-ai/external-secrets-payops.yaml',
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

function manifestReady(relPaths, needle) {
  return relPaths.filter((p) => {
    const abs = join(ROOT, p);
    if (!existsSync(abs)) return false;
    if (!needle) return true;
    return readFileSync(abs, 'utf8').includes(needle);
  });
}

const gates = {
  substrateContract: { ok: existsSync(SUBSTRATE) },
  providerPriority: { ok: false },
  populateScript: { ok: existsSync(POPULATE) },
  fleetHandoff: { ok: existsSync(HANDOFF) },
  meteringWitness: { ok: existsSync(METERING) },
  primaryFlutterwaveEso: { ok: false, count: 0, expected: PRIMARY_FLUTTERWAVE_MANIFESTS.length },
  secondaryStripeEso: { ok: false, count: 0, expected: SECONDARY_STRIPE_MANIFESTS.length },
  smFlutterwaveStaging: { ok: false, advisory: true },
  smStripeStaging: { ok: false, advisory: true },
};

if (existsSync(SUBSTRATE)) {
  const sub = JSON.parse(readFileSync(SUBSTRATE, 'utf8'));
  gates.providerPriority = {
    ok:
      sub.providerPriority?.primary === 'flutterwave' &&
      sub.providerPriority?.secondary === 'stripe',
    primary: sub.providerPriority?.primary,
    secondary: sub.providerPriority?.secondary,
  };
  const fwPath = sub.secretsManager?.flutterwave?.staging;
  const stripePath = sub.secretsManager?.stripe?.staging;
  if (fwPath) gates.smFlutterwaveStaging = { ok: awsSecretExists(fwPath), path: fwPath, advisory: true };
  if (stripePath) gates.smStripeStaging = { ok: awsSecretExists(stripePath), path: stripePath, advisory: true };
}

const fwPresent = manifestReady(PRIMARY_FLUTTERWAVE_MANIFESTS, 'payops/flutterwave');
gates.primaryFlutterwaveEso = {
  ok: fwPresent.length === PRIMARY_FLUTTERWAVE_MANIFESTS.length,
  count: fwPresent.length,
  expected: PRIMARY_FLUTTERWAVE_MANIFESTS.length,
  paths: fwPresent,
};

const stripePresent = manifestReady(SECONDARY_STRIPE_MANIFESTS, 'payops/stripe');
gates.secondaryStripeEso = {
  ok: stripePresent.length === SECONDARY_STRIPE_MANIFESTS.length,
  count: stripePresent.length,
  expected: SECONDARY_STRIPE_MANIFESTS.length,
  paths: stripePresent,
};

const ok =
  gates.substrateContract.ok &&
  gates.providerPriority.ok &&
  gates.populateScript.ok &&
  gates.fleetHandoff.ok &&
  gates.meteringWitness.ok &&
  gates.primaryFlutterwaveEso.ok &&
  gates.secondaryStripeEso.ok;

const witness = {
  schema: 'gtcx://fabric-os/payops-substrate-readiness/v1',
  checkedAt: new Date().toISOString(),
  opsLane: 'PayOps',
  providerPriority: { primary: 'flutterwave', secondary: 'stripe' },
  gates,
  ok,
  note: 'Flutterwave primary + Stripe secondary — SM existence advisory until Class A populate',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const [k, v] of Object.entries(gates)) {
  const tag = v.advisory && !v.ok ? 'ADVISORY' : v.ok !== false ? 'OK' : 'FAIL';
  const extra =
    v.count != null && v.expected != null
      ? ` (${v.count}/${v.expected})`
      : v.path
        ? ` (${v.path})`
        : v.primary
          ? ` (${v.primary}/${v.secondary})`
          : '';
  console.log(`${tag} ${k}${extra}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — PayOps substrate readiness`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
