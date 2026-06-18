/**
 * Shared fractal MPR gates for all docs layers — INIT-DOCS-CORE-IA W12
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const PILLAR_IDS = [
  'compliance',
  'technicalExcellence',
  'craft',
  'worldClass',
  'trustAndSafety',
  'creativityInnovation',
  'commercialValue',
  'defensiveMoat',
  'agenticEmpowerment',
  'ecosystemIntegration',
  'ipMagic',
];

export const PACKS_WITH_CONTRACT = [
  'docs-foundation-pack.json',
  'docs-business-pack.json',
  'docs-architecture-pack.json',
  'docs-product-pack.json',
  'docs-roadmap-pack.json',
  'agile-pack.json',
  'docs-operations-pack.json',
  'agents-pack.json',
];

export function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

export function loadPolicy(repoRoot) {
  const local = join(repoRoot, 'pm/spec/docs-fractal-mpr-policy.json');
  const canon = join(repoRoot, '../canon-os/pm/spec/docs-fractal-mpr-policy.json');
  const path = existsSync(local) ? local : canon;
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadPack(repoRoot, packRel) {
  const local = join(repoRoot, packRel);
  const canon = join(repoRoot, '../canon-os/pm/spec', packRel.replace(/^pm\/spec\//, ''));
  const path = existsSync(local) ? local : existsSync(canon) ? canon : null;
  if (!path) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function canonicalRepoId(repoRoot, packageName, policy) {
  const dirName = repoRoot.split(/[/\\]/).pop();
  if (policy?.repoIdResolution?.preferDirectoryName !== false) {
    if (
      dirName?.endsWith('-os') ||
      dirName?.endsWith('-ai') ||
      dirName === 'ledger-ui' ||
      dirName === 'canon-os'
    ) {
      return dirName;
    }
  }
  const alias = policy?.repoIdResolution?.packageNameAliases?.[packageName];
  if (alias) return alias;
  return packageName;
}

export function resolvePillarTarget(repoId, policy) {
  if (policy.profiles.referenceImpl.repos.includes(repoId)) {
    return policy.profiles.referenceImpl.pillarTarget;
  }
  if (repoId === 'canon-os' || repoId === 'bridge-os') {
    return 100;
  }
  return policy.profiles.product.pillarTarget;
}

export function checkPillarContractComplete(spec, prefix, gates) {
  const missing = PILLAR_IDS.filter((id) => !spec?.pillarContract?.[id]);
  gates.push(
    gate(
      `${prefix}:pillarContract-complete`,
      missing.length === 0,
      missing.length ? `missing: ${missing.join(', ')}` : 'all 11 pillars in pack',
    ),
  );
  return missing.length === 0;
}

export function checkFractalMprBlock(spec, prefix, gates) {
  const fm = spec?.fractalMpr;
  gates.push(
    gate(
      `${prefix}:fractalMpr-present`,
      !!fm?.policy && !!fm?.layerWitness && !!fm?.scorecard,
      fm ? 'fractalMpr block present' : 'pack missing fractalMpr { policy, layerWitness, scorecard }',
    ),
  );
}

export function checkScorecardWitnessLink(scorecardPath, witnessRel, target, gates, prefix) {
  if (!existsSync(scorecardPath)) {
    gates.push(gate(`${prefix}:scorecard`, false, `missing ${witnessRel.replace(/.*\//, '../')}`));
    return;
  }
  const text = readFileSync(scorecardPath, 'utf8');
  gates.push(gate(`${prefix}:scorecard-exists`, true, scorecardPath));
  gates.push(
    gate(
      `${prefix}:scorecard-witness-link`,
      text.includes(witnessRel) || text.includes('mpr-') && text.includes('-layer-latest.json'),
      'scorecard links layer MPR witness (not self-assessed only)',
    ),
  );
  gates.push(
    gate(
      `${prefix}:scorecard-target`,
      new RegExp(`${target}|rollupTarget|rollup`).test(text),
      `scorecard documents target ${target}/100 or rollup`,
    ),
  );
  gates.push(
    gate(
      `${prefix}:scorecard-rollup-notice`,
      /rollup|witness|read-only|published/i.test(text),
      'scorecard declares rollup from witness',
    ),
  );
  const missingInSc = PILLAR_IDS.filter((id) => !new RegExp(id, 'i').test(text));
  gates.push(
    gate(
      `${prefix}:scorecard-eleven-pillars`,
      missingInSc.length === 0,
      missingInSc.length ? `missing: ${missingInSc.join(', ')}` : 'all 11 pillars listed',
    ),
  );
}

export function checkLayerWitnessStub(witnessPath, layer, repoName, target, strict, gates, prefix) {
  if (!existsSync(witnessPath)) {
    gates.push(gate(`${prefix}:layer-witness`, !strict, strict ? 'missing layer witness' : 'bootstrap: witness stub pending'));
    return;
  }
  let witness;
  try {
    witness = JSON.parse(readFileSync(witnessPath, 'utf8'));
  } catch {
    gates.push(gate(`${prefix}:layer-witness-parse`, false, 'invalid JSON'));
    return;
  }
  gates.push(gate(`${prefix}:layer-witness-parse`, true, witnessPath));
  const schemaOk =
    typeof witness.schema === 'string' &&
    (witness.schema.includes('mpr-layer') || witness.schema.includes('mpr-witness'));
  gates.push(gate(`${prefix}:layer-witness-schema`, schemaOk, witness.schema ?? 'no schema'));
  gates.push(
    gate(`${prefix}:layer-witness-scope`, witness.scope === 'layer' && witness.layer === layer.id, `${layer.id} layer scope`),
  );
  gates.push(
    gate(`${prefix}:layer-witness-target`, witness.pillarTarget === target, `target ${target}`),
  );
  if (strict) {
    gates.push(
      gate(
        `${prefix}:layer-witness-published`,
        witness.published === true,
        witness.published ? 'published' : 'published:false — run MPR scoped audit',
      ),
    );
    const rollupScore = witness.fullComposite100 ?? witness.composite100;
    if (typeof rollupScore === 'number') {
      gates.push(
        gate(`${prefix}:layer-witness-rollup`, rollupScore >= target, `rollup ${rollupScore}/${target}`),
      );
    } else {
      gates.push(gate(`${prefix}:layer-witness-rollup`, false, 'no rollup score'));
    }
  } else if (witness.published === true) {
    const rollupScore = witness.fullComposite100 ?? witness.composite100;
    if (typeof rollupScore === 'number') {
      gates.push(
        gate(`${prefix}:layer-witness-rollup`, rollupScore >= target, `rollup ${rollupScore}/${target}`),
      );
    } else {
      gates.push(gate(`${prefix}:layer-witness-rollup`, false, 'no rollup score'));
    }
  } else {
    gates.push(
      gate(
        `${prefix}:layer-witness-stub`,
        witness.published === false || witness.published === undefined,
        'bootstrap stub (published:false until MPR audit)',
      ),
    );
  }
}

export function layerAppliesToRepo(layer, packSpec, profileKey) {
  if (!packSpec?.profiles) return true;
  const profile = packSpec.profiles[profileKey];
  if (!profile) return true;
  if (layer.id === 'foundation') return true;
  if (layer.id === 'business' && profile.businessOptional) return false;
  if (layer.id === 'product' && profile.productOptional) return false;
  if (layer.id === 'agile' && profile.agileRequired === false) return false;
  if (layer.id === 'agents' && profile.agentsRequired === false) return false;
  return true;
}

export function emitFractalReport(gates, repoName, policy, write, witnessPath) {
  const pass = gates.filter((g) => g.ok).length;
  const fail = gates.length - pass;
  console.log('\n=== docs:fractal-mpr:check ===\n');
  for (const g of gates) {
    console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  }
  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass}/${gates.length}\n`);
  if (write) {
    mkdirSync(dirname(witnessPath), { recursive: true });
    writeFileSync(
      witnessPath,
      `${JSON.stringify(
        {
          schema: 'gtcx://canon-os/docs-fractal-mpr-check/v1',
          generatedAt: new Date().toISOString(),
          repo: repoName,
          policyUpdated: policy?.updated,
          pass: fail === 0,
          gates,
        },
        null,
        2,
      )}\n`,
    );
  }
  process.exit(fail === 0 ? 0 : 1);
}
