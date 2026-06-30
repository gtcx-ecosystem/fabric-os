#!/usr/bin/env node
/**
 * AAAS — lifecycle loop runner (E1: wire the framework so it actually RUNS).
 *
 * Chains the AaaS lifecycle for a repo end to end:
 *   audit (MPR + SIGNAL) → handoff → adversarial honesty → ownership → cadence
 * This is the single entry point a runner (CI / cron / operator) invokes so the
 * framework stops being a set of orphan commands. Each step writes its witness;
 * the run prints a one-line score per step and exits nonzero when required
 * lifecycle evidence remains below benchmark.
 *
 * Usage: node aaas-loop.mjs [--repo <name>] [--write] [--strict]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');
const repoArg = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;
const repoArgs = repoArg ? ['--repo', repoArg] : [];
const w = WRITE ? ['--write'] : [];

// step: [label, script, args, hard?]  — hard steps gate the loop exit under --strict
const STEPS = [
  ['audit (MPR+SIGNAL)', 'aaas-audit.mjs', ['--lens', 'all', '--all', ...repoArgs, ...w], false],
  ['handoff', 'aaas-handoff.mjs', [...repoArgs, ...w], false],
  ['honesty (adversarial)', 'aaas-adversarial-honesty.mjs', [...repoArgs, ...w], true],
  ['ownership', 'aaas-ownership-check.mjs', [...repoArgs, ...w], true],
  ['cadence', 'aaas-cadence.mjs', [...w], false],
];

export function summarizeLifecycle(results, { repo = 'fabric-os', now = new Date().toISOString() } = {}) {
  const score100 = results.length
    ? Math.round(results.reduce((sum, result) => sum + result.score100, 0) / results.length)
    : 0;
  const benchmarkCount = results.filter((result) => result.score100 === 100).length;
  return {
    schema: 'gtcx://fabric-os/aaas-loop/v2',
    repo,
    generatedAt: now,
    score100,
    benchmark100: 100,
    benchmarkCount,
    stepCount: results.length,
    belowBenchmark: results.filter((result) => result.score100 < 100).map((result) => result.label),
    results,
  };
}

function main() {
  const repo = repoArg ?? 'fabric-os';
  const repoRoot = repoArg ? join(SCRIPTS, '../..', '..', repoArg) : join(SCRIPTS, '../..');
  const out = join(repoRoot, 'audit/evidence/aaas-loop-latest.json');
  console.log(`AAAS loop · ${repo} · ${WRITE ? 'write' : 'dry-run'}`);
  const results = [];
  for (const [label, script, args, hard] of STEPS) {
    const path = join(SCRIPTS, script);
    if (!existsSync(path)) {
      results.push({ label, script, required: hard, score100: 0, exitCode: null, detail: `missing ${script}` });
      console.log(`  score=0/100 ${label} · missing ${script}`);
      continue;
    }
    const res = spawnSync('node', [path, ...args], { encoding: 'utf8' });
    const exitCode = res.status ?? 1;
    const output = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
    const explicitScore = output.match(/(?:score|maturity|coverage)[^0-9]{0,20}(\d{1,3})\/100/i);
    const score100 = explicitScore ? Number.parseInt(explicitScore[1], 10) : exitCode === 0 ? 100 : 0;
    results.push({
      label,
      script,
      required: hard,
      score100,
      exitCode,
      detail: exitCode === 0 ? null : output.trim().split('\n').at(-1)?.slice(0, 300) ?? `exit ${exitCode}`,
    });
    console.log(`  score=${score100}/100 ${label} · exit ${exitCode}`);
  }
  const witness = summarizeLifecycle(results, { repo });
  if (WRITE) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(witness, null, 2)}\n`);
  }
  console.log(`\nAAAS lifecycle score: ${witness.score100}/100 · ${witness.benchmarkCount}/${results.length} steps at benchmark`);
  if (WRITE) console.log(`witness: ${out}`);
  process.exit(STRICT && witness.score100 < 100 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
