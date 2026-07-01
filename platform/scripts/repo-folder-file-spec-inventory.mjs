#!/usr/bin/env node
/**
 * docs:folder-spec-inventory check — generate a recoverable inventory for critical
 * repository files and folders used in root/cleanup evidence.
 */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = dirname(fileURLToPath(import.meta.url));
const FABRIC_ROOT = join(SELF, '../..');
const FLEET_ROOT = join(FABRIC_ROOT, '..');
const WRITE = process.argv.includes('--write');
const DRY = process.argv.includes('--dry');
const arg = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const repoArg = arg('--repo');
const ROOT = repoArg ? join(FLEET_ROOT, repoArg) : FABRIC_ROOT;
const OUT = join(ROOT, 'audit/evidence/repo-folder-file-spec-inventory-latest.json');

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function sha256(path) {
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

function safeStat(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function walkSpecs(base, dir, out) {
  const abs = join(base, dir);
  if (!existsSync(abs)) return;
  let entries = [];
  try {
    entries = readdirSync(abs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    const full = join(base, rel);
    const st = safeStat(full);
    if (!st) continue;
    if (st.isDirectory()) {
      walkSpecs(base, rel, out);
      continue;
    }
    if (!st.isFile()) continue;
    out.push({
      path: rel,
      kind: 'file',
      bytes: st.size,
      mode: st.mode.toString(8),
      sha256: sha256(full),
      mtimeMs: st.mtimeMs,
    });
  }
}

function walkTopLevel(base, names = [], details = []) {
  for (const name of names) {
    const rel = name;
    const full = join(base, rel);
    if (!existsSync(full)) continue;
    const st = safeStat(full);
    if (!st) continue;
    if (st.isDirectory()) {
      const children = [];
      walkSpecs(base, rel, children);
      details.push({
        path: rel,
        kind: 'directory',
        childCount: children.length,
        entries: children,
      });
      continue;
    }
    if (st.isFile()) {
      details.push({
        path: rel,
        kind: 'file',
        bytes: st.size,
        mode: st.mode.toString(8),
        sha256: sha256(full),
        mtimeMs: st.mtimeMs,
      });
    }
  }
}

const allowlist = readJson('docs/operations/repo/root-allowlist.json') ?? {};
const requiredFiles = allowlist.required_files ?? ['AGENTS.md', 'README.md', 'CHANGELOG.md'];
const requiredDirectories = allowlist.required_directories ?? ['docs', 'operations', 'machine', 'platform', 'deploy', 'audit', 'workstream'];
const allowedDirectories = allowlist.allowed_directories ?? [];
const allowedFiles = allowlist.allowed_files ?? [];
const allowedDotDirectories = allowlist.allowed_dot_directories ?? [];
const approvedDirectories = Object.keys(allowlist.permissible_on_approval ?? {});
const ignoredExact = new Set(allowlist.ignored_exact ?? []);
const ignoredPrefixes = allowlist.ignored_prefixes ?? ['.', 'node_modules'];
const roots = [...requiredDirectories, ...allowedDirectories, ...requiredFiles, ...allowedFiles, ...allowedDotDirectories, ...approvedDirectories, '.github'];

const topRoots = Array.from(new Set(roots)).sort();

const missingRequired = [...requiredFiles, ...requiredDirectories].filter((name) => !existsSync(join(ROOT, name)));
const issues = [];
if (missingRequired.length > 0) {
  for (const name of missingRequired) {
    issues.push({ severity: 'required-missing', code: `${name} missing`, path: name });
  }
}

const entries = [];
walkTopLevel(ROOT, topRoots, entries);

const allTopLevel = readdirSync(ROOT, { withFileTypes: true }).map((entry) => entry.name).sort();
const explicitAllowed = new Set(topRoots.concat(['.git']));
const ignored = (name) => ignoredExact.has(name) || ignoredPrefixes.some((prefix) => name.startsWith(prefix));
const forbiddenTopLevel = allTopLevel
  .filter((entry) => !ignored(entry))
  .filter((entry) => !explicitAllowed.has(entry));
const rootSymlinks = allTopLevel.filter((name) => {
  try {
    return lstatSync(join(ROOT, name)).isSymbolicLink();
  } catch {
    return false;
  }
});
for (const name of forbiddenTopLevel) {
  issues.push({ severity: 'root-scope', code: 'forbidden root entry', path: name });
}
for (const name of rootSymlinks) {
  issues.push({ severity: 'root-link', code: 'symlink at repo root', path: name });
}

const payload = {
  schema: 'gtcx://fabric-os/repo-folder-file-spec-inventory/v1',
  generatedAt: new Date().toISOString(),
  repo: repoArg ?? basename(ROOT),
  ok: issues.length === 0,
  required: {
    files: requiredFiles,
    directories: requiredDirectories,
  },
  forbiddenTopLevel,
  rootSymlinks,
  topLevel: allTopLevel,
  inventory: entries,
  rootAllowlistUsed: 'docs/operations/repo/root-allowlist.json',
  issues,
};

if (WRITE || DRY) {
  mkdirSync(join(ROOT, 'audit/evidence'), { recursive: true });
  if (WRITE || !DRY) {
    writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
  }
  if (DRY) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`witness: ${OUT}`);
  }
  process.exit(payload.ok ? 0 : 1);
}

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.ok ? 0 : 1);
