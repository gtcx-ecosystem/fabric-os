#!/usr/bin/env node
/**
 * AI-cost governance gate (fabric-os).
 *
 * Enforcement teeth for the AI-Ops Cost Intelligence Platform: fails CI when a repo's
 * estimated AI spend exceeds its aiBudget, when the fleet estimate breaches the cap, when
 * a repo lacks a budget binding, or when the fleet manifest is stale/missing.
 *
 * SoR (bridge-os): repo-persona-profiles.json (aiBudget), ai-cost-governance.json (fleet cap),
 * machine/ci/ai-cost-manifest-latest.json (generated fleet rollup).
 *
 * Usage: node platform/scripts/ai-cost-check.mjs [--write] [--json] [--max-stale-days N]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
// bridge-os SoR location — override for CI/worktree contexts (default: sibling checkout).
const BRIDGE = process.env.AI_COST_BRIDGE_DIR ?? join(ROOT, '..', 'bridge-os');
const OUT = join(ROOT, 'audit/evidence/ai-cost-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const staleIdx = process.argv.indexOf('--max-stale-days');
const MAX_STALE_DAYS = staleIdx >= 0 ? Number(process.argv[staleIdx + 1]) : 14;

const GOV = join(BRIDGE, 'machine/spec/ai-cost-governance.json');
const PROFILES = join(BRIDGE, 'machine/spec/repo-persona-profiles.json');
const FLEET = join(BRIDGE, 'machine/ci/ai-cost-manifest-latest.json');

const loadJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const round = (n) => Math.round(n * 100) / 100;

const gov = loadJson(GOV);
const profiles = loadJson(PROFILES);
const fleet = loadJson(FLEET);

const violations = [];
const gates = {};

// 1. SoR presence
gates.governanceSoR = { ok: !!gov };
gates.budgetPolicySoR = { ok: !!profiles };
gates.fleetManifest = { ok: !!fleet };
if (!gov) violations.push('ai-cost-governance.json missing');
if (!profiles) violations.push('repo-persona-profiles.json missing');
if (!fleet) violations.push('fleet manifest missing — run `pnpm --dir ../bridge-os ai:cost:manifest:write`');

// 2. Every repo has an aiBudget binding
if (profiles) {
  const unbound = Object.entries(profiles.repos)
    .filter(([, r]) => !r.aiBudget || !r.aiBudget.tenantId)
    .map(([name]) => name);
  gates.budgetsBound = { ok: unbound.length === 0, unbound };
  if (unbound.length) violations.push(`repos without aiBudget: ${unbound.join(', ')}`);
}

// 3. Fleet estimate within cap; 4. no repo over its budget; 5. freshness
if (fleet && gov) {
  const cap = gov.budgets?.find((b) => b.name === 'gtcx-ai-fleet-monthly')?.amountUsd ?? null;
  const est = fleet.totals?.estimatedMonthlyUsd ?? 0;
  gates.withinFleetCap = { ok: cap == null || est <= cap, estimatedMonthlyUsd: est, capUsd: cap };
  if (cap != null && est > cap) violations.push(`fleet estimate $${est} exceeds cap $${cap}`);

  const over = (fleet.repos ?? []).filter((r) => !r.withinBudget).map((r) => `${r.repo} ($${r.estimateMonthlyUsd}/$${r.budgetMonthlyUsd})`);
  gates.perRepoBudget = { ok: over.length === 0, over };
  if (over.length) violations.push(`repos over budget: ${over.join(', ')}`);

  // freshness — generatedAt is set after the run; tolerate missing in offline contexts
  let ageDays = null;
  if (fleet.generatedAt) {
    ageDays = round((Date.parse(process.env.AI_COST_NOW ?? new Date().toISOString()) - Date.parse(fleet.generatedAt)) / 86_400_000);
  }
  gates.manifestFresh = { ok: ageDays == null || ageDays <= MAX_STALE_DAYS, ageDays, maxStaleDays: MAX_STALE_DAYS };
  if (ageDays != null && ageDays > MAX_STALE_DAYS) violations.push(`fleet manifest is ${ageDays}d old (> ${MAX_STALE_DAYS}d)`);
}

const ok = violations.length === 0 && Object.values(gates).every((g) => g.ok);
const witness = {
  schema: 'gtcx://fabric-os/ai-cost-check/v1',
  generatedAt: new Date().toISOString(),
  ok,
  gates,
  violations,
  sources: {
    governance: 'bridge-os/machine/spec/ai-cost-governance.json',
    budgets: 'bridge-os/machine/spec/repo-persona-profiles.json',
    fleetManifest: 'bridge-os/machine/ci/ai-cost-manifest-latest.json',
  },
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log(`ai-cost-check: ${ok ? 'OK' : 'FAIL'}`);
  for (const [name, g] of Object.entries(gates)) console.log(`  ${g.ok ? 'ok ' : 'XX '} ${name}`);
  if (violations.length) console.log('violations:\n  - ' + violations.join('\n  - '));
}

process.exit(ok ? 0 : 1);
