#!/usr/bin/env node
/**
 * SECAS-S4-01 — CSIRT / SOC operating model structural gate.
 * Usage: node secas-csirt-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER = join(ROOT, 'machine/security-friction-register.json');
const FRICTION_ID = 'SEC-CSIRT-01';
const IR_RUNBOOK = join(ROOT, 'docs/operations/secas/runbooks/incident-response.md');
const OPERATING_MODEL = join(ROOT, 'docs/operations/secas/csirt-operating-model.md');
const SOC_OPS_CANDIDATES = [
  join(ROOT, 'docs/operations/soc-operations.md'),
  join(ROOT, 'docs/operations/core-ops/batch-b/soc-operations.md'),
];
const EVIDENCE_DIR = join(ROOT, 'audit/evidence');
const OUT = join(EVIDENCE_DIR, 'secas-csirt-operating-model-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function readText(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function hasSections(text, sections) {
  const missing = sections.filter((s) => !text.includes(s));
  return { ok: missing.length === 0, missing };
}

function drillWitnessPresent() {
  if (!existsSync(EVIDENCE_DIR)) return { ok: false, files: [] };
  const files = readdirSync(EVIDENCE_DIR).filter((f) => /^secas-ir-drill-\d{4}-\d{2}-\d{2}\.json$/.test(f));
  return { ok: files.length > 0, files };
}

const gates = {};

gates.frictionItem = { ok: false };
if (existsSync(REGISTER)) {
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const item = (reg.items ?? []).find((i) => i.id === FRICTION_ID);
  gates.frictionItem = {
    ok: Boolean(item && item.storyId === 'SECAS-S4-01'),
    status: item?.status ?? null,
    storyId: item?.storyId ?? null,
  };
}

const irText = readText(IR_RUNBOOK);
gates.irRunbook = {
  ok: existsSync(IR_RUNBOOK),
  ...hasSections(irText, ['## Roles', '## Severity', '## Escalation', '## Drill evidence path']),
};

const modelText = readText(OPERATING_MODEL);
gates.operatingModel = {
  ok: existsSync(OPERATING_MODEL),
  ...hasSections(modelText, ['## Escalation matrix', '## On-call contract', '## Drill cadence']),
};

const socOpsPath = SOC_OPS_CANDIDATES.find((p) => existsSync(p)) ?? null;
gates.socOpsLink = {
  ok: Boolean(socOpsPath) && modelText.includes('soc-operations.md'),
  path: socOpsPath ? socOpsPath.slice(ROOT.length + 1) : null,
};

gates.drillEvidence = drillWitnessPresent();

const structuralOk =
  gates.frictionItem.ok &&
  gates.irRunbook.ok &&
  gates.operatingModel.ok &&
  gates.socOpsLink.ok &&
  gates.drillEvidence.ok;

const witness = {
  schema: 'gtcx://fabric-os/secas-csirt-check/v1',
  storyId: 'SECAS-S4-01',
  frictionId: FRICTION_ID,
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  gates,
  ok: structuralOk,
  phase: 'structural',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    const detail =
      v.missing?.length ? ` (missing: ${v.missing.join(', ')})` : v.files?.length ? ` (${v.files.join(', ')})` : v.status ? ` (${v.status})` : '';
    console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${detail}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — SECAS-S4-01 CSIRT operating model (structural)`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
