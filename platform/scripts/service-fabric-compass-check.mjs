#!/usr/bin/env node
/**
 * Service fabric compass — registers + DaaS/SECaaS assurance runners.
 * Initiative: INIT-GTCX-COMPASS-FABRIC / INIT-GTCX-SERVICE-FABRIC
 * Usage: node service-fabric-compass-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const SPEC = join(BRIDGE, 'machine/spec/service-fabric.json');
const OUT = join(ROOT, 'audit/evidence/service-fabric-compass-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function resolveRegisterPath(registerSpec) {
  if (registerSpec.startsWith('bridge-os/')) {
    return join(BRIDGE, registerSpec.slice('bridge-os/'.length));
  }
  if (registerSpec.startsWith('fabric-os/')) {
    return join(ROOT, registerSpec.slice('fabric-os/'.length));
  }
  return join(ROOT, registerSpec);
}

function fabricRegisterRel(registerSpec) {
  if (registerSpec.startsWith('bridge-os/')) return registerSpec;
  if (registerSpec.startsWith('fabric-os/')) return registerSpec.slice('fabric-os/'.length);
  return registerSpec;
}

function runNode(script, args = []) {
  const r = spawnSync('node', [script, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { ok: r.status === 0, exit: r.status ?? 1 };
}

function main() {
  const gates = { registers: {}, roadmaps: {}, runners: {} };

  const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
  for (const svc of spec.services ?? []) {
    if (!svc.register) continue;
    const rel = fabricRegisterRel(svc.register);
    const path = resolveRegisterPath(svc.register);
    gates.registers[svc.id] = { ok: existsSync(path), path: rel, status: svc.status };
  }

  for (const [id, rel] of [
    ['DAAS', 'machine/daas-roadmap.json'],
    ['SECAS', 'machine/secas-roadmap.json'],
    ['HAAS', 'machine/haas-roadmap.json'],
    ['AAAS', 'machine/aaas-roadmap.json'],
  ]) {
    gates.roadmaps[id] = { ok: existsSync(join(ROOT, rel)), path: rel };
  }

  for (const [id, script, args] of [
    ['daas-friction', 'platform/scripts/daas-friction-check.mjs', []],
    ['daas-cards', 'platform/scripts/daas-cards-check.mjs', []],
    ['secas-friction', 'platform/scripts/secas-friction-check.mjs', []],
    ['secas-approval', 'platform/scripts/secas-approval-check.mjs', []],
    ['secas-cards', 'platform/scripts/secas-cards-check.mjs', []],
    ['haas-friction', 'platform/scripts/haas-friction-check.mjs', []],
    ['aaas-friction', 'platform/scripts/aaas-friction-check.mjs', []],
    ['fabric-assurance', 'platform/scripts/fabric-assurance-run.mjs', ['--check']],
    ['taas-tool-scout', 'platform/scripts/taas-tool-scout-run.mjs', []],
  ]) {
    if (!existsSync(join(ROOT, script))) {
      gates.runners[id] = { ok: false, missing: script };
      continue;
    }
    const r = runNode(script, args);
    gates.runners[id] = { ok: r.ok, exit: r.exit, script };
  }

  for (const svc of spec.services ?? []) {
    if (!svc.fleetCheck) continue;
    if (svc.id === 'COMPASS' || svc.fleetCheck === 'fabric:compass:check') continue;
    const ownerCwd = svc.harnessOwner === 'bridge-os' ? BRIDGE : ROOT;
    const r = spawnSync('pnpm', [svc.fleetCheck], { cwd: ownerCwd, encoding: 'utf8', timeout: 120_000 });
    const key = `fleet-${svc.id.toLowerCase()}`;
    gates.runners[key] = {
      ok: r.status === 0,
      exit: r.status ?? 1,
      fleetCheck: svc.fleetCheck,
      serviceId: svc.id,
      cwd: svc.harnessOwner ?? 'fabric-os',
    };
  }

  const registersOk = Object.values(gates.registers).every((g) => g.ok);
  const roadmapsOk = Object.values(gates.roadmaps).every((g) => g.ok);
  const coreRunnersOk = ['daas-friction', 'daas-cards', 'secas-friction', 'secas-approval', 'secas-cards'].every(
    (k) => gates.runners[k]?.ok,
  );
  const ok = registersOk && roadmapsOk && coreRunnersOk;

  const witness = {
    schema: 'gtcx://fabric-os/service-fabric-compass/v1',
    initiative: 'INIT-GTCX-SERVICE-FABRIC',
    compassInitiative: 'INIT-GTCX-COMPASS-FABRIC',
    at: new Date().toISOString(),
    ok,
    gates,
    serviceFabricSpec: 'bridge-os/pm/spec/service-fabric.json',
  };

  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
  else {
    for (const [k, v] of Object.entries(gates.registers)) {
      console.log(`${v.ok ? 'OK' : 'FAIL'} register:${k}`);
    }
    for (const [k, v] of Object.entries(gates.roadmaps)) {
      console.log(`${v.ok ? 'OK' : 'FAIL'} roadmap:${k}`);
    }
    for (const [k, v] of Object.entries(gates.runners)) {
      console.log(`${v.ok ? 'OK' : 'FAIL'} runner:${k}`);
    }
    console.log(`\n${ok ? 'PASS' : 'FAIL'} — service fabric compass`);
    if (WRITE) console.log(`witness: ${OUT}`);
  }
  process.exit(ok ? 0 : 1);
}

main();
