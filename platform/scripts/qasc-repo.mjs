#!/usr/bin/env node
/**
 * GTCX Quality Assurance, Security, and Compliance Protocol repo witness.
 *
 * Generates the mandatory report + machine artifact for GTCX-QASC-001, defined
 * in docs/operations/runbooks/qasc-protocol.md. This command is
 * intentionally conservative: it reports "complete" only when
 * existing evidence proves MPR 100/100, SIGNAL L5 / 100, clean worktree, phase
 * evidence, and no blockers. It does not run remediation commands.
 *
 * Usage:
 *   node platform/scripts/qasc-repo.mjs [--repo <name>] [--write] [--json]
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
const reportRel = `audit/reports/qasc-repo-${new Date().toISOString().slice(0, 10)}.md`;
const artifactRel = 'audit/evidence/qasc-repo-latest.json';

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function compactEvidence(value, max = 1200) {
  if (typeof value !== 'string') return value;
  return value.length > max ? `${value.slice(0, max)}... [truncated ${value.length - max} chars]` : value;
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

function nodeRun(args) {
  const res = spawnSync('node', args, { cwd: ROOT, encoding: 'utf8' });
  return {
    command: `node ${args.join(' ')}`,
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

export function scoreJson(json) {
  if (!json) return 0;
  if (typeof json.score100 === 'number') return Math.max(0, Math.min(100, Math.round(json.score100)));
  if (typeof json.composite100 === 'number') return Math.max(0, Math.min(100, Math.round(json.composite100)));
  for (const [attainedKey, benchmarkKey] of [
    ['conformant', 'repoCount'],
    ['clean', 'total'],
    ['verifiedCount', 'total'],
  ]) {
    const attained = json[attainedKey];
    const benchmark = json[benchmarkKey];
    if (typeof attained === 'number' && typeof benchmark === 'number' && benchmark > 0) {
      return Math.round((attained / benchmark) * 100);
    }
  }
  const gateLeaves = [];
  const collectGateLeaves = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.optional === true) return;
    if (typeof value.ok === 'boolean' || typeof value.pass === 'boolean') {
      gateLeaves.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collectGateLeaves);
      return;
    }
    Object.values(value).forEach(collectGateLeaves);
  };
  collectGateLeaves(json.gates);
  const gates = gateLeaves.filter((gate) => gate?.optional !== true);
  if (gates.length > 0) {
    const attained = gates.filter((gate) => gate.ok === true || gate.pass === true).length;
    return Math.round((attained / gates.length) * 100);
  }
  if (json.ok === true || json.pass === true || json.clean === true) return 100;
  return 0;
}

function evidenceScore(rel) {
  return scoreJson(readJson(rel));
}

function commandScore(run, ratioPattern = null) {
  if (!run) return 0;
  const output = `${run.stdout}\n${run.stderr}`;
  if (ratioPattern) {
    const match = output.match(ratioPattern);
    if (match) {
      const attained = Number.parseInt(match[1], 10);
      const benchmark = Number.parseInt(match[2], 10);
      if (Number.isFinite(attained) && Number.isFinite(benchmark) && benchmark > 0) {
        return Math.round((attained / benchmark) * 100);
      }
    }
  }
  return run.exitCode === 0 ? 100 : 0;
}

function linkCommandScore(run) {
  if (!run) return 0;
  const output = `${run.stdout}\n${run.stderr}`;
  const checked = Number.parseInt(output.match(/Checked\s+(\d+)\s+links/i)?.[1] ?? '0', 10);
  const broken = Number.parseInt(output.match(/(\d+)\s+broken link\(s\) found/i)?.[1] ?? '0', 10);
  if (checked > 0) return Math.max(0, Math.round(((checked - broken) / checked) * 100));
  return run.exitCode === 0 ? 100 : 0;
}

function commandOrNullScore(run, applicable) {
  if (!applicable) return null;
  return run ? commandScore(run) : 0;
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

function readAllowlist() {
  for (const rel of ['config/root-allowlist.json', 'docs/operations/repo/root-allowlist.json']) {
    try {
      return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
    } catch {
      // Try the next supported location before falling back to the generic policy.
    }
  }
  {
    return {
      required_files: ['README.md', 'AGENTS.md', 'CHANGELOG.md'],
      required_directories: ['docs', 'operations', 'machine', 'platform', 'deploy', 'audit', 'workstream'],
      allowed_directories: ['archive', 'agents', 'agentic', 'agile', 'ops', 'pm', 'config'],
      allowed_files: ['LICENSE', 'NOTICE', 'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'turbo.json', 'tsconfig.json'],
      allowed_dot_directories: ['.github', '.husky', '.agent', '.baseline', '.cursor', '.claude', '.gemini', '.kimi', '.gtcx', '.turbo', '.changeset', '.zap'],
    };
  }
}

function asStringList(value) {
  return Array.isArray(value) ? value : [];
}

function computeForbiddenRoots() {
  const allow = readAllowlist();
  const ignoredExact = new Set(asStringList(allow.ignored_exact));
  const ignoredPrefixes = asStringList(allow.ignored_prefixes);
  const allowedNames = new Set([
    '.git',
    '.idea',
    ...asStringList(allow.required_files),
    ...asStringList(allow.required_directories),
    ...asStringList(allow.allowed_directories),
    ...asStringList(allow.allowed_files),
    ...asStringList(allow.allowed_dot_directories),
    ...Object.keys(allow.permissible_on_approval ?? {}),
    'node_modules',
  ]);
  const topLevel = readdirSync(ROOT, { withFileTypes: true }).map((entry) => entry.name);
  return topLevel
    .filter((name) => !ignoredExact.has(name))
    .filter((name) => !ignoredPrefixes.some((prefix) => name.startsWith(prefix)))
    .filter((name) => !allowedNames.has(name))
    .filter((name) => name !== '.git');
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

function specDriftEvidenceRecorded() {
  const files = [
    ...walkTextFiles('audit/reports'),
    ...walkTextFiles('operations/coordination/outbound'),
    ...walkTextFiles('docs/operations/remediation'),
  ];
  const re = /\b(folder\/file\/product spec alignment|target-authoritative spec drift|work-artifact placement|product folder spec|docs-product-subfolder-contract|feature-spec-protocol)\b/i;
  return files.some((rel) => {
    try {
      return re.test(readFileSync(join(ROOT, rel), 'utf8'));
    } catch {
      return false;
    }
  });
}

function folderFileProductSpecScore({ docsProductRun, docsTreeScore, machineFolderRun }) {
  const hasProductPlane = has('docs/product') || has('product') || has('machine/product');
  const docsProductApplicable = hasProductPlane || Boolean(docsProductRun);
  const machineFolderApplicable = has('machine') || Boolean(machineFolderRun);
  const localSpecFiles = [
    'docs/product/FOLDER-SPEC.md',
    'machine/spec/docs-product-pack.json',
    'machine/spec/docs-folders/04-product.json',
    'machine/spec/docs-tree-spec.json',
    'machine/spec/feature-ship-gates-protocol.json',
  ].filter((rel) => has(rel));
  const localSpecScore = localSpecFiles.length > 0 ? 100 : 0;
  const scores = [
    localSpecScore,
    commandOrNullScore(docsProductRun, docsProductApplicable),
    typeof docsTreeScore === 'number' ? docsTreeScore : 0,
    commandOrNullScore(machineFolderRun, machineFolderApplicable),
  ].filter((score) => score !== null);
  const score100 = scores.length ? Math.min(...scores) : 0;
  const driftRecorded = specDriftEvidenceRecorded();
  return {
    score100,
    evidence: `local specs ${localSpecFiles.length}; docs:product exit ${docsProductRun ? docsProductRun.exitCode : 'unavailable'}; docs:tree ${docsTreeScore}/100; machine:folder exit ${machineFolderRun ? machineFolderRun.exitCode : 'unavailable'}; driftRecorded=${driftRecorded}`,
    blocker: score100 === 100
      ? null
      : 'folder/file/product spec alignment is below benchmark or target-authoritative drift is unrecorded',
  };
}

function listMatchingFiles(root, predicate) {
  return walkTextFiles(root).filter(predicate);
}

function scoreByCount(count) {
  return count > 0 ? 100 : 0;
}

function auditScoreFromFiles(files, predicate) {
  if (files.length === 0) return 0;
  const atBenchmark = files.filter((rel) => {
    const json = readJson(rel);
    return predicate(json);
  }).length;
  return Math.round((atBenchmark / files.length) * 100);
}

function agileProductionPackageEvidence() {
  const featureRegistry = readJson('machine/product/feature-registry.json');
  const featureAuditTrace = readJson('machine/product/feature-audit-trace.json');
  const registryFeatureRows = Array.isArray(featureRegistry?.features) ? featureRegistry.features : [];
  const registeredCanonManifests = registryFeatureRows
    .map((feature) => feature?.canonBundleRef)
    .filter((rel) => typeof rel === 'string' && rel.endsWith('/manifest.json'));
  const sourceArtifacts = [
    ...listMatchingFiles('product', (rel) => /^product\/(features|goals|milestones)\/.+\.md$/i.test(rel)),
    ...listMatchingFiles('docs/product', (rel) => /^docs\/product\/(roadmap\/)?(features|goals|milestones)\/.+\.md$/i.test(rel)),
  ];
  const records = [
    ...(featureRegistry ? ['machine/product/feature-registry.json'] : []),
    ...listMatchingFiles('machine/features', (rel) => /\/record\.json$/i.test(rel)),
    ...listMatchingFiles('machine/product-goals', (rel) => /\/record\.json$/i.test(rel)),
    ...listMatchingFiles('machine/business-milestones', (rel) => /\/record\.json$/i.test(rel)),
  ];
  const forensicSpecs = [
    ...(featureAuditTrace ? ['machine/product/feature-audit-trace.json'] : []),
    ...listMatchingFiles('machine/features', (rel) => /\/forensic-spec\.json$/i.test(rel)),
    ...listMatchingFiles('machine/product-goals', (rel) => /\/forensic-spec\.json$/i.test(rel)),
    ...listMatchingFiles('machine/business-milestones', (rel) => /\/forensic-spec\.json$/i.test(rel)),
  ];
  const mprAudits = [
    ...(featureAuditTrace ? ['machine/product/feature-audit-trace.json'] : []),
    ...listMatchingFiles('machine/features', (rel) => /\/audits\/mpr\.json$/i.test(rel)),
    ...listMatchingFiles('machine/product-goals', (rel) => /\/audits\/mpr\.json$/i.test(rel)),
    ...listMatchingFiles('machine/business-milestones', (rel) => /\/audits\/mpr\.json$/i.test(rel)),
  ];
  const signalAudits = [
    ...(featureAuditTrace ? ['machine/product/feature-audit-trace.json'] : []),
    ...listMatchingFiles('machine/features', (rel) => /\/audits\/signal\.json$/i.test(rel)),
    ...listMatchingFiles('machine/product-goals', (rel) => /\/audits\/signal\.json$/i.test(rel)),
    ...listMatchingFiles('machine/business-milestones', (rel) => /\/audits\/signal\.json$/i.test(rel)),
  ];
  const packages = [
    ...registeredCanonManifests,
    ...listMatchingFiles('machine/features', (rel) => /\/feature-pack\/manifest\.json$/i.test(rel)),
    ...listMatchingFiles('machine/product-goals', (rel) => /\/goal-pack\/manifest\.json$/i.test(rel)),
    ...listMatchingFiles('machine/business-milestones', (rel) => /\/milestone-pack\/manifest\.json$/i.test(rel)),
  ];
  const scrumHandoffs = [
    ...listMatchingFiles('delivery/feature-packages', (rel) => /\/sprint-plan\.json$/i.test(rel)),
    ...listMatchingFiles('machine/roadmap/sprints', (rel) => /active\.json$/i.test(rel)),
  ];
  const backlog = readJson('machine/backlog.json');
  const backlogCompatible = !has('machine/backlog.json') || Boolean(backlog?._generated || backlog?.syncSource || backlog?.execution);

  return {
    sourceArtifacts,
    records,
    forensicSpecs,
    mprAudits,
    signalAudits,
    packages,
    scrumHandoffs,
    backlogCompatible,
    scores: {
      sourceArtifacts: scoreByCount(sourceArtifacts.length),
      records: scoreByCount(records.length),
      forensicSpecs: scoreByCount(forensicSpecs.length),
      mprAudits: auditScoreFromFiles(mprAudits, (json) => {
        if (Array.isArray(json?.features)) {
          return json.features.length > 0
            && json.features.every((feature) =>
              Array.isArray(feature?.mpr?.primary)
              && feature.mpr.primary.length > 0
              && Array.isArray(feature?.mpr?.evidence)
              && feature.mpr.evidence.length > 0);
        }
        return json?.score === 100 || json?.score100 === 100;
      }),
      signalAudits: auditScoreFromFiles(signalAudits, (json) => {
        if (Array.isArray(json?.features)) {
          return json.features.length > 0
            && json.features.every((feature) =>
              Array.isArray(feature?.signal?.dimensions)
              && feature.signal.dimensions.length > 0
              && Boolean(feature?.signal?.status)
              && Boolean(feature?.signal?.auditNote));
        }
        return json?.level === 'L5' && (json?.score100 === 100 || json?.score100 == null);
      }),
      packages: auditScoreFromFiles(packages, (json) =>
        (
          Array.isArray(json?.acceptanceCriteria)
          && json.acceptanceCriteria.length > 0
          && (Array.isArray(json?.qaTesting) || Array.isArray(json?.sprintPlans))
          && json?.mprReview
          && json?.signalReview
        )
        || (
          ['charter', 'requirements', 'experience', 'dod', 'uat'].every((slice) => json?.slices?.[slice]?.path)
          && Array.isArray(json?.storyRefs)
          && json.storyRefs.length > 0
          && json?.narrativeRefs?.auditTrace
        )),
      scrumHandoffs: scoreByCount(scrumHandoffs.length),
      backlogCompatible: backlogCompatible ? 100 : 0,
    },
  };
}

function statusRow(area, atBenchmark, evidence, mpr, signal, blocker = null, applicable = true) {
  return scoredRow(area, applicable ? (atBenchmark ? 100 : 0) : null, evidence, mpr, signal, blocker, applicable);
}

function scoredRow(area, score100, evidence, mpr, signal, blocker = null, applicable = true) {
  return {
    area,
    score100: applicable && typeof score100 === 'number'
      ? Math.max(0, Math.min(100, Math.round(score100)))
      : null,
    benchmark100: 100,
    applicable,
    evidence: compactEvidence(evidence),
    mpr,
    signal,
    blocker,
  };
}

function scoreTable(rows) {
  const applicableRows = rows.filter((row) => row.applicable === true && typeof row.score100 === 'number');
  const benchmark = applicableRows.reduce((sum, row) => sum + (row.benchmark100 ?? 100), 0);
  const attained = applicableRows.reduce((sum, row) => sum + (row.score100 ?? 0), 0);
  const benchmarkCount = applicableRows.filter((row) => (row.score100 ?? 0) >= (row.benchmark100 ?? 100)).length;
  const score100 = benchmark === 0 ? 100 : Math.round((attained / benchmark) * 100);

  return {
    areaCount: applicableRows.length,
    benchmarkCount,
    benchmark,
    attained,
    score100,
  };
}

function summarizeGitStatus(statusText) {
  const lines = String(statusText ?? '').split('\n').filter(Boolean);
  const divergence = branchDivergence(lines[0]);
  if (lines.length <= 1) return divergence || statusText || 'git status unavailable';
  const dirty = lines.slice(1);
  const preview = dirty.slice(0, 25).join('; ');
  return `git status -sb: ${dirty.length} dirty entr${dirty.length === 1 ? 'y' : 'ies'}${divergence ? `; ${divergence}` : ''}${preview ? `; ${preview}` : ''}${dirty.length > 25 ? '; ...' : ''}`;
}

export function branchDivergence(statusHeader) {
  const header = String(statusHeader ?? '');
  const match = header.match(/\[(?<state>[^\]]*(?:ahead|behind|gone)[^\]]*)\]/i);
  return match?.groups?.state ? `branch divergence: ${match.groups.state}` : null;
}

function isQascOutputStatusLine(line) {
  return String(line ?? '').includes(artifactRel) || String(line ?? '').includes(reportRel);
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
      status: 'unverified',
      evidence: [],
    })),
  }));
}

function mprScores() {
  const mpr = readJson('audit/evidence/mpr-repo-latest.json');
  const foundationalIds = ['compliance', 'technicalExcellence', 'craft', 'worldClass', 'trustAndSafety'];
  const transformationalIds = [
    'creativityInnovation',
    'commercialValue',
    'defensiveMoat',
    'agenticEmpowerment',
    'productEcosystemIntegration',
    'ipMagic',
  ];
  const transformationalDimensionMap = {
    creativityInnovation: ['innovation-originality'],
    commercialValue: ['ux-product-design', 'enterprise-readiness', 'production-readiness'],
    defensiveMoat: ['technical-moat'],
    agenticEmpowerment: ['ai-maturity', 'hallucination-resilience'],
    productEcosystemIntegration: ['ecosystem-integration'],
    ipMagic: ['innovation-originality', 'technical-moat', 'ux-product-design'],
  };
  const qualityDimensionScores = () => {
    const auditFile = list('audit')
      .filter((file) => /^audit-output-.*\.json$/.test(file))
      .sort()
      .reverse()[0];
    const audit = auditFile ? readJson(`audit/${auditFile}`) : null;
    const raw = audit?.qualityDimensionScores ?? audit?.dimensionScores ?? readJson('audit/evidence/strategic-depth-latest.json')?.dimensionHints ?? {};
    return Object.fromEntries(Object.entries(raw).map(([id, value]) => {
      const score100 = typeof value === 'number'
        ? (value <= 10 ? Math.round(value * 10) : Math.round(value))
        : Math.round(value?.score100 ?? value?.currentScore100 ?? 0);
      return [id, { score100, source: auditFile ? `audit/${auditFile}` : 'audit/evidence/strategic-depth-latest.json' }];
    }));
  };
  const qualityDimensions = qualityDimensionScores();
  const transformationalLeafEvidence = (pillarId) => (transformationalDimensionMap[pillarId] ?? [])
    .map((id) => {
      const dim = qualityDimensions[id];
      if (!dim || typeof dim.score100 !== 'number') return null;
      return {
        id,
        score100: dim.score100,
        evidenceDepth: 'leaf',
        source: dim.source,
      };
    })
    .filter(Boolean);
  const quadrants = {
    ...(mpr?.multiPillar?.quadrants ?? {}),
    ...(mpr?.quadrants ?? {}),
  };
  const leafEvidence = (pillarId) => {
    const pillar = quadrants[pillarId] ?? {};
    const categories = Object.entries(pillar.categories ?? {}).map(([id, value]) => ({
      id,
      score100: value?.score100 ?? null,
      evidenceDepth: Array.isArray(value?.items) && value.items.length > 0 ? 'leaf' : 'aggregate',
    }));
    const metrics = Object.entries(pillar.metrics ?? {}).map(([id, value]) => ({
      id,
      score100: value?.score100 ?? null,
      evidenceDepth: 'leaf',
    }));
    const checks = (pillar.checks ?? []).map((value, index) => ({
      id: value?.id ?? `check-${index + 1}`,
      score100: value?.score100 ?? (value?.ok === true || value?.pass === true ? 100 : 0),
      evidenceDepth: 'leaf',
    }));
    const leaf = [...categories, ...metrics, ...checks].filter((entry) => entry.evidenceDepth === 'leaf');
    return leaf.length ? leaf : transformationalLeafEvidence(pillarId);
  };
  const tierMicroScore = (ids) => {
    const pillarScores = ids.map((id) => {
      const evidence = leafEvidence(id);
      return {
        pillar: id,
        score100: evidence.length
          ? Math.min(...evidence.map((entry) => entry.score100 ?? 0))
          : 0,
        evidence,
        assessable: evidence.length > 0,
      };
    });
    return {
      score100: Math.min(...pillarScores.map((pillar) => pillar.score100)),
      pillars: pillarScores,
    };
  };
  const foundationalMicros = tierMicroScore(foundationalIds);
  const transformationalMicros = tierMicroScore(transformationalIds);
  return {
    source: mpr ? 'audit/evidence/mpr-repo-latest.json' : null,
    composite100: mpr?.composite100 ?? null,
    foundationComposite100: mpr?.foundationComposite100 ?? null,
    fullComposite100: mpr?.fullComposite100 ?? null,
    foundationalMicroScore100: foundationalMicros.score100,
    transformationalMicroScore100: transformationalMicros.score100,
    foundationalMicros: foundationalMicros.pillars,
    transformationalMicros: transformationalMicros.pillars,
    pillars: Object.fromEntries(Object.entries(quadrants).map(([k, v]) => [k, {
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
  const dirtyStatusLines = statusLines.slice(1).filter((line) => !(WRITE && isQascOutputStatusLine(line)));
  const effectiveStatus = [statusLines[0], ...dirtyStatusLines].filter(Boolean).join('\n');
  const diverged = branchDivergence(statusLines[0]);
  const clean = status.exitCode === 0 && dirtyStatusLines.length === 0 && !diverged;
  const branch = statusLines[0]?.replace(/^##\s*/, '') ?? null;
  const commit = git(['rev-parse', 'HEAD']).stdout || null;
  const sc = scripts();
  const scriptKeys = Object.keys(sc);
  const script = (name) => scriptKeys.includes(name);
  const linkEvidence = list(evidenceRel).filter((f) => /link|docs|folder|root|hygiene/.test(f));
  const mpr = mprScores();
  const signal = signalScores();

  const inventoryScore = evidenceScore('audit/evidence/repo-folder-file-spec-inventory-latest.json');
  const archiveManifest = readJson('audit/archive/ARCHIVE-MANIFEST.json');
  const auditScrubManifest = readJson('audit/evidence/audit-scrub-manifest-latest.json');
  const archiveEvidencePath = has('audit/evidence/repo-cleanup-archive-manifest-latest.json')
    ? 'audit/evidence/repo-cleanup-archive-manifest-latest.json'
    : has('audit/archive/ARCHIVE-MANIFEST.json')
      ? 'audit/archive/ARCHIVE-MANIFEST.json'
      : 'audit/evidence/audit-scrub-manifest-latest.json';
  const archiveScore = !has('audit/archive')
    ? 100
    : Math.max(
      evidenceScore('audit/evidence/repo-cleanup-archive-manifest-latest.json'),
      Array.isArray(archiveManifest?.entries) && archiveManifest.entries.length > 0 ? 100 : 0,
      Array.isArray(auditScrubManifest?.moved) && auditScrubManifest.moved.length > 0 ? 100 : 0,
    );
  const docsIaRun = has('platform/scripts/docs-ia-check.mjs')
    ? nodeRun(['platform/scripts/docs-ia-check.mjs'])
    : script('docs:ia:check')
      ? pnpmRun(['docs:ia:check'])
      : null;
  const docsTreeRun = script('docs:tree:check') ? pnpmRun(['docs:tree:check']) : null;
  const docsLinkRun = script('docs:check-links')
    ? pnpmRun(['docs:check-links'])
    : has('platform/scripts/check-doc-links.mjs')
      ? nodeRun(['platform/scripts/check-doc-links.mjs'])
      : null;
  const docsProductRun = script('docs:product:check') ? pnpmRun(['docs:product:check']) : null;
  const machineFolderRun = script('machine:folder:check') ? pnpmRun(['machine:folder:check']) : null;
  const docsIaScore = commandScore(docsIaRun, /docs:ia:check\s+(\d+)\/(\d+)/i);
  const docsTreeScore = commandScore(docsTreeRun, /docs:tree:check\s+\((\d+)\/(\d+)\)/i);
  const docsLinkScore = linkCommandScore(docsLinkRun);
  const docsScore = Math.round((docsIaScore + docsTreeScore + docsLinkScore) / 3);
  const roadmapScore = Math.max(
    evidenceScore('audit/evidence/docs-roadmap-latest.json'),
    evidenceScore('audit/evidence/product-roadmap-lane-isolation-latest.json'),
    evidenceScore('audit/evidence/m4-baseline-roadmap-intake-latest.json'),
  );
  const roadmapOk = anyEvidenceOk(
    'audit/evidence/docs-roadmap-latest.json',
    'audit/evidence/product-roadmap-lane-isolation-latest.json',
    'audit/evidence/m4-baseline-roadmap-intake-latest.json',
  );
  const featureScore = script('docs:feature-spec:check')
    ? Math.max(
      evidenceScore('audit/evidence/docs-feature-spec-latest.json'),
      evidenceScore('audit/evidence/feature-spec-latest.json'),
    )
    : 0;
  const agileApplicable = script('agile:check') || script('docs:agile:check') || has('agile');
  const agileRun = agileApplicable
    ? pnpmRun([script('agile:check') ? 'agile:check' : 'docs:agile:check'])
    : null;
  const agileScore = agileApplicable ? commandScore(agileRun) : null;
  const opsApplicable = script('operations:check') || script('operations:consumption:check') || has('operations');
  const opsRun = opsApplicable
    ? pnpmRun([script('operations:check') ? 'operations:check' : 'operations:consumption:check'])
    : null;
  const opsScore = opsApplicable ? commandScore(opsRun) : null;
  const p22Applicable = script('agent:next-work');
  const fabricApplicable = REPO === 'fabric-os' || script('aaas:loop') || script('daas:fleet:health');
  const fabricEvidence = [
    'audit/evidence/aaas-contract-check-latest.json',
    'audit/evidence/aaas-cadence-latest.json',
    'audit/evidence/aaas-honesty-gate-latest.json',
    'audit/evidence/aaas-ownership-latest.json',
    'audit/evidence/aaas-hygiene-check-latest.json',
    'audit/evidence/aaas-loop-latest.json',
    'audit/evidence/daas-cards-check-latest.json',
    'audit/evidence/daas-friction-check-latest.json',
  ];
  const fabricScore = fabricApplicable
    ? Math.round(fabricEvidence.reduce((sum, rel) => sum + evidenceScore(rel), 0) / fabricEvidence.length)
    : null;
  const p22Run = p22Applicable ? pnpmRun(['agent:next-work', '--json']) : null;
  const p22Output = `${p22Run?.stdout ?? ''}${p22Run?.stderr ? `\n${p22Run.stderr}` : ''}`;
  const p22Blocked = /Persona read gate BLOCKED|personaReadGateBlocked["']?\s*:\s*true/.test(p22Output);
  const p22Score = p22Run ? (p22Run.exitCode === 0 && !p22Blocked ? 100 : 0) : null;
  const mprComplete = mpr.composite100 === 100;
  const signalComplete = signal.level === 'L5' && signal.score100 === 100;
  const securityScore = Math.min(
    mpr.pillars?.technicalExcellence?.score100 ?? 0,
    mpr.pillars?.trustAndSafety?.score100 ?? 0,
  );
  const complianceScore = mpr.pillars?.compliance?.score100 ?? 0;
  const forbiddenRoots = computeForbiddenRoots();
  const laneIsolation = operationalLaneIsolation();
  const agilePackage = agileProductionPackageEvidence();
  const folderFileProductSpec = folderFileProductSpecScore({
    docsProductRun,
    docsTreeScore,
    machineFolderRun,
  });
  const crossRepoScore = Math.max(
    evidenceScore('audit/evidence/aaas-contract-check-latest.json'),
    evidenceScore('audit/evidence/fleet-ops-assurance-check-latest.json'),
    evidenceScore('audit/evidence/fabric-ops-policy-contract-latest.json'),
    evidenceScore('audit/evidence/canon-os-contracts-latest.json'),
  );

  const rows = [
    statusRow('Worktree clean', clean, summarizeGitStatus(effectiveStatus), ['Craft', 'Trust & Safety'], ['Grounded'], clean ? null : 'worktree is dirty'),
    scoredRow('Critical docs preserved', inventoryScore, 'audit/evidence/repo-folder-file-spec-inventory-latest.json', ['Trust & Safety', 'Defensive Moat', 'IP Magic'], ['Lossless', 'Specific'], inventoryScore === 100 ? null : 'inventory witness is incomplete'),
    scoredRow('Feature/spec registry', featureScore, 'docs:feature-spec:check evidence', ['Commercial Value', 'Product/Ecosystem Integration'], ['Specific', 'Integrated', 'Actionable'], featureScore === 100 ? null : 'feature/spec validation is below benchmark'),
    scoredRow('Documentation hygiene', docsScore, `docs IA ${docsIaScore}/100; tree ${docsTreeScore}/100; links ${docsLinkScore}/100`, ['Compliance', 'World Class', 'Trust & Safety'], ['Navigable', 'Grounded', 'Lossless'], docsScore === 100 ? null : 'documentation IA, lifecycle metadata, or link integrity is below benchmark'),
    scoredRow('Folder/file/product spec alignment', folderFileProductSpec.score100, folderFileProductSpec.evidence, ['Compliance', 'World Class', 'Product/Ecosystem Integration'], ['Navigable', 'Grounded', 'Lossless'], folderFileProductSpec.blocker),
    scoredRow('Roadmap/goals/milestones', roadmapScore, 'roadmap/goals/milestone evidence', ['Commercial Value', 'Agentic Empowerment'], ['Actionable', 'Integrated'], roadmapOk && roadmapScore === 100 ? null : 'roadmap/goals/milestones are below benchmark'),
    scoredRow('Agile workflow', agileScore, agileRun ? `${agileRun.command} exit ${agileRun.exitCode}` : 'not applicable', ['Product/Ecosystem Integration', 'Craft'], ['Actionable', 'Integrated'], agileScore === 100 || agileScore == null ? null : 'agile workflow is below benchmark', agileApplicable),
    scoredRow('Ops contract', opsScore, opsRun ? `${opsRun.command} exit ${opsRun.exitCode}` : 'not applicable', ['Technical Excellence', 'Compliance'], ['Grounded', 'Integrated'], opsScore === 100 || opsScore == null ? null : 'ops contract is below benchmark', opsApplicable),
    scoredRow('P22/runtime', p22Score, p22Run ? `pnpm agent:next-work --json exit ${p22Run.exitCode}` : 'agent:next-work unavailable', ['Agentic Empowerment', 'Compliance'], ['Actionable', 'Specific'], p22Score === 100 || p22Score == null ? null : 'P22 runtime failed or emitted a blocking gate', p22Applicable),
    scoredRow('Fabric AaaS/DaaS', fabricScore, 'AaaS/DaaS evidence witness score', ['Technical Excellence', 'World Class'], ['Grounded', 'Actionable'], fabricScore === 100 || fabricScore == null ? null : 'AaaS/DaaS evidence is below benchmark', fabricApplicable),
    scoredRow('Security implementation controls', securityScore, 'lowest of MPR Technical Excellence and Trust & Safety', ['Technical Excellence', 'Trust & Safety'], ['Grounded', 'Specific'], securityScore === 100 ? null : 'security implementation evidence is below benchmark'),
    scoredRow('Compliance implementation controls', complianceScore, 'MPR Compliance pillar and leaf evidence', ['Compliance'], ['Grounded', 'Specific'], complianceScore === 100 ? null : 'compliance implementation evidence is below benchmark'),
    statusRow('Operational lane isolation', laneIsolation.ok, laneIsolation.ok ? 'operational lane scan clean' : laneIsolation.violations.map((v) => `${v.path}:${v.line}`).join(', '), ['Product/Ecosystem Integration', 'Compliance'], ['Integrated', 'Actionable'], laneIsolation.ok ? null : 'operational lane item is rendered as a product/GA release blocker'),
    scoredRow('MPR composite', mpr.composite100 ?? 0, mpr.source ?? 'missing MPR witness', ['All MPR pillars'], ['Grounded', 'Specific'], mprComplete ? null : 'MPR composite is not 100/100'),
    scoredRow('SIGNAL maturity', signal.score100 ?? 0, signal.source ?? 'missing SIGNAL witness', ['Agentic Empowerment', 'Technical Excellence'], ['All SIGNAL dimensions'], signalComplete ? null : 'SIGNAL is not L5 / 100'),
    scoredRow('Foundational micro-audits', mpr.foundationalMicroScore100, 'MPR foundational leaf evidence', ['Foundational MPR tier'], ['Specific', 'Grounded'], mpr.foundationalMicroScore100 === 100 ? null : 'one or more foundational leaf audits are below benchmark'),
    scoredRow('Transformational micro-audits', mpr.transformationalMicroScore100, 'MPR transformational leaf evidence', ['Transformational MPR tier'], ['Integrated', 'Actionable', 'Lossless'], mpr.transformationalMicroScore100 === 100 ? null : 'transformational leaf evidence is missing or below benchmark'),
    scoredRow('Product-intent source', agilePackage.scores.sourceArtifacts, `${agilePackage.sourceArtifacts.length} product intent source artifact(s)`, ['Commercial Value', 'Product/Ecosystem Integration'], ['Specific', 'Actionable'], agilePackage.scores.sourceArtifacts === 100 ? null : 'feature PRD, product goal brief, or milestone brief is missing'),
    scoredRow('Machine-readable standardization', agilePackage.scores.records, `${agilePackage.records.length} standardized record(s)`, ['Technical Excellence', 'Agentic Empowerment'], ['Grounded', 'Integrated'], agilePackage.scores.records === 100 ? null : 'standardized machine-readable record is missing'),
    scoredRow('Forensic spec', agilePackage.scores.forensicSpecs, `${agilePackage.forensicSpecs.length} forensic spec(s)`, ['Craft', 'Trust & Safety'], ['Specific', 'Lossless'], agilePackage.scores.forensicSpecs === 100 ? null : 'forensic spec is missing'),
    scoredRow('Package MPR', agilePackage.scores.mprAudits, `${agilePackage.mprAudits.length} package MPR audit(s)`, ['All MPR pillars'], ['Grounded', 'Specific'], agilePackage.scores.mprAudits === 100 ? null : 'package MPR audit is missing or below 100'),
    scoredRow('Package SIGNAL', agilePackage.scores.signalAudits, `${agilePackage.signalAudits.length} package SIGNAL audit(s)`, ['Agentic Empowerment', 'Technical Excellence'], ['All SIGNAL dimensions'], agilePackage.scores.signalAudits === 100 ? null : 'package SIGNAL audit is missing or below L5'),
    scoredRow('Production spec package', agilePackage.scores.packages, `${agilePackage.packages.length} production package manifest(s)`, ['World Class', 'Product/Ecosystem Integration'], ['Integrated', 'Actionable'], agilePackage.scores.packages === 100 ? null : 'production spec package is missing required acceptance, QA, sprint, MPR, or SIGNAL sections'),
    scoredRow('Scrum handoff', agilePackage.scores.scrumHandoffs, `${agilePackage.scrumHandoffs.length} sprint handoff artifact(s)`, ['Commercial Value', 'Agentic Empowerment'], ['Actionable', 'Integrated'], agilePackage.scores.scrumHandoffs === 100 ? null : 'scrum sprint handoff is missing'),
    scoredRow('Backlog compatibility only', agilePackage.scores.backlogCompatible, agilePackage.backlogCompatible ? 'backlog absent or generated compatibility output' : 'machine/backlog.json lacks generated compatibility marker', ['Compliance', 'Trust & Safety'], ['Grounded', 'Lossless'], agilePackage.scores.backlogCompatible === 100 ? null : 'backlog appears to be active authority rather than generated compatibility output'),
    scoredRow('Root hygiene', forbiddenRoots.length === 0 ? 100 : 0, forbiddenRoots.length ? forbiddenRoots.join(', ') : 'root scan clean', ['Compliance', 'Craft'], ['Navigable'], forbiddenRoots.length === 0 ? null : 'forbidden live roots present'),
    scoredRow('Link/reference hygiene', docsLinkScore, docsLinkRun ? `${docsLinkRun.command} exit ${docsLinkRun.exitCode}; ${linkEvidence.length} related witnesses` : 'link checker unavailable', ['World Class', 'Trust & Safety'], ['Navigable', 'Grounded'], docsLinkScore === 100 ? null : 'link/reference integrity is below benchmark'),
    scoredRow('Cross-repo contract', crossRepoScore, 'contract evidence witness score', ['Product/Ecosystem Integration'], ['Integrated'], crossRepoScore === 100 ? null : 'cross-repo contract evidence is below benchmark'),
    scoredRow('Archive recoverability', archiveScore, archiveEvidencePath, ['Trust & Safety', 'Defensive Moat'], ['Lossless'], archiveScore === 100 ? null : 'archive recoverability is below benchmark'),
  ];

  const blockers = rows
    .filter((row) => row.applicable && row.score100 < 100)
    .map((row) => ({ area: row.area, blocker: row.blocker, evidence: row.evidence }));
  const acceptance = scoreTable(rows);

  const decision = blockers.length === 0 ? 'complete' : 'incomplete';
  const phaseResults = {
    documentationTaxonomyLifecycle: { score100: docsScore, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: [{ command: docsIaRun?.command, score100: docsIaScore }, { command: docsTreeRun?.command, score100: docsTreeScore }, { command: docsLinkRun?.command, score100: docsLinkScore }], applicable: true },
    folderFileSpecs: { score100: folderFileProductSpec.score100, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: folderFileProductSpec.evidence, applicable: true },
    featureSpecRegistryPrd: { score100: featureScore, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: ['docs:feature-spec:check evidence'], applicable: true },
    roadmapGoalsMilestonesWorkstream: { score100: roadmapScore, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: ['roadmap/goals/milestone evidence'], applicable: true },
    operationalLaneIsolation: { score100: laneIsolation.ok ? 100 : 0, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: laneIsolation.violations, applicable: true },
    mprComposite: { score100: mpr.composite100 ?? 0, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: [mpr.source].filter(Boolean), applicable: true },
    signalMaturity: { score100: signal.score100 ?? 0, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: [signal.source].filter(Boolean), applicable: true },
    foundationalMicroAudits: { score100: mpr.foundationalMicroScore100, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: mpr.foundationalMicros, applicable: true },
    transformationalMicroAudits: { score100: mpr.transformationalMicroScore100, benchmark100: 100, loopUntil: 'score100 >= 100', evidence: mpr.transformationalMicros, applicable: true },
  };
  const phaseLoopRows = [
    { phaseId: 'documentationTaxonomyLifecycle', area: 'Documentation hygiene' },
    { phaseId: 'folderFileSpecs', area: 'Folder/file/product spec alignment' },
    { phaseId: 'featureSpecRegistryPrd', area: 'Feature/spec registry' },
    { phaseId: 'roadmapGoalsMilestonesWorkstream', area: 'Roadmap/goals/milestones' },
    { phaseId: 'operationalLaneIsolation', area: 'Operational lane isolation' },
    { phaseId: 'mprComposite', area: 'MPR composite' },
    { phaseId: 'signalMaturity', area: 'SIGNAL maturity' },
    { phaseId: 'foundationalMicroAudits', area: 'Foundational micro-audits' },
    { phaseId: 'transformationalMicroAudits', area: 'Transformational micro-audits' },
  ];
  const phaseLoop = phaseLoopRows.map(({ phaseId, area }, index) => {
    const phase = phaseResults[phaseId];
    const blocker = blockers.find((row) => row.area === area)?.blocker ?? null;
    return {
      phaseIndex: index + 1,
      phaseId,
      area,
      score100: phase.score100,
      benchmark100: phase.benchmark100,
      applicable: phase.applicable,
      loopUntil: phase.loopUntil,
      nextRemediation: phase.score100 >= phase.benchmark100 ? null : blocker,
    };
  });

  return {
    schema: 'gtcx://fabric-os/qasc-repo-score/v1',
    repo: REPO,
    branch,
    commit,
    generatedAt: new Date().toISOString(),
    runbook: 'docs/operations/runbooks/qasc-protocol.md',
    decision,
    loop: {
      iteration: 1,
      target: { mprComposite100: 100, signalLevel: 'L5', signalScore100: 100 },
      current: { mprComposite100: mpr.composite100, signalLevel: signal.level, signalScore100: signal.score100 },
      blockers,
      nextRemediation: blockers[0] ?? null,
    },
    acceptance,
    mpr: {
      composite100: mpr.composite100,
      source: mpr.source,
      pillars: mpr.pillars,
      foundational: {
        score100: mpr.foundationalMicroScore100,
        microAudits: mpr.foundationalMicros,
      },
      transformational: {
        score100: mpr.transformationalMicroScore100,
        microAudits: mpr.transformationalMicros,
      },
    },
    signal,
    phaseResults,
    phaseLoop,
    inventory: {
      path: 'audit/evidence/repo-folder-file-spec-inventory-latest.json',
      lossless: inventoryScore === 100,
      score100: inventoryScore,
    },
    archive: {
      path: archiveEvidencePath,
      recoverable: archiveScore === 100,
      score100: archiveScore,
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
      ...(docsIaRun ? [{ command: docsIaRun.command, cwd: ROOT, exitCode: docsIaRun.exitCode, score100: docsIaScore, ownerContract: 'canon-os', consumerContract: REPO, mprPillars: ['Compliance', 'World Class'], signalDimensions: ['Navigable', 'Grounded'] }] : []),
      ...(docsTreeRun ? [{ command: docsTreeRun.command, cwd: ROOT, exitCode: docsTreeRun.exitCode, score100: docsTreeScore, ownerContract: 'canon-os', consumerContract: REPO, mprPillars: ['Compliance', 'Craft', 'World Class'], signalDimensions: ['Navigable', 'Lossless'] }] : []),
      ...(docsProductRun ? [{ command: docsProductRun.command, cwd: ROOT, exitCode: docsProductRun.exitCode, score100: commandScore(docsProductRun), ownerContract: 'canon-os', consumerContract: REPO, mprPillars: ['Compliance', 'Product/Ecosystem Integration'], signalDimensions: ['Grounded', 'Lossless'] }] : []),
      ...(machineFolderRun ? [{ command: machineFolderRun.command, cwd: ROOT, exitCode: machineFolderRun.exitCode, score100: commandScore(machineFolderRun), ownerContract: 'canon-os', consumerContract: REPO, mprPillars: ['Compliance', 'Technical Excellence'], signalDimensions: ['Grounded', 'Lossless'] }] : []),
      ...(docsLinkRun ? [{ command: docsLinkRun.command, cwd: ROOT, exitCode: docsLinkRun.exitCode, score100: docsLinkScore, ownerContract: REPO, consumerContract: REPO, mprPillars: ['World Class', 'Trust & Safety'], signalDimensions: ['Navigable', 'Grounded'] }] : []),
      ...(agileRun ? [{ command: agileRun.command, cwd: ROOT, exitCode: agileRun.exitCode, score100: agileScore, ownerContract: 'agile-os', consumerContract: REPO, mprPillars: ['Product/Ecosystem Integration'], signalDimensions: ['Actionable', 'Integrated'] }] : []),
      ...(opsRun ? [{ command: opsRun.command, cwd: ROOT, exitCode: opsRun.exitCode, score100: opsScore, ownerContract: REPO, consumerContract: REPO, mprPillars: ['Technical Excellence', 'Compliance'], signalDimensions: ['Grounded', 'Integrated'] }] : []),
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
  const reportArea = (area) => {
    if (area === 'MPR composite') return 'MPR aggregate';
    if (area === 'Link/reference hygiene') return 'Reference hygiene';
    return area;
  };
  const reportEvidence = (row) => {
    if (row.area === 'Link/reference hygiene') {
      return String(row.evidence ?? '').replace(/node platform\/scripts\/check-doc-links\.mjs/g, 'documentation reference checker');
    }
    return row.evidence;
  };
  const table = witness.acceptanceTable
    .map((row) => `| ${cell(reportArea(row.area))} | ${cell(row.applicable ? row.score100 : 'N/A')} | ${cell(row.benchmark100)} | ${cell(preview(reportEvidence(row)))} | ${cell(row.mpr.join(', '))} | ${cell(row.signal.join(', '))} |`)
    .join('\n');
  const blockers = witness.blockers.length
    ? witness.blockers.map((b) => `- ${b.area}: ${b.blocker} (${preview(b.evidence)})`).join('\n')
    : '- none';

  return `---
title: "GTCX QASC repository score - ${witness.repo}"
status: ${witness.decision}
date: ${witness.generatedAt.slice(0, 10)}
owner: fabric-os
document_type: audit-report
authority: fabric-os AaaS/DaaS assurance lane
protocol_id: GTCX-QASC-001
---

# Repository Assurance Acceptance - ${witness.repo}

Decision: **${witness.decision}**

MPR: **${witness.mpr.composite100 ?? 'unverified'}/100**

SIGNAL: **${witness.signal.level ?? 'unverified'} / ${witness.signal.score100 ?? 'unverified'}**

Acceptance score: **${witness.acceptance.score100}/100** (**${witness.acceptance.benchmarkCount}/${witness.acceptance.areaCount}** controls at benchmark)

Runbook: \`${witness.runbook}\`

## Acceptance Table

| Area | Score | Benchmark | Evidence | MPR linkage | SIGNAL linkage |
| --- | ---: | ---: | --- | --- | --- |
${table}

## Loop State

| Iteration | MPR | SIGNAL | Blocking dimensions | Remediation | Decision |
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
    console.log(JSON.stringify(witness));
  } else {
    console.log(`GTCX QASC repository score — ${witness.repo}: ${witness.acceptance.score100}/100`);
    console.log(`MPR ${witness.mpr.composite100 ?? 'unverified'}/100 · SIGNAL ${witness.signal.level ?? 'unverified'} / ${witness.signal.score100 ?? 'unverified'}`);
    console.log(`acceptance ${witness.acceptance.score100}/100 controls ${witness.acceptance.benchmarkCount}/${witness.acceptance.areaCount} at benchmark`);
    console.log(`blockers: ${witness.blockers.length}`);
    if (WRITE) {
      console.log(`report: ${reportRel}`);
      console.log(`artifact: ${artifactRel}`);
    }
  }
  process.exit(witness.decision === 'complete' ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
