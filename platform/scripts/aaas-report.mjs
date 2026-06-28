#!/usr/bin/env node
/**
 * AAAS — canonical report front door (4 umbrellas).
 *
 * Reads the audit witnesses the bridge-os MPR engine wrote into a repo's
 * audit/evidence/ and renders one of the four canonical reports. It does NOT
 * score — it rolls up existing witnesses. Run aaas-audit first.
 *
 * Usage:
 *   aaas-report.mjs <umbrella> [--repo <name>] [--write]
 *     umbrella = foundational-readiness | transformational-readiness
 *              | mpr-scorecard | remediation-roadmap
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const TAXONOMY = join(ROOT, 'machine/spec/aaas-audit-taxonomy.json');

const has = (k) => process.argv.includes(k);
const arg = (k) => (has(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

const PILLAR_WITNESS = {
  compliance: 'compliance-pillar-latest.json',
  technicalExcellence: 'technical-excellence-pillar-latest.json',
  craft: 'craft-pillar-latest.json',
  worldClass: 'world-class-pillar-latest.json',
  trustAndSafety: 'trust-safety-pillar-latest.json',
};

const UMBRELLAS = new Set([
  'foundational-readiness',
  'transformational-readiness',
  'mpr-scorecard',
  'remediation-roadmap',
]);

function pillarScore(evidence, composite, id) {
  const w = PILLAR_WITNESS[id] ? readJson(join(evidence, PILLAR_WITNESS[id])) : null;
  return w?.score100 ?? w?.composite100 ?? composite?.pillars?.[id]?.score100 ?? null;
}

function render(umbrella, repo, taxonomy) {
  const evidence = join(FLEET, repo, 'audit/evidence');
  const composite = readJson(join(evidence, 'mpr-repo-latest.json')) ?? {};
  const r = taxonomy.rollup ?? {};
  const date = (composite.checkedAt || '').slice(0, 10) || 'undated';
  const lines = [`# AAAS report — ${umbrella} — ${repo}`, '', `_witness date: ${date} · engine: bridge-os MPR_`, ''];

  const tierTable = (covers, bar, barLabel) => {
    lines.push(`| pillar | tier | score |`, `| --- | --- | --- |`);
    const scores = [];
    for (const id of covers) {
      const def = taxonomy.pillars[id];
      const s = pillarScore(evidence, composite, id);
      if (typeof s === 'number') scores.push(s);
      lines.push(`| ${id} | ${def?.tier ?? '?'} | ${s != null ? s + '/100' : '—'} |`);
    }
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    lines.push('', `**rollup: ${avg != null ? avg + '/100' : 'n/a'}**${bar ? ` · ${barLabel} ${bar}` : ''} ${avg != null && bar ? (avg >= bar ? '✓ over bar' : '✗ under bar') : ''}`);
  };

  if (umbrella === 'foundational-readiness') {
    const covers = taxonomy.reports.umbrellas.find((u) => u.id === umbrella).covers;
    tierTable(covers, r.unlockThreshold100, 'unlock threshold');
    if (composite.foundationComposite100 != null) lines.push('', `engine foundationComposite100: ${composite.foundationComposite100}/100`);
  } else if (umbrella === 'transformational-readiness') {
    const covers = taxonomy.reports.umbrellas.find((u) => u.id === umbrella).covers;
    tierTable(covers, r.worldClassBar100, 'world-class bar');
    if (composite.fullComposite100 != null) lines.push('', `engine fullComposite100: ${composite.fullComposite100}/100`);
  } else if (umbrella === 'mpr-scorecard') {
    tierTable(Object.keys(taxonomy.pillars), r.worldClassBar100, 'world-class bar');
    lines.push('', `foundationComposite: ${composite.foundationComposite100 ?? '—'} · fullComposite: ${composite.fullComposite100 ?? '—'}`);
  } else if (umbrella === 'remediation-roadmap') {
    const gaps = Object.keys(taxonomy.pillars)
      .map((id) => ({ id, s: pillarScore(evidence, composite, id) }))
      .filter((g) => typeof g.s === 'number')
      .sort((a, b) => a.s - b.s);
    lines.push('Pillars ranked by gap to world-class bar (95):', '');
    for (const g of gaps) lines.push(`- **${g.id}** — ${g.s}/100 (gap ${Math.max(0, 95 - g.s)})`);
    if (!gaps.length) lines.push('_no scored witnesses found — run aaas-audit first._');
  }
  return lines.join('\n') + '\n';
}

function main() {
  const umbrella = process.argv[2];
  if (!UMBRELLAS.has(umbrella)) {
    console.error(`usage: aaas-report.mjs <${[...UMBRELLAS].join(' | ')}> [--repo <name>] [--write]`);
    process.exit(1);
  }
  const taxonomy = readJson(TAXONOMY);
  const repo = arg('--repo') ?? basename(process.cwd());
  const out = render(umbrella, repo, taxonomy);
  if (has('--write')) {
    const dir = join(FLEET, repo, 'audit/reports');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${umbrella}-${(out.match(/witness date: (\S+)/)?.[1]) || 'latest'}.md`);
    writeFileSync(file, out);
    console.log(`report: ${file}`);
  } else {
    process.stdout.write(out);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
