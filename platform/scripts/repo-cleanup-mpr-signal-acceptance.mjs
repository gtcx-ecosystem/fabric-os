#!/usr/bin/env node
/**
 * Repo cleanup MPR/SIGNAL acceptance witness.
 *
 * Generates the mandatory report + machine artifact for the repo-cleanup loop
 * defined in docs/operations/runbooks/repo-cleanup-mpr-signal-loop.md. This
 * command is intentionally conservative: it reports "complete" only when
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
const REPO = repoArg ?? basename(ROOT);

const evidenceRel = 'audit/evidence';
const reportRel = `audit/reports/repo-cleanup-mpr-signal-acceptance-${new Date().toISOString().slice(0, 10)}.md`;
const artifactRel = 'audit/evidence/repo-cleanup-mpr-signal-acceptance-latest.json';

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

function statusRow(area, result, evidence, mpr, signal, blocker = null) {
  return { area, result, evidence, mpr, signal, blocker };
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
      result: 'unverified',
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

function resultFrom(pass) {
  return pass ? 'PASS' : 'FAIL';
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
  const p22Pass = p22Run ? p22Run.exitCode === 0 && !p22Blocked : null;
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
    statusRow('Worktree clean', resultFrom(clean), status.stdout || 'git status unavailable', ['Craft', 'Trust & Safety'], ['Grounded'], clean ? null : 'worktree is dirty'),
    statusRow('Critical docs preserved', resultFrom(inventoryOk), 'audit/evidence/repo-folder-file-spec-inventory-latest.json', ['Trust & Safety', 'Defensive Moat', 'IP Magic'], ['Lossless', 'Specific'], inventoryOk ? null : 'inventory witness missing or failing'),
    statusRow('Feature/spec registry', resultFrom(featureOk), 'docs:feature-spec:check evidence', ['Commercial Value', 'Product/Ecosystem Integration'], ['Specific', 'Integrated', 'Actionable'], featureOk ? null : 'feature/spec validation not proven'),
    statusRow('Documentation hygiene', resultFrom(docsOk), 'docs evidence witnesses', ['Compliance', 'World Class', 'Trust & Safety'], ['Navigable', 'Grounded', 'Lossless'], docsOk ? null : 'documentation hygiene not proven'),
    statusRow('Roadmap/goals/milestones', resultFrom(roadmapOk), 'roadmap/goals/milestone evidence', ['Commercial Value', 'Agentic Empowerment'], ['Actionable', 'Integrated'], roadmapOk ? null : 'roadmap/goals/milestones not proven'),
    statusRow('Agile workflow', agileOk == null ? 'N/A' : resultFrom(agileOk), 'agile command evidence', ['Product/Ecosystem Integration', 'Craft'], ['Actionable', 'Integrated'], agileOk || agileOk == null ? null : 'agile workflow not proven'),
    statusRow('Ops contract', opsOk == null ? 'N/A' : resultFrom(opsOk), 'ops command evidence', ['Technical Excellence', 'Compliance'], ['Grounded', 'Integrated'], opsOk || opsOk == null ? null : 'ops contract not proven'),
    statusRow('P22/runtime', p22Pass == null ? 'N/A' : resultFrom(p22Pass), p22Run ? `pnpm agent:next-work --json exit ${p22Run.exitCode}` : 'agent:next-work unavailable', ['Agentic Empowerment', 'Compliance'], ['Actionable', 'Specific'], p22Pass || p22Pass == null ? null : 'P22 runtime failed or emitted a blocking gate'),
    statusRow('Fabric AaaS/DaaS', fabricOk == null ? 'N/A' : resultFrom(fabricOk), 'AaaS/DaaS evidence witnesses', ['Technical Excellence', 'World Class'], ['Grounded', 'Actionable'], fabricOk || fabricOk == null ? null : 'AaaS/DaaS evidence incomplete'),
    statusRow('Operational lane isolation', resultFrom(laneIsolation.ok), laneIsolation.ok ? 'operational lane scan clean' : laneIsolation.violations.map((v) => `${v.path}:${v.line}`).join(', '), ['Product/Ecosystem Integration', 'Compliance'], ['Integrated', 'Actionable'], laneIsolation.ok ? null : 'operational lane item is rendered as a product/GA release blocker'),
    statusRow('Foundational micro-audits', resultFrom(mprComplete), 'mpr.foundational.microAudits', ['Foundational MPR tier'], ['Specific', 'Grounded'], mprComplete ? null : 'MPR composite is not 100'),
    statusRow('Transformational micro-audits', resultFrom(mprComplete), 'mpr.transformational.microAudits', ['Transformational MPR tier'], ['Integrated', 'Actionable', 'Lossless'], mprComplete ? null : 'MPR composite is not 100'),
    statusRow('Root hygiene', resultFrom(rootOk), forbiddenRoots.length ? forbiddenRoots.join(', ') : 'root scan clean', ['Compliance', 'Craft'], ['Navigable'], rootOk ? null : 'forbidden live roots present'),
    statusRow('Link/reference hygiene', resultFrom(linkOk), linkEvidence.join(', ') || 'no link evidence', ['World Class', 'Trust & Safety'], ['Navigable', 'Grounded'], linkOk ? null : 'link/reference hygiene not proven'),
    statusRow('Cross-repo contract', resultFrom(crossRepoOk), 'contract evidence witnesses', ['Product/Ecosystem Integration'], ['Integrated'], crossRepoOk ? null : 'cross-repo contract evidence not proven'),
    statusRow('Archive recoverability', resultFrom(archiveOk), 'audit/evidence/repo-cleanup-archive-manifest-latest.json', ['Trust & Safety', 'Defensive Moat'], ['Lossless'], archiveOk ? null : 'archive manifest missing or failing'),
  ];

  const blockers = rows
    .filter((row) => row.result === 'FAIL')
    .map((row) => ({ area: row.area, blocker: row.blocker, evidence: row.evidence }));
  if (!signalComplete) {
    blockers.push({ area: 'SIGNAL', blocker: 'SIGNAL is not L5 / 100', evidence: signal.source ?? 'missing signal witness' });
  }
  if (!mprComplete) {
    blockers.push({ area: 'MPR', blocker: 'MPR cleanup composite is not 100/100', evidence: mpr.source ?? 'missing MPR witness' });
  }

  const decision = blockers.length === 0 ? 'complete' : 'incomplete';
  const phaseResults = {
    documentationTaxonomyLifecycle: { score100: docsOk ? 100 : 0, evidence: ['docs evidence witnesses'] },
    featureSpecRegistryPrd: { score100: featureOk ? 100 : 0, evidence: ['docs:feature-spec:check evidence'] },
    roadmapGoalsMilestonesWorkstream: { score100: roadmapOk ? 100 : 0, evidence: ['roadmap/goals/milestone evidence'] },
    operationalLaneIsolation: { score100: laneIsolation.ok ? 100 : 0, evidence: laneIsolation.violations },
    foundationalMicroAudits: { score100: mprComplete ? 100 : 0, evidence: [mpr.source].filter(Boolean) },
    transformationalMicroAudits: { score100: mprComplete ? 100 : 0, evidence: [mpr.source].filter(Boolean) },
  };

  return {
    schema: 'gtcx://fabric-os/repo-cleanup-mpr-signal-acceptance/v1',
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
    .map((row) => `| ${cell(row.area)} | ${cell(row.result)} | ${cell(preview(row.evidence))} | ${cell(row.mpr.join(', '))} | ${cell(row.signal.join(', '))} |`)
    .join('\n');
  const blockers = witness.blockers.length
    ? witness.blockers.map((b) => `- ${b.area}: ${b.blocker} (${preview(b.evidence)})`).join('\n')
    : '- none';

  return `---
title: "Repo cleanup MPR/SIGNAL acceptance - ${witness.repo}"
status: ${witness.decision}
date: ${witness.generatedAt.slice(0, 10)}
owner: fabric-os
document_type: audit-report
authority: fabric-os AaaS/DaaS assurance lane
---

# Repo cleanup MPR/SIGNAL acceptance - ${witness.repo}

Decision: **${witness.decision}**

MPR: **${witness.mpr.composite100 ?? 'unverified'}/100**

SIGNAL: **${witness.signal.level ?? 'unverified'} / ${witness.signal.score100 ?? 'unverified'}**

Runbook: \`${witness.runbook}\`

## Acceptance Table

| Area | Result | Evidence | MPR linkage | SIGNAL linkage |
| --- | --- | --- | --- | --- |
${table}

## Loop State

| Iteration | MPR | SIGNAL | Blocking dimensions | Remediation | Result |
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
    console.log(`repo cleanup acceptance — ${witness.repo}: ${witness.decision}`);
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
