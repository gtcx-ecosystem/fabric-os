import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeLifecycle } from '../aaas-loop.mjs';

describe('AaaS lifecycle scoring', () => {
  it('scores every lifecycle step and exposes below-benchmark phases', () => {
    const witness = summarizeLifecycle(
      [
        { label: 'audit', score100: 100 },
        { label: 'handoff', score100: 80 },
        { label: 'honesty', score100: 100 },
      ],
      { repo: 'fixture-os', now: '2026-06-30T00:00:00.000Z' },
    );

    assert.equal(witness.score100, 93);
    assert.equal(witness.benchmarkCount, 2);
    assert.equal(witness.stepCount, 3);
    assert.deepEqual(witness.belowBenchmark, ['handoff']);
    assert.equal('pass' in witness, false);
    assert.equal('fail' in witness, false);
  });
});
