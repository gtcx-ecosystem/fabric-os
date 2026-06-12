#!/usr/bin/env node
/**
 * Idempotently apply PNV-3 verifier env + e7525dfa image to gtcx-protocols-staging.
 * Use when full kustomize apply fails on immutable selectors.
 *
 * Usage: node deploy/03-platform/scripts/staging/apply-protocols-verifier-env.mjs [--dry-run]
 */
import { spawnSync } from 'node:child_process';

const DRY_RUN = process.argv.includes('--dry-run');
const NAMESPACE = 'gtcx-staging';
const DEPLOY = 'gtcx-protocols-staging';
const IMAGE = '348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-protocols:e7525dfa';

function kubectl(args, input) {
  return spawnSync('kubectl', args, { encoding: 'utf8', input });
}

const get = kubectl(['get', 'deployment', DEPLOY, '-n', NAMESPACE, '-o', 'json']);
if (get.status !== 0) {
  console.error(get.stderr || 'deployment get failed');
  process.exit(get.status ?? 1);
}

const deployment = JSON.parse(get.stdout);
const container = deployment.spec.template.spec.containers.find((c) => c.name === 'protocols');
if (!container) {
  console.error('protocols container not found');
  process.exit(1);
}

const envAdds = [
  {
    name: 'GTCX_MANIFEST_SIGNER_REGISTRY',
    valueFrom: { secretKeyRef: { name: 'gtcx-manifest-verifier-staging', key: 'signer-registry-json' } },
  },
  {
    name: 'GTCX_MANIFEST_REVOCATION_JSON',
    valueFrom: { secretKeyRef: { name: 'gtcx-manifest-verifier-staging', key: 'revocation-json' } },
  },
  {
    name: 'GTCX_MANIFEST_RECEIPT_SIGNING_KEY',
    valueFrom: { secretKeyRef: { name: 'gtcx-manifest-verifier-staging', key: 'receipt-signing-key' } },
  },
  { name: 'GTCX_MANIFEST_RECEIPT_KEY_ID', value: 'manifest-receipt-staging-v1' },
  { name: 'GTCX_MANIFEST_VERIFIER_AUTHORITY', value: 'gtcx-os/protocols' },
  { name: 'GTCX_MANIFEST_RECEIPT_TTL_MS', value: '86400000' },
];

for (const entry of envAdds) {
  const idx = container.env.findIndex((e) => e.name === entry.name);
  if (idx >= 0) container.env[idx] = entry;
  else container.env.push(entry);
}
container.image = IMAGE;

if (DRY_RUN) {
  console.log(`target: ${NAMESPACE}/${DEPLOY}`);
  console.log(`image: ${IMAGE}`);
  console.log('PASS — dry-run only');
  process.exit(0);
}

const apply = kubectl(['apply', '-f', '-'], JSON.stringify(deployment));
if (apply.status !== 0) {
  console.error(apply.stderr || apply.stdout || 'apply failed');
  process.exit(apply.status ?? 1);
}

const rollout = kubectl(['rollout', 'status', `deployment/${DEPLOY}`, '-n', NAMESPACE, '--timeout=120s']);
console.log(rollout.stdout?.trim() || '');
if (rollout.status !== 0) {
  console.error(rollout.stderr || 'rollout failed');
  process.exit(rollout.status ?? 1);
}
console.log(`PASS — ${DEPLOY} verifier env + ${IMAGE}`);
