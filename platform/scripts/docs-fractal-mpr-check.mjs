#!/usr/bin/env node
/**
 * docs:fractal-mpr:check — fractal 11-pillar policy for all docs layers (W12)
 * Usage: node docs-fractal-mpr-check.mjs [--write] [--strict]
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier } from './lib/resolve-docs-pack.mjs';
import {
  canonicalRepoId,
  checkFractalMprBlock,
  checkLayerWitnessStub,
  checkPillarContractComplete,
  checkScorecardWitnessLink,
  emitFractalReport,
  gate,
  layerAppliesToRepo,
  loadPack,
  loadPolicy,
  resolvePillarTarget,
} from './lib/docs-fractal-mpr-gates.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');
const WITNESS = join(REPO, 'audit/evidence/docs-fractal-mpr-latest.json');

function main() {
  const gates = [];
  const policy = loadPolicy(REPO);
  const packageName = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;
  const repoId = canonicalRepoId(REPO, packageName, policy);
  const profileKey = profileKeyFromTier(readProductTier(REPO));
  const target = policy ? resolvePillarTarget(repoId, policy) : 85;

  gates.push(
    gate('policy:present', !!policy, policy ? policy.updated : 'missing docs-fractal-mpr-policy.json'),
  );
  if (!policy) {
    emitFractalReport(gates, repoName, policy, WRITE, WITNESS);
    return;
  }

  gates.push(
    gate('policy:rollup-rules', policy.rollupRules?.forbidSelfAssessedWithoutWitness === true, 'rollup from witnesses'),
  );
  gates.push(gate('profile:target', target === 85 || target === 100, `pillar target ${target}`));

  for (const layer of policy.layers) {
    const prefix = `layer:${layer.id}`;
    const canonicalNorm = (layer.canonical ?? layer.path).replace(/\/$/, '');
    const layerPathNorm = layer.path.replace(/\/$/, '');
    if (layer.status === 'deprecated-pointer' && layerPathNorm !== canonicalNorm) {
      gates.push(
        gate(`${prefix}:deprecated-pointer`, true, `skipped — rollup via ${layer.canonical ?? layer.path}`),
      );
      continue;
    }

    const packSpec = loadPack(REPO, layer.pack);
    if (!packSpec) {
      gates.push(gate(`${prefix}:pack`, false, layer.pack));
      continue;
    }
    if (!layerAppliesToRepo(layer, packSpec, profileKey)) {
      gates.push(gate(`${prefix}:skip`, true, `not required for profile ${profileKey}`));
      continue;
    }

    const layerPath = join(REPO, layer.path);
    gates.push(
      gate(`${prefix}:path`, existsSync(layerPath) || layer.id === 'roadmap', layer.path),
    );

    checkPillarContractComplete(packSpec, prefix, gates);
    checkFractalMprBlock(packSpec, prefix, gates);

    const witnessRel = packSpec.fractalMpr?.layerWitness ?? layer.layerWitness;
    const scorecardRel = packSpec.fractalMpr?.scorecard ?? layer.scorecard;
    checkScorecardWitnessLink(join(REPO, scorecardRel), witnessRel, target, gates, prefix);
    checkLayerWitnessStub(join(REPO, witnessRel), layer, repoId, target, STRICT, gates, prefix);
  }

  emitFractalReport(gates, repoId, policy, WRITE, WITNESS);
}

main();
