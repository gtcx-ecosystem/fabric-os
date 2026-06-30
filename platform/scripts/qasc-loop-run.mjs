#!/usr/bin/env node
/**
 * GTCX QASC repository loop runner.
 *
 * Re-runs the QASC repository witness repeatedly and prints score
 * progression until the configured target is reached or max iterations are
 * exhausted.
 *
 * Usage:
 *   node platform/scripts/qasc-loop-run.mjs --max 5 --repo fabric-os
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { executeQascLoop } from './lib/qasc-loop.mjs';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPTS, '../..');
const ACCEPTANCE = join(SCRIPTS, 'qasc-repo.mjs');
const OUT = join(ROOT, 'audit/evidence/qasc-loop-latest.json');

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

const loop = await executeQascLoop({
  maxIterations: maxIter,
  stagnantLimit,
  observe: async (iteration) => {
  const { res, witness } = runOnce();
  if (!witness) {
    return {
      error: `acceptance witness parse failed (exit ${res.status ?? 1})`,
    };
  }
    if (iteration < maxIter) sleep(sleepMs);
    return witness;
  },
});

const summary = {
  schema: 'gtcx://fabric-os/qasc-loop/v1',
  generatedAt: new Date().toISOString(),
  ...loop,
};

if (write) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(summary, null, 2)}\n`);
}

if (jsonOut) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  summary.history.forEach((row) => {
    const blockText = row.blockerCount > 0 ? row.nextRemediation?.blocker ?? 'blocked' : 'none';
    console.log(`iter=${row.iteration} score=${row.score100}/100 controls=${row.benchmarkCount}/${row.areaCount} at-benchmark mpr=${row.mpr ?? 'n/a'} signal=${row.signal ?? 'n/a'} blocker=${row.blockerCount} next=${blockText}`);
  });
  console.log(`iterations=${summary.iterations}; decision=${summary.decision}; stop=${summary.stopReason}; completed=${summary.completed ? 'yes' : 'no'}`);
  if (write) console.log(`witness=${OUT}`);
}

process.exit(summary.completed ? 0 : 1);
