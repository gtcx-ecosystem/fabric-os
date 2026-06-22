#!/usr/bin/env node
/**
 * Evaluate product charter stack per P56 product-charter-protocol.json
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ASSURANCE_RE =
  /composite\s*[≥>=]*\s*\d+|composite\s*100|five-pillar|operations:check|DEPLOY-GATE|deploy.gate|product-culture:check/i;

export function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function gate(id, ok, detail = null, optional = false, weight = 1) {
  return { id, ok, optional, weight, ...(detail ? { detail } : {}) };
}

export function scoreGates(gates, scoring = {}) {
  const reqW = scoring.requiredGateWeight ?? 1;
  const optW = scoring.optionalGateWeight ?? 0.25;
  let earned = 0;
  let possible = 0;
  for (const g of gates) {
    const w = g.optional ? optW : reqW;
    possible += w;
    if (g.ok) earned += w;
  }
  const pct = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;
  const green = scoring.rag?.green?.gte ?? 85;
  const yellow = scoring.rag?.yellow?.gte ?? 70;
  const rag = pct >= green ? 'green' : pct >= yellow ? 'yellow' : 'red';
  return { earned, possible, pct, rag };
}

function countFiles(dir, pred) {
  try {
    return readdirSync(dir).filter(pred).length;
  } catch {
    return 0;
  }
}

function resolveRegistry(repoRoot) {
  const eco = join(repoRoot, 'machine/spec/ecosystem-feature-registry.json');
  const prod = join(repoRoot, 'machine/product/feature-registry.json');
  const man = join(repoRoot, 'machine/spec/feature-registry/manifest.json');
  if (existsSync(eco)) {
    const j = readJson(eco);
    return { dialect: 'ecosystem-v2', count: j?.features?.length ?? 0, path: eco, forensic: false };
  }
  if (existsSync(prod)) {
    const j = readJson(prod);
    return { dialect: 'product-v2', count: j?.features?.length ?? 0, path: prod, forensic: false };
  }
  if (existsSync(man)) {
    const m = readJson(man);
    let count = 0;
    let workflowSteps = 0;
    let specGaps = 0;
    for (const s of m?.shards ?? []) {
      const j = readJson(join(repoRoot, s));
      const feats = j?.features ?? [];
      count += feats.length;
      for (const f of feats) {
        if (f.featureClass === 'workflow-step') workflowSteps += 1;
        if (f.featureClass === 'spec-gap') specGaps += 1;
      }
    }
    const forensic = !!(m?.forensic?.auditOutput || m?.forensic?.jtbdCatalog);
    return {
      dialect: forensic ? 'sharded-v2-forensic' : 'sharded-v1',
      count: count || m?.featureCount || 0,
      workflowSteps,
      specGaps,
      path: man,
      forensic,
    };
  }
  const matrix = readJson(join(repoRoot, 'machine/ci/feature-coverage-matrix.json'));
  if (matrix?.features?.length) {
    return { dialect: 'matrix-only', count: matrix.features.length, path: 'machine/ci/feature-coverage-matrix.json', forensic: false };
  }
  return { dialect: 'none', count: 0, path: null, forensic: false };
}

function exrAudit(repoRoot) {
  const dir = join(repoRoot, 'docs/architecture/specs/experiences');
  const files = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.startsWith('EXR-') && f.endsWith('.md'))
    : [];
  let complete = 0;
  for (const f of files) {
    const text = readFileSync(join(dir, f), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (fm && /personaId:/.test(fm[1]) && /jtbdId:/.test(fm[1])) complete += 1;
  }
  return { count: files.length, complete };
}

function jtbdAudit(repoRoot) {
  const catalog = readJson(join(repoRoot, 'machine/ux/jtbd/catalog.json'));
  if (catalog?.jobs?.length) {
    return { count: catalog.jobs.length, complete: catalog.jobs.length, source: 'catalog' };
  }
  const dir = join(repoRoot, 'machine/ux/jtbd');
  if (!existsSync(dir)) return { count: 0, complete: 0, source: 'files' };
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'README.json' && f !== 'catalog.json');
  let complete = 0;
  for (const f of files) {
    const j = readJson(join(dir, f));
    if (
      j?.id &&
      j?.personaId &&
      Array.isArray(j?.acceptanceCriteria) &&
      j.acceptanceCriteria.length > 0
    ) {
      complete += 1;
    }
  }
  return { count: files.length, complete, source: 'files' };
}

function charterSections(charterPath) {
  if (!existsSync(charterPath)) return { present: false, sections: [] };
  const text = readFileSync(charterPath, 'utf8');
  const required = [
    'Vision',
    'Mission',
    'Product goals',
    'Shipping goals',
    'Features',
    'Milestones',
  ];
  const found = required.filter((s) => new RegExp(`^## ${s}`, 'm').test(text));
  return { present: true, sections: found, missing: required.filter((s) => !found.includes(s)) };
}

/**
 * @param {string} repoRoot
 * @param {object} options
 */
