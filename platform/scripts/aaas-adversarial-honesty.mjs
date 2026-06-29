#!/usr/bin/env node
/**
 * AAAS — adversarial honesty gate (L5 Safeguards, §4c.3).
 *
 * Red-teams the verdicts in a repo's MPR witness: tries to refute each pillar
 * score as inflated / fabricated / unprovenanced / self-contradicting, attaches a
 * content-addressed provenance digest, and QUARANTINES any verdict that cannot
 * survive. A quarantined verdict means the published audit cannot be trusted as-is.
 *
 * Usage: node aaas-adversarial-honesty.mjs [--repo <name>] [--write] [--json] [--strict]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractVerdicts, evaluateAdversarial } from './lib/aaas-adversarial-honesty.mjs';

const SELF = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');
const repoArg = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;
const ROOT = repoArg ? join(SELF, '..', repoArg) : SELF;

function main() {
  const mprPath = join(ROOT, 'audit/evidence/mpr-repo-latest.json');
  if (!existsSync(mprPath)) {
    console.error(`no mpr-repo-latest.json for ${repoArg ?? 'fabric-os'} — run aaas:audit first`);
    process.exit(STRICT ? 1 : 0);
  }
  let mpr = null;
  try { mpr = JSON.parse(readFileSync(mprPath, 'utf8')); } catch { mpr = null; }
  const verdicts = extractVerdicts(mpr);
  const witness = evaluateAdversarial({ verdicts });
  witness.repo = repoArg ?? 'fabric-os';
  witness.checkedAt = new Date().toISOString();

  if (WRITE) {
    const OUT = join(ROOT, 'audit/evidence/aaas-adversarial-honesty-latest.json');
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`adversarial honesty · ${witness.repo} · ${witness.verifiedCount} verified · ${witness.unassessableCount} unassessable (aggregate-only) · ${witness.quarantinedCount} quarantined · of ${witness.total}`);
    for (const q of witness.quarantined) {
      console.log(`  QUARANTINE ${q.id} (${q.score}) — ${q.refutedBy.map((r) => r.challenge).join(', ')}`);
      for (const r of q.refutedBy) console.log(`     · ${r.detail}`);
    }
    for (const u of witness.upheld) console.log(`  VERIFIED ${u.id} (${u.score}) ${u.provenance}`);
    for (const u of witness.unassessable) console.log(`  UNASSESSABLE ${u.id} (${u.score}) — aggregate-only, no leaf evidence to challenge`);
    console.log(`\n${witness.ok ? 'PASS' : 'FAIL'} — adversarial honesty (PASS = nothing refuted; see unassessable for coverage)${WRITE ? ' · witness written' : ''}`);
  }

  process.exit(STRICT && !witness.ok ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
