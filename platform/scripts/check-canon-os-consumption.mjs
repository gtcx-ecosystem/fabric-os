#!/usr/bin/env node
/**
 * canon:contracts:check — verify canon-os consumer pins resolve (writes: false).
 * Registry SoR: ../canon-os/machine/spec/canon-os-fleet-contracts.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/canon-os-contracts-latest.json');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function resolveRel(rel) {
  return resolve(REPO, rel);
}

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : null) };
}

function checkPin(pinPath, contractId, gates) {
  const abs = resolveRel(pinPath);
  if (!existsSync(abs)) {
    gates.push(gate(`pin:${contractId}`, false, `missing ${pinPath}`));
    return;
  }
  const pin = loadJson(abs);
  if (pin.contractId && pin.contractId !== contractId) {
    gates.push(gate(`pin:${contractId}:id`, false, pin.contractId));
    return;
  }
  if (pin.writes === true) {
    gates.push(gate(`pin:${contractId}:writes`, false, 'writes must be false'));
    return;
  }
  const sorAbs = pin.sor ? resolveRel(pin.sor) : null;
  if (!sorAbs || !existsSync(sorAbs)) {
    gates.push(gate(`pin:${contractId}:sor`, false, pin.sor ?? 'no sor'));
    return;
  }
  gates.push(gate(`pin:${contractId}`, true, `${pinPath} → ${pin.sor}`));
}

function main() {
  const gates = [];

  const consumptionPath = join(REPO, 'config/canon-os-consumption.json');
  gates.push(
    gate('consumption:present', existsSync(consumptionPath), 'config/canon-os-consumption.json'),
  );
  if (existsSync(consumptionPath)) {
    const consumption = loadJson(consumptionPath);
    gates.push(gate('consumption:writes-false', consumption.writes === false, 'writes: false'));
    const central = resolveRel(consumption.standardsSoR?.centralSoR ?? '');
    gates.push(
      gate(
        'sor:ecosystem-central',
        existsSync(central),
        consumption.standardsSoR?.centralSoR ?? 'missing',
      ),
    );
    for (const [key, rel] of Object.entries(consumption.resolvePaths ?? {})) {
      gates.push(gate(`sor:path:${key}`, existsSync(resolveRel(rel)), rel));
    }
  }

  const localRegistryPath = join(REPO, 'machine/spec/canon-os-fleet-contracts.json');
  gates.push(
    gate('registry:local-pin', existsSync(localRegistryPath), 'machine/spec/canon-os-fleet-contracts.json'),
  );
  let registrySor = '../canon-os/machine/spec/canon-os-fleet-contracts.json';
  if (existsSync(localRegistryPath)) {
    const localPin = loadJson(localRegistryPath);
    gates.push(gate('registry:writes-false', localPin.writes === false, 'writes: false'));
    registrySor = localPin.sor ?? registrySor;
    const registryAbs = resolveRel(registrySor);
    gates.push(gate('registry:sor', existsSync(registryAbs), registrySor));
    if (existsSync(registryAbs)) {
      const registry = loadJson(registryAbs);
      for (const contract of registry.contracts ?? []) {
        const pinRel =
          localPin.consumerPins?.[contract.contractId] ?? contract.consumerPin ?? null;
        if (!pinRel) {
          gates.push(gate(`contract:${contract.contractId}`, false, 'no consumer pin'));
          continue;
        }
        checkPin(pinRel, contract.contractId, gates);
      }
    }
  }

  const rolloutPin = join(REPO, 'machine/spec/fleet-repo-rollout-program.json');
  if (existsSync(rolloutPin)) {
    const rollout = loadJson(rolloutPin);
    gates.push(gate('rollout:writes-false', rollout.writes === false, 'writes: false'));
    gates.push(
      gate(
        'rollout:sor',
        existsSync(resolveRel(rollout.sor ?? '')),
        rollout.sor ?? 'missing sor',
      ),
    );
  } else {
    gates.push(gate('rollout:pin', false, 'machine/spec/fleet-repo-rollout-program.json'));
  }

  const renamePolicy = join(REPO, 'config/folder-rename-policy.json');
  if (existsSync(renamePolicy)) {
    const policy = loadJson(renamePolicy);
    gates.push(
      gate(
        'folder-rename:sor',
        existsSync(resolveRel(policy.sor ?? '')),
        policy.sor ?? 'missing sor',
      ),
    );
  } else {
    gates.push(gate('folder-rename:pin', false, 'config/folder-rename-policy.json'));
  }

  gates.push(
    gate(
      'folder-registry:resolver',
      existsSync(join(REPO, 'platform/scripts/lib/folder-registry.mjs')),
      'platform/scripts/lib/folder-registry.mjs',
    ),
  );
  gates.push(
    gate('folder-registry:config', existsSync(join(REPO, 'config/folders.json')), 'config/folders.json'),
  );

  const pass = gates.filter((g) => g.ok).length;
  const fail = gates.length - pass;

  console.log('\n=== canon:contracts:check ===\n');
  for (const g of gates) {
    console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  }
  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass}/${gates.length}\n`);

  if (WRITE) {
    mkdirSync(dirname(WITNESS), { recursive: true });
    writeFileSync(
      WITNESS,
      `${JSON.stringify(
        {
          schema: 'gtcx://canon-os/contracts-check/v1',
          generatedAt: new Date().toISOString(),
          repo: 'fabric-os',
          pass: fail === 0,
          gates,
        },
        null,
        2,
      )}\n`,
    );
  }

  process.exit(fail === 0 ? 0 : 1);
}

main();
