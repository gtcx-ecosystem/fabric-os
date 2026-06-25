#!/usr/bin/env node
/**
 * MATURITY-LANE-FAB-005 — central assurance programme audit.
 * Usage: node platform/scripts/central-assurance-check.mjs [--write]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECOSYSTEM = join(ROOT, '..');
const PROGRAM = join(ROOT, 'pm/spec/central-assurance-program.json');
const FABRIC_BACKLOG = join(ROOT, 'machine/backlog.json');
const OUT = join(ROOT, 'audit/evidence/central-assurance-program-latest.json');
const WRITE = process.argv.includes('--write');

function readJson(p) {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const program = readJson(PROGRAM);
const patterns = program?.productRepoRules?.forbiddenStoryPatterns ?? [];
const productRepos = [
  'terminal-os',
  'markets-os',
  'terra-os',
  'compliance-os',
  'ledger-ui',
  'gtcx-os',
  'exploration-os',
];

function storyMatchesPattern(id) {
  return patterns.some((pat) => {
    const re = new RegExp(`^${pat.replace(/\*/g, '.*')}$`);
    return re.test(id);
  });
}

function openAssuranceStoriesInRepo(repoId) {
  const backlogPath = join(ECOSYSTEM, repoId, 'machine/backlog.json');
  const backlog = readJson(backlogPath);
  if (!backlog) return { repoId, missingBacklog: true, violations: [] };
  const stories = backlog.stories ?? backlog.items ?? [];
  const violations = [];
  for (const s of stories) {
    const id = String(s.id ?? s.storyId ?? '');
    const status = String(s.status ?? 'open');
    if (!['open', 'in_progress', 'in-progress', 'blocked'].includes(status)) continue;
    if (storyMatchesPattern(id)) violations.push(id);
  }
  return { repoId, missingBacklog: false, violations };
}

const fabricBacklog = readJson(FABRIC_BACKLOG);
const fabricStories = fabricBacklog?.stories ?? [];
const programmeIds = new Set();
for (const p of program?.programmes ?? []) {
  for (const id of p.stories ?? []) programmeIds.add(id);
}

const fabricHasProgramme = [...programmeIds].filter((id) =>
  fabricStories.some((s) => String(s.id) === id && String(s.status) !== 'done'),
);

const productAudits = productRepos.map(openAssuranceStoriesInRepo);
const productViolations = productAudits.filter((a) => a.violations.length > 0);

const checks = {
  programSpec: { ok: Boolean(program?.lane === 'externalAssurance') },
  fabricBacklog: { ok: existsSync(FABRIC_BACKLOG) },
  productReposClean: {
    ok: productViolations.length === 0,
    detail: productViolations.length
      ? productViolations.map((v) => `${v.repoId}:${v.violations.join(',')}`).join('; ')
      : 'no open assurance stories in product repos',
  },
};

const ok = Object.values(checks).every((c) => c.ok);

const witness = {
  schema: 'gtcx://fabric-os/central-assurance-program-check/v1',
  storyId: 'MATURITY-LANE-FAB-005',
  policy: 'GS-MATURITY-LANE-001',
  checkedAt: new Date().toISOString(),
  ok,
  checks,
  programme: {
    id: program?.initiative,
    openFabricAssuranceStories: fabricHasProgramme,
    productRepoAudits: productAudits,
  },
  blocksEngineeringMaturity: false,
  blocksIntegratorPilotGtm: false,
  lane: 'externalAssurance',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const [k, v] of Object.entries(checks)) {
  console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${v.detail ? ` — ${v.detail}` : ''}`);
}
console.log(`${ok ? 'PASS' : 'FAIL'} — central-assurance:check`);
if (WRITE) console.log(`witness: ${OUT.slice(ROOT.length + 1)}`);
process.exit(ok ? 0 : 1);
