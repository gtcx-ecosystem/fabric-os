#!/usr/bin/env node
/**
 * AAAS — provision the per-repo audit contract (folders + pin).
 * For every repo in fleet-audit-contracts.json, ensure the contract's
 * requiredFolders exist (with .gitkeep) and write the contract pin that binds
 * the repo to the fabric-os SoR. Idempotent. DRY-RUN by default.
 *
 * Usage: node aaas-provision.mjs [--write] [--repo <name>] [--json]
 */
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(ROOT, '..');
const CONTRACT = join(ROOT, 'machine/spec/aaas-audit-contract.json');
const BINDINGS = join(ROOT, 'machine/fleet-audit-contracts.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const repoArg = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

const PIN_REL = 'machine/spec/aaas-audit-contract.pin.json';

function pinBody(repo, profile, contract) {
  return {
    $schema: 'gtcx://fabric-os/aaas-audit-contract-pin/v1',
    sor: 'fabric-os/machine/spec/aaas-audit-contract.json',
    contractVersion: contract.version,
    repo,
    auditProfile: profile,
    writes: false,
    note: 'Thin pin — fabric-os owns the AaaS contract SoR. Do not edit obligations here; they resolve from the SoR.',
  };
}

function provisionRepo(repo, profile, contract) {
  const repoRoot = join(FLEET, repo);
  if (!existsSync(repoRoot)) return { repo, absent: true, created: [], pin: false };
  const created = [];
  for (const f of contract.obligations.repo.requiredFolders) {
    const abs = join(repoRoot, f);
    if (!existsSync(abs)) {
      created.push(f);
      if (WRITE) {
        mkdirSync(abs, { recursive: true });
        writeFileSync(join(abs, '.gitkeep'), '');
      }
    }
  }
  const pinAbs = join(repoRoot, PIN_REL);
  const pinExists = existsSync(pinAbs);
  let pinNeedsWrite = !pinExists;
  if (pinExists) {
    const cur = readJson(pinAbs);
    pinNeedsWrite = !cur || cur.contractVersion !== contract.version || cur.auditProfile !== profile;
  }
  if (WRITE && pinNeedsWrite) {
    mkdirSync(dirname(pinAbs), { recursive: true });
    writeFileSync(pinAbs, JSON.stringify(pinBody(repo, profile, contract), null, 2) + '\n');
  }
  return { repo, created, pin: pinNeedsWrite ? (WRITE ? 'written' : 'needed') : 'current' };
}

function main() {
  const contract = readJson(CONTRACT);
  const bindings = readJson(BINDINGS);
  if (!contract || !bindings) {
    console.error('missing contract or bindings');
    process.exit(1);
  }
  const repos = (bindings.repos ?? []).filter((b) => !repoArg || b.repo === repoArg);
  const results = repos.map((b) => provisionRepo(b.repo, b.auditProfile, contract));

  const folders = results.reduce((n, r) => n + (r.created?.length ?? 0), 0);
  const pins = results.filter((r) => r.pin === 'needed' || r.pin === 'written').length;
  if (JSON_OUT) {
    console.log(JSON.stringify({ mode: WRITE ? 'write' : 'dry-run', folders, pins, results }, null, 2));
  } else {
    console.log(`${WRITE ? 'PROVISION' : 'DRY-RUN'} — ${folders} folders ${WRITE ? 'created' : 'missing'} · ${pins} pins ${WRITE ? 'written' : 'needed'} across ${results.length} repos`);
    for (const r of results) {
      if (r.absent) { console.log(`  ${r.repo.padEnd(15)} ABSENT`); continue; }
      const bits = [];
      if (r.created.length) bits.push(`+${r.created.length} folders`);
      if (r.pin !== 'current') bits.push(`pin:${r.pin}`);
      if (bits.length) console.log(`  ${r.repo.padEnd(15)} ${bits.join(' · ')}`);
    }
    if (!WRITE) console.log('\n(dry-run — re-run with --write to provision)');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
