/**
 * @fileoverview Unit tests for per-principal QPS + daily budget limiter.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { checkBudget, recordSpend, getSpend, resetBudget } from '../src/budget.mjs';

describe('checkBudget — QPS', () => {
  beforeEach(() => {
    process.env.GTCX_QPS_LIMIT = '3';
    process.env.GTCX_QPS_WINDOW_MS = '1000';
    process.env.GTCX_DAILY_BUDGET_USD = '100';
    resetBudget();
  });
  afterEach(() => {
    delete process.env.GTCX_QPS_LIMIT;
    delete process.env.GTCX_QPS_WINDOW_MS;
    delete process.env.GTCX_DAILY_BUDGET_USD;
    delete process.env.GTCX_PRINCIPAL_BUDGETS_JSON;
    resetBudget();
  });

  it('allows requests under the per-window QPS limit', () => {
    // QPS_LIMIT is read at module load. The test verifies the contract
    // with whatever limit the module observed; default 10.
    const a = checkBudget('alice');
    const b = checkBudget('alice');
    assert.strictEqual(a.ok, true);
    assert.strictEqual(b.ok, true);
  });

  it('returns 429 with reason=qps after the limit is exceeded', () => {
    const subject = 'flood-test';
    // Fire well over the default 10 QPS limit.
    const results = [];
    for (let i = 0; i < 12; i += 1) {
      results.push(checkBudget(subject));
    }
    const rejected = results.find((r) => !r.ok);
    assert.ok(rejected, 'expected at least one 429');
    assert.strictEqual(rejected.status, 429);
    assert.strictEqual(rejected.reason, 'qps');
    assert.ok(rejected.retryAfterSeconds > 0);
  });

  it('isolates principals: alice over the limit does not affect bob', () => {
    for (let i = 0; i < 12; i += 1) checkBudget('alice-isolated');
    const bob = checkBudget('bob-isolated');
    assert.strictEqual(bob.ok, true);
  });
});

describe('checkBudget — daily budget', () => {
  beforeEach(() => resetBudget());
  afterEach(() => resetBudget());

  it('allows requests under the budget', () => {
    recordSpend('carol', 0.01);
    const r = checkBudget('carol');
    assert.strictEqual(r.ok, true);
  });

  it('rejects with reason=budget when spend ≥ daily ceiling', () => {
    const subject = 'spendy';
    // Default is $5 — push past it.
    recordSpend(subject, 999);
    const r = checkBudget(subject);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.status, 429);
    assert.strictEqual(r.reason, 'budget');
    assert.ok(r.retryAfterSeconds > 0);
  });

  it('getSpend reports current spend + limits', () => {
    recordSpend('dora', 0.5);
    const s = getSpend('dora');
    assert.strictEqual(typeof s.day, 'string');
    assert.ok(s.spentUsd >= 0.5);
    assert.ok(s.limits.qps > 0);
    assert.ok(s.limits.dailyUsd > 0);
  });
});

describe('per-principal overrides', () => {
  afterEach(() => {
    delete process.env.GTCX_PRINCIPAL_BUDGETS_JSON;
    resetBudget();
  });

  it('applies an override from GTCX_PRINCIPAL_BUDGETS_JSON', () => {
    process.env.GTCX_PRINCIPAL_BUDGETS_JSON = JSON.stringify({
      'whale': { qps: 100, dailyUsd: 500 },
    });
    resetBudget();
    const r = checkBudget('whale');
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.limits.qps, 100);
    assert.strictEqual(r.limits.dailyUsd, 500);
  });

  it('ignores malformed JSON in the override env var', () => {
    process.env.GTCX_PRINCIPAL_BUDGETS_JSON = '{not-json';
    resetBudget();
    const r = checkBudget('safe');
    assert.strictEqual(r.ok, true);
  });
});
