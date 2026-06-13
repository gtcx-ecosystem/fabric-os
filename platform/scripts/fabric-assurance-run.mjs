#!/usr/bin/env node
/**
 * Fabric assurance runner — executes independent catalog runs from bridge evaluate witness.
 * Spec: bridge-os/pm/spec/assurance-run-catalog.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { assessBlockingSatisfaction } from '../../../bridge-os/platform/scripts/lib/assurance-blocking-satisfaction.mjs';

const FABRIC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ECO = join(FABRIC, '..');
const BRIDGE = join(ECO, 'bridge-os');
const WRITE = process.argv.includes('--write') || (!process.argv.includes('--check') && !process.argv.includes('--dry-run'));
const CHECK = process.argv.includes('--check');
const WITNESS = join(FABRIC, 'audit/evidence/fabric-assurance-latest.json');
const EVALUATE = join(BRIDGE, 'pm/ci/assurance-evaluate-latest.json');
const CATALOG = join(BRIDGE, 'pm/spec/assurance-run-catalog.json');

const COMMAND_ALIASES = {
  'pnpm ecosystem:fleet:uat:run': 'pnpm ecosystem:fleet:uat:run',
  'pnpm ecosystem:fleet:readiness -- --quick': 'pnpm ecosystem:fleet:readiness:all --quick --json',
  'pnpm ecosystem:documentation-audit:check:fleet':
    'pnpm ecosystem:documentation-audit:check:fleet:write',
  'pnpm ecosystem:five-pillar:stress:fleet:write': 'pnpm ecosystem:five-pillar:stress:fleet:write',
  'pnpm ecosystem:fleet:verify -- --quick': 'pnpm ecosystem:fleet:verify:all --no-build --json',
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function buildContextBundle() {
  const baselineConfig = existsSync(join(FABRIC, 'config/baseline/baseline.config.json'))
    ? 'config/baseline/baseline.config.json'
    : null;
  return {
    baselineConfig,
    persona: 'pm/spec/repo-persona-profiles.json',
    skills: 'bridge-os/pm/spec/skills-ecosystem-map.json',
    ragWitness: 'audit/evidence/rag-model-b-fabric-os-latest.json',
    triggers: 'bridge-os/pm/spec/assurance-triggers.json',
  };
}

function runShell(command, cwd) {
  const mapped = COMMAND_ALIASES[command] ?? command;
  if (mapped.includes('<target>')) {
    return { ok: true, skipped: true, reason: 'requires-target', command: mapped, exitCode: 0 };
  }
  const result = spawnSync(mapped, {
    cwd,
    encoding: 'utf8',
    shell: true,
    timeout: 600_000,
  });
  return {
    ok: result.status === 0,
    skipped: false,
    command: mapped,
    exitCode: result.status ?? 1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-800),
  };
}

function executeIndependentRuns(evaluateWitness, catalog) {
  const runIds = [...new Set((evaluateWitness.runs ?? []).map((r) => r.id))];
  const executed = [];

  for (const runId of runIds) {
    const entry = catalog.runs?.[runId];
    if (!entry) continue;
    if (entry.independent !== true) continue;
    if (entry.delegate !== 'fabric-os') continue;
    const cwd = entry.delegate === 'fabric-os' ? BRIDGE : BRIDGE;
    const result = WRITE ? runShell(entry.command, cwd) : { ok: true, dryRun: true, command: entry.command };
    executed.push({ id: runId, label: entry.label, witness: entry.witness, ...result });
  }

  return executed;
}

function main() {
  if (!existsSync(EVALUATE)) {
    console.error('fabric-assurance-run FAIL — missing bridge assurance-evaluate witness');
    process.exit(1);
  }

  const evaluateWitness = readJson(EVALUATE);
  const catalog = existsSync(CATALOG) ? readJson(CATALOG) : { runs: {} };
  const executed = executeIndependentRuns(evaluateWitness, catalog);
  const blocking = (evaluateWitness.fired ?? [])
    .filter((f) => f.blocks)
    .map((f) => ({ id: f.id, runs: f.runs }));

  const satisfaction = assessBlockingSatisfaction({
    ecosystemRoot: ECO,
    catalog,
    blocking,
    maxAgeHours: 72,
  });

  const witness = {
    schema: 'gtcx://fabric-os/fabric-assurance/v1',
    at: new Date().toISOString(),
    repo: 'fabric-os',
    initiative: 'INIT-ASSURANCE-BURN-DOWN',
    story: 'T35',
    dryRun: !WRITE,
    ok:
      executed.every((r) => r.skipped || r.dryRun || r.ok) &&
      (blocking.length === 0 || satisfaction.ok),
    evaluateExitCode: 0,
    fired: evaluateWitness.fired ?? [],
    runs: evaluateWitness.runs ?? [],
    blocking,
    executed,
    blockingSatisfaction: satisfaction,
    contextBundle: buildContextBundle(),
    executionOwner: 'fabric-os',
    orchestrator: 'bridge-os',
    note: WRITE
      ? 'fabric executed independent catalog runs; blocking satisfaction evaluated from witnesses'
      : 'dry-run — use --write to execute independent runs',
  };

  if (WRITE) {
    mkdirSync(join(FABRIC, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (CHECK && !existsSync(WITNESS)) {
    console.error('fabric-assurance-run CHECK FAIL — missing witness');
    process.exit(1);
  }

  console.log(`fabric-assurance-run ${witness.ok ? 'OK' : 'FAIL'}`);
  console.log(`  independent runs: ${executed.map((r) => `${r.id}:${r.ok ? 'ok' : 'fail'}`).join(', ') || 'none'}`);
  console.log(`  blocking: ${blocking.map((b) => b.id).join(', ') || 'none'}`);
  if (WRITE) console.log(`  witness: audit/evidence/fabric-assurance-latest.json`);
  process.exit(witness.ok ? 0 : 1);
}

main();
