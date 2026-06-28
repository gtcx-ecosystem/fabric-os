#!/usr/bin/env node
/**
 * AAAS — enforced ownership check (L5 Team & Ownership, §4c.4).
 *
 * Verifies the contract codifies an owner + SLA + escalation for every required
 * artifact folder, that each synthesized handoff item names an owner, and that no
 * artifact is past its SLA (breaches escalate). Unowned type / unowned handoff item
 * = a hard contract violation.
 *
 * Usage: node aaas-ownership-check.mjs [--repo <name>] [--write] [--json] [--strict]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPillars, synthesizeHandoff } from './lib/aaas-handoff.mjs';
import { evaluateOwnership } from './lib/aaas-ownership.mjs';

const SELF = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACT = join(SELF, 'machine/spec/aaas-audit-contract.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');
const repoArg = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;
const ROOT = repoArg ? join(SELF, '..', repoArg) : SELF;

const readJson = (p) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; } catch { return null; } };

/** Age (days) of the most recently modified file in a folder, or null if empty/absent. */
function folderAgeDays(absDir) {
  if (!existsSync(absDir)) return null;
  let newest = 0;
  for (const name of readdirSync(absDir)) {
    if (name === '.gitkeep') continue;
    try { newest = Math.max(newest, statSync(join(absDir, name)).mtimeMs); } catch { /* */ }
  }
  return newest === 0 ? null : Math.round((Date.now() - newest) / 86_400_000);
}

function main() {
  const contract = readJson(CONTRACT);
  if (!contract) { console.error('missing contract'); process.exit(1); }

  const required = contract.obligations?.repo?.requiredFolders ?? [];
  const artifacts = required
    .map((t) => ({ type: t, ageDays: folderAgeDays(join(ROOT, t)) }))
    .filter((a) => a.ageDays != null);

  // Synthesize the current handoff so its items can be checked for an owner.
  const pillars = extractPillars(readJson(join(ROOT, 'audit/evidence/mpr-repo-latest.json')));
  const { actions } = synthesizeHandoff({ repo: repoArg ?? 'fabric-os', pillars, signal: null });

  const witness = evaluateOwnership({ contract, artifacts, handoffItems: actions });
  witness.repo = repoArg ?? 'fabric-os';
  witness.checkedAt = new Date().toISOString();

  if (WRITE) {
    const OUT = join(ROOT, 'audit/evidence/aaas-ownership-latest.json');
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`ownership · ${witness.repo} · ${witness.ownedTypes}/${witness.requiredTypes} artifact types owned · ${witness.handoffItemsChecked} handoff items (${witness.handoffItemsUnowned} unowned)`);
    for (const v of witness.violations) console.log(`  VIOLATION ${v.kind}: ${v.type ?? v.action}`);
    for (const e of witness.escalations) console.log(`  ESCALATE ${e.type} — ${e.ageDays}d > SLA ${e.slaDays}d → ${e.escalation}`);
    console.log(`\n${witness.ok ? 'PASS' : 'FAIL'} — enforced ownership${witness.escalations.length ? ` (${witness.escalations.length} SLA escalation)` : ''}`);
  }

  process.exit((STRICT && (!witness.ok || witness.escalations.length)) || !witness.ok ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
