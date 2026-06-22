#!/usr/bin/env node
/**
 * docs:operations:check — strict docs/operations/ pack per resolved docs-operations-pack.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-operations-latest.json');
const PACK = 'docs-operations-pack.json';

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
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
      resolution.localPath ?? 'missing machine/spec/docs-operations-pack.json',
    ),
  );
  gates.push(gate('spec:not-stub', !resolution.localIsStub, resolution.localIsStub ? 'upgrade pack' : 'full local pack'));
  gates.push(
    gate(
      'spec:resolved-full',
      resolution.resolvedIsFull,
      resolution.resolvedIsFull ? 'resolved full operations pack' : 'could not resolve pack',
    ),
  );

  if (!spec || !resolution.resolvedIsFull) {
    emit(gates, repoName, resolution);
    return;
  }

  const tier = readProductTier(REPO);
  const profileKey = profileKeyFromTier(tier, REPO);
  let profile = spec.profiles?.[profileKey] ?? spec.profiles?.product;
  if (profile?.extends && spec.profiles?.[profile.extends]) {
    profile = { ...spec.profiles[profile.extends], ...profile };
  }
  gates.push(gate('profile', !!profile, profileKey));

  const opsDir = join(REPO, 'docs/operations');
  const opsExists = existsSync(opsDir);

  if (!profile?.operationsRequired && !opsExists) {
    gates.push(gate('operations-optional-skip', true, `${profileKey} — operations not required`));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  if (profileKey === 'constitution-standards') {
    gates.push(gate('hub:readme', existsSync(join(opsDir, 'README.md')), 'docs/operations/README.md'));
    if (existsSync(join(opsDir, 'README.md'))) {
      const readme = readFileSync(join(opsDir, 'README.md'), 'utf8');
      const isHubHost = repoName === 'canon-os';
      gates.push(
        gate(
          'hub:ecosystem-pointer',
          isHubHost || /ecosystem-os|canon-os/i.test(readme),
          'hub README must point to fleet ops narrative',
        ),
      );
    }
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  for (const entry of spec.requiredRootFiles ?? []) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const rootReadme = join(opsDir, 'README.md');
  if (existsSync(rootReadme)) {
    const text = readFileSync(rootReadme, 'utf8');
    gates.push(gate('root-readme:cross-ref', /cross-ref/i.test(text) && /foundation/i.test(text), 'README cross-ref'));
    gates.push(gate('root-readme:ops-link', /\bops\//i.test(text), 'README must link operations/ machine SoR'));
  }

  const folderSpec = join(opsDir, 'FOLDER-SPEC.md');
  if (existsSync(folderSpec)) {
    gates.push(
      gate('root-folder-spec:pack-link', /docs-operations-pack/i.test(readFileSync(folderSpec, 'utf8')), 'FOLDER-SPEC cites pack'),
    );
  }

  for (const sub of profile?.requiredSubfolders ?? []) {
    const def = spec.requiredSubfolders?.[sub];
    const dir = join(opsDir, sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `docs/operations/${sub}/`));
    for (const f of def?.required ?? ['README.md']) {
      gates.push(gate(`subfolder-file:${sub}/${f}`, existsSync(join(dir, f)), `docs/operations/${sub}/${f}`));
    }
    for (const file of def?.canonicalFiles ?? []) {
      gates.push(gate(`canonical:${sub}/${file}`, existsSync(join(dir, file)), `docs/operations/${sub}/${file}`));
    }
  }

  emit(gates, repoName, resolution, profileKey);
}

function emit(gates, repoName, resolution, profileKey = null) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-operations-check/v1',
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
  console.log('=== docs:operations:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  process.exit(ok ? 0 : 1);
}

main();
