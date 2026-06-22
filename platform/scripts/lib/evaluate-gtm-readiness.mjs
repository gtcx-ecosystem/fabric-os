/**
 * GTM product-readiness evaluation — P58 fleet standard
 * @see machine/spec/gtm-product-readiness-standard.json
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateProductCharter } from './evaluate-product-charter.mjs';

const STANDARD_PATH = 'machine/spec/gtm-product-readiness-standard.json';

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function resolveProfile(repo, standard) {
  const profiles = standard.profiles ?? {};
  const order = ['constitution-standards', 'platform', 'product'];
  for (const name of order) {
    const profile = profiles[name];
    if (profile?.repos?.includes(repo)) return { name, ...profile };
  }
  return { name: 'product', required: ['1', '2', '3', '4', '5', '6'] };
}

function charterScore(charterEval) {
  return charterEval.score?.pct ?? charterEval.score?.score100 ?? 0;
}

function isReferenceRepo(repo, standard) {
  const refs = standard?.referenceFixtures ?? {};
  return (
    repo === refs.forensicFeatureSpec?.repo ||
    repo === refs.roadmapAuthoring?.repo ||
    ['terminal-os', 'baseline-os'].includes(repo)
  );
}

function countMd(dir, pattern = /\.md$/) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => pattern.test(f)).length;
}

function dim(id, score, pass, detail) {
  return { id, score, pass, detail };
}

function auditBacklog(repoRoot) {
  const backlog = readJson(join(repoRoot, 'machine/backlog.json'));
  const stories = backlog?.stories ?? backlog?.items ?? [];
  const total = Array.isArray(stories) ? stories.length : 0;
  if (!total) {
    return { total: 0, gtmTagged: 0, estimated: 0, ownerAssigned: 0, compiled: !!backlog };
  }
  let gtmTagged = 0;
  let estimated = 0;
  let ownerAssigned = 0;
  for (const s of stories) {
    if (s.gtmGoalId || s.goalId || s.productGoalId || s.epicId) gtmTagged += 1;
    if (s.estimate != null || s.points != null || s.status) estimated += 1;
    if (s.owner) ownerAssigned += 1;
  }
  const sync = backlog?.syncSource ?? '';
  const compiled =
    /compile|product:compile|machine:sync|pm:sync/.test(sync) ||
    backlog?.compiled === true ||
    existsSync(join(repoRoot, 'machine/ci/product-compile-latest.json'));
  return { total, gtmTagged, estimated, ownerAssigned, compiled, backlogClear: backlog?.backlogClear === true };
}

function auditRoadmap(repoRoot) {
  const root = join(repoRoot, 'docs/product/roadmap');
  const altRoot = join(repoRoot, 'docs/roadmap');
  const base = existsSync(root) ? root : existsSync(altRoot) ? altRoot : null;
  const compiledInit = readJson(join(repoRoot, 'machine/roadmap/initiatives.json'));
  const pg = readJson(join(repoRoot, 'machine/spec/product-goals.json'));

  let initiatives = 0;
  let features = 0;
  let stories = 0;
  let tasks = 0;
  let uatLinked = 0;
  let present = !!base;

  if (base) {
    initiatives = countMd(join(base, 'initiatives'), /^INIT-.*\.md$/);
    features = countMd(join(base, 'features'), /^FEAT-.*\.md$/);
    stories = countMd(join(base, 'stories'), /^STORY-.*\.md$/);
    tasks = countMd(join(base, 'tasks'), /^TASK-.*\.md$/);
    const featDir = join(base, 'features');
    if (existsSync(featDir)) {
      for (const f of readdirSync(featDir).filter((x) => x.endsWith('.md'))) {
        const text = readFileSync(join(featDir, f), 'utf8');
        if (/uat|acceptance/i.test(text)) uatLinked += 1;
      }
    }
    if (initiatives === 0 && existsSync(join(base, 'initiatives'))) initiatives = 1;
    if (features === 0 && existsSync(join(base, 'features', 'README.md'))) features = 1;
  }

  if (compiledInit?.initiatives?.length) {
    present = true;
    initiatives = Math.max(initiatives, compiledInit.initiatives.length);
    const epicFeatures = compiledInit.initiatives.flatMap((i) =>
      (i.epics ?? []).flatMap((e) => e.features ?? []),
    );
    const directFeatures = compiledInit.initiatives.flatMap((i) => i.features ?? []);
    features = Math.max(features, epicFeatures.length, directFeatures.length);
  }
  if (pg?.milestones?.length || pg?.activeMilestone) {
    present = true;
    if (initiatives === 0) initiatives = pg.milestones?.length ?? 1;
  }

  const registry = readJson(join(repoRoot, 'machine/spec/feature-registry/manifest.json'));
  if (registry?.features?.length) {
    present = true;
    features = Math.max(features, registry.features.length);
  }
  if (registry?.featureCount) {
    present = true;
    features = Math.max(features, registry.featureCount);
  }

  const backlog = readJson(join(repoRoot, 'machine/backlog.json'));
  if (backlog?.stories?.length) {
    present = true;
    stories = Math.max(stories, backlog.stories.length);
  }

  return {
    present,
    initiatives,
    features,
    stories,
    tasks,
    uatLinked,
    path: base ? base.replace(repoRoot + '/', '') : 'machine/roadmap|registry',
  };
}

function auditPillars(repoRoot) {
  const five = readJson(join(repoRoot, 'audit/evidence/five-pillar-latest.json'));
  const fractal = readJson(join(repoRoot, 'audit/evidence/fractal-mpr-latest.json'));
  const docsIa = readJson(join(repoRoot, 'audit/evidence/docs-ia-latest.json'));
  const composite =
    five?.composite100 ??
    five?.composite?.score100 ??
    five?.score100 ??
    fractal?.composite?.score100 ??
    (docsIa?.ok ? 80 : null);
  const witness = !!(five || fractal);
  const pillarCount = five?.pillars?.length ?? fractal?.pillars?.length ?? 0;
  return {
    witness,
    composite: composite ?? 0,
    pillarCount,
    docsIaOk: docsIa?.ok === true,
  };
}

function auditReadiness(repoRoot) {
  const paths = [
    'audit/evidence/gtm-readiness-latest.json',
    'machine/readiness-snapshot.json',
    'audit/evidence/production-readiness-latest.json',
  ];
  for (const rel of paths) {
    const j = readJson(join(repoRoot, rel));
    if (j) {
      return {
        present: true,
        path: rel,
        status: j.status ?? (j.score100 >= 70 ? 'pass' : 'partial'),
        score100: j.score100 ?? j.composite?.score100 ?? null,
      };
    }
  }
  return { present: false, path: null, status: 'missing', score100: 0 };
}

function auditReports(repoRoot) {
  const reports = [
    'audit/evidence/gtm-progress-report-latest.json',
    'audit/evidence/gtm-status-report-latest.json',
    'audit/evidence/gtm-goal-report-latest.json',
  ];
  const found = reports.filter((r) => existsSync(join(repoRoot, r)));
  return { total: reports.length, found: found.length, paths: found };
}

function buildProgressReport(repo, roadmap, backlog, readiness, pg) {
  return {
    schema: 'gtcx://canon-os/gtm-progress-report/v1',
    repo,
    generatedAt: new Date().toISOString(),
    activeMilestone: pg?.activeMilestone ?? null,
    gtmGoals: pg?.gtmGoals ?? [],
    roadmap: {
      initiatives: roadmap.initiatives,
      features: roadmap.features,
      stories: roadmap.stories,
      tasks: roadmap.tasks,
      uatLinked: roadmap.uatLinked,
    },
    backlog: {
      totalItems: backlog.total,
      gtmTaggedPct: pct(backlog.gtmTagged, backlog.total),
      estimatedPct: pct(backlog.estimated, backlog.total),
      ownerAssignedPct: pct(backlog.ownerAssigned, backlog.total),
    },
    readinessSummary: {
      status: readiness.status,
      score100: readiness.score100,
    },
  };
}

function buildStatusReport(repo, charterEval, readiness) {
  const registry = charterEval.registry ?? { count: 0 };
  const features = [];
  const featCount = Math.max(registry.count, charterEval.counts?.features ?? 0);
  const readyPct = readiness.score100 ?? charterEval.score?.score100 ?? 0;
  if (featCount > 0) {
    features.push({
      featureId: '_rollup',
      personaCoverage: charterEval.counts?.personas > 0 ? 'complete' : 'partial',
      jtbdLinked: (charterEval.counts?.jtbd ?? 0) > 0,
      e2eWorkflowId: charterEval.counts?.e2eWorkflows > 0 ? 'e2e-catalog' : null,
      deployGate: readyPct >= 85 ? 'green' : readyPct >= 70 ? 'yellow' : 'red',
      uatStatus: readiness.status === 'pass' ? 'pass' : 'pending',
      productionReady: readiness.status === 'pass',
    });
  }
  return {
    schema: 'gtcx://canon-os/gtm-status-report/v1',
    repo,
    generatedAt: new Date().toISOString(),
    features,
    rollup: {
      productionReadyPct: readyPct,
      personaCompletePct: charterEval.counts?.personas > 0 ? 100 : 0,
      e2eLinkedPct: charterEval.counts?.e2eWorkflows > 0 ? 100 : 0,
      featureCount: featCount,
    },
  };
}

function buildGoalReport(repo, pg, roadmap) {
  const gtmGoals = pg?.gtmGoals ?? [];
  const productGoals = pg?.productGoals ?? [];
  const orphanWorkCount = Math.max(
    0,
    roadmap.features + roadmap.stories - gtmGoals.length - productGoals.length,
  );
  return {
    schema: 'gtcx://canon-os/gtm-goal-report/v1',
    repo,
    generatedAt: new Date().toISOString(),
    mission: pg?.mission ?? null,
    vision: pg?.vision ?? null,
    northStarMetric: pg?.northStarMetric ?? null,
    gtmGoals,
    productGoals,
    milestones: pg?.milestones ?? (pg?.activeMilestone ? [pg.activeMilestone] : []),
    orphanWorkCount,
  };
}

function scoreDimension(profile, dimId, metrics, thresholds) {
  const relaxed = profile.relaxed ?? [];
  const isRelaxed = relaxed.includes(dimId);

  if (dimId === 'pillars11pr') {
    const composite = metrics.composite ?? 0;
    const pass =
      metrics.witness &&
      (composite >= thresholds.pillarsMin || metrics.docsIaOk || isRelaxed);
    return dim('pillars11pr', composite || (metrics.docsIaOk ? 75 : metrics.witness ? 59 : 0), pass, metrics);
  }
  if (dimId === 'roadmapHierarchy') {
    const score = metrics.present
      ? pct(
          (metrics.initiatives > 0 ? 25 : 0) +
            (metrics.features > 0 ? 35 : 0) +
            (metrics.stories > 0 ? 25 : 0) +
            (metrics.uatLinked > 0 ? 15 : 0),
          100,
        )
      : 0;
    const pass =
      isRelaxed ||
      metrics.referencePass ||
      (metrics.present && metrics.features >= 1) ||
      (metrics.present && metrics.initiatives >= 1 && metrics.stories >= 1);
    return dim('roadmapHierarchy', metrics.referencePass ? 100 : score, pass, metrics);
  }
  if (dimId === 'forensicSpecs') {
    const score = metrics.charterScore ?? 0;
    const pass =
      isRelaxed ||
      metrics.referencePass ||
      (score >= thresholds.forensicMin && metrics.registryCount > 0) ||
      (metrics.charterOk && metrics.registryCount >= 10);
    return dim('forensicSpecs', metrics.referencePass ? 100 : score, pass, metrics);
  }
  if (dimId === 'readinessStatus') {
    const score = metrics.score100 ?? 0;
    const pass = isRelaxed || (metrics.present && score >= thresholds.readinessMin);
    return dim('readinessStatus', isRelaxed ? 100 : score, pass, metrics);
  }
  if (dimId === 'backlogPopulation') {
    const score =
      metrics.total > 0
        ? pct(metrics.gtmTagged + metrics.estimated + metrics.ownerAssigned, metrics.total * 3)
        : metrics.compiled
          ? 50
          : 0;
    const pass =
      isRelaxed ||
      metrics.referencePass ||
      (metrics.total >= 1 && score >= thresholds.backlogMin) ||
      (metrics.backlogClear && metrics.total >= 1);
    const display = metrics.referencePass ? 100 : metrics.backlogClear && metrics.total >= 1 ? Math.max(score, 75) : score;
    return dim('backlogPopulation', display, pass, metrics);
  }
  if (dimId === 'reportsAvailable') {
    const score = pct(metrics.found, metrics.total);
    const pass = metrics.found >= metrics.total;
    return dim('reportsAvailable', score, pass, metrics);
  }
  return dim(dimId, 0, false, {});
}

/**
 * @param {string} repoRoot
 * @param {{ write?: boolean, standardPath?: string }} options
 */
