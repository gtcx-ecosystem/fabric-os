#!/usr/bin/env node
/**
 * Recover tracked deletion history into archive/_delete.
 *
 * Writes two recovery lanes:
 * - archive/_delete/by-commit/<commit>/<original-path> for forensic provenance.
 * - archive/_delete/<original-path> for mirrored compliance coverage.
 *
 * If a deleted path is also a prefix of other deleted paths, the mirrored lane
 * stores the original entry at archive/_delete/<original-path>/.__deleted-entry
 * so descendants can coexist without symlinks or path collisions.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FABRIC_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECOSYSTEM_ROOT = join(FABRIC_ROOT, '..');
const ROOT = resolveTargetRoot();
const REPO = repoName(ROOT);
const SINCE = arg('--since') ?? '2026-06-02T00:00:00';
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const ARCHIVE_ROOT = join(ROOT, 'archive/_delete');
const BY_COMMIT = join(ARCHIVE_ROOT, 'by-commit');
const MANIFEST = join(ARCHIVE_ROOT, 'exact-manifest.json');

function arg(name) {
  return process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
}

function resolveTargetRoot() {
  const explicit = arg('--repo-root');
  if (explicit) return explicit;
  const repo = arg('--repo');
  if (repo) return repo.includes('/') ? repo : join(ECOSYSTEM_ROOT, repo);
  return FABRIC_ROOT;
}

function repoName(root) {
  try {
    return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name ?? root.split('/').pop();
  } catch {
    return root.split('/').pop();
  }
}

function git(args, options = {}) {
  return execFileSync('git', ['-C', ROOT, '-c', 'diff.renameLimit=999999', ...args], {
    encoding: options.encoding,
    maxBuffer: 150 * 1024 * 1024,
  });
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function safeRel(rel) {
  if (!rel || rel.startsWith('/') || rel.includes('\0') || rel.split('/').includes('..')) {
    throw new Error(`unsafe relative path: ${rel}`);
  }
  return rel;
}

function parseLog(raw) {
  const commits = [];
  let current = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('@@')) {
      const [hash, shortHash, date, ...subjectParts] = line.slice(2).split('\t');
      current = { hash, shortHash, date, subject: subjectParts.join('\t'), deletes: [] };
      commits.push(current);
      continue;
    }
    if (current && line.startsWith('D\t')) current.deletes.push(safeRel(line.slice(2)));
  }
  return commits.filter((commit) => commit.deletes.length > 0);
}

function deletedPathHasDescendant(path, deletedPaths) {
  const prefix = `${path}/`;
  return deletedPaths.some((candidate) => candidate.startsWith(prefix));
}

function objectType(revPath) {
  return git(['cat-file', '-t', revPath], { encoding: 'utf8' }).trim();
}

function objectMode(rev, path) {
  const out = git(['ls-tree', rev, path], { encoding: 'utf8' }).trim();
  return out.split(/\s+/)[0] || null;
}

function objectBuffer(type, revPath) {
  return git(['cat-file', type, revPath]);
}

function ensureWritableFile(path) {
  if (existsSync(path)) {
    const st = statSync(path);
    if (st.isDirectory()) return false;
    rmSync(path);
  }
  mkdirSync(dirname(path), { recursive: true });
  return true;
}

function writeBuffer(path, buffer) {
  if (!WRITE) return true;
  if (!ensureWritableFile(path)) return false;
  writeFileSync(path, buffer);
  return true;
}

function exportTree(parentRev, originalPath, destRoot, rows) {
  const raw = git(['ls-tree', '-r', '-z', `${parentRev}:${originalPath}`]);
  const entries = raw.toString('utf8').split('\0').filter(Boolean);
  let count = 0;
  for (const entry of entries) {
    const match = entry.match(/^(\d+)\s+(\w+)\s+([0-9a-f]{40})\t(.+)$/);
    if (!match) continue;
    const [, mode, type, sha, child] = match;
    const buffer = objectBuffer(type, sha);
    const rel = safeRel(join(originalPath, child));
    const dest = join(destRoot, rel);
    writeBuffer(dest, buffer);
    rows.push({ rel, mode, type, sha, bytes: buffer.length, sha256: sha256(buffer), archivePath: dest.slice(ROOT.length + 1) });
    count += 1;
  }
  return count;
}

function recoverEntry(commit, path, deletedPaths) {
  const parentRev = `${commit.hash}^`;
  const revPath = `${parentRev}:${path}`;
  const type = objectType(revPath);
  const mode = objectMode(parentRev, path);
  const hasDescendant = deletedPathHasDescendant(path, deletedPaths);
  const rows = [];
  let exactArchivePath = null;
  let byCommitArchivePath = null;
  let bytes = 0;
  let digest = null;

  if (type === 'tree') {
    const exactCount = exportTree(parentRev, path, ARCHIVE_ROOT, rows);
    const byCommitCount = exportTree(parentRev, path, join(BY_COMMIT, commit.shortHash), rows);
    exactArchivePath = `archive/_delete/${path}/`;
    byCommitArchivePath = `archive/_delete/by-commit/${commit.shortHash}/${path}/`;
    return { type, mode, exactCount, byCommitCount, exactArchivePath, byCommitArchivePath, rows };
  }

  const buffer = objectBuffer(type, revPath);
  bytes = buffer.length;
  digest = sha256(buffer);
  const exactPath = hasDescendant ? join(ARCHIVE_ROOT, path, '.__deleted-entry') : join(ARCHIVE_ROOT, path);
  const byCommitPath = join(BY_COMMIT, commit.shortHash, path);
  writeBuffer(exactPath, buffer);
  writeBuffer(byCommitPath, buffer);
  exactArchivePath = exactPath.slice(ROOT.length + 1);
  byCommitArchivePath = byCommitPath.slice(ROOT.length + 1);
  return { type, mode, bytes, sha256: digest, exactArchivePath, byCommitArchivePath, collisionMarker: hasDescendant };
}

function verifyCoverage(events) {
  let covered = 0;
  const missing = [];
  for (const event of events) {
    const exact = event.exactArchivePath ? join(ROOT, event.exactArchivePath) : null;
    const byCommit = event.byCommitArchivePath ? join(ROOT, event.byCommitArchivePath) : null;
    const exactOk = exact && existsSync(exact);
    const byCommitOk = byCommit && existsSync(byCommit);
    if (exactOk && byCommitOk) covered += 1;
    else missing.push({ commit: event.commit, path: event.path, exactOk, byCommitOk });
  }
  return { covered, missing };
}

const log = git([
  'log',
  '--since',
  SINCE,
  '--date=short',
  '--find-renames',
  '--pretty=format:@@%H%x09%h%x09%ad%x09%s',
  '--name-status',
], { encoding: 'utf8' });
const commits = parseLog(log);
const deletedPaths = [...new Set(commits.flatMap((commit) => commit.deletes))];
const events = [];

for (const commit of commits) {
  for (const path of commit.deletes) {
    const recovered = recoverEntry(commit, path, deletedPaths);
    events.push({
      commit: commit.shortHash,
      commitHash: commit.hash,
      date: commit.date,
      subject: commit.subject,
      path,
      ...recovered,
    });
  }
}

const coverage = verifyCoverage(events);
const witness = {
  schema: 'gtcx://fabric-os/archive-delete-exact-recovery/v1',
  generatedAt: new Date().toISOString(),
  repo: REPO,
  since: SINCE,
  write: WRITE,
  deletionEvents: events.length,
  uniqueDeletedPaths: deletedPaths.length,
  coveredEvents: coverage.covered,
  missingEvents: coverage.missing.length,
  exactRoot: 'archive/_delete/<original-path>',
  provenanceRoot: 'archive/_delete/by-commit/<commit>/<original-path>',
  collisionMarkers: events.filter((event) => event.collisionMarker).length,
  missing: coverage.missing,
  events,
};

if (WRITE) {
  mkdirSync(ARCHIVE_ROOT, { recursive: true });
  writeFileSync(MANIFEST, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  console.log(`deletion events: ${witness.deletionEvents}`);
  console.log(`unique deleted paths: ${witness.uniqueDeletedPaths}`);
  console.log(`covered: ${witness.coveredEvents}/${witness.deletionEvents}`);
  console.log(`missing: ${witness.missingEvents}`);
  console.log(`collision markers: ${witness.collisionMarkers}`);
  if (WRITE) console.log('manifest: archive/_delete/exact-manifest.json');
}

process.exit(witness.missingEvents === 0 ? 0 : 1);
