#!/usr/bin/env node
/**
 * Preserve Git safety-net material: stashes and unreachable objects.
 *
 * This is read-only with respect to Git refs. It writes archive files only:
 * - archive/_delete/safety-net/unreachable-objects-<type>.jsonl
 * - archive/_delete/safety-net/stashes.jsonl
 * - archive/_delete/safety-net/manifest.json
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const OUT_ROOT = join(ROOT, 'archive/_delete/safety-net');
const MANIFEST = join(OUT_ROOT, 'manifest.json');
const TYPES = ['commit', 'tree', 'blob', 'tag'];

function git(args, options = {}) {
  return execFileSync('git', ['-C', ROOT, ...args], {
    encoding: options.encoding,
    maxBuffer: 250 * 1024 * 1024,
  });
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function parseUnreachable(raw) {
  const objects = [];
  for (const line of raw.split('\n')) {
    const match = line.match(/unreachable\s+(\w+)\s+([0-9a-f]{7,40})/);
    if (!match) continue;
    objects.push({ type: match[1], sha: match[2] });
  }
  return objects;
}

function readObject(row) {
  const type = git(['cat-file', '-t', row.sha], { encoding: 'utf8' }).trim();
  const size = Number(git(['cat-file', '-s', row.sha], { encoding: 'utf8' }).trim());
  const payload = git(['cat-file', type, row.sha]);
  return {
    sha: row.sha,
    type,
    size,
    sha256: sha256(payload),
    payloadBase64: payload.toString('base64'),
  };
}

function stashRows() {
  const raw = git(['stash', 'list'], { encoding: 'utf8' });
  const rows = [];
  for (const line of raw.split('\n').filter(Boolean)) {
    const ref = line.match(/^(stash@\{\d+\})/)?.[1];
    if (!ref) continue;
    const commit = git(['rev-parse', ref], { encoding: 'utf8' }).trim();
    const show = git(['show', '--stat', '--oneline', '--decorate', ref], { encoding: 'utf8' });
    const patch = git(['stash', 'show', '-p', '--binary', ref]);
    rows.push({
      ref,
      commit,
      description: line,
      show,
      patchSha256: sha256(patch),
      patchBytes: patch.length,
      patchBase64: patch.toString('base64'),
    });
  }
  return rows;
}

const unreachableRaw = git(['fsck', '--unreachable', '--no-reflogs', '--full'], { encoding: 'utf8' });
const unreachable = parseUnreachable(unreachableRaw);
const objectsByType = Object.fromEntries(TYPES.map((type) => [type, []]));
const errors = [];

for (const row of unreachable) {
  try {
    const object = readObject(row);
    if (!objectsByType[object.type]) objectsByType[object.type] = [];
    objectsByType[object.type].push(object);
  } catch (error) {
    errors.push({ sha: row.sha, type: row.type, error: error.message });
  }
}

const stashes = stashRows();
const objectCounts = Object.fromEntries(Object.entries(objectsByType).map(([type, rows]) => [type, rows.length]));
const objectBytes = Object.fromEntries(
  Object.entries(objectsByType).map(([type, rows]) => [type, rows.reduce((sum, row) => sum + row.size, 0)]),
);
const manifest = {
  schema: 'gtcx://fabric-os/git-safety-net-pack/v1',
  generatedAt: new Date().toISOString(),
  repo: 'fabric-os',
  write: WRITE,
  stashCount: stashes.length,
  unreachableObjectCount: Object.values(objectCounts).reduce((sum, count) => sum + count, 0),
  objectCounts,
  objectBytes,
  errors,
  files: [
    'archive/_delete/safety-net/manifest.json',
    'archive/_delete/safety-net/stashes.jsonl',
    ...Object.keys(objectsByType).map((type) => `archive/_delete/safety-net/unreachable-objects-${type}.jsonl`),
  ],
};

if (WRITE) {
  mkdirSync(OUT_ROOT, { recursive: true });
  writeFileSync(join(OUT_ROOT, 'stashes.jsonl'), stashes.map((row) => JSON.stringify(row)).join('\n') + (stashes.length ? '\n' : ''));
  for (const [type, rows] of Object.entries(objectsByType)) {
    writeFileSync(join(OUT_ROOT, `unreachable-objects-${type}.jsonl`), rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''));
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(manifest, null, 2));
else {
  console.log(`stashes: ${manifest.stashCount}`);
  console.log(`unreachable objects: ${manifest.unreachableObjectCount}`);
  console.log(`counts: ${JSON.stringify(manifest.objectCounts)}`);
  console.log(`errors: ${manifest.errors.length}`);
  if (WRITE) console.log('manifest: archive/_delete/safety-net/manifest.json');
}

process.exit(manifest.errors.length === 0 ? 0 : 1);
