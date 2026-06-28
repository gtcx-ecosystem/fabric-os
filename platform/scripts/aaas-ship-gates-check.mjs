#!/usr/bin/env node
/**
 * AAAS — feature ship-gates fleet monitor (layer-1 of the three-layer model).
 *
 * The per-repo feature ship-gates witness (machine/ci/feature-ship-gates-latest.json)
 * is OWNED + produced by each product repo (evaluator: pm:feature-matrix:sync, ref
 * impl gtcx-os). This is the fabric-os fleet MONITOR: it reports per-repo witness
 * presence + freshness and emits a fleet coverage witness — it does NOT evaluate
 * features itself (that needs each repo's feature matrix). Surfaces adoption gaps
 * honestly without fabricating ship-gate verdicts.
 *
 * Usage: node aaas-ship-gates-check.mjs [--strict] [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const BINDINGS = join(ROOT, 'machine/fleet-audit-contracts.json');
const WITNESS_REL = 'machine/ci/feature-ship-gates-latest.json';
const STRICT = process.argv.includes('--strict');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const MAX_AGE_DAYS = 30;

const readJson = (p) => {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  } catch {
    return null;
  }
};

function repoState(repo) {
  const w = join(FLEET, repo, WITNESS_REL);
  if (!existsSync(w)) return { repo, present: false, fresh: false };
  let ageDays = null;
  const w2 = readJson(w);
  const dateStr = w2?.checkedAt ?? w2?.updated ?? w2?.generatedAt;
  if (dateStr) {
    const ms = Date.parse(dateStr);
    if (!Number.isNaN(ms)) ageDays = Math.round((Date.now() - ms) / 86_400_000);
  }
  if (ageDays == null) {
    try { ageDays = Math.round((Date.now() - statSync(w).mtimeMs) / 86_400_000); } catch { /* */ }
  }
  return { repo, present: true, fresh: ageDays != null && ageDays <= MAX_AGE_DAYS, ageDays };
}

function main() {
  const bindings = readJson(BINDINGS);
  if (!bindings) { console.error('missing bindings'); process.exit(2); }
  const repos = (bindings.repos ?? []).map((b) => b.repo).filter((r) => existsSync(join(FLEET, r)));
  const results = repos.map(repoState);
  const present = results.filter((r) => r.present).length;
  const fresh = results.filter((r) => r.fresh).length;
  const missing = results.filter((r) => !r.present).map((r) => r.repo);

  const witness = {
    schema: 'gtcx://fabric-os/aaas-ship-gates-monitor/v1',
    provider: 'fabric-os',
    layer: 'feature (layer-1 of three-layer ship-gates model)',
    note: 'Fleet coverage monitor only. Per-repo witness is product-repo-owned (pm:feature-matrix:sync). No verdicts fabricated.',
    checkedAt: new Date().toISOString(),
    total: results.length,
    present,
    fresh,
    coveragePct: results.length ? Math.round((present / results.length) * 100) : 0,
    missing,
  };

  if (WRITE) {
    mkdirSync(join(ROOT, 'audit/evidence'), { recursive: true });
    writeFileSync(join(ROOT, 'audit/evidence/aaas-ship-gates-monitor-latest.json'), JSON.stringify(witness, null, 2) + '\n');
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`AAAS ship-gates (feature layer) — ${present}/${results.length} repos have a witness, ${fresh} fresh (<=${MAX_AGE_DAYS}d)`);
    for (const r of results) {
      if (!r.present) console.log(`  MISSING  ${r.repo}`);
      else if (!r.fresh) console.log(`  STALE    ${r.repo} (${r.ageDays}d)`);
    }
    console.log('\n(per-repo witness is product-repo-owned: pm:feature-matrix:sync — this monitor only reports coverage)');
    if (WRITE) console.log('witness: audit/evidence/aaas-ship-gates-monitor-latest.json');
  }
  // strict fails only on missing (coverage), never fabricates feature verdicts
  process.exit(STRICT && missing.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
