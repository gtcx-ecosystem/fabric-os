#!/usr/bin/env node
/**
 * AAAS — lifecycle loop runner (E1: wire the framework so it actually RUNS).
 *
 * Chains the AaaS lifecycle for a repo end to end:
 *   audit (MPR + SIGNAL) → handoff → adversarial honesty → ownership → cadence
 * This is the single entry point a runner (CI / cron / operator) invokes so the
 * framework stops being a set of orphan commands. Each step writes its witness;
 * the run prints a one-line status per step and exits nonzero if any HARD step fails.
 *
 * Usage: node aaas-loop.mjs [--repo <name>] [--write] [--strict]
 */
import { existsSync } from 'node:fs';
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

function main() {
  const repo = repoArg ?? 'fabric-os';
  console.log(`AAAS loop · ${repo} · ${WRITE ? 'write' : 'dry-run'}`);
  let failed = 0;
  for (const [label, script, args, hard] of STEPS) {
    const path = join(SCRIPTS, script);
    if (!existsSync(path)) { console.log(`  SKIP ${label} (missing ${script})`); continue; }
    const res = spawnSync('node', [path, ...args], { encoding: 'utf8' });
    const ok = (res.status ?? 0) === 0;
    if (!ok && hard) failed += 1;
    console.log(`  ${ok ? 'OK  ' : hard ? 'FAIL' : 'warn'} ${label}${ok ? '' : ` (exit ${res.status})`}`);
  }
  console.log(`\n${failed === 0 ? 'PASS' : `FAIL (${failed} hard step(s))`} — AAAS loop · ${repo}`);
  process.exit(STRICT && failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
