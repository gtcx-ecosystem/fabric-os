import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

async function loadConfig(label) {
  return import(`../src/config.mjs?test=${label}-${Date.now()}-${Math.random()}`);
}

describe('config', () => {
  it('uses explicit environment overrides', async () => {
    process.env.USSD_PORT = '9001';
    process.env.NODE_ENV = 'production';
    process.env.USSD_SESSION_TTL_SECONDS = '240';
    process.env.USSD_PIN_LOCKOUT_MINUTES = '30';
    process.env.USSD_MAX_PIN_ATTEMPTS = '5';
    process.env.REDIS_URL = 'redis://localhost:6379';

    const { config } = await loadConfig('overrides');

    assert.strictEqual(config.port, 9001);
    assert.strictEqual(config.nodeEnv, 'production');
    assert.strictEqual(config.sessionTtlSeconds, 240);
    assert.strictEqual(config.pinLockoutMinutes, 30);
    assert.strictEqual(config.maxPinAttempts, 5);
    assert.strictEqual(config.redisUrl, 'redis://localhost:6379');
    assert.strictEqual(config.scryptParams.N, 32768);
  });

  it('uses test defaults when env values are absent', async () => {
    delete process.env.USSD_PORT;
    process.env.NODE_ENV = 'test';
    delete process.env.USSD_SESSION_TTL_SECONDS;
    delete process.env.USSD_PIN_LOCKOUT_MINUTES;
    delete process.env.USSD_MAX_PIN_ATTEMPTS;
    delete process.env.REDIS_URL;

    const { config } = await loadConfig('test-defaults');

    assert.strictEqual(config.port, 8600);
    assert.strictEqual(config.sessionTtlSeconds, 2);
    assert.strictEqual(config.pinLockoutMinutes, 15);
    assert.strictEqual(config.maxPinAttempts, 3);
    assert.strictEqual(config.redisUrl, null);
    assert.strictEqual(config.scryptParams.N, 64);
  });
});
