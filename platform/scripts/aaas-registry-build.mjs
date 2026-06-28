#!/usr/bin/env node
/**
 * AAAS — fleet audit registry builder.
 * Scans every repo bound to the AaaS audit contract and records its actual audit
 * state (types present, dates, scores, freshness) into the central state SoR:
 * machine/fleet-audit-registry.json. The single pane of fleet audit state.
 *
 * Usage: node aaas-registry-build.mjs [--write] [--json]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeRepoAudit } from './lib/aaas-audit-registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const BINDINGS = join(ROOT, 'machine/fleet-audit-contracts.json');
const OUT = join(ROOT, 'machine/fleet-audit-registry.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function readJson(p) {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  } catch {
    return null;
  }
}

function loadWitnesses(repoRoot) {
  const dir = join(repoRoot, 'audit/evidence');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('-latest.json'))
    .map((f) => ({ file: f, json: readJson(join(dir, f)) }))
    .filter((w) => w.json);
}

function main() {
  const bindings = readJson(BINDINGS);
  if (!bindings) {
    console.error(`missing bindings: ${BINDINGS}`);
    process.exit(1);
  }
  const nowMs = Date.now();
  const repos = (bindings.repos ?? []).map((b) => {
    const repoRoot = join(FLEET, b.repo);
    if (!existsSync(repoRoot)) return { repo: b.repo, present: false };
    const state = summarizeRepoAudit({
      repo: b.repo,
      witnesses: loadWitnesses(repoRoot),
      nowMs,
      cadenceDays: b.cadenceDays ?? bindings.defaultCadenceDays ?? 7,
    });
    return {
      repo: b.repo,
      profile: b.auditProfile,
      present: true,
      witnessCount: state.count,
      staleCount: state.staleCount,
      types: state.types,
      witnesses: state.entries.map((e) => ({
        type: e.type,
        schema: e.schema,
        ageDays: e.ageDays,
        score: e.score,
        stale: e.stale,
      })),
    };
  });

  const witness = {
    schema: 'gtcx://fabric-os/fleet-audit-registry/v1',
    provider: 'fabric-os',
    builtAt: new Date().toISOString(),
    contractSor: 'machine/spec/aaas-audit-contract.json',
    repoCount: repos.length,
    totalWitnesses: repos.reduce((n, r) => n + (r.witnessCount ?? 0), 0),
    staleRepos: repos.filter((r) => (r.staleCount ?? 0) > 0).map((r) => r.repo),
    repos,
  };

  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`fleet audit registry — ${witness.repoCount} repos, ${witness.totalWitnesses} witnesses`);
    for (const r of repos) {
      console.log(
        `  ${(r.repo + '').padEnd(15)} ${r.present ? `${r.witnessCount} witnesses, ${r.staleCount} stale` : 'ABSENT'}`,
      );
    }
    if (WRITE) console.log(`\nwritten: ${OUT}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
