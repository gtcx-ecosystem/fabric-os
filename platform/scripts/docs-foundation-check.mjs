#!/usr/bin/env node
/**
 * docs:foundation:check — verify docs/foundation/ eight-file pack per pm/spec/docs-foundation-pack.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SPEC = join(REPO, 'pm/spec/docs-foundation-pack.json');
const PRODUCT_GOALS = join(REPO, 'pm/spec/product-goals.json');
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-foundation-latest.json');

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function stripMd(text) {
  return text.replace(/\*\*/g, '').replace(/`/g, '');
}

function main() {
  const gates = [];
  gates.push(gate('spec', existsSync(SPEC), 'pm/spec/docs-foundation-pack.json'));

  if (!existsSync(SPEC)) {
    emit(gates);
    return;
  }

  const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
  for (const entry of spec.requiredFiles ?? []) {
    const rel = entry.path.replace(/^docs\//, '');
    gates.push(gate(`file:${rel}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const fleetConstitution = spec.fleetConstitution?.path;
  if (fleetConstitution) {
    gates.push(gate('fleet-constitution', existsSync(join(REPO, fleetConstitution)), fleetConstitution));
  }

  if (existsSync(PRODUCT_GOALS)) {
    const goals = JSON.parse(readFileSync(PRODUCT_GOALS, 'utf8'));
    const visionMd = existsSync(join(REPO, 'docs/foundation/vision.md'))
      ? readFileSync(join(REPO, 'docs/foundation/vision.md'), 'utf8')
      : '';
    const missionMd = existsSync(join(REPO, 'docs/foundation/mission.md'))
      ? readFileSync(join(REPO, 'docs/foundation/mission.md'), 'utf8')
      : '';
    const milestonesMd = existsSync(join(REPO, 'docs/foundation/milestones.md'))
      ? readFileSync(join(REPO, 'docs/foundation/milestones.md'), 'utf8')
      : '';

    if (goals.vision?.statement) {
      gates.push(
        gate(
          'sync:vision',
          stripMd(visionMd).includes(goals.vision.statement.slice(0, 40)),
          'vision.md mirrors product-goals.json',
        ),
      );
    }
    if (goals.mission) {
      gates.push(
        gate(
          'sync:mission',
          stripMd(missionMd).includes(goals.mission.slice(0, 40)),
          'mission.md mirrors product-goals.json',
        ),
      );
    }
    if (goals.activeMilestone?.id) {
      gates.push(
        gate(
          'sync:milestone',
          milestonesMd.includes(goals.activeMilestone.id),
          `milestones.md references ${goals.activeMilestone.id}`,
        ),
      );
    }
  }

  emit(gates);
}

function emit(gates) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-foundation-check/v1',
    repo: 'fabric-os',
    at: new Date().toISOString(),
    ok,
    gates,
  };

  if (WRITE) {
    mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
  }

  console.log('=== docs:foundation:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  if (WRITE) console.log(`witness: ${WITNESS}`);
  process.exit(ok ? 0 : 1);
}

main();
