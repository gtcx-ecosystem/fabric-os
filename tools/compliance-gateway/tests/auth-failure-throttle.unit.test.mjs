/**
 * @fileoverview Unit tests for the per-IP auth-failure throttle.
 *
 * Threshold/window are kept small (3 fails in 100ms → 100ms lockout)
 * to keep tests fast without changing the production defaults.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  _resetForTests,
  clearAuthFailures,
  isAuthThrottled,
  recordAuthFailure,
  sourceIpFromRequest,
} from '../src/auth-failure-throttle.mjs';

const CFG = { threshold: 3, windowMs: 100, throttleMs: 100 };

describe('auth-failure-throttle — counter + window', () => {
  beforeEach(() => _resetForTests());
  afterEach(() => _resetForTests());

  it('does not throttle a fresh IP', () => {
    assert.strictEqual(isAuthThrottled('1.2.3.4').throttled, false);
  });

  it('throttles after the threshold is crossed', () => {
    recordAuthFailure('a', CFG);
    recordAuthFailure('a', CFG);
    const r = recordAuthFailure('a', CFG);
    assert.strictEqual(r.throttled, true, '3rd failure crosses threshold');
    assert.ok(r.retryAfterSeconds >= 1);
    assert.strictEqual(isAuthThrottled('a').throttled, true);
  });

  it('does not affect other IPs', () => {
    for (let i = 0; i < 5; i += 1) recordAuthFailure('a', CFG);
    assert.strictEqual(isAuthThrottled('a').throttled, true);
    assert.strictEqual(isAuthThrottled('b').throttled, false);
  });

  it('clearAuthFailures resets the counter', () => {
    for (let i = 0; i < 3; i += 1) recordAuthFailure('a', CFG);
    assert.strictEqual(isAuthThrottled('a').throttled, true);
    clearAuthFailures('a');
    assert.strictEqual(isAuthThrottled('a').throttled, false);
  });

  it('lockout expires after throttleMs', async () => {
    for (let i = 0; i < 3; i += 1) recordAuthFailure('a', CFG);
    assert.strictEqual(isAuthThrottled('a').throttled, true);
    await new Promise((r) => setTimeout(r, 130));
    assert.strictEqual(isAuthThrottled('a').throttled, false);
  });

  it('counter resets if no failures within window', async () => {
    recordAuthFailure('a', CFG);
    recordAuthFailure('a', CFG);
    await new Promise((r) => setTimeout(r, 130));
    // Next failure should start a fresh window, not immediately throttle.
    const r = recordAuthFailure('a', CFG);
    assert.strictEqual(r.throttled, false);
    assert.strictEqual(r.count, 1);
  });
});

describe('auth-failure-throttle — sourceIpFromRequest', () => {
  it('prefers x-forwarded-for first hop when present', () => {
    const req = {
      headers: { 'x-forwarded-for': '10.0.0.1, 172.16.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    assert.strictEqual(sourceIpFromRequest(req), '10.0.0.1');
  });

  it('falls back to socket.remoteAddress', () => {
    const req = { headers: {}, socket: { remoteAddress: '192.168.1.50' } };
    assert.strictEqual(sourceIpFromRequest(req), '192.168.1.50');
  });

  it('returns "unknown" when no source can be determined', () => {
    assert.strictEqual(sourceIpFromRequest({ headers: {} }), 'unknown');
  });
});
