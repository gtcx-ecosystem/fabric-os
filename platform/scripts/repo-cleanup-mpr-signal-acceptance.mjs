#!/usr/bin/env node
/**
 * GTCX Quality Assurance Protocol witness.
 *
 * Generates the mandatory report + machine artifact for GTCX-QAP-001, defined
 * in docs/operations/runbooks/repo-cleanup-mpr-signal-loop.md. This command is
 * intentionally conservative: it reports "complete" only when
 * existing evidence proves MPR 100/100, SIGNAL L5 / 100, clean worktree, phase
 * evidence, and no blockers. It does not run remediation commands.
 *
 * Usage:
 *   node platform/scripts/repo-cleanup-mpr-signal-acceptance.mjs [--repo <name>] [--write] [--json]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SELF = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET = join(SELF, '..');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const arg = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const repoArg = arg('--repo');
const ROOT = repoArg ? join(FLEET, repoArg) : process.cwd();
const REPO = repoArg ?? (() => {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))?.name ?? basename(ROOT);
  } catch {
    return basename(ROOT);
  }
})();

const evidenceRel = 'audit/evidence';
const reportRel = `audit/reports/repo-cleanup-mpr-signal-acceptance-${new Date().toISOString().slice(0, 10)}.md`;
const artifactRel = 'audit/evidence/repo-cleanup-mpr-signal-acceptance-latest.json';
const protocolId = 'GTCX-QAP-001';
const protocolName = 'GTCX Quality Assurance Protocol';

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function list(rel) {
  try {
    return readdirSync(join(ROOT, rel));
  } catch {
    return [];
  }
}

function git(args) {
  const res = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return {
    exitCode: res.status ?? 1,
    stdout: (res.stdout ?? '').trim(),
    stderr: (res.stderr ?? '').trim(),
  };
}

function pnpmRun(args) {
  const res = spawnSync('pnpm', args, { cwd: ROOT, encoding: 'utf8' });
  return {
    command: `pnpm ${args.join(' ')}`,
    exitCode: res.status ?? 1,
    stdout: (res.stdout ?? '').trim(),
    stderr: (res.stderr ?? '').trim(),
  };
}

function scripts() {
  return readJson('package.json')?.scripts ?? {};
}

function has(rel) {
  return existsSync(join(ROOT, rel));
}

function evidenceOk(rel) {
  const j = readJson(rel);
  if (!j) return false;
  if (j.ok === false || j.pass === false || j.clean === false) return false;
  if (Array.isArray(j.gates) && j.gates.some((g) => g.ok === false || g.pass === false)) return false;
  if (Array.isArray(j.blockers) && j.blockers.length > 0) return false;
  return true;
}

function anyEvidenceOk(...rels) {
  return rels.some((rel) => evidenceOk(rel));
}

function walkTextFiles(rel, out = []) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return out;
  for (const entry of readdirSync(abs)) {
    const childRel = `${rel}/${entry}`;
    if (/\/(archive|_delete|node_modules|\.git|dist|build|coverage)\b/.test(childRel)) continue;
    const childAbs = join(ROOT, childRel);
    let st = null;
    try { st = statSync(childAbs); } catch { continue; }
    if (st.isDirectory()) walkTextFiles(childRel, out);
    else if (/\.(md|json|ya?ml)$/i.test(entry)) out.push(childRel);
  }
  return out;
}

function operationalLaneIsolation() {
  const roots = ['docs', 'operations', 'machine', 'audit/reports'];
  const files = roots.flatMap((root) => walkTextFiles(root));
  const blockRe = /\b(no ship|ga blocked|release blocked|ship blocked|blocks product release|product release blocker|blocks engineering release|engineering release blocker)\b/i;
  const opsRe = /\b(pen[- ]?test|pentest|soc ?2|iso[- ]?27001|dpa|loi|legal|compliance|gtm|pilot|mobile store|store evidence|dr live failover|rpo|rto|sla|procurement assurance|external assurance|parallel assurance)\b/i;
  const allowRe = /blocksProductRelease["']?\s*:\s*true/i;
  const negativePolicyRe = /\b(must not|do not|never|does not|should not|not)\b.{0,80}\b(block|blocked|blocker|release gate|critical path)\b/i;

  const violations = [];
  for (const rel of files) {
    let text = '';
    try { text = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
    if (allowRe.test(text)) continue;
    if (!blockRe.test(text) || !opsRe.test(text)) continue;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!blockRe.test(line)) continue;
      const context = lines.slice(Math.max(0, i - 4), Math.min(lines.length, i + 5)).join(' ');
      if (!opsRe.test(context)) continue;
      if (negativePolicyRe.test(context) || /blocksIR:\s*false|blocksEngineeringMaturity:\s*false|blocksGtmStage:\s*false/i.test(context)) continue;
      violations.push({ path: rel, line: i + 1, excerpt: line.trim().slice(0, 240) });
    }
  }
  return { ok: violations.length === 0, violations };
}

function scoreFromCheck(ok, applicable = true) {
  if (!applicable) return 100;
  return ok ? 100 : 0;
}

function controlRow(area, {
  score100,
  benchmark100 = 100,
  applicable = true,
  evidence,
  mpr,
  signal,
  blocker = null,
}) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score100 ?? 0)));
  return {
    area,
    score100: normalizedScore,
    benchmark100,
    applicable,
    evidence,
    mpr,
    signal,
    blocker: normalizedScore >= benchmark100 ? null : blocker,
  };
}

function microsOf(pillar) {
  if (!pillar) return [];
  if (Array.isArray(pillar.microAudits)) return pillar.microAudits;
  if (Array.isArray(pillar.micros)) return pillar.micros;
  if (pillar.microGroups) return Object.values(pillar.microGroups).flat();
  return [];
}

function taxonomyMicroAudits(tier) {
  const taxonomy = readJson('machine/spec/aaas-audit-taxonomy.json')
    ?? (() => {
      try {
        return JSON.parse(readFileSync(join(SELF, 'machine/spec/aaas-audit-taxonomy.json'), 'utf8'));
      } catch {
        return null;
      }
    })();
  const pillars = taxonomy?.tiers?.[tier]?.pillars ?? [];
  return pillars.map((pillarId) => ({
    pillar: pillarId,
    score100: null,
    status: 'unverified',
    microAudits: microsOf(taxonomy?.pillars?.[pillarId]).map((id) => ({
      id,
      score100: null,
      benchmark100: 100,
      evidence: [],
    })),
  }));
}

function mprScores() {
  const mpr = readJson('audit/evidence/mpr-repo-latest.json');
  return {
    source: mpr ? 'audit/evidence/mpr-repo-latest.json' : null,
    composite100: mpr?.composite100 ?? null,
    foundationComposite100: mpr?.foundationComposite100 ?? null,
    fullComposite100: mpr?.fullComposite100 ?? null,
    pillars: Object.fromEntries(Object.entries(mpr?.quadrants ?? {}).map(([k, v]) => [k, {
      score100: v?.score100 ?? null,
      published: v?.published ?? null,
      provisional: v?.provisional ?? null,
      blockedBy: v?.blockedBy ?? null,
    }])),
  };
}

function signalScores() {
  const signal = readJson('audit/evidence/signal-maturity-latest.json');
  const score100 = signal?.overall === 5 ? 100 : signal?.overall != null ? signal.overall * 20 : null;
  return {
    source: signal ? 'audit/evidence/signal-maturity-latest.json' : null,
    level: signal?.overallLabel ?? null,
    score100,
    dimensions: Object.fromEntries((signal?.dimensions ?? []).map((d) => [d.dimension, {
      level: d.level,
      label: d.label,
      primaryBlocker: d.primaryBlocker ?? null,
      gaps: d.gaps ?? [],
    }])),
  };
}

function buildWitness() {
  const status = git(['status', '-sb']);
  const statusLines = status.stdout.split('\n').filter(Boolean);
  const clean = status.exitCode === 0 && statusLines.length <= 1;
  const branch = statusLines[0]?.replace(/^##\s*/, '') ?? null;
  const commit = git(['rev-parse', 'HEAD']).stdout || null;
  const sc = scripts();
  const scriptKeys = Object.keys(sc);
  const script = (name) => scriptKeys.includes(name);
  const forbiddenRoots = ['pm', 'ops', 'agentic', 'reports', '.claude', '.cursor', '.gemini', '.kimi']
    .filter((entry) => has(entry));
  const linkEvidence = list(evidenceRel).filter((f) => /link|docs|folder|root|hygiene/.test(f));
  const mpr = mprScores();
  const signal = signalScores();

  const inventoryOk = evidenceOk('audit/evidence/repo-folder-file-spec-inventory-latest.json');
  const archiveOk = !has('audit/archive')
    ? true
    : evidenceOk('audit/evidence/repo-cleanup-archive-manifest-latest.json');
  const docsOk = anyEvidenceOk(
    'audit/evidence/docs-ia-latest.json',
    'audit/evidence/docs-folder-hygiene-latest.json',
    'audit/evidence/docs-operations-latest.json',
    'audit/evidence/docs-product-latest.json',
  );
  const roadmapOk = anyEvidenceOk(
    'audit/evidence/docs-roadmap-latest.json',
    'audit/evidence/product-roadmap-lane-isolation-latest.json',
    'audit/evidence/m4-baseline-roadmap-intake-latest.json',
  );
  const featureOk = script('docs:feature-spec:check')
    ? anyEvidenceOk('audit/evidence/docs-feature-spec-latest.json', 'audit/evidence/feature-spec-latest.json')
    : false;
  const agileApplicable = script('agile:check') || script('docs:agile:check') || has('agile');
  const agileOk = agileApplicable ? anyEvidenceOk('audit/evidence/agile-latest.json') : null;
  const opsApplicable = script('operations:check') || script('operations:consumption:check') || has('operations');
  const opsOk = opsApplicable ? anyEvidenceOk(
    'audit/evidence/ops-latest.json',
    'audit/evidence/deployment-ops-contract-check-latest.json',
    'audit/evidence/fabric-ops-policy-contract-latest.json',
  ) : null;
  const p22Applicable = script('agent:next-work');
  const fabricApplicable = REPO === 'fabric-os' || script('aaas:loop') || script('daas:fleet:health');
  const fabricOk = fabricApplicable ? [
    'audit/evidence/aaas-contract-check-latest.json',
    'audit/evidence/aaas-cadence-latest.json',
    'audit/evidence/aaas-honesty-gate-latest.json',
    'audit/evidence/aaas-ownership-latest.json',
    'audit/evidence/aaas-hygiene-check-latest.json',
    'audit/evidence/daas-cards-check-latest.json',
    'audit/evidence/daas-friction-check-latest.json',
  ].every((rel) => evidenceOk(rel)) : null;
  const p22Run = p22Applicable ? pnpmRun(['agent:next-work', '--json']) : null;
  const p22Output = `${p22Run?.stdout ?? ''}${p22Run?.stderr ? `\n${p22Run.stderr}` : ''}`;
  const p22Blocked = /Persona read gate BLOCKED|personaReadGateBlocked["']?\s*:\s*true/.test(p22Output);
  const p22ScoreReady = p22Run ? p22Run.exitCode === 0 && !p22Blocked : null;
  const mprComplete = mpr.composite100 === 100;
  const signalComplete = signal.level === 'L5' && signal.score100 === 100;
  const rootOk = forbiddenRoots.length === 0;
  const linkOk = linkEvidence.length > 0 && docsOk;
  const laneIsolation = operationalLaneIsolation();
  const crossRepoOk = anyEvidenceOk(
    'audit/evidence/aaas-contract-check-latest.json',
    'audit/evidence/fleet-ops-assurance-check-latest.json',
    'audit/evidence/fabric-ops-policy-contract-latest.json',
  );

  const rows = [
    controlRow('Worktree clean', { score100: scoreFromCheck(clean), evidence: status.stdout || 'git status unavailable', mpr: ['Craft', 'Trust & Safety'], signal: ['Grounded'], blocker: 'worktree is dirty' }),
    controlRow('Critical docs preserved', { score100: scoreFromCheck(inventoryOk), evidence: 'audit/evidence/repo-folder-file-spec-inventory-latest.json', mpr: ['Trust & Safety', 'Defensive Moat', 'IP Magic'], signal: ['Lossless', 'Specific'], blocker: 'inventory witness missing or below benchmark' }),
    controlRow('Feature/spec registry', { score100: scoreFromCheck(featureOk), evidence: 'docs:feature-spec:check evidence', mpr: ['Commercial Value', 'Product/Ecosystem Integration'], signal: ['Specific', 'Integrated', 'Actionable'], blocker: 'feature/spec validation below benchmark' }),
    controlRow('Documentation hygiene', { score100: scoreFromCheck(docsOk), evidence: 'docs evidence witnesses', mpr: ['Compliance', 'World Class', 'Trust & Safety'], signal: ['Navigable', 'Grounded', 'Lossless'], blocker: 'documentation hygiene below benchmark' }),
    controlRow('Roadmap/goals/milestones', { score100: scoreFromCheck(roadmapOk), evidence: 'roadmap/goals/milestone evidence', mpr: ['Commercial Value', 'Agentic Empowerment'], signal: ['Actionable', 'Integrated'], blocker: 'roadmap/goals/milestones below benchmark' }),
    controlRow('Agile workflow', { score100: scoreFromCheck(agileOk, agileApplicable), applicable: agileApplicable, evidence: agileApplicable ? 'agile command evidence' : 'not applicable to this repo profile', mpr: ['Product/Ecosystem Integration', 'Craft'], signal: ['Actionable', 'Integrated'], blocker: 'agile workflow below benchmark' }),
    controlRow('Ops contract', { score100: scoreFromCheck(opsOk, opsApplicable), applicable: opsApplicable, evidence: opsApplicable ? 'ops command evidence' : 'not applicable to this repo profile', mpr: ['Technical Excellence', 'Compliance'], signal: ['Grounded', 'Integrated'], blocker: 'ops contract below benchmark' }),
    controlRow('P22/runtime', { score100: scoreFromCheck(p22ScoreReady, p22Applicable), applicable: p22Applicable, evidence: p22Run ? `pnpm agent:next-work --json exit ${p22Run.exitCode}` : 'agent:next-work unavailable for this repo profile', mpr: ['Agentic Empowerment', 'Compliance'], signal: ['Actionable', 'Specific'], blocker: 'P22 runtime below benchmark or emitted a blocking gate' }),
    controlRow('Fabric AaaS/DaaS', { score100: scoreFromCheck(fabricOk, fabricApplicable), applicable: fabricApplicable, evidence: fabricApplicable ? 'AaaS/DaaS evidence witnesses' : 'not applicable to this repo profile', mpr: ['Technical Excellence', 'World Class'], signal: ['Grounded', 'Actionable'], blocker: 'AaaS/DaaS evidence below benchmark' }),
    controlRow('Operational lane isolation', { score100: scoreFromCheck(laneIsolation.ok), evidence: laneIsolation.ok ? 'operational lane scan clean' : laneIsolation.violations.map((v) => `${v.path}:${v.line}`).join(', '), mpr: ['Product/Ecosystem Integration', 'Compliance'], signal: ['Integrated', 'Actionable'], blocker: 'operational lane item is rendered as a product/GA release blocker' }),
    controlRow('Foundational micro-audits', { score100: mprComplete ? 100 : Number(mpr.foundationComposite100 ?? mpr.composite100 ?? 0), evidence: 'mpr.foundational.microAudits', mpr: ['Foundational MPR tier'], signal: ['Specific', 'Grounded'], blocker: 'foundational MPR micro-audits below benchmark' }),
    controlRow('Transformational micro-audits', { score100: mprComplete ? 100 : Number(mpr.fullComposite100 ?? mpr.composite100 ?? 0), evidence: 'mpr.transformational.microAudits', mpr: ['Transformational MPR tier'], signal: ['Integrated', 'Actionable', 'Lossless'], blocker: 'transformational MPR micro-audits below benchmark' }),
    controlRow('Root hygiene', { score100: scoreFromCheck(rootOk), evidence: forbiddenRoots.length ? forbiddenRoots.join(', ') : 'root scan clean', mpr: ['Compliance', 'Craft'], signal: ['Navigable'], blocker: 'forbidden live roots present' }),
    controlRow('Link/reference hygiene', { score100: scoreFromCheck(linkOk), evidence: linkEvidence.join(', ') || 'no link evidence', mpr: ['World Class', 'Trust & Safety'], signal: ['Navigable', 'Grounded'], blocker: 'link/reference hygiene below benchmark' }),
    controlRow('Cross-repo contract', { score100: scoreFromCheck(crossRepoOk), evidence: 'contract evidence witnesses', mpr: ['Product/Ecosystem Integration'], signal: ['Integrated'], blocker: 'cross-repo contract evidence below benchmark' }),
    controlRow('Archive recoverability', { score100: scoreFromCheck(archiveOk), evidence: 'audit/evidence/repo-cleanup-archive-manifest-latest.json', mpr: ['Trust & Safety', 'Defensive Moat'], signal: ['Lossless'], blocker: 'archive manifest missing or below benchmark' }),
  ];

  const blockers = rows
    .filter((row) => row.score100 < row.benchmark100)
    .map((row) => ({ area: row.area, score100: row.score100, benchmark100: row.benchmark100, blocker: row.blocker, evidence: row.evidence }));
  if (!signalComplete) {
    blockers.push({ area: 'SIGNAL', score100: signal.score100 ?? 0, benchmark100: 100, blocker: 'SIGNAL is below L5 / 100', evidence: signal.source ?? 'missing signal witness' });
  }
  if (!mprComplete) {
    blockers.push({ area: 'MPR', score100: mpr.composite100 ?? 0, benchmark100: 100, blocker: 'MPR cleanup composite is below 100/100', evidence: mpr.source ?? 'missing MPR witness' });
  }

  const decision = blockers.length === 0 ? 'complete' : 'incomplete';
  const phaseResults = {
    documentationTaxonomyLifecycle: { score100: scoreFromCheck(docsOk), benchmark100: 100, loopUntil: 'score100 >= benchmark100', evidence: ['docs evidence witnesses'] },
    featureSpecRegistryPrd: { score100: scoreFromCheck(featureOk), benchmark100: 100, loopUntil: 'score100 >= benchmark100', evidence: ['docs:feature-spec:check evidence'] },
    roadmapGoalsMilestonesWorkstream: { score100: scoreFromCheck(roadmapOk), benchmark100: 100, loopUntil: 'score100 >= benchmark100', evidence: ['roadmap/goals/milestone evidence'] },
    operationalLaneIsolation: { score100: scoreFromCheck(laneIsolation.ok), benchmark100: 100, loopUntil: 'score100 >= benchmark100', evidence: laneIsolation.violations },
    foundationalMicroAudits: { score100: rows.find((row) => row.area === 'Foundational micro-audits')?.score100 ?? 0, benchmark100: 100, loopUntil: 'score100 >= benchmark100', evidence: [mpr.source].filter(Boolean) },
    transformationalMicroAudits: { score100: rows.find((row) => row.area === 'Transformational micro-audits')?.score100 ?? 0, benchmark100: 100, loopUntil: 'score100 >= benchmark100', evidence: [mpr.source].filter(Boolean) },
  };
  const phaseLoop = rows.map((row, index) => ({
    phase: index,
    area: row.area,
    score100: row.score100,
    benchmark100: row.benchmark100,
    applicable: row.applicable,
    loopUntil: 'score100 >= benchmark100',
    nextRemediation: row.score100 < row.benchmark100 ? row.blocker : null,
  }));

  return {
    schema: 'gtcx://fabric-os/gtcx-qap-repository-acceptance/v1',
    protocolId,
    protocolName,
    compatibilitySchema: 'gtcx://fabric-os/repo-cleanup-mpr-signal-acceptance/v1',
    repo: REPO,
    branch,
    commit,
    generatedAt: new Date().toISOString(),
    runbook: 'docs/operations/runbooks/repo-cleanup-mpr-signal-loop.md',
    decision,
    loop: {
      iteration: 1,
      target: { mprComposite100: 100, signalLevel: 'L5', signalScore100: 100 },
      current: { mprComposite100: mpr.composite100, signalLevel: signal.level, signalScore100: signal.score100 },
      blockers,
      nextRemediation: blockers[0] ?? null,
    },
    mpr: {
      composite100: mpr.composite100,
      source: mpr.source,
      pillars: mpr.pillars,
      foundational: {
        score100: mpr.foundationComposite100 ?? null,
        microAudits: taxonomyMicroAudits('foundational'),
      },
      transformational: {
        score100: mpr.fullComposite100 ?? null,
        microAudits: taxonomyMicroAudits('transformational'),
      },
    },
    signal,
    phaseResults,
    phaseLoop,
    inventory: {
      path: 'audit/evidence/repo-folder-file-spec-inventory-latest.json',
      lossless: inventoryOk,
    },
    archive: {
      path: 'audit/evidence/repo-cleanup-archive-manifest-latest.json',
      recoverable: archiveOk,
    },
    acceptanceTable: rows,
    commands: [
      { command: 'git status -sb', cwd: ROOT, exitCode: status.exitCode, evidencePath: null, ownerContract: REPO, consumerContract: REPO, mprPillars: ['Craft', 'Trust & Safety'], signalDimensions: ['Grounded'] },
      ...(p22Run ? [{
        command: p22Run.command,
        cwd: ROOT,
        exitCode: p22Run.exitCode,
        evidencePath: null,
        stdout: p22Run.stdout.slice(0, 12000),
        stderr: p22Run.stderr.slice(0, 4000),
        ownerContract: 'bridge-os',
        consumerContract: REPO,
        mprPillars: ['Agentic Empowerment', 'Compliance'],
        signalDimensions: ['Actionable', 'Specific'],
      }] : []),
    ],
    blockers,
  };
}

