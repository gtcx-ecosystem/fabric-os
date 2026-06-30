#!/usr/bin/env node
/**
 * AAAS — audit contract check.
 * Enforces the fabric-os↔repo audit contract: for every bound repo, verify the
 * required folders + contract pin + witness freshness, then evaluate conformance
 * (obligations vs actual state). Surfaced/advisory until per-repo enablement.
 *
 * Usage: node aaas-contract-check.mjs [--write] [--json] [--strict]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeRepoAudit, evaluateConformance } from './lib/aaas-audit-registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const CONTRACT = join(ROOT, 'machine/spec/aaas-audit-contract.json');
const BINDINGS = join(ROOT, 'machine/fleet-audit-contracts.json');
const OUT = join(ROOT, 'audit/evidence/aaas-contract-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');

const readJson = (p) => {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  } catch {
    return null;
  }
};

function loadWitnesses(repoRoot) {
  const dir = join(repoRoot, 'audit/evidence');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('-latest.json'))
    .map((f) => ({ file: f, json: readJson(join(dir, f)) }))
    .filter((w) => w.json);
}

function main() {
  const contract = readJson(CONTRACT);
  const bindings = readJson(BINDINGS);
  if (!contract || !bindings) {
    console.error('missing contract or bindings');
    process.exit(1);
  }
  const nowMs = Date.now();
  const required = contract.obligations?.repo?.requiredFolders ?? [];

  const results = (bindings.repos ?? []).map((b) => {
    const repoRoot = join(FLEET, b.repo);
    if (!existsSync(repoRoot)) return { repo: b.repo, ok: false, absent: true };
    const presentFolders = required.filter((f) => existsSync(join(repoRoot, f)));
    const hasPin = existsSync(join(repoRoot, 'machine/spec/aaas-audit-contract.pin.json'))
      || existsSync(join(repoRoot, 'pm/spec/aaas-audit-contract.pin.json'));
    const repoState = summarizeRepoAudit({
      repo: b.repo,
      witnesses: loadWitnesses(repoRoot),
      nowMs,
      cadenceDays: b.cadenceDays ?? 7,
    });
    return evaluateConformance({ binding: b, contract, presentFolders, repoState, hasPin });
  });

  const conformant = results.filter((r) => r.ok).length;
  const score100 = results.length
    ? Math.round(results.reduce((sum, r) => sum + (r.score100 ?? (r.ok ? 100 : 0)), 0) / results.length)
    : 100;
  const witness = {
    schema: 'gtcx://fabric-os/aaas-contract-check/v1',
    provider: 'fabric-os',
    checkedAt: new Date().toISOString(),
    contractSor: 'machine/spec/aaas-audit-contract.json',
    repoCount: results.length,
    conformant,
    nonConformant: results.length - conformant,
    score100,
    results,
    ok: conformant === results.length,
  };

  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`audit contract score: ${score100}/100 · ${conformant}/${results.length} repos at benchmark`);
    for (const r of results) {
      if (r.ok) continue;
      const reasons = [
        r.absent ? 'absent' : null,
        !r.hasPin ? 'no-pin' : null,
        r.missingFolders?.length ? `missing-folders:${r.missingFolders.length}` : null,
        r.missingAudits?.length ? `missing-audits:${r.missingAudits.join(',')}` : null,
        r.failedAudits?.length ? `below-contract:${r.failedAudits.join(',')}` : null,
        r.provisioningGaps?.length ? `provisioning-gap:${r.provisioningGaps.map((g) => g.type).join(',')}` : null,
        r.staleWitnesses ? `stale:${r.staleWitnesses}` : null,
      ].filter(Boolean);
      console.log(`  score=${String(r.score100 ?? 0).padStart(3)}/100 ${(r.repo + '').padEnd(15)} ${reasons.join(' · ')}`);
    }
    if (WRITE) console.log(`\nwitness: ${OUT}`);
  }
  process.exit(STRICT && !witness.ok ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
