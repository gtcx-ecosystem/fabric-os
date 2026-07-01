import assert from 'node:assert';
import { describe, it } from 'node:test';

import { NonceStore } from '../src/store/nonce-store.mjs';

describe('NonceStore interface', () => {
  it('throws for abstract mutation and diagnostic methods', async () => {
    const store = new NonceStore();

    await assert.rejects(store.checkAndSet('nonce', 1000), /must be implemented/);
    await assert.rejects(store.has('nonce'), /must be implemented/);
    await assert.rejects(store.delete('nonce'), /must be implemented/);
  });

  it('defaults health to reachable for non-network stores', async () => {
    const store = new NonceStore();

    assert.strictEqual(await store.health(), true);
  });
});
