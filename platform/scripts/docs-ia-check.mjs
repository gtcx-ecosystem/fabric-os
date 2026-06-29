#!/usr/bin/env node
/**
 * docs:ia:check — layered documentation IA gate (harness grammar).
 * Resolves gateSequence from canon docs-ia-initiative (our language → harness).
 *
 * Usage: node docs-ia-check.mjs [--write] [--strict]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { repoRootFromImportMeta } from './lib/repo-root.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');
const WITNESS = join(REPO, 'audit/evidence/docs-ia-latest.json');
const REPO_ID = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;

/** pnpm script id → platform/scripts entry (harness resolution table). */
const SCRIPT_MAP = {
  'docs:foundation:check': 'docs-foundation-check.mjs',
  'docs:business:check': 'docs-business-check.mjs',
  'docs:architecture:check': 'docs-architecture-check.mjs',
  'docs:product:check': 'docs-product-check.mjs',
  'docs:ux:check': 'docs-ux-check.mjs',
  'docs:canon:check': 'docs-canon-check.mjs',
  'docs:research:check': 'docs-research-check.mjs',
  'docs:roadmap:check': 'docs-roadmap-check.mjs',
  'docs:agile:check': 'agile-check.mjs',
  'docs:operations:check': 'docs-operations-check.mjs',
  'docs:agents:check': 'agents-check.mjs',
  'docs:fractal-mpr:check': 'docs-fractal-mpr-check.mjs',
  'docs:pack:pillar-contract:check': 'docs-pack-pillar-contract-check.mjs',
};

const DEFAULT_SEQUENCE = [
  'docs:foundation:check',
  'docs:business:check',
  'docs:architecture:check',
  'docs:product:check',
  'docs:roadmap:check',
  'docs:agile:check',
  'docs:operations:check',
  'docs:agents:check',
  'docs:fractal-mpr:check',
  'docs:pack:pillar-contract:check',
];

function loadGateSequence() {
  const candidates = [
    join(REPO, '../canon-os/machine/spec/docs-ia-initiative.json'),
    join(REPO, '../canon-os/pm/spec/docs-ia-initiative.json'),
    join(REPO, 'machine/spec/docs-ia-initiative.json'),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const seq = JSON.parse(readFileSync(path, 'utf8')).enforcement?.gateSequence;
    if (Array.isArray(seq) && seq.length) return seq;
  }
  return DEFAULT_SEQUENCE;
}

function runScript(scriptRel, extraArgs = []) {
  const abs = join(REPO, 'platform/scripts', scriptRel);
  if (!existsSync(abs)) {
    return { ok: false, exit: 2, detail: `missing ${scriptRel}` };
  }
  const r = spawnSync(process.execPath, [abs, ...extraArgs], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const tail = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-3).join(' | ');
  return { ok: (r.status ?? 1) === 0, exit: r.status ?? 1, detail: tail };
}

function runCanonSynthesizePreflight() {
  const synth = join(REPO, '../canon-os/platform/scripts/synthesize-product-canon.mjs');
  if (!existsSync(synth)) return;
  const mode = WRITE ? '--write' : '--check';
  spawnSync(process.execPath, [synth, mode], {
    cwd: REPO,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function main() {
  runCanonSynthesizePreflight();
  const sequence = loadGateSequence();
  const steps = [];
  const failures = [];

  console.log('\n=== docs:ia:check (layer rollup) ===\n');

  for (const gateId of sequence) {
    const script = SCRIPT_MAP[gateId];
    if (!script) {
      if (gateId.startsWith('validate:') && !STRICT) {
        steps.push({ gateId, skipped: true, reason: 'validate gates require --strict' });
        continue;
      }
      steps.push({ gateId, skipped: true, reason: 'no harness script mapped' });
      continue;
    }

    const extra = gateId === 'docs:fractal-mpr:check' && STRICT ? ['--strict'] : [];
    const result = runScript(script, extra);
    steps.push({ gateId, script, ...result });
    const label = result.ok ? 'OK' : 'FAIL';
    console.log(`${label} ${gateId} — exit ${result.exit}`);
    if (!result.ok) failures.push(gateId);
  }

  const ran = steps.filter((s) => !s.skipped);
  const ok = failures.length === 0;
  console.log(
    `\n${ok ? 'PASS' : 'FAIL'} — docs:ia:check ${ran.length - failures.length}/${ran.length}`,
  );

  const payload = {
    schema: 'gtcx://baseline-os/docs-ia-check/v1',
    generatedAt: new Date().toISOString(),
    repo: REPO_ID,
    ok,
    strict: STRICT,
    initiative: 'INIT-DOCS-CORE-IA-V1',
    gateSequenceSource: 'canon-os/machine/spec/docs-ia-initiative.json',
    failures,
    steps,
  };

  if (WRITE) {
    mkdirSync(dirname(WITNESS), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`witness: ${WITNESS.replace(`${REPO}/`, '')}`);
  }

  process.exit(ok ? 0 : 1);
}

main();
