#!/usr/bin/env node
/**
 * EcosystemOps — partnerships, developer engagement, community network gate.
 * Usage: node ecosystemops-network-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const ECOSYSTEM_OS = join(ROOT, '..', 'ecosystem-os');
const OUT = join(ROOT, 'audit/evidence/ecosystemops-network-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const PATHS = {
  networkRegistry: join(BRIDGE, 'pm/spec/ecosystemops-network-registry.json'),
  frictionRegister: join(BRIDGE, 'pm/spec/ecosystemops-friction-register.json'),
  tradeLanes: join(BRIDGE, 'pm/spec/trade-ecosystem-lanes.json'),
  stratopsRegistry: join(BRIDGE, 'pm/spec/stratops-strategy-registry.json'),
  docServices: join(BRIDGE, 'pm/spec/documentation-services.json'),
  opsDoc: join(ROOT, 'docs/operations/ecosystemops-as-a-service.md'),
  ecosystemOsPresent: ECOSYSTEM_OS,
};

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const gates = {};
for (const [key, path] of Object.entries(PATHS)) {
  gates[key] = { ok: existsSync(path), path };
}

const netReg = readJson(PATHS.networkRegistry);
gates.ecosystemopsLane = { ok: netReg?.opsLane === 'EcosystemOps', lane: netReg?.opsLane ?? null };

const frictionReg = readJson(PATHS.frictionRegister);
gates.frictionLane = { ok: frictionReg?.opsLane === 'EcosystemOps', lane: frictionReg?.opsLane ?? null };

const domains = netReg?.networkDomains ?? {};
const requiredDomains = ['partnerships', 'developerEngagement', 'communities', 'productEcosystem'];
const presentDomains = requiredDomains.filter((k) => Boolean(domains[k]));
gates.networkDomains = {
  ok: presentDomains.length === requiredDomains.length,
  present: presentDomains,
  required: requiredDomains,
};

const stratops = readJson(PATHS.stratopsRegistry);
const programmeMap = stratops?.programmeLaneMap ?? [];
gates.stratopsLink = { ok: programmeMap.length >= 5, programmes: programmeMap.length };

const structuralOk = Object.values(gates).every((g) => g.ok);

const witness = {
  schema: 'gtcx://fabric-os/ecosystemops-network-check/v1',
  opsLane: 'EcosystemOps',
  checkedAt: new Date().toISOString(),
  owner: 'bridge-os',
  publishRepo: 'ecosystem-os',
  gates,
  openFriction: (frictionReg?.items ?? []).filter((i) => i.status === 'open').length,
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
      v.lane != null
        ? ` (${v.lane})`
        : v.present
          ? ` [${v.present.join(', ')}]`
          : v.programmes != null
            ? ` (${v.programmes})`
            : '';
    console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${extra}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — EcosystemOps structural gates`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
