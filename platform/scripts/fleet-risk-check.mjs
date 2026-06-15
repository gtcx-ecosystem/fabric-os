#!/usr/bin/env node
/**
 * Unified fleet risk register gate — SecOps + Legal + product threat index.
 * Usage: node fleet-risk-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const ECOSYSTEM = join(ROOT, '..');
const REGISTER = join(BRIDGE, 'pm/spec/fleet-risk-register.json');
const OUT = join(ROOT, 'audit/evidence/fleet-risk-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function resolve(path) {
  if (path.startsWith('fabric-os/')) return join(ROOT, path.slice('fabric-os/'.length));
  if (path.startsWith('bridge-os/')) return join(BRIDGE, path.slice('bridge-os/'.length));
  return join(ECOSYSTEM, path);
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function threatModelStatus(relPath) {
  const abs = resolve(relPath);
  if (!existsSync(abs)) return 'missing';
  const text = readFileSync(abs, 'utf8');
  if (/(?:^|\n)\s*Link stub\s*[-–]\s*doc integrity|\bTODO:\b|^\s*stub\s*$/i.test(text)) return 'stub';
  if (text.length < 400) return 'thin';
  return 'present';
}

const gates = {};
gates.register = { ok: existsSync(REGISTER) };

const reg = readJson(REGISTER);
gates.riskCount = { ok: (reg?.risks?.length ?? 0) >= 8, count: reg?.risks?.length ?? 0 };

const sources = reg?.sources ?? {};
gates.sources = { ok: true, missing: [] };
for (const [k, rel] of Object.entries(sources)) {
  if (k === 'humanGates') continue;
  const abs = resolve(rel);
  if (!existsSync(abs)) {
    gates.sources.ok = false;
    gates.sources.missing.push(k);
  }
}

const productRisks = (reg?.risks ?? []).filter((r) => r.category === 'product-threat' || r.category === 'ai-model-risk');
const tmProbe = {};
let productTmOk = true;
for (const r of productRisks) {
  if (!r.threatModelPath) continue;
  const status = threatModelStatus(r.threatModelPath);
  tmProbe[r.id] = { repo: r.repo, status, path: r.threatModelPath };
  if (status === 'missing' || status === 'stub') productTmOk = false;
}
gates.productThreatModels = { ok: productTmOk, probe: tmProbe };

const openP0 = (reg?.risks ?? []).filter((r) => r.severity === 'P0' && ['open', 'in_progress'].includes(r.status));
gates.openP0Risks = { ok: true, count: openP0.length, ids: openP0.map((r) => r.id) };

const structuralOk = gates.register.ok && gates.riskCount.ok && gates.sources.ok;

const witness = {
  schema: 'gtcx://fabric-os/fleet-risk-check/v1',
  opsLane: 'SecOps',
  checkedAt: new Date().toISOString(),
  owner: 'bridge-os',
  executionOwner: 'fabric-os',
  register: 'bridge-os/pm/spec/fleet-risk-register.json',
  gates,
  openP0: openP0.length,
  productThreatGap: !gates.productThreatModels.ok,
  ok: structuralOk,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    const extra =
      v.count != null
        ? ` (${v.count})`
        : v.missing?.length
          ? ` [${v.missing.join(', ')}]`
          : '';
    console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${extra}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — fleet risk register`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
