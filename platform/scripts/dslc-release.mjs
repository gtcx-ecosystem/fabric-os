#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACT = JSON.parse(readFileSync(join(ROOT, 'machine/spec/dslc-contract.json'), 'utf8'));
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function arg(name) {
  return process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

function applies(control, releaseClass) {
  return control.requiredFor.includes('all') || control.requiredFor.includes(releaseClass);
}

function safeId(value) {
  return value.replace(/[^A-Za-z0-9._-]/g, '-');
}

function renderReport(witness) {
  const rows = Object.values(witness.lanes)
    .map(
      (lane) =>
        `| ${lane.name} | ${lane.required ? 'yes' : 'no'} | ${lane.score100}/100 | ${lane.controlsAtBenchmark}/${lane.controlCount} |`
    )
    .join('\n');
  const blockers = witness.blockers.length
    ? witness.blockers
        .map((blocker) => `- **${blocker.lane}:** ${blocker.control} — ${blocker.reason}`)
        .join('\n')
    : '- None.';

  return `---
title: "GTCX DSLC release decision — ${witness.releaseId}"
status: current
date: ${witness.date}
owner: ${witness.owner}
authority: GTCX-DSLC-001
version: 1.0.0
---

# GTCX DSLC Release Decision — ${witness.releaseId}

Decision: **${witness.decision}**. Score: **${witness.score100}/100**.

| Lane | Required | Score | Controls at benchmark |
| ---- | -------- | ----: | --------------------: |
${rows}

## QASC

- Score: ${witness.qasc.score100}/100
- SIGNAL: ${witness.qasc.signalLevel}
- Evidence: \`${witness.qasc.evidence}\`

## Blockers

${blockers}
`;
}

const manifestArg = arg('--manifest');
if (!manifestArg) fail('Usage: dslc-release.mjs --manifest <path> [--write] [--json]');

const manifestPath = resolve(process.cwd(), manifestArg);
if (!existsSync(manifestPath)) fail(`DSLC manifest not found: ${manifestArg}`);

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`DSLC manifest is not valid JSON: ${error.message}`);
}

const structuralErrors = [];
if (manifest.schema !== 'gtcx://fabric-os/dslc-release-manifest/v1')
  structuralErrors.push('invalid schema');
for (const field of ['releaseId', 'repo', 'releaseClass', 'title', 'owner']) {
  if (!manifest[field] || typeof manifest[field] !== 'string')
    structuralErrors.push(`missing ${field}`);
}
if (!CONTRACT.releaseClasses[manifest.releaseClass]) structuralErrors.push('unknown releaseClass');
for (const lane of Object.keys(CONTRACT.lanes)) {
  if (!manifest.lanes?.[lane] || !Array.isArray(manifest.lanes[lane].controls)) {
    structuralErrors.push(`missing lanes.${lane}.controls`);
  }
}
if (!manifest.qasc || typeof manifest.qasc.score100 !== 'number' || !manifest.qasc.evidence) {
  structuralErrors.push('invalid qasc evidence');
}
if (structuralErrors.length)
  fail(`DSLC manifest invalid (${basename(manifestPath)}): ${structuralErrors.join(', ')}`);

const requiredLanes = new Set(CONTRACT.releaseClasses[manifest.releaseClass].requiredLanes);
const blockers = [];
const lanes = {};

