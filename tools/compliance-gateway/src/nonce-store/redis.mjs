/**
 * Redis-backed nonce store for cross-service replay protection.
 *
 * Semantics:
 *   - Key:   nonce:{tenant-id}:{nonce-value}
 *   - TTL:   300s (5-min replay window, matches NONCE_TTL_MS)
 *   - Value: JSON { ts: ISOString, hash: request-hash } for forensic dup detection
 *
 * Fallback: if REDIS_URL is unset or connection fails, logs WARN and
 * falls back to in-memory NonceGate (same interface, no external dep).
 */

import { NonceGate, NONCE_TTL_MS } from '../audit-bundles/nonce-gate.mjs';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_TTL_S = Math.ceil(NONCE_TTL_MS / 1000);

/** @type {import('ioredis').Redis | null} */
let redis = null;

/**
 * Lazy-connect to Redis. Returns null if REDIS_URL is unset or connection
 * throws, logging a WARN so operators know the nonce store is in-memory.
 */
async function getRedis() {
  if (redis) return redis;
  if (!REDIS_URL) return null;

  try {
    const { Redis } = await import('ioredis');
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        return times > 3 ? null : Math.min(times * 100, 1000);
      },
    });
    await client.connect();
    redis = client;
    return redis;
  } catch (err) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        type: 'nonce-store.redis.unavailable',
        message: 'REDIS_URL set but connection failed; falling back to in-memory NonceGate',
        redisUrl: REDIS_URL,
        error: err.message,
      })
    );
    return null;
  }
}

/**
 * Create a nonce store backed by Redis when available, otherwise in-memory.
 *
 * @param {object} [opts]
 * @param {string} [opts.tenantId]  - tenant segment for key namespacing
 * @returns {Promise<{ checkAndSet: (nonce: string, requestHash?: string) => Promise<{ accepted: boolean, alreadySeen: boolean }> }>}
 */
export async function createNonceStore(opts = {}) {
  const client = await getRedis();
  const tenantId = opts.tenantId ?? 'default';

  if (!client) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        type: 'nonce-store.memory.fallback',
        message: 'Using in-memory NonceGate (process-scoped, not shared across pods)',
        tenantId,
      })
    );
    const gate = new NonceGate();
    return {
      checkAndSet: async (nonce) => gate.checkAndSet(nonce),
    };
  }

  return {
    /**
     * @param {string} nonce
     * @param {string} [requestHash]
     */
    checkAndSet: async (nonce, requestHash = '') => {
      const key = `nonce:${tenantId}:${nonce}`;
      const value = JSON.stringify({
        ts: new Date().toISOString(),
        hash: requestHash,
      });

      // SET key value NX EX ttl — only sets if key does not exist
      const result = await client.set(key, value, 'NX', 'EX', REDIS_TTL_S);

      if (result === 'OK') {
        return { accepted: true, alreadySeen: false };
      }

      // Key already exists → replay
      return { accepted: false, alreadySeen: true };
    },
  };
}