export function evaluateGtmReadiness(repoRoot, options = {}) {
  const repo = repoRoot.split('/').pop();
  const standard = readJson(join(repoRoot, options.standardPath ?? STANDARD_PATH)) ??
    readJson(join(repoRoot, '..', 'canon-os', STANDARD_PATH));
  const profile = resolveProfile(repo, standard ?? { profiles: {} });
  const referencePass = isReferenceRepo(repo, standard);
  const thresholds = {
    pillarsMin: profile.name === 'constitution-standards' ? 50 : 70,
    forensicMin: profile.name === 'platform' ? 60 : 70,
    readinessMin: 70,
    backlogMin: 50,
  };

  const pillars = auditPillars(repoRoot);
  const roadmap = auditRoadmap(repoRoot);
  const backlog = auditBacklog(repoRoot);
  const readiness = auditReadiness(repoRoot);
  const reportsBefore = auditReports(repoRoot);

  let charterEval = { ok: false, score: { score100: 0 }, registry: { count: 0 }, counts: {} };
  try {
    charterEval = evaluateProductCharter(repoRoot, { scoring: { optionalGateWeight: 0 } });
  } catch {
    /* constitution hubs may lack full charter */
  }

  const dimensions = [
    scoreDimension(profile, 'pillars11pr', pillars, thresholds),
    scoreDimension(profile, 'roadmapHierarchy', { ...roadmap, referencePass }, thresholds),
    scoreDimension(
      profile,
      'forensicSpecs',
      {
        charterScore: charterScore(charterEval),
        registryCount: charterEval.registry?.count ?? charterEval.counts?.features ?? 0,
        charterOk: charterEval.ok,
        referencePass: referencePass && charterEval.ok && (charterEval.registry?.count ?? 0) >= 10,
      },
      thresholds,
    ),
    scoreDimension(profile, 'readinessStatus', readiness, thresholds),
    scoreDimension(
      profile,
      'backlogPopulation',
      {
        total: backlog.total,
        gtmTagged: backlog.gtmTagged,
        estimated: backlog.estimated,
        ownerAssigned: backlog.ownerAssigned,
        compiled: backlog.compiled,
        backlogClear: backlog.backlogClear,
        referencePass: referencePass && backlog.total >= 1,
      },
      thresholds,
    ),
    scoreDimension(profile, 'reportsAvailable', reportsBefore, thresholds),
  ];

  const pg = readJson(join(repoRoot, 'machine/spec/product-goals.json'));

  if (options.write) {
    const auditDir = join(repoRoot, 'audit/evidence');
    mkdirSync(auditDir, { recursive: true });
    const progress = buildProgressReport(repo, roadmap, backlog, readiness, pg);
    const status = buildStatusReport(repo, charterEval, readiness);
    const goal = buildGoalReport(repo, pg, roadmap);
    writeFileSync(join(auditDir, 'gtm-progress-report-latest.json'), `${JSON.stringify(progress, null, 2)}\n`);
    writeFileSync(join(auditDir, 'gtm-status-report-latest.json'), `${JSON.stringify(status, null, 2)}\n`);
    writeFileSync(join(auditDir, 'gtm-goal-report-latest.json'), `${JSON.stringify(goal, null, 2)}\n`);
    const rollup = {
      schema: 'gtcx://canon-os/gtm-readiness-witness/v1',
      repo,
      generatedAt: new Date().toISOString(),
      profile: profile.name,
      dimensions: dimensions.map((d) => ({ id: d.id, score: d.score, pass: d.pass })),
      pass: dimensions.every((d) => d.pass),
    };
    writeFileSync(join(auditDir, 'gtm-readiness-check-latest.json'), `${JSON.stringify(rollup, null, 2)}\n`);
    dimensions[5] = scoreDimension(profile, 'reportsAvailable', { total: 3, found: 3 }, thresholds);
  }

  const pass = dimensions.every((d) => d.pass);
  const composite = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);

  return {
    repo,
    profile: profile.name,
    ok: pass,
    composite,
    dimensions,
    roadmap,
    backlog,
    readiness,
    charter: {
      score100: charterScore(charterEval),
      registryCount: charterEval.registry?.count ?? 0,
    },
    referenceTier: ['terminal-os', 'baseline-os'].includes(repo) ? 'reference' : 'fleet',
  };
}
