#!/usr/bin/env node
/**
 * agile:check — strict agile/ pack per resolved agile-pack.json
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/agile-latest.json');
const PACK = 'agile-pack.json';

const PILLAR_IDS = [
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

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function agileProfileKey(tier, repoName) {
  if (repoName === 'agile-os' || tier === 'fleet-agile') return 'fleet-agile';
  return profileKeyFromTier(tier);
}

function isPointerOnly(filePath) {
  if (!existsSync(filePath)) return true;
  const text = readFileSync(filePath, 'utf8');
  return (
    /status:\s*pointer/i.test(text) ||
    /\*\*Canonical SoR:\*\*/.test(text) ||
    /\*\*Canonical agile hub:\*\*/.test(text)
  );
}

function checkShadowPath(relPath, gates) {
  const abs = join(REPO, relPath);
  if (!existsSync(abs)) return;
  const readme = join(abs, 'README.md');
  if (!existsSync(readme)) {
    gates.push(gate(`shadow:${relPath}`, false, `${relPath}/ exists without pointer README`));
    return;
  }
  gates.push(
    gate(
      `shadow:${relPath}`,
      isPointerOnly(readme),
      `${relPath}/ must be pointer-only to agile/`,
    ),
  );
  for (const ent of readdirSync(abs, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      gates.push(gate(`shadow-nodir:${relPath}/${ent.name}`, false, 'shadow path must not have subdirs'));
    } else if (ent.name !== 'README.md' && !isPointerOnly(join(abs, ent.name))) {
      gates.push(gate(`shadow-loose:${relPath}/${ent.name}`, false, 'shadow path — pointer README + pointer stubs only'));
    }
  }
}

