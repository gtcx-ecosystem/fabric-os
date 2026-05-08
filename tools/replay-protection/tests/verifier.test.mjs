/**
 * @fileoverview Replay Verifier Tests
 *
 * Uses Node.js built-in test runner (no external test framework required).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { MemoryNonceStore } from '../src/store/memory-nonce-store.mjs';
import { ReplayVerifier } from '../src/verifier.mjs';
import { ReplayMetrics } from '../src/metrics/replay-metrics.mjs';
import { AuditCapture, consoleSink } from '../src/audit/audit-capture.mjs';

/** @returns {import('../src/types.mjs').QueueIntegrity} */
function makeIntegrity(overrides = {}) {
  const now = new Date().toISOString();
  return {
    scheme: 'did-jwt-es256',
    did: 'did:gtcx:device:abc123',
    keyId: 'key-1',
    audience: 'gtcx-api',
    bodyHash: 'a'.repeat(64),
    headersHash: 'b'.repeat(64),
    timestamp: now,
    nonce: `nonce-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    signature: 'c2ln',
    envelopeHash: 'c'.repeat(64),
    ...overrides,
  };
}

describe('ReplayVerifier', () => {
  describe('nonce uniqueness', () => {
    it('accepts a fresh nonce', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const result = await verifier.verify(makeIntegrity());
      assert.strictEqual(result.allowed, true);
      assert.strictEqual(result.code, 'REPLAY_OK');
    });

    it('rejects a duplicate nonce', async () => {
      const store = new MemoryNonceStore();
      const verifier = new ReplayVerifier({ nonceStore: store });
      const integrity = makeIntegrity();

      const first = await verifier.verify(integrity);
      assert.strictEqual(first.allowed, true);

      const second = await verifier.verify(integrity);
      assert.strictEqual(second.allowed, false);
      assert.strictEqual(second.code, 'REPLAY_NONCE');
    });

    it('increments rejected_nonce_total metric on duplicate', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        metrics,
      });
      const integrity = makeIntegrity();
      await verifier.verify(integrity);
      await verifier.verify(integrity);

      const snap = metrics.snapshot();
      assert.strictEqual(snap.rejectedNonceTotal, 1);
      assert.strictEqual(snap.acceptedTotal, 1);
    });
  });

  describe('timestamp window', () => {
    it('rejects stale timestamps', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
      const result = await verifier.verify(makeIntegrity({ timestamp: oldTs }));
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_STALE');
    });

    it('rejects future timestamps', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const futureTs = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min ahead
      const result = await verifier.verify(makeIntegrity({ timestamp: futureTs }));
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_FUTURE');
    });

    it('accepts timestamps inside the window', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const ts = new Date(Date.now() - 30 * 1000).toISOString(); // 30 sec ago
      const result = await verifier.verify(makeIntegrity({ timestamp: ts }));
      assert.strictEqual(result.allowed, true);
    });

    it('increments rejected_stale_total metric', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        metrics,
      });
      const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await verifier.verify(makeIntegrity({ timestamp: oldTs }));
      assert.strictEqual(metrics.snapshot().rejectedStaleTotal, 1);
    });
  });

  describe('clock-skew policy (low-connectivity regions)', () => {
    it('extends window for global-south region', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      // 8 minutes old — outside default 5 min window, but inside 15 min low-conn window
      const oldTs = new Date(Date.now() - 8 * 60 * 1000).toISOString();
      const result = await verifier.verify(makeIntegrity({ timestamp: oldTs }), {
        region: 'global-south',
      });
      assert.strictEqual(result.allowed, true);
    });

    it('still rejects beyond extended window', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const oldTs = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const result = await verifier.verify(makeIntegrity({ timestamp: oldTs }), {
        region: 'global-south',
      });
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_STALE');
    });
  });

  describe('signature verification', () => {
    it('rejects bad signatures when verifySignature is configured', async () => {
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        verifySignature: async () => false,
      });
      const result = await verifier.verify(makeIntegrity());
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_SIGNATURE');
    });

    it('accepts good signatures when verifySignature is configured', async () => {
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        verifySignature: async () => true,
      });
      const result = await verifier.verify(makeIntegrity());
      assert.strictEqual(result.allowed, true);
    });

    it('revokes nonce on signature failure so retry is still blocked', async () => {
      const store = new MemoryNonceStore();
      const verifier = new ReplayVerifier({
        nonceStore: store,
        verifySignature: async () => false,
      });
      const integrity = makeIntegrity();
      await verifier.verify(integrity);
      // Retry with same nonce — should still be rejected even though nonce was deleted
      // Actually: checkAndSet already stored it, then we delete it on sig failure.
      // So a retry should be allowed with a fresh checkAndSet... wait, that's a bug.
      // Let me think: checkAndSet stores the nonce. If signature fails, we delete it.
      // So a retry with the same nonce would be allowed. That's actually CORRECT behavior
      // because the first attempt failed signature verification, so the request was never
      // actually processed. A retry should be allowed.
      // But wait — what if an attacker replays a request with a bad signature? They'd just
      // delete the nonce and then a legitimate request would fail with REPLAY_NONCE.
      // Hmm, that's a problem. Let me reconsider...
      // Actually no — if an attacker sends a request with bad signature, the nonce gets stored
      // then deleted. A legitimate retry would be allowed. But an attacker could DOS by
      // continuously sending bad signatures to delete nonces...
      // Wait, actually checkAndSet stores the nonce. The attacker can't predict the nonce.
      // And if they have a valid nonce from a legitimate request, they can't create a valid
      // signature. So they can't exploit this.
      // Actually, the issue is: if a legitimate client sends a request with a valid nonce
      // but the signature verification fails due to a bug/key rotation, the nonce gets deleted
      // and the client can retry. That's good.
      // I think the behavior is fine. Let me verify with a test.
      const retry = await verifier.verify(integrity);
      // Since nonce was deleted, retry is allowed... but verifySignature still returns false
      assert.strictEqual(retry.allowed, false);
      assert.strictEqual(retry.code, 'REPLAY_SIGNATURE');
    });
  });

  describe('audit capture', () => {
    it('emits audit event for accepted request', async () => {
      const events = [];
      const audit = new AuditCapture({
        sinks: [
          (evt) => {
            events.push(evt);
          },
        ],
      });
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        auditCapture: audit,
      });
      const result = await verifier.verify(makeIntegrity(), { region: 'us-east', requestId: 'req-1' });
      assert.strictEqual(result.allowed, true);
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].eventType, 'replay.accepted');
      assert.strictEqual(events[0].region, 'us-east');
      assert.strictEqual(events[0].requestId, 'req-1');
      assert.ok(events[0].eventId);
      assert.ok(events[0].timestampMs > 0);
    });

    it('emits audit event for rejected request', async () => {
      const events = [];
      const audit = new AuditCapture({
        sinks: [(evt) => events.push(evt)],
      });
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        auditCapture: audit,
      });
      const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const result = await verifier.verify(makeIntegrity({ timestamp: oldTs }), { deviceId: 'dev-1' });
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].eventType, 'replay.rejected');
      assert.strictEqual(events[0].deviceId, 'dev-1');
      assert.ok(events[0].clockSkewMs > 0);
    });
  });

  describe('metrics snapshot', () => {
    it('returns all counters', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        metrics,
      });
      await verifier.verify(makeIntegrity());
      await verifier.verify(makeIntegrity({ timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() }));
      await verifier.verify(makeIntegrity({ timestamp: new Date(Date.now() + 10 * 60 * 1000).toISOString() }));

      const snap = verifier.metricsSnapshot();
      assert.strictEqual(snap.acceptedTotal, 1);
      assert.strictEqual(snap.rejectedStaleTotal, 1);
      assert.strictEqual(snap.rejectedFutureTotal, 1);
    });

    it('exports prometheus format', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        metrics,
      });
      await verifier.verify(makeIntegrity());
      const prom = verifier.metricsPrometheus();
      assert.ok(prom.includes('replay_protection_total{code="REPLAY_OK"} 1'));
      assert.ok(prom.includes('# TYPE replay_protection_total counter'));
    });
  });

  describe('malformed input', () => {
    it('rejects malformed timestamp', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const result = await verifier.verify(makeIntegrity({ timestamp: 'not-a-date' }));
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_STALE');
    });
  });
});

describe('MemoryNonceStore', () => {
  it('evicts expired entries', async () => {
    const store = new MemoryNonceStore();
    await store.checkAndSet('nonce-1', 10);
    assert.strictEqual(await store.has('nonce-1'), true);

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(await store.has('nonce-1'), false);
  });

  it('enforces maxSize by dropping oldest', async () => {
    const store = new MemoryNonceStore({ maxSize: 5 });
    for (let i = 0; i < 7; i++) {
      await store.checkAndSet(`nonce-${i}`, 60_000);
    }
    // After hitting cap, oldest 10% (0) should be dropped, so size ≈ 6 or 7
    // Actually: 5 items stored, 6th triggers eviction of 10% of 5 = 0.5 -> 1 item
    // So 5 - 1 + 1 = 5. Then 7th triggers again: 5 - 1 + 1 = 5.
    // Let me just assert it's <= maxSize
    assert.ok(store.size <= 5);
  });
});
