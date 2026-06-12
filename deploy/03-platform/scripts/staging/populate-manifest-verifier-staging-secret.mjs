#!/usr/bin/env node
/**
 * Populate gtcx-manifest-verifier-staging in gtcx-staging (PNV-3).
 * Generates staging-only Ed25519 receipt signer material; does not write secrets to Git.
 *
 * Usage:
 *   node deploy/03-platform/scripts/staging/populate-manifest-verifier-staging-secret.mjs [--dry-run]
 *
 * Class A: requires kubectl write + staging deployment authority.
 */
import { randomBytes, generateKeyPairSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');
const NAMESPACE = 'gtcx-staging';
const SECRET_NAME = 'gtcx-manifest-verifier-staging';
const MARKETS_SIGNER_SECRET_NAME = 'gtcx-markets-manifest-signer-staging';

const signerRegistry = [
  {
    keyId: 'manifest-signer-staging-v1',
    signerDid: 'did:gtcx:manifest-signer-staging-v1',
    publicKeyMultibase: null,
    authorizedFrom: '2026-01-01T00:00:00.000Z',
    authorizedUntil: null,
    revokedAt: null,
    permittedPurposes: ['registration', 'admission', 'close'],
  },
];

const revocation = { manifests: [], signers: [], evidence: [] };

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeEd25519PublicKeyMultibase(rawPublicKey) {
  const prefixed = Buffer.concat([Buffer.from([0xed, 0x01]), rawPublicKey]);
  let zeros = 0;
  while (zeros < prefixed.length && prefixed[zeros] === 0) zeros += 1;
  const size = Math.floor(((prefixed.length - zeros) * 138) / 100) + 1;
  const encoded = new Uint8Array(size);
  let outputLength = 0;
  for (let i = zeros; i < prefixed.length; i += 1) {
    let carry = prefixed[i] ?? 0;
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < outputLength) && k >= 0; k -= 1, j += 1) {
      carry += 256 * (encoded[k] ?? 0);
      encoded[k] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    outputLength = j;
  }
  let index = size - outputLength;
  while (index < size && encoded[index] === 0) index += 1;
  let result = '1'.repeat(zeros);
  for (let i = index; i < size; i += 1) result += BASE58[encoded[i] ?? 0];
  return `z${result}`;
}

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const rawPublic = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
const manifestSignerSeed = privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(-32);
signerRegistry[0].publicKeyMultibase = encodeEd25519PublicKeyMultibase(rawPublic);
const receiptSeed = randomBytes(32).toString('hex');

const files = {
  'signer-registry-json': JSON.stringify(signerRegistry, null, 2),
  'revocation-json': JSON.stringify(revocation, null, 2),
  'receipt-signing-key': receiptSeed,
};
const marketsSignerFiles = {
  'manifest-signing-key': manifestSignerSeed.toString('hex'),
  'manifest-signing-key-id': signerRegistry[0].keyId,
};

console.log(`target: ${NAMESPACE}/${SECRET_NAME}`);
console.log(`marketsSignerTarget: ${NAMESPACE}/${MARKETS_SIGNER_SECRET_NAME}`);
console.log(`receiptKeyId: manifest-receipt-staging-v1`);
console.log(`signerKeyId: ${signerRegistry[0].keyId}`);

if (DRY_RUN) {
  console.log('PASS — dry-run only (no kubectl apply)');
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), 'gtcx-manifest-verifier-'));
try {
  for (const [key, value] of Object.entries({ ...files, ...marketsSignerFiles })) {
    writeFileSync(join(dir, key), value);
  }

  for (const [secretName, secretFiles] of [
    [SECRET_NAME, files],
    [MARKETS_SIGNER_SECRET_NAME, marketsSignerFiles],
  ]) {
    const createArgs = [
      'create',
      'secret',
      'generic',
      secretName,
      '-n',
      NAMESPACE,
      '--dry-run=client',
      '-o',
      'yaml',
    ];
    for (const key of Object.keys(secretFiles)) {
      createArgs.push('--from-file', `${key}=${join(dir, key)}`);
    }
    const create = spawnSync('kubectl', createArgs, { encoding: 'utf8' });
    if (create.status !== 0) {
      console.error(create.stderr || create.stdout || `kubectl render ${secretName} failed`);
      process.exit(create.status ?? 1);
    }
    const apply = spawnSync('kubectl', ['apply', '--validate=false', '-f', '-'], {
      encoding: 'utf8',
      input: create.stdout,
    });
    if (apply.status !== 0) {
      console.error(apply.stderr || apply.stdout || `kubectl apply ${secretName} failed`);
      process.exit(apply.status ?? 1);
    }
    console.log(apply.stdout.trim());
  }

  console.log(`PASS — verifier and Markets signer secrets applied atomically in ${NAMESPACE}`);
  console.log('next: rollout restart deploy/gtcx-protocols-staging -n gtcx-staging');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