function main() {
  const gates = [];
  const resolution = resolveDocsPack(REPO, PACK);
  const spec = resolution.resolved;
  const repoName = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;

  gates.push(
    gate(
      'spec:local-present',
      !!resolution.localPath || existsSync(join(REPO, '../canon-os/pm/spec', PACK)),
      resolution.localPath ?? 'missing pm/spec/agile-pack.json',
    ),
  );
  gates.push(gate('spec:not-stub', !resolution.localIsStub, resolution.localIsStub ? 'upgrade pack' : 'full local pack'));
  gates.push(
    gate(
      'spec:resolved-full',
      resolution.resolvedIsFull,
      resolution.resolvedIsFull ? 'resolved full agile pack' : 'could not resolve pack',
    ),
  );

  if (!spec || !resolution.resolvedIsFull) {
    emit(gates, repoName, resolution);
    return;
  }

  const tier = readProductTier(REPO);
  const profileKey = agileProfileKey(tier, repoName);
  const profile = spec.profiles?.[profileKey] ?? spec.profiles?.product;
  gates.push(gate('profile', !!profile, profileKey));

  const agileDir = join(REPO, spec.canonicalPath ?? 'agile');
  const agileExists = existsSync(agileDir);

  if (!profile?.agileRequired && !agileExists) {
    gates.push(gate('agile-optional-skip', true, `${profileKey} — agile not required`));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  if (profileKey === 'constitution-standards') {
    gates.push(gate('hub:readme', existsSync(join(agileDir, 'README.md')), 'agile/README.md'));
    if (existsSync(join(agileDir, 'README.md'))) {
      const readme = readFileSync(join(agileDir, 'README.md'), 'utf8');
      gates.push(
        gate('hub:agile-os-pointer', /agile-os/i.test(readme), 'hub README must point to agile-os CPO reference'),
      );
      gates.push(gate('hub:cpo-link', /CPO|Chief Product Officer/i.test(readme), 'hub README cites fleet CPO'));
    }
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  for (const entry of spec.requiredRootFiles ?? []) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const missingContract = PILLAR_IDS.filter((id) => !spec.pillarContract?.[id]);
  gates.push(
    gate(
      'pillarContract:complete',
      missingContract.length === 0,
      missingContract.length ? `missing: ${missingContract.join(', ')}` : 'all 11 pillars in pack',
    ),
  );

  const rootReadme = join(agileDir, 'README.md');
  if (existsSync(rootReadme)) {
    const text = readFileSync(rootReadme, 'utf8');
    gates.push(gate('root-readme:agile-os-ref', /agile-os/i.test(text), 'README links agile-os reference'));
    gates.push(
      gate(
        'root-readme:ceremony-surface',
        /intake\.md/i.test(text) && /planning\.md/i.test(text),
        'README documents ceremony surface (intake, planning)',
      ),
    );
    gates.push(gate('root-readme:cpo', /cpo\.md|CPO|Chief Product Officer/i.test(text), 'README cites CPO connection'));
    gates.push(
      gate('root-readme:scorecard', /scorecard/i.test(text), 'README links scorecard'),
    );
  }

  const scorecardPath = join(agileDir, 'scorecard.md');
  if (existsSync(scorecardPath)) {
    const sc = readFileSync(scorecardPath, 'utf8');
    const missingInSc = PILLAR_IDS.filter((id) => !new RegExp(id, 'i').test(sc));
    gates.push(
      gate(
        'scorecard:eleven-pillars',
        missingInSc.length === 0,
        missingInSc.length ? `missing: ${missingInSc.join(', ')}` : 'all 11 pillars listed',
      ),
    );
    const target = profile?.pillarTarget ?? 85;
    gates.push(
      gate(
        'scorecard:target',
        new RegExp(`${target}|100\\/100|compositeTarget`).test(sc),
        `pillar target ${target}/100 documented`,
      ),
    );
  }

  const cpoPath = join(agileDir, 'cpo.md');
  if (existsSync(cpoPath)) {
    const cpo = readFileSync(cpoPath, 'utf8');
    gates.push(
      gate(
        'cpo:charter-link',
        /Chief Product Officer|tactical CPO|fleet-agile-hub/i.test(cpo),
        'cpo.md links fleet CPO charter',
      ),
    );
  }

  const folderSpec = join(agileDir, 'FOLDER-SPEC.md');
  if (existsSync(folderSpec)) {
    gates.push(
      gate(
        'root-folder-spec:pack-link',
        /agile-pack/i.test(readFileSync(folderSpec, 'utf8')),
        'FOLDER-SPEC cites pack',
      ),
    );
  }

  for (const sub of profile?.requiredSubfolders ?? []) {
    const def = spec.requiredSubfolders?.[sub];
    const dir = join(agileDir, sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `agile/${sub}/`));
    for (const f of def?.required ?? ['README.md']) {
      gates.push(gate(`subfolder-file:${sub}/${f}`, existsSync(join(dir, f)), `agile/${sub}/${f}`));
    }
  }

  for (const sub of profile?.optionalSubfolders ?? []) {
    const dir = join(agileDir, sub);
    if (!existsSync(dir)) continue;
    const def = spec.requiredSubfolders?.[sub];
    gates.push(gate(`optional-subfolder:${sub}`, true, `agile/${sub}/ present`));
    for (const f of def?.required ?? ['README.md']) {
      if (f === 'README.md' || existsSync(join(dir, f))) {
        gates.push(gate(`optional-file:${sub}/${f}`, existsSync(join(dir, f)), `agile/${sub}/${f}`));
      }
    }
  }

  if (profile?.isReferenceImpl) {
    for (const link of profile.hubLinks ?? []) {
      gates.push(gate(`hub-link:${link}`, existsSync(join(REPO, link)), link));
    }
    gates.push(
      gate(
        'hub:cpo-product-goals',
        existsSync(join(REPO, 'pm/spec/product-goals.json')),
        'agile-os product-goals SoR',
      ),
    );
    gates.push(
      gate(
        'hub:pillar-target-100',
        profile.pillarTarget === 100,
        'fleet CPO hub targets 100/100 on 11 pillars',
      ),
    );
  }

  const manifestPath = join(REPO, spec.crossReference?.opsBinding?.manifest ?? 'ops/pm/manifest.json');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const expected = spec.crossReference?.opsBinding?.expectedValue ?? 'agile';
      const actual = manifest?.local?.agileDocs;
      gates.push(
        gate('ops-manifest:agileDocs', actual === expected, `ops/pm/manifest.json local.agileDocs = ${expected}`),
      );
    } catch {
      gates.push(gate('ops-manifest:parse', false, 'ops/pm/manifest.json invalid JSON'));
    }
  }

  for (const shadow of spec.forbiddenShadowPaths ?? []) {
    checkShadowPath(shadow.path, gates);
  }

  emit(gates, repoName, resolution, profileKey);
}

function emit(gates, repoName, resolution, profileKey = null) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/agile-check/v1',
    repo: repoName,
    profile: profileKey,
    at: new Date().toISOString(),
    ok,
    gates,
  };
  if (WRITE) {
    mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
  }
  console.log('=== agile:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  process.exit(ok ? 0 : 1);
}

main();
