#!/usr/bin/env node
/**
 * SECAS-S4-03 — standing vulnerability management cadence + friction register hygiene.
 * Usage: node secas-vuln-cadence-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER = join(ROOT, 'pm/security-friction-register.json');
const POLICY_JSON = join(ROOT, 'pm/spec/vuln-cadence-policy.json');
const SUPPLY_POLICY = join(ROOT, 'pm/spec/supply-chain-cve-policy.json');
const POLICY_DOC = join(ROOT, 'docs/operations/secas/vuln-cadence.md');
const FRICTION_ID = 'SEC-VULN-01';
const OUT = join(ROOT, 'audit/evidence/secas-vuln-cadence-latest.json');
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

function readText(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function hasSections(text, sections) {
  const missing = sections.filter((s) => !text.includes(s));
  return { ok: missing.length === 0, missing };
}

function openSecItems(reg) {
  return (reg?.items ?? []).filter(
    (i) =>
      i.id?.startsWith('SEC-') &&
      ['open', 'pending'].includes(String(i.status ?? '').toLowerCase()),
  );
}

function hygieneForItem(item) {
  const owner = Boolean(item.repo?.trim());
  const unblock = Boolean(String(item.infraAction ?? '').trim());
  const acceptance = Boolean(String(item.acceptance ?? '').trim());
  return {
    id: item.id,
    status: item.status,
    repo: item.repo ?? null,
    owner,
    unblock,
    acceptance,
    ok: owner && unblock && acceptance,
  };
}

const gates = {};

gates.frictionItem = { ok: false };
const reg = readJson(REGISTER);
if (reg) {
  const item = (reg.items ?? []).find((i) => i.id === FRICTION_ID);
  gates.frictionItem = {
    ok: Boolean(item && item.storyId === 'SECAS-S4-03'),
    status: item?.status ?? null,
    storyId: item?.storyId ?? null,
  };
}

const policyJson = readJson(POLICY_JSON);
gates.policyJson = {
  ok: Boolean(
    policyJson?.storyId === 'SECAS-S4-03' &&
      policyJson?.slaTiers?.P0 &&
      policyJson?.slaTiers?.P1 &&
      policyJson?.slaTiers?.P2 &&
      policyJson?.cadence?.triageFrequency === 'weekly',
  ),
  triageFrequency: policyJson?.cadence?.triageFrequency ?? null,
};

const policyText = readText(POLICY_DOC);
gates.policyDoc = {
  ok: existsSync(POLICY_DOC),
  ...hasSections(policyText, ['## Weekly triage', '## SLA tiers', '## Friction register hygiene']),
};

gates.supplyChainAlignment = {
  ok: existsSync(SUPPLY_POLICY) && policyText.includes('supply-chain-policy.md'),
};

const hygiene = openSecItems(reg).map(hygieneForItem);
gates.openSecHygiene = {
  ok: hygiene.length > 0 && hygiene.every((h) => h.ok),
  count: hygiene.length,
  items: hygiene,
};

gates.weeklyTriage = {
  ok: Boolean(policyJson?.cadence?.witnessPath && policyJson?.cadence?.rollupCommand),
  witnessPath: policyJson?.cadence?.witnessPath ?? null,
};

const structuralOk =
  gates.frictionItem.ok &&
  gates.policyJson.ok &&
  gates.policyDoc.ok &&
  gates.supplyChainAlignment.ok &&
  gates.openSecHygiene.ok &&
  gates.weeklyTriage.ok;

const witness = {
  schema: 'gtcx://fabric-os/secas-vuln-cadence-check/v1',
  storyId: 'SECAS-S4-03',
  frictionId: FRICTION_ID,
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  policy: {
    json: 'pm/spec/vuln-cadence-policy.json',
    doc: 'docs/operations/secas/vuln-cadence.md',
  },
  gates,
  openSecItems: hygiene,
  ok: structuralOk,
  phase: 'cadence-hygiene',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    const detail =
      v.missing?.length
        ? ` (missing: ${v.missing.join(', ')})`
        : v.count != null
          ? ` (${v.items?.filter((i) => i.ok).length ?? 0}/${v.count} hygiene pass)`
          : v.status
            ? ` (${v.status})`
            : '';
    console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${detail}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — SECAS-S4-03 vuln cadence (hygiene)`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
