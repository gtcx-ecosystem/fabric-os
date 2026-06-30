import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeQascLoop } from '../lib/qasc-loop.mjs';

function observation(score100, decision = 'incomplete') {
  return {
    acceptance: {
      score100,
      areaCount: 18,
      benchmarkCount: Math.round((score100 / 100) * 18),
    },
    decision,
    blockers: decision === 'complete' ? [] : [{ area: 'Next phase', blocker: 'below benchmark' }],
    loop: {
      current: { mprComposite100: score100, signalScore100: score100 },
      nextRemediation: decision === 'complete' ? null : { area: 'Next phase', blocker: 'below benchmark' },
    },
    phaseLoop: [{ phaseId: 'fixture', score100, benchmark100: 100 }],
  };
}

describe('GTCX QASC loop efficacy', () => {
  it('records real convergence from 59 to 82 to the 100 benchmark', async () => {
    const scores = [59, 82, 100];
    const remediated = [];
    const result = await executeQascLoop({
      maxIterations: 5,
      stagnantLimit: 2,
      observe: async (iteration) => observation(
        scores[iteration - 1],
        scores[iteration - 1] === 100 ? 'complete' : 'incomplete',
      ),
      remediate: async ({ iteration, row }) => {
        remediated.push(row.score100);
        return { scoreBefore: row.score100, action: `fixture-remediation-${iteration}`, exitCode: 0 };
      },
    });

    assert.equal(result.completed, true);
    assert.equal(result.stopReason, 'benchmark-reached');
    assert.deepEqual(result.history.map((row) => row.score100), [59, 82, 100]);
    assert.deepEqual(remediated, [59, 82]);
    assert.equal(result.remediations.length, 2);
  });

  it('stops immediately when the repository already meets benchmark', async () => {
    const result = await executeQascLoop({
      observe: async () => observation(100, 'complete'),
    });

    assert.equal(result.iterations, 1);
    assert.equal(result.completed, true);
    assert.equal(result.stopReason, 'benchmark-reached');
  });

  it('detects repetition without score movement as stagnation', async () => {
    const result = await executeQascLoop({
      maxIterations: 10,
      stagnantLimit: 2,
      observe: async () => observation(59),
      remediate: async ({ row }) => ({ scoreBefore: row.score100, action: 'no-op', exitCode: 0 }),
    });

    assert.equal(result.completed, false);
    assert.equal(result.stopReason, 'stagnant');
    assert.deepEqual(result.history.map((row) => row.score100), [59, 59, 59]);
  });

  it('distinguishes improving but unfinished work from stagnation', async () => {
    const scores = [40, 55, 70];
    const result = await executeQascLoop({
      maxIterations: 3,
      stagnantLimit: 2,
      observe: async (iteration) => observation(scores[iteration - 1]),
      remediate: async ({ row }) => ({ scoreBefore: row.score100, action: 'progress', exitCode: 0 }),
    });

    assert.equal(result.completed, false);
    assert.equal(result.stopReason, 'max-iterations');
    assert.deepEqual(result.history.map((row) => row.score100), scores);
  });
});
