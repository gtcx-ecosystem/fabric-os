#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACT = JSON.parse(readFileSync(join(ROOT, 'machine/spec/ship-contract.json'), 'utf8'));
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
  const rows = Object.values(witness.pillars)
    .map(
      (pillar) =>
        `| ${pillar.name} | ${pillar.required ? 'yes' : 'no'} | ${pillar.score100}/100 | ${pillar.controlsAtBenchmark}/${pillar.controlCount} |`
    )
    .join('\n');
  const blockers = witness.blockers.length
    ? witness.blockers
        .map((blocker) => `- **${blocker.pillar}:** ${blocker.control} — ${blocker.reason}`)
        .join('\n')
    : '- None.';

  return `---
title: "GTCX SHIP release decision — ${witness.releaseId}"
status: current
date: ${witness.date}
owner: ${witness.owner}
authority: GTCX-SHIP-001
version: ${witness.contractVersion}
---

# GTCX SHIP Release Decision — ${witness.releaseId}

Decision: **${witness.decision}**. Score: **${witness.score100}/100**.

| Pillar | Required | Score | Controls at benchmark |
| ------ | -------- | ----: | --------------------: |
${rows}

## DSLC prerequisite

- Release: ${witness.dslc.releaseId}
- Decision: ${witness.dslc.decision}
- Score: ${witness.dslc.score100}/100
- Evidence: \`${witness.dslc.evidence}\`

## Blockers

${blockers}
`;
}

const manifestArg = arg('--manifest');
if (!manifestArg) fail('Usage: ship-release.mjs --manifest <path> [--write] [--json]');

const manifestPath = resolve(process.cwd(), manifestArg);
const outputRoot = resolve(process.cwd(), arg('--output-root') ?? ROOT);
if (!existsSync(manifestPath)) fail(`SHIP manifest not found: ${manifestArg}`);

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`SHIP manifest is not valid JSON: ${error.message}`);
}

const structuralErrors = [];
if (manifest.schema !== 'gtcx://fabric-os/ship-release-manifest/v1')
  structuralErrors.push('invalid schema');
for (const field of ['releaseId', 'repo', 'releaseClass', 'title', 'owner']) {
  if (!manifest[field] || typeof manifest[field] !== 'string')
    structuralErrors.push(`missing ${field}`);
}
if (!CONTRACT.releaseClasses[manifest.releaseClass]) structuralErrors.push('unknown releaseClass');
for (const pillar of Object.keys(CONTRACT.pillars)) {
  if (!manifest.pillars?.[pillar] || !Array.isArray(manifest.pillars[pillar].controls)) {
    structuralErrors.push(`missing pillars.${pillar}.controls`);
  }
}
if (
  !manifest.dslc ||
  typeof manifest.dslc.score100 !== 'number' ||
  !manifest.dslc.decision ||
  !manifest.dslc.evidence
) {
  structuralErrors.push('invalid dslc evidence');
}
if (structuralErrors.length)
  fail(`SHIP manifest invalid (${basename(manifestPath)}): ${structuralErrors.join(', ')}`);

const requiredPillars = new Set(CONTRACT.releaseClasses[manifest.releaseClass].requiredPillars);
const blockers = [];
const pillars = {};

for (const [pillarName, pillarContract] of Object.entries(CONTRACT.pillars)) {
  const required = requiredPillars.has(pillarName);
  const applicable = required
    ? pillarContract.controls.filter((control) => applies(control, manifest.releaseClass))
    : [];
  const observed = new Map(
    manifest.pillars[pillarName].controls.map((control) => [control.id, control])
  );
  const results = applicable.map((control) => {
    const entry = observed.get(control.id);
    const evidenced = (entry?.evidence?.length ?? 0) > 0;
    const approvalRequired = ['A', 'S'].includes(control.authorityClass);
    const approved = !approvalRequired || Boolean(entry?.approver?.trim());
    const approvedNotApplicable =
      entry?.status === 'not-applicable' &&
      evidenced &&
      Boolean(entry.rationale?.trim()) &&
      Boolean(entry.approver?.trim());
    const atBenchmark =
      (entry?.status === 'satisfied' && evidenced && approved) || approvedNotApplicable;
    if (!atBenchmark) {
      blockers.push({
        pillar: pillarName,
        control: control.id,
        authorityClass: control.authorityClass,
        reason: entry
          ? `status=${entry.status}; evidence=${entry.evidence?.length ?? 0}; approver=${
              entry.approver ?? 'missing'
            }`
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
  pillars[pillarName] = {
    name: pillarName,
    owner: manifest.pillars[pillarName].owner,
    required,
    score100: applicable.length ? Math.round((controlsAtBenchmark / applicable.length) * 100) : 100,
    controlsAtBenchmark,
    controlCount: applicable.length,
    controls: results,
  };
}

const dslcAtBenchmark =
  manifest.dslc.decision === CONTRACT.dslcRelationship.minimumDecision &&
  manifest.dslc.score100 >= CONTRACT.dslcRelationship.minimumScore100;
if (!dslcAtBenchmark) {
  blockers.unshift({
    pillar: 'sealed',
    control: 'dslc-decision-ready',
    authorityClass: 'R',
    reason: `DSLC ${manifest.dslc.decision}; ${manifest.dslc.score100}/100`,
  });
}

const requiredPillarResults = [...requiredPillars].map((pillar) => pillars[pillar]);
const scoreComponents = [
  dslcAtBenchmark ? 100 : 0,
  ...requiredPillarResults.map((pillar) => pillar.score100),
];
const score100 = Math.round(
  scoreComponents.reduce((sum, score) => sum + score, 0) / scoreComponents.length
);
const ready = dslcAtBenchmark && requiredPillarResults.every((pillar) => pillar.score100 === 100);
const blocked = blockers.some((blocker) => blocker.authorityClass === 'S');
const generatedAt = new Date().toISOString();
const witness = {
  schema: 'gtcx://fabric-os/ship-release-decision/v1',
  generatedAt,
  date: generatedAt.slice(0, 10),
  protocolId: CONTRACT.protocolId,
  contractVersion: CONTRACT.version,
  manifest: manifestArg,
  outputRoot,
  releaseId: manifest.releaseId,
  repo: manifest.repo,
  releaseClass: manifest.releaseClass,
  title: manifest.title,
  owner: manifest.owner,
  requiredPillars: [...requiredPillars],
  dslc: { ...manifest.dslc, atBenchmark: dslcAtBenchmark },
  pillars,
  score100,
  benchmarkScore100: 100,
  decision: ready ? 'ready' : blocked ? 'blocked' : 'incomplete',
  atBenchmark: ready,
  blockers,
};

if (WRITE) {
  const id = safeId(manifest.releaseId);
  const evidence = join(outputRoot, `audit/evidence/ship-release-${id}-latest.json`);
  const report = join(outputRoot, `audit/reports/ship-decision-${id}-${witness.date}.md`);
  mkdirSync(dirname(evidence), { recursive: true });
  mkdirSync(dirname(report), { recursive: true });
  writeFileSync(evidence, `${JSON.stringify(witness, null, 2)}\n`);
  writeFileSync(report, renderReport(witness));
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log(`GTCX SHIP release ${manifest.releaseId}: ${witness.decision} · ${score100}/100`);
  for (const pillar of Object.values(pillars)) {
    console.log(`${pillar.name}: ${pillar.score100}/100 · required=${pillar.required}`);
  }
  if (WRITE)
    console.log(`witness=audit/evidence/ship-release-${safeId(manifest.releaseId)}-latest.json`);
}

process.exit(ready ? 0 : 1);
