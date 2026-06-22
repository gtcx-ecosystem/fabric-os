#!/usr/bin/env node
/**
 * docs:operations:check — strict docs/operations/ pack + fabric-os subfolder contract
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './lib/resolve-docs-pack.mjs';
import {
  findLocalFolderSpecFiles,
  gateNoLocalFolderSpec,
  gateReadmeCentralSpec,
} from './lib/folder-spec-centralization-gates.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-operations-latest.json');
const PACK = 'docs-operations-pack.json';
const SUBFOLDER_CONTRACT = 'docs-operations-subfolder-contract.json';
const ROOT_ALLOW = new Set(['README.md', 'scorecard.md']);

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function listLooseRootMd(dir, allow = ROOT_ALLOW) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && !allow.has(e.name))
    .map((e) => e.name);
}

function listUnknownSubfolders(dir, allowed) {
  if (!existsSync(dir)) return [];
  const allow = allowed instanceof Set ? allowed : new Set(allowed);
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !allow.has(e.name))
    .map((e) => e.name);
}

function loadJsonCandidates(repoRoot, name) {
  const local = join(repoRoot, 'machine/spec', name);
  const fleet = join(repoRoot, '../canon-os/pm/spec', name);
  const path = existsSync(local) ? local : fleet;
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadComplianceNest(repoRoot) {
  return loadJsonCandidates(repoRoot, 'docs-operations-compliance-nest.json');
}

function loadSubfolderContract(repoRoot) {
  return loadJsonCandidates(repoRoot, SUBFOLDER_CONTRACT);
}

function enforceSubfolderContract(gates, opsDir, contract, activeSubs, enforceStrict) {
  if (!contract) {
    if (enforceStrict) {
      gates.push(gate('subfolder-contract:present', false, SUBFOLDER_CONTRACT));
    }
    return;
  }
  gates.push(gate('subfolder-contract:present', true, SUBFOLDER_CONTRACT));

  const root = contract.root ?? {};
  for (const f of (root.requiredFiles ?? []).filter((x) => x !== 'FOLDER-SPEC.md')) {
    gates.push(gate(`root-required:${f}`, existsSync(join(opsDir, f)), `docs/operations/${f}`));
  }

  for (const sub of activeSubs) {
    const def = contract.subfolders?.[sub];
    if (!def) continue;
    const dir = join(opsDir, sub);
    if (!existsSync(dir)) continue;

    for (const f of (def.requiredFiles ?? ['README.md']).filter((x) => x !== 'FOLDER-SPEC.md')) {
      gates.push(gate(`subfolder-readme:${sub}`, existsSync(join(dir, f)), `docs/operations/${sub}/${f}`));
    }

    if (def.closedRootFileAllowlist) {
      const allow = new Set(def.allowedRootFiles ?? []);
      const loose = listLooseRootMd(dir, allow);
      gates.push(
        gate(
          `subfolder-closed:${sub}`,
          loose.length === 0,
          loose.length ? loose.join(', ') : 'closed allowlist',
        ),
      );
    } else if (def.forbidLooseMdAtRoot) {
      const allow = new Set([
        ...(def.requiredFiles ?? ['README.md']).filter((x) => x !== 'FOLDER-SPEC.md'),
        ...(def.canonicalRootFiles ?? []),
      ]);
      const loose = listLooseRootMd(dir, allow);
      gates.push(
        gate(
          `subfolder-no-loose:${sub}`,
          loose.length === 0,
          loose.length ? loose.join(', ') : 'README + canonical only',
        ),
      );
    }

    let allowedChild = new Set([...(def.allowedChildFolders ?? []), 'archive']);
    if (def.useNestSpecForChildFolders && def.nestSpec) {
      const nest = loadJsonCandidates(REPO, def.nestSpec.replace(/^pm\/spec\//, ''));
      if (nest?.allowedChildFolders) {
        allowedChild = new Set([...nest.allowedChildFolders, 'archive']);
      }
    }
    const unknown = listUnknownSubfolders(dir, allowedChild);
    gates.push(
      gate(
        `subfolder-children:${sub}`,
        unknown.length === 0,
        unknown.length ? unknown.join(', ') : 'fabric contract child folders',
      ),
    );

    // Format enforcement: loose files must match the declared filePatternRegex.
    if (def.filePatternRegex) {
      const re = new RegExp(def.filePatternRegex);
      const allowRoot = new Set([
        ...(def.requiredFiles ?? ['README.md']),
        ...(def.allowedRootFiles ?? []),
        'README.md',
        'scorecard.md',
      ]);
      const badFmt = readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && !allowRoot.has(e.name) && !re.test(e.name))
        .map((e) => e.name);
      gates.push(
        gate(
          `subfolder-format:${sub}`,
          badFmt.length === 0,
          badFmt.length ? `${badFmt.join(', ')} ≠ ${def.filePatternHuman ?? def.filePatternRegex}` : (def.filePatternHuman ?? 'format ok'),
        ),
      );
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
          isHubHost || /ecosystem-os|canon-os|fabric-os/i.test(readme),
          'hub README must point to fleet ops narrative',
        ),
      );
    }
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  for (const entry of (spec.requiredRootFiles ?? []).filter((e) => !e.path.endsWith('FOLDER-SPEC.md'))) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const looseRoot = listLooseRootMd(opsDir);
  gates.push(
    gate(
      'forbid:loose-root-md',
      looseRoot.length === 0,
      looseRoot.length ? looseRoot.join(', ') : 'README + scorecard only',
    ),
  );

  const opsFolderSpecViolations = findLocalFolderSpecFiles(opsDir);
  gates.push(
    gate(
      'forbid:local-folder-spec',
      opsFolderSpecViolations.length === 0,
      opsFolderSpecViolations.length
        ? opsFolderSpecViolations.join(', ')
        : 'operations/ — central spec via README only',
    ),
  );

  const allowedSubs = new Set([
    ...(profile?.requiredSubfolders ?? []),
    ...(profile?.optionalSubfolders ?? []),
    'archive',
  ]);
  const unknownSubs = listUnknownSubfolders(opsDir, allowedSubs);
  gates.push(gate('allowlist:subfolders', unknownSubs.length === 0, unknownSubs.length ? unknownSubs.join(', ') : 'pack profile subfolders'));

  const rootReadme = join(opsDir, 'README.md');
  if (existsSync(rootReadme)) {
    const text = readFileSync(rootReadme, 'utf8');
    gates.push(gate('root-readme:cross-ref', /cross-ref/i.test(text) && /foundation/i.test(text), 'README cross-ref'));
    gates.push(gate('root-readme:ops-link', /\bops\//i.test(text), 'README must link operations/ machine SoR'));
    gates.push(
      gate(
        'readme:central-spec',
        gateReadmeCentralSpec(text, { specId: '05-operations', packName: 'docs-operations-pack.json' }),
        'README links canon-os 05-operations + pack',
      ),
    );
  }

  for (const sub of profile?.requiredSubfolders ?? []) {
    const def = spec.requiredSubfolders?.[sub];
    const dir = join(opsDir, sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `docs/operations/${sub}/`));
    for (const f of (def?.required ?? ['README.md']).filter((x) => x !== 'FOLDER-SPEC.md')) {
      gates.push(gate(`subfolder-file:${sub}/${f}`, existsSync(join(dir, f)), `docs/operations/${sub}/${f}`));
    }
    for (const file of def?.canonicalFiles ?? []) {
      gates.push(gate(`canonical:${sub}/${file}`, existsSync(join(dir, file)), `docs/operations/${sub}/${file}`));
    }
  }

  if ((profile?.requiredSubfolders ?? []).includes('compliance')) {
    const nest = loadComplianceNest(REPO);
    const complianceDir = join(opsDir, 'compliance');
    if (nest && existsSync(complianceDir)) {
      const forbidden = new Set(nest.forbiddenChildFolders ?? []);
      const bad = readdirSync(complianceDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && forbidden.has(e.name))
        .map((e) => e.name);
      gates.push(
        gate('compliance:forbid-slices', bad.length === 0, bad.length ? bad.join(', ') : 'artifact-type taxonomy only'),
      );
    }
  }

  const contract = loadSubfolderContract(REPO);
  const presentSubs = readdirSync(opsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);
  const activeSubs = presentSubs.filter((s) => allowedSubs.has(s));
  const enforceStrict = profile?.subfolderContractEnforced === true;
  enforceSubfolderContract(gates, opsDir, contract, activeSubs, enforceStrict);

  if (spec.fabricContract?.referenceImplRepo) {
    gates.push(
      gate(
        'fabric-contract:declared',
        true,
        `${spec.fabricContract.referenceImplRepo} → ${spec.fabricContract.referencePath ?? 'docs/operations/'}`,
      ),
    );
  }

  emit(gates, repoName, resolution, profileKey);
}

function emit(gates, repoName, resolution, profileKey = null) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-operations-check/v3',
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