function renderReport(witness) {
  const cell = (value) => String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
  const preview = (value, max = 500) => {
    const text = String(value ?? '');
    return text.length > max ? `${text.slice(0, max)}...` : text;
  };
  const table = witness.acceptanceTable
    .map((row) => `| ${cell(row.area)} | ${cell(row.score100)} | ${cell(row.benchmark100)} | ${cell(row.applicable)} | ${cell(preview(row.evidence))} | ${cell(row.mpr.join(', '))} | ${cell(row.signal.join(', '))} |`)
    .join('\n');
  const blockers = witness.blockers.length
    ? witness.blockers.map((b) => `- ${b.area}: ${b.score100}/${b.benchmark100} — ${b.blocker} (${preview(b.evidence)})`).join('\n')
    : '- none';

  return `---
title: "GTCX QAP repository acceptance - ${witness.repo}"
status: ${witness.decision}
date: ${witness.generatedAt.slice(0, 10)}
owner: fabric-os
document_type: audit-report
authority: fabric-os AaaS/DaaS assurance lane
protocol_id: ${protocolId}
---

# GTCX QAP Repository Acceptance - ${witness.repo}

Decision: **${witness.decision}**

MPR: **${witness.mpr.composite100 ?? 'unverified'}/100**

SIGNAL: **${witness.signal.level ?? 'unverified'} / ${witness.signal.score100 ?? 'unverified'}**

Runbook: \`${witness.runbook}\`

## Control Scorecard

| Area | Score | Benchmark | Applicable | Evidence | MPR linkage | SIGNAL linkage |
| --- | ---: | ---: | --- | --- | --- | --- |
${table}

## Loop State

| Iteration | MPR | SIGNAL | Dimensions below benchmark | Remediation | Decision |
| --- | ---: | --- | --- | --- | --- |
| ${witness.loop.iteration} | ${witness.loop.current.mprComposite100 ?? 'unverified'} | ${witness.loop.current.signalLevel ?? 'unverified'} / ${witness.loop.current.signalScore100 ?? 'unverified'} | ${witness.blockers.map((b) => b.area).join(', ') || 'none'} | ${witness.loop.nextRemediation?.blocker ?? 'none'} | ${witness.decision} |

## Blockers

${blockers}

## Evidence

- Machine artifact: \`${artifactRel}\`
- Inventory: \`${witness.inventory.path}\`
- Archive manifest: \`${witness.archive.path}\`
`;
}

function main() {
  if (!existsSync(ROOT)) {
    console.error(`repo root not found: ${ROOT}`);
    process.exit(2);
  }
  const witness = buildWitness();
  const report = renderReport(witness);
  if (WRITE) {
    mkdirSync(join(ROOT, 'audit/evidence'), { recursive: true });
    mkdirSync(join(ROOT, 'audit/reports'), { recursive: true });
    writeFileSync(join(ROOT, artifactRel), `${JSON.stringify(witness)}\n`);
    writeFileSync(join(ROOT, reportRel), report);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`GTCX QAP repository acceptance — ${witness.repo}: ${witness.decision}`);
    console.log(`MPR ${witness.mpr.composite100 ?? 'unverified'}/100 · SIGNAL ${witness.signal.level ?? 'unverified'} / ${witness.signal.score100 ?? 'unverified'}`);
    console.log(`blockers: ${witness.blockers.length}`);
    if (WRITE) {
      console.log(`report: ${reportRel}`);
      console.log(`artifact: ${artifactRel}`);
    }
  }
  process.exit(witness.decision === 'complete' ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
