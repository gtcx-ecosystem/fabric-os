#!/usr/bin/env node
/**
 * XR-MKT-PROTOCOL-NATIVE-001 — live Golden Transaction probe (registration allowed path).
 * Requires verifier URL + token + Markets trace route. Fixture-only cannot close handoff.
 *
 * Usage:
 *   GTCX_OS_PROTOCOLS_VERIFIER_URL=... GTCX_OS_PROTOCOLS_VERIFIER_TOKEN=... \
 *     node platform/scripts/golden-transaction-protocol-native-probe.mjs [--write]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/evidence/golden-transaction-protocol-native-2026-06-12.json');
const WRITE = process.argv.includes('--write');

const verifierUrl = process.env.GTCX_OS_PROTOCOLS_VERIFIER_URL;
const verifierToken = process.env.GTCX_OS_PROTOCOLS_VERIFIER_TOKEN;

const witness = {
  schema: 'gtcx://fabric-os/golden-transaction-protocol-native/v1',
  id: 'GOLDEN-TXN-PROTOCOL-NATIVE-2026-06-12',
  ticket: 'XR-MKT-PROTOCOL-NATIVE-001',
  probedAt: new Date().toISOString(),
  ok: false,
  phase: 'blocked_prerequisites',
  prerequisites: {
    verifierUrl: Boolean(verifierUrl),
    verifierToken: Boolean(verifierToken),
    readinessWitness: 'audit/evidence/protocol-verifier-staging-readiness-2026-06-12.json',
  },
  note: 'Live registration→admission trace pack not executed — populate verifier secrets, deploy e7525dfa image, inject Markets credentials first.',
  repo: 'fabric-os',
};

if (!verifierUrl || !verifierToken) {
  console.error('BLOCKED — GTCX_OS_PROTOCOLS_VERIFIER_URL and GTCX_OS_PROTOCOLS_VERIFIER_TOKEN required');
  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
    console.log(`witness: ${OUT}`);
  }
  process.exit(1);
}

console.error('BLOCKED — live manifest + Markets trace orchestration not yet wired in this runner');
process.exit(1);
