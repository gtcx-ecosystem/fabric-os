#!/usr/bin/env node
/**
 * fabric-os docs layer decompose — reference, specs, operations root.
 * Usage: node platform/scripts/docs-layer-decompose.mjs [--write]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const WRITE = process.argv.includes('--write');
const DRY = !WRITE;

function log(msg) {
  console.log(DRY ? `[dry] ${msg}` : msg);
}

function ensureDir(rel) {
  const abs = join(root, rel);
  if (!existsSync(abs)) mkdirSync(abs, { recursive: true });
}

function moveFile(fromRel, toRel) {
  const from = join(root, fromRel);
  const to = join(root, toRel);
  if (!existsSync(from)) return false;
  if (existsSync(to)) {
    log(`skip exists ${toRel}`);
    rmSync(from);
    return false;
  }
  ensureDir(dirname(toRel));
  if (DRY) {
    log(`mv ${fromRel} → ${toRel}`);
    return true;
  }
  renameSync(from, to);
  return true;
}

function moveTree(fromRel, toRel) {
  const from = join(root, fromRel);
  if (!existsSync(from)) return 0;
  let n = 0;
  const walk = (src, dest) => {
    for (const e of readdirSync(src, { withFileTypes: true })) {
      const s = join(src, e.name);
      const d = join(dest, e.name);
      if (e.isDirectory()) {
        ensureDir(join(toRel, e.name));
        walk(s, d);
      } else if (e.name.endsWith('.md') || e.name.endsWith('.yaml')) {
        const relFrom = s.slice(root.length + 1);
        const relTo = d.slice(root.length + 1);
        if (moveFile(relFrom, relTo)) n += 1;
      }
    }
  };
  ensureDir(toRel);
  walk(from, join(root, toRel));
  if (!DRY && existsSync(from)) rmSync(from, { recursive: true, force: true });
  return n;
}

function restoreReferenceFromGit() {
  if (existsSync(join(root, 'docs/reference/README.md'))) return;
  log('restore docs/reference from HEAD');
  if (!DRY) {
    const r = spawnSync('git', ['checkout', 'HEAD', '--', 'docs/reference'], { cwd: root, stdio: 'inherit' });
    if (r.status !== 0) throw new Error('git checkout docs/reference failed');
  }
}

function decomposeReference() {
  restoreReferenceFromGit();
  const moves = [
    ['docs/reference/adr/ADR-0007-fabric-os-repo-rename.md', 'docs/architecture/decisions/ADR-0007-fabric-os-repo-rename.md'],
    ['docs/reference/design/canonical-layouts.md', 'docs/architecture/specs/design/canonical-layouts.md'],
    ['docs/reference/design/ledger-doctrine.md', 'docs/architecture/specs/design/ledger-doctrine.md'],
    ['docs/reference/design/token-system.md', 'docs/architecture/specs/design/token-system.md'],
    ['docs/reference/evaluation/multi-pillar-audit.md', 'docs/architecture/pillars/multi-pillar-audit.md'],
    ['docs/reference/financial/accounting-policies.md', 'docs/business/economics/accounting-policies.md'],
    ['docs/reference/financial/expense-policy.md', 'docs/business/economics/expense-policy.md'],
    ['docs/reference/financial/trust-account.md', 'docs/business/economics/trust-account.md'],
    ['docs/reference/esg/esg-policy.md', 'docs/business/research/esg-policy.md'],
    ['docs/reference/guides/market/competitors.md', 'docs/business/market/competitors.md'],
    ['docs/reference/guides/market/industry-landscape.md', 'docs/business/market/industry-landscape.md'],
    ['docs/reference/guides/performance-metrics.md', 'docs/operations/runbooks/sre/performance-metrics.md'],
    ['docs/reference/guides/performance-slos.md', 'docs/operations/runbooks/sre/performance-slos.md'],
    ['docs/reference/alternative-network-concepts.md', 'docs/business/research/alternative-network-concepts.md'],
    ['docs/reference/cannon-glossary.md', 'docs/reference/glossary.md'],
  ];
  let moved = 0;
  for (const [from, to] of moves) {
    if (moveFile(from, to)) moved += 1;
  }
  for (const stub of [
    'docs/reference/adr/README.md',
    'docs/reference/design/README.md',
    'docs/reference/esg/README.md',
    'docs/reference/evaluation/README.md',
    'docs/reference/financial/README.md',
    'docs/reference/security/README.md',
    'docs/reference/folder-spec.md',
    'docs/reference/guides/folder-spec.md',
    'docs/reference/guides/market/README.md',
  ]) {
    if (existsSync(join(root, stub)) && !DRY) rmSync(join(root, stub));
  }
  const refReadme = `---
title: 'reference — pointer hub'
status: pointer
date: 2026-06-16
owner: fabric-os
document_type: overview
review_cycle: on-change
---

# docs/reference/

> **Canonical SoR:** decomposed per \`docs-business-pack.json\` + \`docs-architecture-pack.json\`.

| Remaining | Role |
| --------- | ---- |
| [\`guides/\`](./guides/) | Writing guides, glossary, integration patterns |
| [\`glossary.md\`](./glossary.md) | Cannon / fleet glossary |

Business narrative → \`docs/business/\` · Technical specs → \`docs/architecture/\` · Runbooks → \`docs/operations/runbooks/\`
`;
  if (!DRY) {
    ensureDir('docs/reference');
    ensureDir('docs/reference/guides');
    writeFileSync(join(root, 'docs/reference/README.md'), refReadme);
  } else log('write docs/reference/README.md pointer');
  return moved;
}

function decomposeSpecs() {
  const rootMoves = [
    ['docs/specs/cicd-pipeline.md', 'docs/architecture/specs/backend/cicd-pipeline.md'],
    ['docs/specs/data-governance.md', 'docs/architecture/specs/data/data-governance.md'],
    ['docs/specs/observability-framework.md', 'docs/architecture/specs/backend/observability-framework.md'],
    ['docs/specs/resilience-framework.md', 'docs/architecture/specs/backend/resilience-framework.md'],
    ['docs/specs/scalability-framework.md', 'docs/architecture/specs/backend/scalability-framework.md'],
    ['docs/specs/testing-framework.md', 'docs/architecture/specs/testing/testing-framework.md'],
    ['docs/specs/vault-dynamic-credentials.md', 'docs/architecture/specs/backend/vault-dynamic-credentials.md'],
    ['docs/specs/ussd-protocol.md', 'docs/architecture/specs/backend/ussd-protocol.md'],
    ['docs/specs/ia-navigation-spec.md', 'docs/architecture/specs/design/ia-navigation-spec.md'],
    ['docs/specs/operator-journey-map.md', 'docs/product/ux/operator-journey-map.md'],
    ['docs/specs/folder-spec.md', 'docs/architecture/specs/folder-spec.md'],
  ];
  let moved = 0;
  for (const [from, to] of rootMoves) {
    if (moveFile(from, to)) moved += 1;
  }
  moved += moveTree('docs/specs/ecosystem', 'docs/architecture/integration/ecosystem');
  moved += moveTree('docs/specs/experiences', 'docs/product/surfaces/experiences');
  const specsPointer = `---
title: 'specs — pointer'
status: pointer
date: 2026-06-16
owner: fabric-os
document_type: overview
review_cycle: on-change
---

# docs/specs/ (legacy path)

> **Canonical SoR:** [\`../architecture/specs/\`](../architecture/specs/)

Do not add new files here. Experiences → \`docs/product/surfaces/experiences/\`.
`;
  if (!DRY) {
    ensureDir('docs/specs');
    writeFileSync(join(root, 'docs/specs/README.md'), specsPointer);
    const readme = join(root, 'docs/specs/README.md');
    for (const ent of readdirSync(join(root, 'docs/specs'))) {
      if (ent === 'README.md') continue;
      const p = join(root, 'docs/specs', ent);
      rmSync(p, { recursive: true, force: true });
    }
  } else log('collapse docs/specs to pointer README');
  return moved;
}

function decomposeOperationsRoot() {
  const moves = [
    ['docs/operations/agent-work-selection.md', 'docs/operations/agent-spine/agent-work-selection.md'],
    ['docs/operations/aiops-as-a-service.md', 'docs/operations/platform-services/aiops-as-a-service.md'],
    ['docs/operations/aiops-agentic-team.md', 'docs/operations/platform-services/aiops-agentic-team.md'],
    ['docs/operations/commops-as-a-service.md', 'docs/operations/platform-services/commops-as-a-service.md'],
    ['docs/operations/finops-as-a-service.md', 'docs/operations/platform-services/finops-as-a-service.md'],
    ['docs/operations/soc-operations.md', 'docs/operations/secas/soc-operations.md'],
  ];
  let moved = 0;
  for (const [from, to] of moves) {
    const fromAbs = join(root, from);
    const toAbs = join(root, to);
    if (!existsSync(fromAbs)) continue;
    if (existsSync(toAbs)) {
      if (!DRY) rmSync(fromAbs);
      log(`dedupe removed ${from}`);
      moved += 1;
      continue;
    }
    if (moveFile(from, to)) moved += 1;
  }
  return moved;
}

function updateSor() {
  const sorPath = join(root, 'docs/sor.json');
  if (!existsSync(sorPath)) return;
  const sor = JSON.parse(readFileSync(sorPath, 'utf8'));
  sor.updated = '2026-06-16';
  sor.allowedTopLevel = (sor.allowedTopLevel ?? []).filter((x) => x !== 'specs' && x !== 'overview');
  if (!sor.allowedTopLevel.includes('reference')) sor.allowedTopLevel.push('reference');
  sor.documentDriven.paths = (sor.documentDriven?.paths ?? []).filter((p) => p !== 'docs/specs/');
  if (!sor.documentDriven.paths.includes('docs/business/')) sor.documentDriven.paths.push('docs/business/');
  sor.pointerOnly = sor.pointerOnly ?? { description: '', paths: [] };
  const ptr = new Set(sor.pointerOnly.paths ?? []);
  ptr.add('docs/reference/');
  ptr.add('docs/specs/');
  sor.pointerOnly.paths = [...ptr];
  sor.iaExemptions = sor.iaExemptions ?? {};
  sor.iaExemptions.denseExemptPathPrefixes = (sor.iaExemptions.denseExemptPathPrefixes ?? []).filter(
    (p) => p !== 'docs/overview/product' && p !== 'docs/reference/archive',
  );
  if (!DRY) writeFileSync(sorPath, `${JSON.stringify(sor, null, 2)}\n`);
  else log('update docs/sor.json');
}

const results = {
  reference: decomposeReference(),
  specs: decomposeSpecs(),
  operationsRoot: decomposeOperationsRoot(),
};
updateSor();
console.log(JSON.stringify({ dryRun: DRY, results }, null, 2));
