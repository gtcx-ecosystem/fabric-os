#!/usr/bin/env node
/**
 * repo-cleanup:archive-manifest — generate recoverability manifest for archived
 * repository artifacts used by repo-cleanup acceptance.
 *
 * Usage:
 *   node platform/scripts/repo-cleanup-archive-manifest.mjs [--repo <name>] [--json] [--write]
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, lstatSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const ARG = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);

const repoArg = ARG('--repo');
const ROOT = repoArg ? join(SELF, repoArg) : process.cwd();
const REPO = repoArg ?? basename(ROOT);

const ARCHIVE_ROOTS = ['archive', 'audit/archive'];
const OUT = join(ROOT, 'audit', 'evidence', 'repo-cleanup-archive-manifest-latest.json');

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function sha256(path) {
  try {
    const buf = readFileSync(path);
    return createHash('sha256').update(buf).digest('hex');
  } catch {
    return null;
  }
}

function walkArchive(rel, out, issues) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return;

  for (const name of readdirSync(abs, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${name.name}` : name.name;
    const childAbs = join(ROOT, childRel);
    let st = null;
    try {
      st = lstatSync(childAbs);
    } catch {
      issues.push({ code: 'archive:stat-failed', path: childRel });
      continue;
    }

    if (st.isSymbolicLink()) {
      issues.push({ code: 'archive:symlink', path: childRel });
      continue;
    }

    if (st.isDirectory()) {
      walkArchive(childRel, out, issues);
      continue;
    }

    if (!st.isFile()) continue;
    const digest = sha256(childAbs);
    if (!digest) {
      issues.push({ code: 'archive:checksum-failed', path: childRel });
      continue;
    }

    out.push({
      path: childRel,
      bytes: st.size,
      mode: st.mode.toString(8),
      sha256: digest,
      mtimeMs: st.mtimeMs,
      archivePath: childRel,
    });
  }
}

function buildWitness() {
  const entries = [];
  const issues = [];

  for (const archiveRoot of ARCHIVE_ROOTS) {
    const archivePath = join(ROOT, archiveRoot);
    if (!existsSync(archivePath)) {
      issues.push({ code: 'archive:missing', path: archiveRoot });
      continue;
    }
    try {
      if (!statSync(archivePath).isDirectory()) {
        issues.push({ code: 'archive:not-dir', path: archiveRoot });
      } else {
        walkArchive(archiveRoot, entries, issues);
      }
    } catch {
      issues.push({ code: 'archive:read-failed', path: archiveRoot });
    }
  }

  const countsByExt = Object.create(null);
  let maxMtime = 0;
  for (const row of entries) {
    const ext = row.path.includes('.') ? row.path.split('.').pop().toLowerCase() : '';
    countsByExt[ext] = (countsByExt[ext] ?? 0) + 1;
    if (row.mtimeMs > maxMtime) maxMtime = row.mtimeMs;
  }

  const repoName = readJson('package.json')?.name ?? 'fabric-os';
  return {
    schema: 'gtcx://fabric-os/repo-cleanup-archive-manifest/v1',
    repo: repoName,
    repoRoot: repoArg ? repoArg : basename(ROOT),
    generatedAt: new Date().toISOString(),
    archiveRoots: ARCHIVE_ROOTS,
    ok: issues.length === 0,
    archiveExists: ARCHIVE_ROOTS.every((root) => existsSync(join(ROOT, root))),
    counts: {
      entries: entries.length,
      roots: ARCHIVE_ROOTS.length,
      extensions: countsByExt,
      newestMtimeMs: maxMtime || null,
    },
    blockers: issues,
    manifest: entries,
  };
}

function main() {
  const witness = buildWitness();
  if (WRITE) {
    mkdirSync(join(ROOT, 'audit', 'evidence'), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`archive manifest entries: ${witness.counts.entries}`);
    console.log(`archive exists: ${witness.archiveExists}`);
    if (!witness.ok) {
      console.log(`issues: ${witness.blockers.map((b) => `${b.code}:${b.path}`).join(', ')}`);
    }
    if (WRITE) {
      console.log(`witness: ${OUT}`);
    }
  }

  process.exit(witness.ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
