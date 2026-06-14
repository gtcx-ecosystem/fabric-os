#!/usr/bin/env node
/**
 * RevOps (CRO) — GTM + economics friction register gate.
 * Usage: node revops-friction-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REVOPS_REG = join(ROOT, 'pm/revops-friction-register.json');
const GTM_REG = join(ROOT, 'pm/gtm-friction-register.json');
const OPS = join(ROOT, 'docs/operations/revops-as-a-service.md');
const OUT = join(ROOT, 'audit/evidence/revops-friction-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const gates = {};
gates.revopsRegister = { ok: existsSync(REVOPS_REG) };
gates.gtmRegister = { ok: existsSync(GTM_REG) };
gates.opsDoc = { ok: existsSync(OPS) };
gates.revopsLane = { ok: false };

if (existsSync(GTM_REG)) {
  const gtm = JSON.parse(readFileSync(GTM_REG, 'utf8'));
  gates.revopsLane = { ok: gtm.opsLane === 'RevOps', lane: gtm.opsLane };
}

const structuralOk = gates.revopsRegister.ok && gates.gtmRegister.ok && gates.opsDoc.ok && gates.revopsLane.ok;

const witness = {
  schema: 'gtcx://fabric-os/revops-friction-check/v1',
  opsLane: 'RevOps',
  checkedAt: new Date().toISOString(),
  owner: 'bridge-os',
  registerHost: 'fabric-os',
  gates,
  ok: structuralOk,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${v.lane ? ` (${v.lane})` : ''}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — RevOps (CRO) structural gates`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
