#!/usr/bin/env node
/**
 * AAAS — canonical audit front door (11-pillar MPR lens).
 *
 * This is the ONE audit command for the fleet. It does NOT score — scoring stays
 * in the bridge-os MPR engine (audit:mpr:repo:run). aaas-audit delegates to that
 * engine, then presents the requested taxonomy slice (pillar / micro / tier / all)
 * from the per-pillar witnesses the engine writes into the target repo.
 *
 * Usage:
 *   aaas-audit.mjs --repo <name> [--lens mpr|signal|all] --pillar <p> [--micro <m>] [--write]
 *   aaas-audit.mjs --repo <name> --tier foundational|transformational [--write]
 *   aaas-audit.mjs --repo <name> --all [--write]
 *   (no --repo = current working repo · default --lens mpr)
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const TAXONOMY = join(ROOT, 'machine/spec/aaas-audit-taxonomy.json');
const ENGINE = join(FLEET, 'bridge-os/platform/scripts/ecosystem/run-mpr-repo-audit.mjs');

const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const has = (k) => process.argv.includes(k);

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

// pillar id -> the per-pillar witness filename the engine emits
const PILLAR_WITNESS = {
  compliance: 'compliance-pillar-latest.json',
  technicalExcellence: 'technical-excellence-pillar-latest.json',
  craft: 'craft-pillar-latest.json',
  worldClass: 'world-class-pillar-latest.json',
  trustAndSafety: 'trust-safety-pillar-latest.json',
};

function microsOf(pillar) {
  return pillar?.micros ?? (pillar?.microGroups ? Object.values(pillar.microGroups).flat() : []);
}

function selectPillars(taxonomy) {
  const all = Object.keys(taxonomy.pillars);
  if (has('--all')) return all;
  const tier = arg('--tier');
  if (tier) return all.filter((p) => taxonomy.pillars[p].tier === tier);
  const pillar = arg('--pillar');
  if (pillar) return [pillar];
  return all;
}

function runEngine(repo, write) {
  if (!existsSync(ENGINE)) {
    console.error(`engine not found: ${ENGINE} (bridge-os not a sibling?)`);
    process.exit(2);
  }
  const args = [ENGINE, '--repo', repo];
  if (write) args.push('--write');
  const res = spawnSync('node', args, { stdio: 'inherit' });
  return res.status ?? 0;
}

function present(repo, pillars, micro, taxonomy) {
  const repoRoot = join(FLEET, repo);
  const evidence = join(repoRoot, 'audit/evidence');
  const composite = readJson(join(evidence, 'mpr-repo-latest.json'));
  console.log(`\nAAAS audit — ${repo}  (engine: bridge-os MPR)`);
  if (composite?.composite100 != null) {
    console.log(`composite: ${composite.composite100}/100`);
  }
  for (const id of pillars) {
    const def = taxonomy.pillars[id];
    if (!def) { console.log(`  ${id}: not in taxonomy`); continue; }
    const wfile = PILLAR_WITNESS[id];
    const w = wfile ? readJson(join(evidence, wfile)) : null;
    const score = w?.score100 ?? w?.composite100 ?? composite?.pillars?.[id]?.score100 ?? null;
    const micros = microsOf(def);
    const microNote = micro ? ` · micro=${micro}` : ` · ${micros.length} micros`;
    console.log(`  ${id.padEnd(28)} ${def.tier.padEnd(16)} ${score != null ? score + '/100' : '(pillar-level only)'}${microNote}`);
    if (micro && !micros.includes(micro)) {
      console.log(`      ! "${micro}" not a defined micro of ${id} (${micros.join(', ')})`);
    }
  }
  console.log('\nReports: node platform/scripts/aaas-report.mjs <umbrella>');
}

// SIGNAL lens — delegate to the fabric-os reference evaluator (parallel to MPR).
function runSignal(repo, write) {
  const signal = join(ROOT, 'platform/scripts/aaas-signal-eval.mjs');
  if (!existsSync(signal)) { console.error('signal evaluator not found'); return 2; }
  const args = [signal];
  if (arg('--repo')) args.push('--repo', repo);
  if (write) args.push('--write');
  const res = spawnSync('node', args, { stdio: 'inherit' });
  return res.status ?? 0;
}

function main() {
  const taxonomy = readJson(TAXONOMY);
  if (!taxonomy) { console.error('missing taxonomy'); process.exit(1); }
  const repo = arg('--repo') ?? basename(process.cwd());
  const write = has('--write');
  const lens = arg('--lens') ?? 'mpr';
  if (!['mpr', 'signal', 'all'].includes(lens)) {
    console.error(`--lens must be mpr|signal|all (got "${lens}")`); process.exit(1);
  }
  const pillars = selectPillars(taxonomy);
  const micro = arg('--micro');

  let status = 0;
  if (lens === 'mpr' || lens === 'all') {
    status = runEngine(repo, write);
    if (status !== 0) console.error(`\n(engine exited ${status} — presenting any witnesses found)`);
    present(repo, pillars, micro, taxonomy);
  }
  if (lens === 'signal' || lens === 'all') {
    console.log(`\n--- SIGNAL lens ---`);
    const s = runSignal(repo, write);
    if (s !== 0 && status === 0) status = s;
  }
  process.exit(status);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
