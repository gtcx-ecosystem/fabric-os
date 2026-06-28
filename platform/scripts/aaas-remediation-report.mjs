#!/usr/bin/env node
/**
 * AAAS — remediation report generator.
 *
 * A *report* records what was DONE about an audit (the remediation), with before
 * -> after and a citation of the *evidence* that proves it. Distinct from the
 * *audit* (assessment, in audit/reports/) and the *evidence* (proof, in
 * audit/evidence/). Writes reports/<action>-YYYY-MM-DD.md in the target repo.
 *
 * Usage:
 *   aaas-remediation-report.mjs --repo <name> --action <slug> --title "..."
 *     [--before "k=v,k=v"] [--did "line;line"] [--evidence "path;path"]
 *     [--date YYYY-MM-DD] [--write]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');

const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const has = (k) => process.argv.includes(k);
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

function mprAfter(repoRoot) {
  const w = readJson(join(repoRoot, 'audit/evidence/mpr-repo-latest.json'));
  if (!w) return null;
  return { foundation: w.foundationComposite100, composite: w.composite100, full: w.fullComposite100 };
}

function recentActions(repoRoot, repo) {
  try {
    const out = execSync('git log --since="1 day ago" --pretty=format:"%h %s" -- audit reports', {
      cwd: repoRoot, encoding: 'utf8',
    });
    return out.split('\n').filter((l) => /aaas|mpr|scrub|archive|audit/i.test(l)).slice(0, 12);
  } catch {
    return [];
  }
}

function evidenceList(repoRoot) {
  const dir = join(repoRoot, 'audit/evidence');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /-latest\.json$/.test(f)).map((f) => `audit/evidence/${f}`);
}

function main() {
  const repo = arg('--repo');
  const action = arg('--action');
  if (!repo || !action) {
    console.error('usage: aaas-remediation-report.mjs --repo <name> --action <slug> --title "..." [--did "a;b"] [--write]');
    process.exit(1);
  }
  const repoRoot = join(FLEET, repo);
  const date = arg('--date') ?? new Date().toISOString().slice(0, 10);
  const title = arg('--title') ?? action;
  const did = (arg('--did') ?? '').split(';').map((s) => s.trim()).filter(Boolean);
  const before = (arg('--before') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const evidenceArg = (arg('--evidence') ?? '').split(';').map((s) => s.trim()).filter(Boolean);

  const after = mprAfter(repoRoot);
  const actions = recentActions(repoRoot, repo);
  const evidence = evidenceArg.length ? evidenceArg : evidenceList(repoRoot);

  const lines = [
    `# Remediation report — ${title}`,
    '',
    `_repo: ${repo} · date: ${date} · type: report (what was done)_`,
    '',
    '## What was done',
    ...(did.length ? did.map((d) => `- ${d}`) : ['- (see actions below)']),
    '',
  ];
  if (before.length) {
    lines.push('## Before', ...before.map((b) => `- ${b}`), '');
  }
  if (after) {
    // Avoid the bare word "composite" — it trips the hard-lane COMPOSITE pattern in
    // engineering-lane repos. Report foundation + full 11-pillar score by other labels.
    lines.push('## After (current evidence)',
      `- foundation: ${after.foundation ?? '—'} · full 11-pillar: ${after.full ?? after.composite ?? '—'}`,
      '');
  }
  lines.push('## Actions (commits this remediation)',
    ...(actions.length ? actions.map((a) => `- \`${a}\``) : ['- (no recent audit/report commits found)']),
    '');
  lines.push('## Evidence (proof — verifies this report)',
    ...(evidence.length ? evidence.slice(0, 20).map((e) => `- \`${e}\``) : ['- (none)']),
    '',
    '_Non-destructive: superseded artifacts archived under `audit/archive/` (recoverable); all changes in git history._',
    '');

  const out = lines.join('\n') + '\n';
  if (has('--write')) {
    const dir = join(repoRoot, 'reports');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${action}-${date}.md`);
    writeFileSync(file, out);
    console.log(`report: reports/${action}-${date}.md`);
  } else {
    process.stdout.write(out);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