for (const [laneName, laneContract] of Object.entries(CONTRACT.lanes)) {
  const required = requiredLanes.has(laneName);
  const applicable = required
    ? laneContract.controls.filter((control) => applies(control, manifest.releaseClass))
    : [];
  const observed = new Map(
    manifest.lanes[laneName].controls.map((control) => [control.id, control])
  );
  const results = applicable.map((control) => {
    const entry = observed.get(control.id);
    const evidenced = (entry?.evidence?.length ?? 0) > 0;
    const approvedNotApplicable =
      entry?.status === 'not-applicable' &&
      evidenced &&
      Boolean(entry.rationale?.trim()) &&
      Boolean(entry.approver?.trim());
    const atBenchmark = (entry?.status === 'satisfied' && evidenced) || approvedNotApplicable;
    if (!atBenchmark) {
      blockers.push({
        lane: laneName,
        control: control.id,
        authorityClass: control.authorityClass,
        reason: entry
          ? `status=${entry.status}; evidence=${entry.evidence?.length ?? 0}`
          : 'control missing',
      });
    }
    return {
      id: control.id,
      authorityClass: control.authorityClass,
      status: entry?.status ?? 'missing',
      evidence: entry?.evidence ?? [],
      rationale: entry?.rationale ?? null,
      approver: entry?.approver ?? null,
      atBenchmark,
    };
  });
  const controlsAtBenchmark = results.filter((control) => control.atBenchmark).length;
  lanes[laneName] = {
    name: laneName,
    owner: manifest.lanes[laneName].owner,
    required,
    score100: applicable.length ? Math.round((controlsAtBenchmark / applicable.length) * 100) : 100,
    controlsAtBenchmark,
    controlCount: applicable.length,
    controls: results,
  };
}

const qascAtBenchmark =
  manifest.qasc.score100 >= CONTRACT.qascRelationship.minimumScore100 &&
  manifest.qasc.signalLevel === CONTRACT.qascRelationship.minimumSignalLevel;
if (!qascAtBenchmark) {
  blockers.unshift({
    lane: 'deployment',
    control: 'qa-qasc-acceptance',
    authorityClass: 'R',
    reason: `QASC ${manifest.qasc.score100}/100; SIGNAL ${manifest.qasc.signalLevel}`,
  });
}

const requiredLaneResults = [...requiredLanes].map((lane) => lanes[lane]);
const scoreComponents = [
  qascAtBenchmark ? 100 : 0,
  ...requiredLaneResults.map((lane) => lane.score100),
];
const score100 = Math.round(
  scoreComponents.reduce((sum, score) => sum + score, 0) / scoreComponents.length
);
const ready = qascAtBenchmark && requiredLaneResults.every((lane) => lane.score100 === 100);
const blocked = blockers.some((blocker) => blocker.authorityClass === 'S');
const generatedAt = new Date().toISOString();
const witness = {
  schema: 'gtcx://fabric-os/dslc-release-decision/v1',
  generatedAt,
  date: generatedAt.slice(0, 10),
  protocolId: CONTRACT.protocolId,
  contractVersion: CONTRACT.version,
  manifest: manifestArg,
  releaseId: manifest.releaseId,
  repo: manifest.repo,
  releaseClass: manifest.releaseClass,
  title: manifest.title,
  owner: manifest.owner,
  requiredLanes: [...requiredLanes],
  qasc: { ...manifest.qasc, atBenchmark: qascAtBenchmark },
  lanes,
  score100,
  benchmarkScore100: 100,
  decision: ready ? 'ready' : blocked ? 'blocked' : 'incomplete',
  atBenchmark: ready,
  blockers,
};

if (WRITE) {
  const id = safeId(manifest.releaseId);
  const evidence = join(ROOT, `audit/evidence/dslc-release-${id}-latest.json`);
  const report = join(ROOT, `audit/reports/dslc-decision-${id}-${witness.date}.md`);
  mkdirSync(dirname(evidence), { recursive: true });
  mkdirSync(dirname(report), { recursive: true });
  writeFileSync(evidence, `${JSON.stringify(witness, null, 2)}\n`);
  writeFileSync(report, renderReport(witness));
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log(`GTCX DSLC release ${manifest.releaseId}: ${witness.decision} · ${score100}/100`);
  for (const lane of Object.values(lanes)) {
    console.log(`${lane.name}: ${lane.score100}/100 · required=${lane.required}`);
  }
  if (WRITE)
    console.log(`witness=audit/evidence/dslc-release-${safeId(manifest.releaseId)}-latest.json`);
}

process.exit(ready ? 0 : 1);
