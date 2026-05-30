#!/usr/bin/env node
/**
 * @fileoverview Verify jurisdictions.json against jurisdictions.json.sig.
 *
 * Runs in CI on every commit and on `npm pack` as a publication
 * gate. Also intended as a copy-paste reference for downstream
 * consumers verifying the published catalog offline.
 */

import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, '..');
const CATALOG = join(PKG, 'jurisdictions.json');
const SIG = join(PKG, 'jurisdictions.json.sig');

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
}

function main() {
  let sig;
  try {
    sig = JSON.parse(readFileSync(SIG, 'utf8'));
  } catch (err) {
    console.error(
      `[verify-catalog] cannot read ${SIG.replace(`${PKG}/`, '')}: ${err.message}\n` +
        '  The package may have been published without a signature, or the\n' +
        '  sidecar was stripped after publication. Refuse to use.'
    );
    process.exit(1);
  }

  if (sig.algorithm !== 'ed25519+sha256+jcs') {
    console.error(`[verify-catalog] unexpected algorithm: ${sig.algorithm}`);
    process.exit(1);
  }

  const catalogRaw = readFileSync(CATALOG, 'utf8');
  const catalog = JSON.parse(catalogRaw);
  const canonical = canonicalize(catalog);
  const computedHash = createHash('sha256').update(canonical, 'utf8').digest('base64');

  if (computedHash !== sig.catalogHash) {
    console.error(
      `[verify-catalog] catalog hash mismatch:\n` +
        `  computed: ${computedHash}\n` +
        `  recorded: ${sig.catalogHash}\n` +
        '  The catalog has been modified since signing. Refuse to use.'
    );
    process.exit(1);
  }

  const publicKey = createPublicKey({
    key: Buffer.from(sig.publicKey, 'base64'),
    format: 'der',
    type: 'spki',
  });
  const ok = verify(
    null,
    Buffer.from(canonical, 'utf8'),
    publicKey,
    Buffer.from(sig.signature, 'base64')
  );

  if (!ok) {
    console.error(
      '[verify-catalog] signature does NOT verify against the embedded public key.\n' +
        '  The signature was either forged or the public key was swapped.\n' +
        '  Refuse to use.'
    );
    process.exit(1);
  }

  console.log(
    `[verify-catalog] OK — v${sig.version} signed ${sig.signedAt}\n` +
      `  catalogHash:  ${sig.catalogHash}\n` +
      `  publicKey:    ${sig.publicKey.slice(0, 32)}...`
  );
}

main();
