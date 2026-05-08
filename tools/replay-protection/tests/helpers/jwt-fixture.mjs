/**
 * @fileoverview JWT Test Fixtures
 *
 * Generates ES256 key pairs, DID documents, and signed JWTs for tests.
 * Uses Node.js Web Crypto API — no external dependencies.
 */

import { generateEs256KeyPair, signJwt } from '../../src/crypto/jwt-verify.mjs';

/** @type {object | null} */
let cachedKeyPair = null;

/**
 * Get or create the singleton test key pair.
 *
 * @returns {Promise<{ privateKeyJwk: object, publicKeyJwk: object }>}
 */
export async function getTestKeyPair() {
  if (!cachedKeyPair) {
    cachedKeyPair = await generateEs256KeyPair();
  }
  return cachedKeyPair;
}

/**
 * Build a DID document for the test key.
 *
 * @param {string} did
 * @param {string} keyId
 * @param {object} publicKeyJwk
 * @returns {object}
 */
export function buildDidDocument(did, keyId, publicKeyJwk) {
  const fullKeyId = keyId.includes('#') ? keyId : `${did}#${keyId}`;
  return {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
    verificationMethod: [
      {
        id: fullKeyId,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk,
      },
    ],
    authentication: [fullKeyId],
    assertionMethod: [fullKeyId],
  };
}

/**
 * Create a mock fetch that resolves the test DID.
 *
 * @param {object} didDocument
 * @returns {Function}
 */
export function createMockFetch(didDocument) {
  return async (url) => {
    if (typeof url === 'string' && url.includes(didDocument.id)) {
      return {
        ok: true,
        status: 200,
        json: async () => didDocument,
      };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
}

/**
 * Sign a test JWT for the given envelope hash and audience.
 *
 * @param {string} envelopeHash
 * @param {string} audience
 * @param {string} [keyId]
 * @returns {Promise<string>} JWT
 */
export async function signTestJwt(envelopeHash, audience, keyId = 'key-1') {
  const { privateKeyJwk } = await getTestKeyPair();
  const nowSec = Math.floor(Date.now() / 1000);
  return signJwt(
    {
      envelopeHash,
      aud: audience,
      iat: nowSec,
      exp: nowSec + 300,
      kid: keyId,
    },
    privateKeyJwk
  );
}

/**
 * Install the mock fetch globally for tests.
 * Call `uninstallMockFetch()` in cleanup.
 *
 * @param {object} didDocument
 * @returns {typeof global.fetch} The original fetch
 */
export function installMockFetch(didDocument) {
  const original = global.fetch;
  global.fetch = /** @type {typeof global.fetch} */ (createMockFetch(didDocument));
  return original;
}

/**
 * Restore the original fetch.
 *
 * @param {typeof global.fetch} original
 */
export function uninstallMockFetch(original) {
  global.fetch = original;
}
