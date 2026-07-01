#!/usr/bin/env node
/**
 * AAAS — SIGNAL agentic-maturity evaluator (the second lens).
 *
 * Reference implementation of the SIGNAL lens: scores a repo across the six
 * dimensions from concrete, checkable evidence and writes
 * audit/evidence/signal-maturity-latest.json — the witness the handoff synthesizer
 * (and the rest of the framework) already consumes. Production-only, weakest-link.
 *
 * Ownership note: SIGNAL is destined for baseline-os (XR-AGENT-CAPABILITY-OWNERSHIP-001);
 * this fabric-os producer unblocks full dual-lens operation until that move lands.
 *
 * Usage: node aaas-signal-eval.mjs [--repo <name>] [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateSignal } from './lib/aaas-signal.mjs';

const SELF = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const repoArg = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;
const ROOT = repoArg ? join(SELF, '..', repoArg) : SELF;

const has = (rel) => existsSync(join(ROOT, rel));
const fabricHas = (rel) => existsSync(join(SELF, rel));
const hasAny = (...rels) => rels.some(has);
const readJson = (rel) => { try { return JSON.parse(readFileSync(join(ROOT, rel), 'utf8')); } catch { return null; } };
const readFabricJson = (rel) => { try { return JSON.parse(readFileSync(join(SELF, rel), 'utf8')); } catch { return null; } };
const specDir = () => (has('machine/spec') ? 'machine/spec' : has('pm/spec') ? 'pm/spec' : null);

function listFiles(rel) {
  const abs = join(ROOT, rel);
  try { return existsSync(abs) ? readdirSync(abs) : []; } catch { return []; }
}
function scripts() { return readJson('package.json')?.scripts ?? {}; }
function specCount() { const d = specDir(); return d ? listFiles(d).filter((f) => f.endsWith('.json')).length : 0; }
function schemaValidatedSpecs() {
  const d = specDir(); if (!d) return false;
  return listFiles(d).filter((f) => f.endsWith('.json')).some((f) => readJson(`${d}/${f}`)?.$schema);
}
function freshWitness(maxDays = 7) {
  const files = listFiles('audit/evidence').filter((f) => f.endsWith('-latest.json'));
  return files.some((f) => {
    try { return (Date.now() - statSync(join(ROOT, 'audit/evidence', f)).mtimeMs) / 86_400_000 <= maxDays; } catch { return false; }
  });
}
function witnessHasProvenance() {
  for (const f of listFiles('audit/evidence').filter((x) => x.endsWith('-latest.json'))) {
    const txt = (() => { try { return readFileSync(join(ROOT, 'audit/evidence', f), 'utf8'); } catch { return ''; } })();
    if (txt.includes('sha256:')) return true;
  }
  return false;
}
function historySnapshots() {
  const h = readJson('audit/evidence/aaas-cadence-history.json');
  return Array.isArray(h?.points) ? h.points.length : 0;
}
const sc = scripts();
const scriptVals = Object.values(sc).join(' ');
const hasScript = (re) => Object.keys(sc).some((k) => re.test(k));
const hasAaasPin = hasAny('machine/spec/aaas-audit-contract.pin.json', 'pm/spec/aaas-audit-contract.pin.json');
const fabricContract = readFabricJson('machine/spec/aaas-audit-contract.json');
const fabricAaasProvider = hasAaasPin && fabricContract?.service === 'AAAS';

const dimChecks = {
  'Systems Architecture': [
    { level: 1, label: 'spec directory present', pass: !!specDir() },
    { level: 2, label: 'AaaS contract pin', pass: hasAny('machine/spec/aaas-audit-contract.pin.json', 'pm/spec/aaas-audit-contract.pin.json') },
    { level: 3, label: '>=3 machine specs', pass: specCount() >= 3 },
    { level: 4, label: 'schema-validated specs ($schema)', pass: schemaValidatedSpecs() },
    { level: 5, label: 'framework design doc', pass: listFiles(specDir() ?? '.').some((f) => /design.*\.md$/.test(f)) || has('machine/spec/aaas-framework-design-2026-06-28.md') || (fabricAaasProvider && fabricHas('machine/spec/aaas-framework-design-2026-06-28.md')) },
  ],
  Tooling: [
    { level: 1, label: 'package scripts', pass: Object.keys(sc).length > 0 },
    { level: 2, label: '>=10 scripts', pass: Object.keys(sc).length >= 10 },
    { level: 3, label: 'check/audit tooling', pass: hasScript(/:check$|^aaas:/) },
    { level: 4, label: 'handoff synthesizer (aaas:handoff)', pass: hasScript(/^aaas:handoff/) || has('platform/scripts/lib/aaas-handoff.mjs') || (fabricAaasProvider && fabricHas('platform/scripts/aaas-handoff.mjs')) },
    { level: 5, label: '>=30 scripts (rich automation)', pass: Object.keys(sc).length >= 30 },
  ],
  Process: [
    { level: 1, label: 'audit/ tree', pass: has('audit') },
    { level: 2, label: 'evidence + reports folders', pass: has('audit/evidence') && has('audit/reports') },
    { level: 3, label: 'handoff directive folder', pass: has('audit/handoff') },
    { level: 4, label: 'remediation audit/reports folder', pass: has('audit/reports') },
    { level: 5, label: 'lifecycle running (fresh witness)', pass: freshWitness() },
  ],
  Safeguards: [
    { level: 1, label: 'gate/check tooling', pass: hasScript(/:check$|gate/i) || /gate/i.test(scriptVals) },
    { level: 2, label: 'honesty gate', pass: has('audit/evidence/aaas-honesty-gate-latest.json') || hasScript(/honesty/) },
    { level: 3, label: 'adversarial honesty', pass: has('platform/scripts/lib/aaas-adversarial-honesty.mjs') || hasScript(/adversarial/) || has('audit/evidence/aaas-adversarial-honesty-latest.json') },
    { level: 4, label: 'commit gates (husky/settlement)', pass: has('.husky') || /settlement/i.test(scriptVals) },
    { level: 5, label: 'signed provenance in witnesses', pass: witnessHasProvenance() },
  ],
  Monitoring: [
    { level: 1, label: 'evidence witnesses', pass: listFiles('audit/evidence').some((f) => f.endsWith('.json')) },
    { level: 2, label: 'cadence witness', pass: has('audit/evidence/aaas-cadence-latest.json') || hasScript(/^aaas:cadence/) },
    { level: 3, label: 'witness freshness (<=7d)', pass: freshWitness() },
    { level: 4, label: 'predictive forecast', pass: has('audit/evidence/aaas-cadence-forecast-latest.json') },
    { level: 5, label: 'trend history (>=3 snapshots)', pass: historySnapshots() >= 3 },
  ],
  'Team & Ownership': [
    { level: 1, label: 'agent instructions (CLAUDE/AGENTS.md)', pass: hasAny('CLAUDE.md', '.claude/CLAUDE.md', 'AGENTS.md') },
    { level: 2, label: 'contract pin (ownership binding)', pass: hasAny('machine/spec/aaas-audit-contract.pin.json', 'pm/spec/aaas-audit-contract.pin.json') },
    { level: 3, label: 'ownership codified in contract', pass: !!readJson('machine/spec/aaas-audit-contract.json')?.ownership || (fabricAaasProvider && !!fabricContract?.ownership) },
    { level: 4, label: 'coordination docs (P24)', pass: hasAny('docs/operations/coordination', '01-docs/06-coordination', '01-docs/08-gtm/inbound-tickets') },
    { level: 5, label: 'ownership check witness', pass: has('audit/evidence/aaas-ownership-latest.json') },
  ],
};

function main() {
  const witness = evaluateSignal({ repo: repoArg ?? 'fabric-os', dimChecks, nowIso: new Date().toISOString() });
  if (WRITE) {
    const OUT = join(ROOT, 'audit/evidence/signal-maturity-latest.json');
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`SIGNAL · ${witness.repo} · overall ${witness.overallLabel} (weakest-link: ${witness.weakestLink}) · production-only`);
    for (const d of witness.dimensions) {
      console.log(`  ${d.label.padEnd(8)} ${d.dimension}${d.primaryBlocker ? `  — next: ${d.primaryBlocker}` : ''}`);
    }
    if (WRITE) console.log('\nwitness: audit/evidence/signal-maturity-latest.json');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
