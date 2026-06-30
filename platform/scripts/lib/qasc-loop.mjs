function normalizeObservation(observation, iteration) {
  const witness = observation?.witness ?? observation;
  if (!witness || typeof witness !== 'object') {
    return {
      iteration,
      score100: 0,
      areaCount: 0,
      benchmarkCount: 0,
      mpr: null,
      signal: null,
      decision: 'unreadable',
      blockerCount: 1,
      error: observation?.error ?? 'acceptance witness unavailable',
      phases: [],
    };
  }

  return {
    iteration,
    score100: witness.acceptance?.score100 ?? 0,
    areaCount: witness.acceptance?.areaCount ?? 0,
    benchmarkCount: witness.acceptance?.benchmarkCount ?? 0,
    mpr: witness.loop?.current?.mprComposite100 ?? null,
    signal: witness.loop?.current?.signalScore100 ?? null,
    decision: witness.decision ?? 'incomplete',
    blockerCount: witness.blockers?.length ?? 0,
    blockers: witness.blockers ?? [],
    nextRemediation: witness.loop?.nextRemediation ?? null,
    phases: witness.phaseLoop ?? [],
  };
}

function sameScore(left, right) {
  return left.score100 === right.score100
    && left.mpr === right.mpr
    && left.signal === right.signal
    && left.benchmarkCount === right.benchmarkCount;
}

export async function executeQascLoop({
  observe,
  remediate = null,
  maxIterations = 10,
  stagnantLimit = 2,
}) {
  const history = [];
  const remediations = [];
  let stagnantIterations = 0;
  let stopReason = 'max-iterations';

  for (let iteration = 1; iteration <= Math.max(1, maxIterations); iteration += 1) {
    const observation = await observe(iteration);
    const row = normalizeObservation(observation, iteration);
    const previous = history.at(-1);

    if (previous && sameScore(previous, row)) stagnantIterations += 1;
    else stagnantIterations = 0;

    history.push(row);

    if (row.decision === 'complete') {
      stopReason = 'benchmark-reached';
      break;
    }
    if (row.decision === 'unreadable') {
      stopReason = 'unreadable-witness';
      break;
    }
    if (stagnantIterations >= Math.max(1, stagnantLimit)) {
      stopReason = 'stagnant';
      break;
    }
    if (iteration >= Math.max(1, maxIterations)) break;

    if (remediate) {
      const result = await remediate({ iteration, observation, row });
      remediations.push({ afterIteration: iteration, ...result });
    }
  }

  const final = history.at(-1) ?? null;
  return {
    completed: final?.decision === 'complete',
    decision: final?.decision ?? 'unreadable',
    iterations: history.length,
    maxIterations,
    stagnantLimit,
    stopReason,
    final,
    history,
    remediations,
  };
}
