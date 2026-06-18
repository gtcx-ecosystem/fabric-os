/**
 * Generate pillarContract + fractalMpr blocks for docs layer packs — W12
 */
import { PILLAR_IDS } from './docs-fractal-mpr-gates.mjs';

const NA_INNOVATION = {
  notApplicable: true,
  reason: 'Innovation narratives live in docs/product/ and docs/architecture/; this layer routes only',
};

const NA_IP = {
  notApplicable: true,
  reason: 'IP magic scored in docs/product/acceptance and reference implementations',
};

const LAYER_ARTIFACTS = {
  foundation: {
    compliance: { primary: true, artifacts: ['docs/foundation/README.md', 'docs/foundation/constitution.md'], gates: ['pnpm docs:foundation:check'] },
    technicalExcellence: { secondary: true, artifacts: ['docs/foundation/goals.md'], gates: ['pnpm canon:synthesize:check'] },
    craft: { secondary: true, artifacts: ['docs/foundation/README.md'], gates: ['session read order ≤8'] },
    worldClass: { secondary: true, artifacts: ['docs/foundation/milestones.md'], gates: ['milestone exit criteria'] },
    trustAndSafety: { primary: true, artifacts: ['docs/foundation/constitution.md'], gates: ['fleet constitution link'] },
    creativityInnovation: NA_INNOVATION,
    commercialValue: { secondary: true, artifacts: ['docs/foundation/goals.md'], gates: ['links docs/business/'] },
    defensiveMoat: { secondary: true, artifacts: ['docs/foundation/vision.md'], gates: ['unique repo charter'] },
    agenticEmpowerment: { primary: true, artifacts: ['docs/foundation/README.md'], gates: ['P22 session chain'] },
    ecosystemIntegration: { secondary: true, artifacts: ['docs/foundation/roadmap.md'], gates: ['pm/ + docs/roadmap links'] },
    ipMagic: NA_IP,
  },
  business: {
    compliance: { primary: true, artifacts: ['docs/business/FOLDER-SPEC.md'], gates: ['pnpm docs:business:check'] },
    technicalExcellence: { secondary: true, artifacts: ['docs/business/research/'], gates: ['no loose md at business root'] },
    craft: { secondary: true, artifacts: ['docs/business/README.md'], gates: ['cross-ref table'] },
    worldClass: { secondary: true, artifacts: ['docs/business/market/'], gates: ['ICP + market depth'] },
    trustAndSafety: { secondary: true, artifacts: ['docs/business/customers/'], gates: ['audience claims sourced'] },
    creativityInnovation: NA_INNOVATION,
    commercialValue: { primary: true, artifacts: ['docs/business/market/', 'docs/business/economics/'], gates: ['GTM trace'] },
    defensiveMoat: { primary: true, artifacts: ['docs/business/strategy/'], gates: ['differentiation narrative'] },
    agenticEmpowerment: { secondary: true, artifacts: ['docs/business/README.md'], gates: ['agent read order link'] },
    ecosystemIntegration: { secondary: true, artifacts: ['docs/business/partnerships/'], gates: ['XR handoff links'] },
    ipMagic: NA_IP,
  },
  architecture: {
    compliance: { primary: true, artifacts: ['docs/architecture/FOLDER-SPEC.md'], gates: ['pnpm docs:architecture:check'] },
    technicalExcellence: { primary: true, artifacts: ['docs/architecture/specs/', 'docs/architecture/decisions/'], gates: ['ADR + spec nests'] },
    craft: { secondary: true, artifacts: ['docs/architecture/README.md'], gates: ['no loose ADR at root'] },
    worldClass: { secondary: true, artifacts: ['docs/architecture/integration/'], gates: ['ecosystem integration map'] },
    trustAndSafety: { primary: true, artifacts: ['docs/architecture/threat-models/'], gates: ['threat model present'] },
    creativityInnovation: { secondary: true, artifacts: ['docs/architecture/decisions/'], gates: ['novel patterns documented'] },
    commercialValue: { secondary: true, artifacts: ['docs/architecture/README.md'], gates: ['capability trace'] },
    defensiveMoat: { secondary: true, artifacts: ['docs/architecture/specs/'], gates: ['proprietary schemas'] },
    agenticEmpowerment: { secondary: true, artifacts: ['docs/architecture/integration/'], gates: ['agent/MCP surfaces'] },
    ecosystemIntegration: { primary: true, artifacts: ['docs/architecture/integration/'], gates: ['sibling repo contracts'] },
    ipMagic: { secondary: true, artifacts: ['docs/architecture/specs/'], gates: ['signature technical artifacts'] },
  },
  product: {
    compliance: { primary: true, artifacts: ['docs/product/FOLDER-SPEC.md'], gates: ['pnpm docs:product:check'] },
    technicalExcellence: { secondary: true, artifacts: ['docs/product/workflows/'], gates: ['workflow specs'] },
    craft: { primary: true, artifacts: ['docs/product/personas/', 'docs/product/journeys/'], gates: ['operator journey quality'] },
    worldClass: { secondary: true, artifacts: ['docs/product/acceptance/'], gates: ['acceptance bars'] },
    trustAndSafety: { secondary: true, artifacts: ['docs/product/workflows/'], gates: ['authority + safety paths'] },
    creativityInnovation: { secondary: true, artifacts: ['docs/product/journeys/'], gates: ['novel operator patterns'] },
    commercialValue: { primary: true, artifacts: ['docs/product/jtbd/'], gates: ['JTBD → business value'] },
    defensiveMoat: { secondary: true, artifacts: ['docs/product/acceptance/'], gates: ['signature UX'] },
    agenticEmpowerment: { secondary: true, artifacts: ['docs/product/workflows/'], gates: ['agent-operable journeys'] },
    ecosystemIntegration: { secondary: true, artifacts: ['docs/product/README.md'], gates: ['roadmap + architecture links'] },
    ipMagic: { primary: true, artifacts: ['docs/product/acceptance/'], gates: ['operator-wow acceptance'] },
  },
  roadmap: {
    compliance: { primary: true, artifacts: ['docs/roadmap/README.md'], gates: ['pnpm docs:roadmap:check'] },
    technicalExcellence: { secondary: true, artifacts: ['docs/roadmap/technical/'], gates: ['lane READMEs'] },
    craft: { secondary: true, artifacts: ['docs/roadmap/README.md'], gates: ['single-home lanes'] },
    worldClass: { secondary: true, artifacts: ['docs/roadmap/README.md'], gates: ['prioritization rubric'] },
    trustAndSafety: { secondary: true, artifacts: ['docs/roadmap/compliance/'], gates: ['compliance lane'] },
    creativityInnovation: NA_INNOVATION,
    commercialValue: { primary: true, artifacts: ['docs/roadmap/gtm/', 'docs/roadmap/partnerships/'], gates: ['GTM lane'] },
    defensiveMoat: { secondary: true, artifacts: ['docs/roadmap/README.md'], gates: ['fleet decision trace'] },
    agenticEmpowerment: { secondary: true, artifacts: ['docs/roadmap/agile/README.md'], gates: ['pointer to agile/ hub'] },
    ecosystemIntegration: { primary: true, artifacts: ['docs/roadmap/README.md'], gates: ['XR + pm links'] },
    ipMagic: NA_IP,
  },
  operations: {
    compliance: { primary: true, artifacts: ['docs/operations/FOLDER-SPEC.md'], gates: ['pnpm docs:operations:check'] },
    technicalExcellence: { primary: true, artifacts: ['docs/operations/runbooks/', 'docs/operations/deployment/'], gates: ['commands + exit codes'] },
    craft: { secondary: true, artifacts: ['docs/operations/README.md'], gates: ['runbook index'] },
    worldClass: { primary: true, artifacts: ['docs/operations/runbooks/'], gates: ['global ops bars'] },
    trustAndSafety: { primary: true, artifacts: ['docs/operations/agent-spine/'], gates: ['P27 execution obligation'] },
    creativityInnovation: NA_INNOVATION,
    commercialValue: { secondary: true, artifacts: ['docs/operations/README.md'], gates: ['pilot unblock path'] },
    defensiveMoat: { secondary: true, artifacts: ['docs/operations/deployment/'], gates: ['proprietary deploy choreography'] },
    agenticEmpowerment: { primary: true, artifacts: ['docs/operations/agent-spine/'], gates: ['agent ops narrative'] },
    ecosystemIntegration: { secondary: true, artifacts: ['docs/operations/integrations/'], gates: ['cross-repo runbooks'] },
    ipMagic: NA_IP,
  },
};

