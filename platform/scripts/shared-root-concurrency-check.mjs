#!/usr/bin/env node
/**
 * Shared-root concurrency drift check — Protocol 62 (AGENT-WORKTREE).
 *
 * Flags a git repository whose main checkout and linked worktrees are being
 * written concurrently. Under P62 the shared checkout must be read-only and
 * each writing agent must use its own worktree.
 *
 * Usage:
 *   node platform/scripts/shared-root-concurrency-check.mjs [--write] [--json]
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.GTCX_ECOSYSTEM_ROOT || join(__dirname, '..', '..', '..');
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../..', 'audit/evidence/shared-root-concurrency-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function run(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function safeRun(cmd, cwd) {
  try {
    return { ok: true, out: run(cmd, cwd) };
  } catch (e) {
    return { ok: false, out: (e.stdout || e.stderr || e.message || '').trim() };
  }
}

function isGitCheckout(cwd) {
  return existsSync(join(cwd, '.git'));
}

function getCommonGitDir(cwd) {
  try {
    const out = run('git rev-parse --git-common-dir', cwd);
    return resolve(cwd, out);
  } catch {
    return null;
  }
}

function getGitDir(cwd) {
  try {
    return resolve(cwd, run('git rev-parse --git-dir', cwd));
  } catch {
    return null;
  }
}

function listWorktrees(cwd) {
  const out = safeRun('git worktree list --porcelain', cwd);
  if (!out.ok) return [];
  const entries = [];
  let current = null;
  for (const line of out.out.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current) entries.push(current);
      current = { path: line.slice('worktree '.length) };
    } else if (line.startsWith('HEAD ')) {
      if (current) current.head = line.slice('HEAD '.length);
    } else if (line.startsWith('branch ')) {
      if (current) current.branch = line.slice('branch '.length);
    } else if (line === '') {
      if (current) {
        entries.push(current);
        current = null;
      }
    }
  }
  if (current) entries.push(current);
  return entries;
}

function uncommittedCount(cwd) {
  const out = safeRun('git status --short', cwd);
  if (!out.ok) return 0;
  return out.out.split('\n').filter((l) => l.trim()).length;
}

function discoverRepoCandidates() {
  if (!existsSync(ROOT)) return [];
  return readdirSync(ROOT)
    .map((name) => join(ROOT, name))
    .filter((p) => statSync(p).isDirectory() && isGitCheckout(p));
}

function checkSharedRootConcurrency() {
  const candidates = discoverRepoCandidates();
  const seenCommonDirs = new Set();
  const drift = [];

  for (const candidate of candidates) {
    const commonDir = getCommonGitDir(candidate);
    if (!commonDir || seenCommonDirs.has(commonDir)) continue;
    seenCommonDirs.add(commonDir);

    const worktrees = listWorktrees(candidate).map((wt) => {
      const gitDir = getGitDir(wt.path);
      return {
        ...wt,
        isMain: gitDir === commonDir,
        uncommitted: uncommittedCount(wt.path),
      };
    });

    if (worktrees.length <= 1) continue;

    const writingWorktrees = worktrees.filter((wt) => wt.uncommitted > 0);
    const mainCheckout = worktrees.find((wt) => wt.isMain);
    const mainHasWrites = mainCheckout && mainCheckout.uncommitted > 0;

    if (writingWorktrees.length > 1 || mainHasWrites) {
      drift.push({
        commonDir,
        worktreeCount: worktrees.length,
        writingWorktreeCount: writingWorktrees.length,
        mainCheckoutReadOnlyViolation: mainHasWrites,
        worktrees: worktrees.map((wt) => ({
          path: wt.path,
          branch: wt.branch ? wt.branch.replace(/^refs\/heads\//, '') : null,
          isMain: wt.isMain,
          uncommitted: wt.uncommitted,
        })),
      });
    }
  }

  return drift;
}

const drift = checkSharedRootConcurrency();
const ok = drift.length === 0;

const gates = {
  ecosystemRootExists: { ok: existsSync(ROOT) },
  noSharedRootWrites: { ok, count: drift.length },
};

const witness = {
  schema: 'gtcx://fabric-os/shared-root-concurrency-check/v1',
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  initiative: 'INIT-HUB-SCOPE-GUARD',
  protocol: 'P62',
  gates,
  drift,
  ok,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log('=== shared-root:concurrency:check ===\n');
  for (const [k, v] of Object.entries(gates)) {
    console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${v.count != null ? ` (${v.count})` : ''}`);
  }
  if (drift.length) {
    console.log('\nDrift:');
    for (const d of drift) {
      console.log(`  - ${d.commonDir}: ${d.worktreeCount} worktrees, ${d.writingWorktreeCount} writing`);
      for (const wt of d.worktrees) {
        console.log(`      ${wt.isMain ? 'main' : 'worktree'} ${wt.branch || '(detached)'}: ${wt.uncommitted} uncommitted`);
      }
    }
  }
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${drift.length} shared-root concurrency issue(s)`);
  if (WRITE) console.log(`witness: ${OUT}`);
}

process.exit(ok ? 0 : 1);
