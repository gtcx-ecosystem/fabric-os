#!/usr/bin/env node
/**
 * Repository acceptance loop runner.
 *
 * Re-runs the repo-cleanup acceptance witness repeatedly and prints score
 * progression until the configured target is reached or max iterations are
 * exhausted.
 *
 * Usage:
 *   node platform/scripts/repo-cleanup-mpr-signal-acceptance-loop-run.mjs --max 5 --repo fabric-os
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPTS, '../..');
const ACCEPTANCE = join(SCRIPTS, 'repo-cleanup-mpr-signal-acceptance.mjs');
const OUT = join(ROOT, 'audit/evidence/repo-cleanup-mpr-signal-loop-run-latest.json');

function arg(name) {
  return process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
}

const repo = arg('--repo') ?? null;
const maxIter = Number.parseInt(arg('--max') || '10', 10);
const sleepMs = Number.parseInt(arg('--sleep-ms') || '0', 10);
const stagnantLimit = Number.parseInt(arg('--stagnant-limit') || '2', 10);
const jsonOut = process.argv.includes('--json');
const write = process.argv.includes('--write');

const opts = [];
if (repo) opts.push('--repo', repo);
opts.push('--json');

function runOnce() {
  const res = spawnSync('node', [ACCEPTANCE, ...opts], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const stdout = (res.stdout || '').trim();
  let witness = null;
  try {
    witness = stdout ? JSON.parse(stdout) : null;
  } catch {
    witness = null;
  }
  return { res, witness };
}

function sleep(ms) {
  if (ms <= 0) return;
  spawnSync('sleep', [String(ms / 1000)]);
}

const history = [];
let final = null;
let decision = 'incomplete';
let iteration = 0;
let stagnantIterations = 0;
let stopReason = 'max-iterations';

for (iteration = 1; iteration <= Math.max(1, maxIter); iteration += 1) {
  const { res, witness } = runOnce();
  if (!witness) {
    const row = {
      iteration,
      score100: 0,
      areaCount: 0,
      benchmarkCount: 0,
      mpr: null,
      signal: null,
      decision: 'unreadable',
      blockerCount: 1,
      error: `acceptance witness parse failed (exit ${res.status ?? 1})`,
      phases: [],
    };
    history.push(row);
    final = row;
    stopReason = 'unreadable-witness';
    break;
  }

  const row = {
    iteration,
    score100: witness.acceptance?.score100 ?? 0,
    areaCount: witness.acceptance?.areaCount ?? 0,
    benchmarkCount: witness.acceptance?.benchmarkCount ?? 0,
    mpr: witness.loop?.current?.mprComposite100 ?? null,
    signal: witness.loop?.current?.signalScore100 ?? null,
    decision: witness.decision ?? 'incomplete',
    blockerCount: witness.blockers?.length ?? 0,
    blockers: witness.blockers || [],
    nextRemediation: witness.loop?.nextRemediation ?? null,
    phases: witness.phaseLoop ?? [],
  };

  const previous = history.at(-1);
  if (previous && previous.score100 === row.score100 && previous.mpr === row.mpr && previous.signal === row.signal) {
    stagnantIterations += 1;
  } else {
    stagnantIterations = 0;
  }
  history.push(row);
  final = row;
  decision = row.decision;
  if (decision === 'complete') {
    stopReason = 'benchmark-reached';
    break;
  }
  if (stagnantIterations >= Math.max(1, stagnantLimit)) {
    stopReason = 'stagnant';
    break;
  }

  if (iteration < maxIter) sleep(sleepMs);
}

const summary = {
  schema: 'gtcx://fabric-os/repo-cleanup-mpr-signal-loop-run/v2',
  generatedAt: new Date().toISOString(),
  completed: decision === 'complete',
  decision,
  iterations: history.length,
  maxIterations: maxIter,
  stagnantLimit,
  stopReason,
  final,
  history,
};

if (write) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(summary, null, 2)}\n`);
}

if (jsonOut) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  history.forEach((row) => {
    const blockText = row.blockerCount > 0 ? row.nextRemediation?.blocker ?? 'blocked' : 'none';
    console.log(`iter=${row.iteration} score=${row.score100}/100 controls=${row.benchmarkCount}/${row.areaCount} at-benchmark mpr=${row.mpr ?? 'n/a'} signal=${row.signal ?? 'n/a'} blocker=${row.blockerCount} next=${blockText}`);
  });
  console.log(`iterations=${history.length}; decision=${decision}; stop=${stopReason}; completed=${decision === 'complete' ? 'yes' : 'no'}`);
  if (write) console.log(`witness=${OUT}`);
}

process.exit(decision === 'complete' ? 0 : 1);
