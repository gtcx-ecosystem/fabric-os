#!/usr/bin/env node
/**
 * MATURITY-LANE-FAB-001 — GS-MATURITY-LANE-001 enforcement harness.
 * Usage: node platform/scripts/maturity-lane-check.mjs [--write]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isExternalAssuranceWitnessFilename,
  validateExternalAssuranceWitness,
} from './lib/assurance-lane-witness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const EVIDENCE = join(ROOT, 'audit/evidence');
const OUT = join(EVIDENCE, 'maturity-lane-check-latest.json');
const PIN = join(ROOT, 'pm/spec/maturity-lane-separation.json');
const CONTRACT = join(ROOT, 'pm/spec/assurance-lane-witness-fields.json');
const BASELINE_SOR = join(ROOT, '../baseline-os/pm/spec/maturity-lane-separation.json');
const WRITE = process.argv.includes('--write');

function readJson(p) {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const pin = readJson(PIN);
const contract = readJson(CONTRACT);
const baseline = readJson(BASELINE_SOR);

const structural = {
  policyPin: { ok: Boolean(pin?.policyId === 'GS-MATURITY-LANE-001' && pin?.sor) },
  baselineSor: { ok: Boolean(baseline?.id === 'GS-MATURITY-LANE-001') },
  witnessContract: { ok: Boolean(contract?.requiredFields?.lane?.const === 'externalAssurance') },
  parallelLaneCheck: {
    ok: existsSync(join(EVIDENCE, 'secas-parallel-lane-check-latest.json')),
    detail: 'secas-parallel-lane-check witness present',
  },
};

const witnessResults = [];
if (existsSync(EVIDENCE)) {
  for (const name of readdirSync(EVIDENCE).filter((f) => f.endsWith('.json'))) {
    if (!isExternalAssuranceWitnessFilename(name)) continue;
    const rel = `audit/evidence/${name}`;
    const doc = readJson(join(EVIDENCE, name));
    if (!doc) continue;
    witnessResults.push(validateExternalAssuranceWitness(doc, rel));
  }
}

const witnessFailures = witnessResults.filter((r) => !r.ok);
const ok =
  Object.values(structural).every((c) => c.ok) && witnessFailures.length === 0;

const witness = {
  schema: 'gtcx://fabric-os/maturity-lane-check/v1',
  storyId: 'MATURITY-LANE-FAB-001',
  policy: 'GS-MATURITY-LANE-001',
  checkedAt: new Date().toISOString(),
  ok,
  structural,
  assuranceWitnesses: {
    checked: witnessResults.length,
    pass: witnessResults.filter((r) => r.ok).length,
    fail: witnessFailures.length,
    results: witnessResults,
  },
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const [k, v] of Object.entries(structural)) {
  console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${v.detail ? ` — ${v.detail}` : ''}`);
}
for (const r of witnessFailures) {
  console.log(`FAIL witness ${r.path} — ${r.failures.join(', ')}`);
}
console.log(
  `\nassurance witnesses: ${witness.assuranceWitnesses.pass}/${witness.assuranceWitnesses.checked} pass`,
);
console.log(`${ok ? 'PASS' : 'FAIL'} — maturity-lane:check`);
if (WRITE) console.log(`witness: ${OUT.slice(ROOT.length + 1)}`);
process.exit(ok ? 0 : 1);
