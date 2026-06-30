#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ACCEPTANCE_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'qasc-repo.mjs');
const BASE = join(dirname(ACCEPTANCE_SCRIPT), '..', '..');

const forwarded = process.argv.slice(2).filter((value) => value !== '--');
const res = spawnSync(process.execPath, [ACCEPTANCE_SCRIPT, ...forwarded, '--json'], {
  cwd: BASE,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
if (res.error) {
  console.error(res.error.message);
  process.exit(2);
}
let witness = null;
try {
  witness = JSON.parse((res.stdout || '').trim());
} catch (err) {
  console.error('could not parse acceptance witness JSON');
  console.error(err.message);
  process.exit(2);
}

const acceptance = witness.acceptance ?? {};
const score = typeof acceptance.score100 === 'number' ? acceptance.score100 : 0;
const benchmarkCount = typeof acceptance.benchmarkCount === 'number' ? acceptance.benchmarkCount : 0;
const areaCount = typeof acceptance.areaCount === 'number' ? acceptance.areaCount : 0;

console.log(`GTCX QASC repository score: ${score}/100`);
console.log(`Controls at benchmark: ${benchmarkCount}/${areaCount}`);
console.log(`MPR: ${witness.mpr?.composite100 ?? 'unverified'}/100`);
console.log(`SIGNAL: ${witness.signal?.level ?? 'unverified'} / ${witness.signal?.score100 ?? 'unverified'}`);
console.log(`Decision: ${witness.decision}`);

process.exit(witness.decision === 'complete' ? 0 : 1);
