#!/usr/bin/env node
/**
 * Active fleet threat register gate — TI + internal findings → SOC L3 feed.
 * Usage: node fleet-threat-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const REGISTER = join(BRIDGE, 'pm/spec/fleet-threat-register.json');
const RISK_REGISTER = join(BRIDGE, 'pm/spec/fleet-risk-register.json');
const SOC = join(ROOT, 'docs/operations/soc-operations.md');
const ANOMALY = join(ROOT, 'platform/tools/anomaly-detector');
const OUT = join(ROOT, 'audit/evidence/fleet-threat-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const gates = {};
gates.register = { ok: existsSync(REGISTER) };
gates.riskRegisterLink = { ok: existsSync(RISK_REGISTER) };
gates.socPlan = { ok: existsSync(SOC) };
gates.anomalyDetector = { ok: existsSync(ANOMALY) };

const reg = readJson(REGISTER);
const threats = reg?.threats ?? [];
gates.threatCount = { ok: threats.length >= 3, count: threats.length };

const internal = threats.filter((t) => t.source === 'internal-finding');
const ti = threats.filter((t) => t.source === 'threat-intel');
gates.internalFindings = { ok: internal.length >= 2, count: internal.length };
gates.threatIntelFeed = { ok: ti.length >= 1, count: ti.length, note: 'TI operationalization planned for SOC L3' };

gates.socMaturity = {
  ok: reg?.socMaturityTarget === 'L3',
  target: reg?.socMaturityTarget ?? null,
};

const structuralOk =
  gates.register.ok &&
  gates.riskRegisterLink.ok &&
  gates.socPlan.ok &&
  gates.threatCount.ok &&
  gates.internalFindings.ok;

const witness = {
  schema: 'gtcx://fabric-os/fleet-threat-check/v1',
  opsLane: 'SecOps',
  checkedAt: new Date().toISOString(),
  owner: 'bridge-os',
  register: 'bridge-os/pm/spec/fleet-threat-register.json',
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
    const extra = v.count != null ? ` (${v.count})` : v.target ? ` (${v.target})` : '';
    console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${extra}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — fleet threat register`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
