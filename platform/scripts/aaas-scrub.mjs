#!/usr/bin/env node
/**
 * AAAS — legacy audit/report scrub (front 1: files).
 * Archives non-canonical witnesses/reports per the aaas-legacy-scrub-map into
 * audit/archive/legacy-scrub-<date>/ (recoverable). DRY-RUN by default.
 *
 * Usage: node aaas-scrub.mjs [--write] [--repo <name>] [--json]
 *   (no --write = dry-run: report what WOULD be archived)
 */
import { existsSync, readFileSync, readdirSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const MAP = join(ROOT, 'machine/spec/aaas-legacy-scrub-map.json');
const BINDINGS = join(ROOT, 'machine/fleet-audit-contracts.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const repoArg = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;

const readJson = (p) => {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  } catch {
    return null;
  }
};

function archiveTypes(map) {
  const set = new Set();
  for (const group of Object.values(map.archive ?? {})) {
    for (const t of group.types ?? []) set.add(t);
  }
  return set;
}

function typeOf(file) {
  return file.replace(/-\d{4}-\d{2}-\d{2}.*$/, '').replace(/-latest\.json$/, '').replace(/\.(json|md)$/, '');
}

function scrubRepo(repoRoot, archiveSet, destRel) {
  const hits = [];
  for (const sub of ['audit/evidence', 'audit', 'audit/reports']) {
    const dir = join(repoRoot, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (!f.isFile()) continue;
      if (!/\.(json|md)$/.test(f.name)) continue;
      const t = typeOf(f.name);
      if (archiveSet.has(t)) hits.push(join(sub, f.name));
    }
  }
  if (WRITE && hits.length) {
    const destAbs = join(repoRoot, destRel);
    mkdirSync(destAbs, { recursive: true });
    for (const rel of hits) {
      try {
        renameSync(join(repoRoot, rel), join(destAbs, rel.replace(/\//g, '__')));
      } catch {
        /* skip */
      }
    }
  }
  return hits;
}

function main() {
  const map = readJson(MAP);
  const bindings = readJson(BINDINGS);
  if (!map || !bindings) {
    console.error('missing scrub map or bindings');
    process.exit(1);
  }
  const archiveSet = archiveTypes(map);
  const destRel = map.scrubDestination ?? 'audit/archive/legacy-scrub/';
  const repos = (bindings.repos ?? []).map((b) => b.repo).filter((r) => !repoArg || r === repoArg);

  const results = repos.map((r) => {
    const repoRoot = join(FLEET, r);
    if (!existsSync(repoRoot)) return { repo: r, absent: true, count: 0 };
    const hits = scrubRepo(repoRoot, archiveSet, destRel);
    return { repo: r, count: hits.length, files: hits };
  });

  const total = results.reduce((n, r) => n + r.count, 0);
  if (JSON_OUT) {
    console.log(JSON.stringify({ mode: WRITE ? 'write' : 'dry-run', archiveTypes: [...archiveSet], total, results }, null, 2));
  } else {
    console.log(`${WRITE ? 'SCRUB' : 'DRY-RUN'} — ${archiveSet.size} archive types · ${total} files ${WRITE ? 'archived' : 'would archive'} across ${results.length} repos`);
    for (const r of results) {
      if (r.count) console.log(`  ${(r.repo + '').padEnd(15)} ${r.count}`);
    }
    if (!WRITE) console.log(`\n(dry-run — re-run with --write to archive into ${destRel}, recoverable)`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