export function buildPillarContract(layerId, layerWitness, minBar) {
  const seeds = LAYER_ARTIFACTS[layerId];
  if (!seeds) return null;
  const contract = {};
  for (const id of PILLAR_IDS) {
    const seed = seeds[id] ?? { secondary: true, artifacts: [], gates: ['layer pack check'] };
    contract[id] = {
      ...seed,
      minBar: seed.minBar ?? minBar,
      witness: layerWitness,
    };
  }
  return contract;
}

export function buildFractalMprBlock(layerWitness, scorecard) {
  return {
    policy: 'pm/spec/docs-fractal-mpr-policy.json',
    layerWitness,
    scorecard,
    rollupFrom: ['file', 'folder'],
    scorecardIsReadOnlyRollup: true,
  };
}

export function scorecardBody(layer, target, witnessRel, packRel, primaryPillars) {
  const rows = PILLAR_IDS.map((id) => {
    const role = primaryPillars.includes(id) ? 'primary' : id.includes('creativity') || id === 'ipMagic' ? 'N/A' : 'secondary';
    return `| ${id} | ${role} | pack contract | MPR witness rollup | ${target} |`;
  }).join('\n');
  return `---
title: 'pillar-scorecard — ${layer.path}'
status: current
date: 2026-06-16
document_type: folder-spec
tier: operating
tags: ['documentation', 'multi-pillar', 'fractal-mpr']
review_cycle: on-change
---

# Pillar scorecard — \`${layer.path}\`

**Read-only rollup** — scores come from published MPR witnesses, not manual entry.

- Policy: [\`../../canon-os/pm/spec/docs-fractal-mpr-policy.json\`](../../canon-os/pm/spec/docs-fractal-mpr-policy.json)
- Pack: [\`${packRel}\`](${packRel}#pillarContract)
- **Layer witness (SoR):** [\`${witnessRel}\`](${witnessRel})

**Composite target:** **${target}/100** per profile at layer audit order.

| Pillar | Role | Artifacts | Gate | Target |
| ------ | ---- | --------- | ---- | ------ |
${rows}

## Fractal rollup

| Scope | Witness |
| ----- | ------- |
| File | \`audit/evidence/mpr-files/${layer.id}/*.json\` (planned) |
| Folder | child file witnesses |
| Layer | \`${witnessRel}\` |
| Repo | \`audit/evidence/five-pillar-latest.json\` |
`;
}

export function witnessStubBody(layer, repoName, target) {
  return {
    schema: 'gtcx://canon-os/mpr-layer-witness-stub/v1',
    scope: 'layer',
    layer: layer.id,
    path: layer.path,
    repo: repoName,
    evaluatedAt: new Date().toISOString(),
    published: false,
    pillarTarget: target,
    fullComposite100: null,
    foundationComposite100: null,
    trustCap100: null,
    rollupFrom: {
      file: `audit/evidence/mpr-files/${layer.id}/`,
      folder: layer.path,
      packCheck: layer.check,
    },
    quadrants: Object.fromEntries(
      PILLAR_IDS.map((id) => [id, { score100: null, published: false, provisional: true }]),
    ),
    note: 'Bootstrap stub — publish via bridge run-five-pillar-audit.mjs --scope layer when live',
  };
}