export function evaluateProductCharter(repoRoot, options = {}) {
  const repo = repoRoot.split('/').pop();
  const gates = [];
  const pg = readJson(join(repoRoot, 'machine/spec/product-goals.json'));
  const prdIdx = readJson(join(repoRoot, 'machine/product/prd-index.json'));
  const charterPath = join(repoRoot, 'machine/product/prds/prd-product-charter.md');
  const registry = resolveRegistry(repoRoot);
  const exr = exrAudit(repoRoot);
  const jtbd = jtbdAudit(repoRoot);
  const personas = countFiles(join(repoRoot, 'machine/ux/personas'), (f) => f.endsWith('.md'));
  const flows = countFiles(join(repoRoot, 'machine/ux/user-flows'), (f) => f.endsWith('.md'));
  const workflows =
    readJson(join(repoRoot, 'machine/spec/ecosystem-workflows.json')) ||
    readJson(join(repoRoot, 'machine/product/workflows.json'));
  const wfCount = workflows?.workflows?.length ?? 0;

  const foundationFiles = ['vision.md', 'mission.md', 'goals.md', 'milestones.md'];
  for (const f of foundationFiles) {
    gates.push(
      gate(`foundation:${f}`, existsSync(join(repoRoot, 'docs/foundation', f)), f),
    );
  }

  gates.push(gate('product-goals:present', !!pg, pg ? 'ok' : 'missing'));
  gates.push(
    gate('product-goals:productGoals', Array.isArray(pg?.productGoals) && pg.productGoals.length >= 1),
  );
  gates.push(
    gate('product-goals:shippingGoals', !!pg?.shippingGoals?.goals?.length, null, true),
  );
  gates.push(
    gate('product-goals:gtmGoals', Array.isArray(pg?.gtmGoals) && pg.gtmGoals.length >= 1, null, true),
  );
  gates.push(gate('product-goals:activeMilestone', !!pg?.activeMilestone?.id));

  const ns = `${pg?.northStarMetric?.name ?? ''} ${pg?.northStarMetric?.target ?? ''}`;
  const mission = pg?.mission ?? '';
  gates.push(
    gate(
      'strategy:no-assurance-in-north-star',
      !ASSURANCE_RE.test(ns),
      ASSURANCE_RE.test(ns) ? 'assurance leak in northStarMetric' : 'ok',
    ),
  );
  gates.push(
    gate(
      'strategy:no-assurance-in-mission',
      !ASSURANCE_RE.test(mission.slice(0, 200)),
      ASSURANCE_RE.test(mission) ? 'assurance leak in mission' : 'ok',
    ),
  );

  const activeM = pg?.activeMilestone?.id;
  const deployGateTitle = /DEPLOY-GATE|composite\s*≥/i.test(pg?.activeMilestone?.title ?? '');
  gates.push(
    gate('strategy:milestone-not-deploy-gate', !deployGateTitle, deployGateTitle ? 'assurance milestone title' : 'ok'),
  );

  const charter = charterSections(charterPath);
  gates.push(gate('prd-charter:present', charter.present));
  gates.push(
    gate(
      'prd-charter:sections',
      charter.missing?.length === 0,
      charter.missing?.length ? `missing: ${charter.missing.join(', ')}` : `${charter.sections?.length} sections`,
    ),
  );

  gates.push(gate('prd-index:present', !!prdIdx));
  const idxMilestones = (prdIdx?.prds ?? []).flatMap((p) => p.milestones ?? []);
  const milestoneSync = activeM ? idxMilestones.includes(activeM) : true;
  gates.push(
    gate(
      'prd-index:milestone-sync',
      milestoneSync,
      milestoneSync ? 'ok' : `active=${activeM} index=${idxMilestones.join(',')}`,
    ),
  );
  const prdFeatures = (prdIdx?.prds ?? []).reduce((a, p) => a + (p.features?.length ?? 0), 0);
  gates.push(gate('prd-index:features', prdFeatures >= 1, `${prdFeatures} slugs`));

  gates.push(
    gate(
      'registry:present',
      registry.dialect !== 'none',
      registry.dialect !== 'none' ? `${registry.dialect} (${registry.count})` : 'no registry dialect',
    ),
  );
  gates.push(
    gate('registry:min-features', registry.count >= 1, `${registry.count} features`, true),
  );
  gates.push(
    gate(
      'registry:forensic-v2',
      registry.forensic || registry.dialect === 'ecosystem-v2',
      registry.forensic
        ? `workflowSteps=${registry.workflowSteps ?? 0} specGaps=${registry.specGaps ?? 0}`
        : 'bootstrap — no forensic manifest block',
      true,
    ),
  );

  const jtbdCatalog = readJson(join(repoRoot, 'machine/ux/jtbd/catalog.json'));
  gates.push(
    gate(
      'jtbd:catalog',
      Array.isArray(jtbdCatalog?.jobs) && jtbdCatalog.jobs.length >= 1,
      jtbdCatalog?.jobs?.length ? `${jtbdCatalog.jobs.length} jobs` : 'missing machine/ux/jtbd/catalog.json',
      true,
    ),
  );

  const e2eCatalog = readJson(join(repoRoot, 'machine/spec/workflows/e2e-catalog.json'));
  gates.push(
    gate(
      'workflows:e2e-catalog',
      Array.isArray(e2eCatalog?.workflows) && e2eCatalog.workflows.length >= 1,
      e2eCatalog?.workflows?.length ? `${e2eCatalog.workflows.length} workflows` : 'missing e2e-catalog',
      true,
    ),
  );

  const forensicAudit = readJson(join(repoRoot, 'machine/ci/forensic-feature-audit-latest.json'));
  gates.push(
    gate(
      'forensic:spec-impl-audit',
      !!forensicAudit?.specSurfaceAudit?.length,
      forensicAudit?.specSurfaceAudit?.length
        ? `${forensicAudit.specSurfaceAudit.length} surfaces scanned`
        : 'missing forensic-feature-audit-latest.json',
      true,
    ),
  );
  if (forensicAudit?.inventory?.workflowSteps) {
    gates.push(
      gate(
        'forensic:workflow-impl-resolved',
        forensicAudit.inventory.missingImplementations === 0 || forensicAudit.inventory.workflowSteps > 0,
        `steps=${forensicAudit.inventory.workflowSteps} pages=${forensicAudit.inventory.pageRoutes ?? '?'}`,
        true,
      ),
    );
  }

  gates.push(gate('ux:personas', personas >= 1, `${personas} personas`, personas < 3));
  gates.push(
    gate('ux:jtbd', jtbd.complete >= 1, `${jtbd.complete}/${jtbd.count} complete`, jtbd.count < 3),
  );
  gates.push(gate('ux:flows', flows >= 1, `${flows} flows`, flows < 2));

  gates.push(gate('exr:pack', exr.count >= 1, `${exr.count} files`, exr.count < 2));
  gates.push(
    gate(
      'exr:frontmatter',
      exr.complete === exr.count && exr.count > 0,
      `${exr.complete}/${exr.count} with personaId+jtbdId`,
      true,
    ),
  );

  gates.push(gate('workflows:spine', wfCount >= 1 || (e2eCatalog?.workflows?.length ?? 0) >= 1, `${wfCount || e2eCatalog?.workflows?.length || 0} workflows`, true));

  const mpr = existsSync(join(repoRoot, 'audit/evidence/five-pillar-latest.json'));
  const matrix = readJson(join(repoRoot, 'machine/ci/feature-coverage-matrix.json'));
  gates.push(
    gate(
      'audit:11pr-witness',
      mpr,
      mpr ? 'five-pillar-latest.json' : 'missing',
      true,
    ),
  );
  gates.push(
    gate(
      'audit:feature-matrix',
      !!(matrix?.features?.length || registry.count > 0),
      matrix?.features?.length ? `matrix ${matrix.features.length}` : `registry ${registry.count}`,
      true,
    ),
  );

  const scoring = options.scoring ?? {
    requiredGateWeight: 1,
    optionalGateWeight: 0.25,
    rag: { green: { gte: 85 }, yellow: { gte: 70 } },
  };
  const score = scoreGates(gates, scoring);
  const required = gates.filter((g) => !g.optional);
  const ok = required.every((g) => g.ok);

  return {
    repo,
    repoRoot,
    ok,
    score,
    registry,
    counts: {
      features: registry.count,
      workflowSteps: registry.workflowSteps ?? 0,
      specGaps: registry.specGaps ?? 0,
      prdFeatures,
      personas,
      jtbd: jtbd.count,
      jtbdCatalog: jtbdCatalog?.jobs?.length ?? 0,
      e2eWorkflows: e2eCatalog?.workflows?.length ?? 0,
      flows,
      exr: exr.count,
      workflows: wfCount,
      forensicSurfaces: forensicAudit?.specSurfaceAudit?.length ?? 0,
    },
    gates,
    activeMilestone: activeM,
    referenceTier:
      repo === 'terminal-os' || repo === 'terra-os' || repo === 'gtcx-os' ? 'reference' : 'product',
  };
}
