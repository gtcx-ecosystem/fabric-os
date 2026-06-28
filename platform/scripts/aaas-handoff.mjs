#!/usr/bin/env node
/**
 * AAAS — handoff synthesizer (lifecycle step 2).
 *
 * Reads each repo's lens witnesses (audit/evidence/mpr-repo-latest.json +
 * signal-maturity-latest.json) and writes ONE prioritized work-order to
 * audit/handoff/handoff-YYYY-MM-DD.md. SIGNAL weakest-link first, then MPR
 * threshold gaps by leverage. Never fabricates a score — degrades to MPR-only
 * (or "blocked") when a lens witness is absent.
 *
 * Usage: node aaas-handoff.mjs [--repo <name>] [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPillars, extractSignal, synthesizeHandoff, renderHandoff } from './lib/aaas-handoff.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const BINDINGS = join(ROOT, 'machine/fleet-audit-contracts.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const repoArg = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;

const readJson = (p) => {
  try { return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; } catch { return null; }
};

function handoffForRepo(repo, date) {
  const repoRoot = join(FLEET, repo);
  if (!existsSync(repoRoot)) return { repo, absent: true };
  const ev = join(repoRoot, 'audit/evidence');
  const pillars = extractPillars(readJson(join(ev, 'mpr-repo-latest.json')));
  const signal = extractSignal(readJson(join(ev, 'signal-maturity-latest.json')));
  const synth = synthesizeHandoff({ repo, pillars, signal });
  const md = renderHandoff({ repo, date, synth });
  let written = null;
  if (WRITE) {
    const dir = join(repoRoot, 'audit/handoff');
    mkdirSync(dir, { recursive: true });
    written = join(dir, `handoff-${date}.md`);
    writeFileSync(written, md + '\n');
  }
  return {
    repo,
    actions: synth.actions.length,
    signalPresent: synth.signalPresent,
    mprPresent: synth.mprPresent,
    written: written ? `audit/handoff/handoff-${date}.md` : null,
    md,
  };
}

function main() {
  const bindings = readJson(BINDINGS);
  if (!bindings) { console.error('missing bindings'); process.exit(1); }
  const date = new Date().toISOString().slice(0, 10);
  const repos = (bindings.repos ?? [])
    .map((b) => b.repo)
    .filter((r) => (!repoArg || r === repoArg) && existsSync(join(FLEET, r)));

  const results = repos.map((r) => handoffForRepo(r, date));

  if (JSON_OUT) {
    console.log(JSON.stringify({ date, count: results.length, results: results.map(({ md, ...r }) => r) }, null, 2));
  } else if (repoArg && results.length === 1) {
    console.log(results[0].md);
    if (results[0].written) console.log(`\nwritten: ${results[0].written}`);
  } else {
    console.log(`AAAS handoff — ${results.length} repos · ${date}`);
    for (const r of results) {
      if (r.absent) { console.log(`  ${r.repo.padEnd(15)} ABSENT`); continue; }
      const lens = `${r.mprPresent ? 'M' : '-'}${r.signalPresent ? 'S' : '-'}`;
      console.log(`  ${r.repo.padEnd(15)} [${lens}] ${r.actions} action(s)${r.written ? ' · written' : ''}`);
    }
    if (!WRITE) console.log('\n(dry-run — re-run with --write to emit handoff files)');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
