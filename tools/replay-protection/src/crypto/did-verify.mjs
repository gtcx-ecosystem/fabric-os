/**
 * @fileoverview DID Signature Verification
 *
 * Verifies ES256 JWT signatures from gtcx-mobile's offline queue.
 * Uses Node.js Web Crypto API — zero external dependencies.
 *
 * Flow:
 *   1. Structural validation (hex nonce, ISO timestamp, did: prefix, SHA-256 envelopeHash)
 *   2. DID resolution → DID document
 *   3. Extract publicKeyJwk by keyId
 *   4. Verify JWT signature over envelopeHash
 *   5. Validate audience claim
 *
 * Principles: SECURE (P11)
 */

import { resolveDid, extractPublicKeyJwk, verifyJwt } from './jwt-verify.mjs';

const HEX_RE = /^[0-9a-fA-F]+$/;
const NONCE_MIN_LEN = 16; // 8 bytes hex minimum

/**
 * Verify a DID-signed JWT envelope.
 *
 * @param {import('../types').QueueIntegrity} integrity
 * @returns {Promise<boolean>}
 */
export async function verifyDidSignature(integrity) {
  // 1. Structural validation
  const required = ['scheme', 'did', 'keyId', 'audience', 'timestamp', 'nonce', 'signature', 'envelopeHash'];
  for (const field of required) {
    const val = integrity[field];
    if (typeof val !== 'string' || val.length === 0) {
      return false;
    }
  }

  if (!HEX_RE.test(integrity.nonce) || integrity.nonce.length < NONCE_MIN_LEN) {
    return false;
  }

  const tsMs = Date.parse(integrity.timestamp);
  if (Number.isNaN(tsMs)) {
    return false;
  }

  if (!integrity.did.startsWith('did:')) {
    return false;
  }

  if (integrity.signature.length < 4) {
    return false;
  }

  if (!HEX_RE.test(integrity.envelopeHash) || integrity.envelopeHash.length !== 64) {
    return false;
  }

  // 2–5. Cryptographic verification
  try {
    const didDocument = await resolveDid(integrity.did);
    const publicKeyJwk = extractPublicKeyJwk(didDocument, integrity.keyId);
    if (!publicKeyJwk) {
      return false;
    }

    const payload = await verifyJwt(integrity.signature, publicKeyJwk, {
      audience: integrity.audience,
    });

    // The JWT payload must contain the envelopeHash that was signed
    return payload.envelopeHash === integrity.envelopeHash;
  } catch {
    return false;
  }
}

/**
 * Bypass wrapper for integration tests and local development ONLY.
 * Logs a loud warning every time it is invoked.
 *
 * @deprecated Remove once all environments have DID resolver access.
 * @param {import('../types').QueueIntegrity} integrity
 * @returns {Promise<boolean>}
 */
export async function verifyDidSignatureStubBypass(integrity) {
  const required = ['scheme', 'did', 'keyId', 'audience', 'timestamp', 'nonce', 'signature', 'envelopeHash'];
  for (const field of required) {
    const val = integrity[field];
    if (typeof val !== 'string' || val.length === 0) {
      return false;
    }
  }
  if (!HEX_RE.test(integrity.nonce) || integrity.nonce.length < NONCE_MIN_LEN) {
    return false;
  }
  if (Number.isNaN(Date.parse(integrity.timestamp))) {
    return false;
  }
  if (!integrity.did.startsWith('did:')) {
    return false;
  }
  if (integrity.signature.length < 4) {
    return false;
  }
  if (!HEX_RE.test(integrity.envelopeHash) || integrity.envelopeHash.length !== 64) {
    return false;
  }
  // eslint-disable-next-line no-console
  console.warn(JSON.stringify({
    level: 'warn',
    type: 'auth.replay.signature.bypass',
    message: 'Cryptographic signature verification is BYPASSED. This must not run in production.',
    did: integrity.did,
    nonce: integrity.nonce,
    envelopeHash: integrity.envelopeHash,
  }));
  return true;
}
