#!/usr/bin/env node
/**
 * XR-BASELINE-ROADMAP-INTAKE-001 — Baseline-os roadmap intake reconcile.
 *
 * Triages ecosystem roadmap intake items owned by fabric-os against the local
 * compiled backlog, classifying each as:
 *   - present      → already in fabric-os/machine/backlog.json
 *   - doneUpstream → completed in the ecosystem backlog, no local action
 *   - openTriaged  → open item with a recorded triage disposition
 *
 * Non-fabric-os intake items are counted as handed off to their owner repo
 * (Protocol 24 — implement in owner repo, not here).
 *
 * Usage: node baseline-roadmap-intake-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const INTAKE = join(ROOT, '..', 'agile-os/pm/ecosystem-sprint-backlog.json');
const LOCAL = join(ROOT, 'machine/backlog.json');
const OUT = join(ROOT, 'audit/evidence/m4-baseline-roadmap-intake-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

// Recorded triage dispositions for open fabric-os intake items.
const TRIAGE = {
  'Q3-FABRIC-03': {
    disposition: 'done',
    lane: 'engineeringMaturity',
    note: 'secas:supply-chain:check PASS + secas:pentest:remediation:check PASS (S4-04 external track) + composite 100 >= 85.',
  },
  'BL-SOC2-01': {
    disposition: 'external-lane',
    lane: 'externalAssurance',
    note: 'SOC2 external assurance — Class A auditor track; parallel sovereign gate, not automatable engineering work.',
  },
};

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const intake = readJson(INTAKE);
const local = readJson(LOCAL);
const localItems = (local?.items || local?.stories || []).map((s) => ({
  id: s.id,
  title: (s.title || '').toLowerCase(),
}));
const localIds = new Set(localItems.map((s) => s.id));
const localTitles = new Set(localItems.map((s) => s.title));

const allItems = intake?.items || [];
const ownerCounts = {};
for (const i of allItems) {
  const r = i.owner || 'unknown';
  ownerCounts[r] = (ownerCounts[r] || 0) + 1;
}

const fabItems = allItems.filter((i) => i.owner === 'fabric-os');
const buckets = { present: [], doneUpstream: [], openTriaged: [], openUntriaged: [] };
for (const i of fabItems) {
  const hit = localIds.has(i.id) || localTitles.has((i.title || '').toLowerCase());
  if (hit) {
    buckets.present.push(i.id);
  } else if (i.status === 'done') {
    buckets.doneUpstream.push(i.id);
  } else if (TRIAGE[i.id]) {
    buckets.openTriaged.push({ id: i.id, ...TRIAGE[i.id] });
  } else {
    buckets.openUntriaged.push({ id: i.id, title: i.title, priority: i.priority });
  }
}

const handedOff = allItems.length - fabItems.length;
const ok = buckets.openUntriaged.length === 0;

const witness = {
  schema: 'gtcx://fabric-os/baseline-roadmap-intake/v1',
  story: 'XR-BASELINE-ROADMAP-INTAKE-001',
  generatedAt: new Date().toISOString(),
  source: 'agile-os/pm/ecosystem-sprint-backlog.json',
  totals: {
    intakeItems: allItems.length,
    fabricOsOwned: fabItems.length,
    handedOffToOwnerRepo: handedOff,
  },
  ownerCounts,
  fabricTriage: {
    present: buckets.present.length,
    doneUpstream: buckets.doneUpstream.length,
    openTriaged: buckets.openTriaged.length,
    openUntriaged: buckets.openUntriaged.length,
  },
  detail: buckets,
  ok,
};

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log(`Intake items: ${witness.totals.intakeItems}`);
  console.log(`  fabric-os owned: ${witness.totals.fabricOsOwned}`);
  console.log(`  handed off to owner repo: ${witness.totals.handedOffToOwnerRepo}`);
  console.log(`fabric-os triage:`);
  console.log(`  OK present: ${buckets.present.length}`);
  console.log(`  OK doneUpstream: ${buckets.doneUpstream.length}`);
  console.log(`  OK openTriaged: ${buckets.openTriaged.length}`);
  console.log(
    `  ${ok ? 'OK' : 'FAIL'} openUntriaged: ${buckets.openUntriaged.length}`,
  );
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — XR-BASELINE-ROADMAP-INTAKE-001 reconcile`);
}

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(witness, null, 2) + '\n');
  if (!JSON_OUT) console.log(`witness: ${OUT}`);
}

process.exit(ok ? 0 : 1);
