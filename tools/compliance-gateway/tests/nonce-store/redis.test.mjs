import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createNonceStore } from '../../src/nonce-store/redis.mjs';

describe('createNonceStore — memory fallback (no REDIS_URL)', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  it('falls back to in-memory when REDIS_URL is unset', async () => {
    delete process.env.REDIS_URL;
    const store = await createNonceStore({ tenantId: 'zw' });

    const r1 = await store.checkAndSet('nonce-1');
    assert.strictEqual(r1.accepted, true);
    assert.strictEqual(r1.alreadySeen, false);

    const r2 = await store.checkAndSet('nonce-1');
    assert.strictEqual(r2.accepted, false);
    assert.strictEqual(r2.alreadySeen, true);
  });

  it('isolates nonces by tenantId', async () => {
    delete process.env.REDIS_URL;
    const storeZw = await createNonceStore({ tenantId: 'zw' });
    const storeGh = await createNonceStore({ tenantId: 'gh' });

    const r1 = await storeZw.checkAndSet('shared-nonce');
    assert.strictEqual(r1.accepted, true);

    const r2 = await storeGh.checkAndSet('shared-nonce');
    assert.strictEqual(r2.accepted, true);

    const r3 = await storeZw.checkAndSet('shared-nonce');
    assert.strictEqual(r3.accepted, false);
  });

  it('stores requestHash in memory when provided', async () => {
    delete process.env.REDIS_URL;
    const store = await createNonceStore({ tenantId: 'zw' });

    const r1 = await store.checkAndSet('nonce-hash', 'sha256:abc123');
    assert.strictEqual(r1.accepted, true);

    const r2 = await store.checkAndSet('nonce-hash', 'sha256:def456');
    assert.strictEqual(r2.accepted, false);
  });

  // Restore env
  if (originalRedisUrl !== undefined) {
    process.env.REDIS_URL = originalRedisUrl;
  }
});
