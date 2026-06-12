#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const contractPath = join(
  process.cwd(),
  'deploy/kubernetes/overlays/staging/patches/protocols-staging-env.yaml'
);
const contract = readFileSync(contractPath, 'utf8');
const failures = [];

const requiredSecretRefs = new Map([
  ['GTCX_MANIFEST_SIGNER_REGISTRY', 'signer-registry-json'],
  ['GTCX_MANIFEST_REVOCATION_JSON', 'revocation-json'],
  ['GTCX_MANIFEST_RECEIPT_SIGNING_KEY', 'receipt-signing-key'],
]);

const requiredLiterals = new Map([
  ['GTCX_MANIFEST_RECEIPT_KEY_ID', 'manifest-receipt-staging-v1'],
  ['GTCX_MANIFEST_VERIFIER_AUTHORITY', 'gtcx-os/protocols'],
  ['GTCX_MANIFEST_RECEIPT_TTL_MS', '86400000'],
]);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function envBlock(name) {
  const escapedName = escapeRegex(name);
  const match = contract.match(
    new RegExp(`\\n\\s*- name: ${escapedName}\\n([\\s\\S]*?)(?=\\n\\s*- name:|$)`)
  );
  return match?.[1] ?? '';
}

for (const [name, key] of requiredSecretRefs) {
  const block = envBlock(name);
  if (!block) {
    failures.push(`${name} is missing`);
    continue;
  }
  if (!block.includes('valueFrom:') || !block.includes('secretKeyRef:')) {
    failures.push(`${name} must use secretKeyRef`);
  }
  if (!block.includes('name: gtcx-manifest-verifier-staging')) {
    failures.push(`${name} must use the gtcx-manifest-verifier-staging secret`);
  }
  if (!block.includes(`key: ${key}`)) {
    failures.push(`${name} must use secret key ${key}`);
  }
  if (/optional:\s*true/.test(block)) {
    failures.push(`${name} must not be optional`);
  }
  if (/^\s*value:\s*/m.test(block)) {
    failures.push(`${name} must not contain a literal value`);
  }
}

for (const [name, value] of requiredLiterals) {
  const block = envBlock(name);
  if (!block) {
    failures.push(`${name} is missing`);
    continue;
  }
  if (!new RegExp(`^\\s*value:\\s*['"]?${escapeRegex(value)}['"]?\\s*$`, 'm').test(block)) {
    failures.push(`${name} must equal ${value}`);
  }
}

const replayBlock = envBlock('REDIS_URL');
if (!replayBlock || !replayBlock.includes('redis-staging.gtcx-staging.svc.cluster.local:6379')) {
  failures.push('REDIS_URL must configure the staging distributed replay dependency');
}

if (failures.length > 0) {
  console.error('Protocol verifier staging contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  'Protocol verifier staging contract check passed: signer registry, revocation, receipt signer, authority, TTL, and distributed replay are configured.'
);
