#!/usr/bin/env node
/** SECAS-S5-04 — PQC crypto-agility register gate */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const REGISTER = join(BRIDGE, 'machine/spec/crypto-agility-register.json');
const OUT = join(ROOT, 'audit/evidence/secas-pqc-check-latest.json');
const WRITE = process.argv.includes('--write');

const reg = existsSync(REGISTER) ? JSON.parse(readFileSync(REGISTER, 'utf8')) : null;
const inventory = reg?.inventory ?? [];
const gates = {
  register: { ok: reg?.storyId === 'SECAS-S5-04' },
  inventory: { ok: inventory.length >= 2, count: inventory.length },
  harnessRef: { ok: (reg?.harness ?? []).includes('pnpm secas:pqc:check') },
};
const ok = Object.values(gates).every((g) => g.ok);
const witness = {
  schema: 'gtcx://fabric-os/secas-pqc-check/v1',
  storyId: 'SECAS-S5-04',
  checkedAt: new Date().toISOString(),
  register: 'bridge-os/pm/spec/crypto-agility-register.json',
  gates,
  ok,
};
if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
for (const [k, v] of Object.entries(gates)) {
  console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${v.count != null ? ` (${v.count})` : ''}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — SECAS PQC crypto-agility`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
