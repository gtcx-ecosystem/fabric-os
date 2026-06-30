#!/usr/bin/env node
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStaleness, extractDateMs } from '../aaas-cadence.mjs';

const DAY = 86_400_000;
const now = 1_750_000_000_000; // fixed epoch for determinism

describe('aaas-cadence · evaluateStaleness', () => {
  it('passes when every witness is within maxAgeDays', () => {
    const { witness, ok } = evaluateStaleness({
      witnesses: [
        { id: 'composite', dateMs: now - 1 * DAY },
        { id: 'honesty', dateMs: now - 0.5 * DAY },
      ],
      nowMs: now,
      maxAgeDays: 2,
    });
    assert.equal(ok, true);
    assert.equal(witness.stale.length, 0);
    assert.equal(witness.unknown.length, 0);
    assert.equal(witness.fresh.length, 2);
  });

  it('flags a witness older than maxAgeDays as stale', () => {
    const { witness, ok } = evaluateStaleness({
      witnesses: [
        { id: 'composite', dateMs: now - 1 * DAY },
        { id: 'mpr-repo', dateMs: now - 6 * DAY },
      ],
      nowMs: now,
      maxAgeDays: 2,
    });
    assert.equal(ok, false);
    assert.deepEqual(witness.stale, ['mpr-repo']);
  });

  it('treats an unknown/missing date as not-verifiable (fails)', () => {
    const { witness, ok } = evaluateStaleness({
      witnesses: [{ id: 'fabric-assurance', dateMs: null }],
      nowMs: now,
      maxAgeDays: 2,
    });
    assert.equal(ok, false);
    assert.deepEqual(witness.unknown, ['fabric-assurance']);
  });

  it('reports oldest age and counts', () => {
    const { witness } = evaluateStaleness({
      witnesses: [
        { id: 'a', dateMs: now - 3 * DAY },
        { id: 'b', dateMs: now - 1 * DAY },
      ],
      nowMs: now,
      maxAgeDays: 7,
    });
    assert.equal(witness.maxAgeDays, 7);
    assert.equal(witness.counts.total, 2);
    assert.equal(witness.oldestAgeDays, 3);
  });
});

describe('aaas-cadence · extractDateMs', () => {
  it('reads the first present date-ish field', () => {
    assert.equal(
      extractDateMs({ checkedAt: '2026-06-27T00:00:00.000Z' }),
      Date.parse('2026-06-27T00:00:00.000Z'),
    );
    assert.equal(extractDateMs({ date: '2026-06-22' }), Date.parse('2026-06-22'));
    assert.equal(extractDateMs({ evaluatedAt: '2026-06-25T14:38:00Z' }), Date.parse('2026-06-25T14:38:00Z'));
  });

  it('returns null when no date field is present', () => {
    assert.equal(extractDateMs({ foo: 'bar' }), null);
    assert.equal(extractDateMs(null), null);
  });
});
