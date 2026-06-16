#!/usr/bin/env node
/**
 * docs:agents:check — strict docs/agents/ pack per resolved docs-agents-pack.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-agents-latest.json');
const PACK = 'docs-agents-pack.json';

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
      resolution.localPath ?? 'missing pm/spec/docs-agents-pack.json',
    ),
  );
  gates.push(gate('spec:not-stub', !resolution.localIsStub, resolution.localIsStub ? 'upgrade pack' : 'full local pack'));
  gates.push(
    gate(
      'spec:resolved-full',
      resolution.resolvedIsFull,
      resolution.resolvedIsFull ? 'resolved full agents pack' : 'could not resolve pack',
    ),
  );

  if (!spec || !resolution.resolvedIsFull) {
    emit(gates, repoName, resolution);
    return;
  }

  const tier = readProductTier(REPO);
  const profileKey = profileKeyFromTier(tier);
  const profile = spec.profiles?.[profileKey] ?? spec.profiles?.product;
  gates.push(gate('profile', !!profile, profileKey));

  const agentsDir = join(REPO, 'docs/agents');
  const agentsExists = existsSync(agentsDir);

  if (!profile?.agentsRequired && !agentsExists) {
    gates.push(gate('agents-optional-skip', true, `${profileKey} — agents not required`));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  for (const entry of spec.requiredRootFiles ?? []) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const rootReadme = join(agentsDir, 'README.md');
  if (existsSync(rootReadme)) {
    const text = readFileSync(rootReadme, 'utf8');
    gates.push(gate('root-readme:separation', /agent-spine|operations/i.test(text), 'README cites separation'));
    gates.push(gate('root-readme:pack-link', /docs-agents-pack/i.test(text), 'README cites pack'));
  }

  const folderSpec = join(agentsDir, 'FOLDER-SPEC.md');
  if (existsSync(folderSpec)) {
    gates.push(
      gate('root-folder-spec:pack-link', /docs-agents-pack/i.test(readFileSync(folderSpec, 'utf8')), 'FOLDER-SPEC cites pack'),
    );
  }

  const requiredSubs = profile?.requiredSubfolders ?? spec.allRequiredSubfolders ?? [];
  for (const sub of requiredSubs) {
    const def = spec.requiredSubfolders?.[sub];
    const dir = join(agentsDir, sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `docs/agents/${sub}/`));
    for (const f of def?.required ?? ['README.md']) {
      gates.push(gate(`subfolder-file:${sub}/${f}`, existsSync(join(dir, f)), `docs/agents/${sub}/${f}`));
    }
  }

  const chainPath = join(agentsDir, 'bootstrap/session-chain.json');
  if (existsSync(chainPath)) {
    try {
      const chain = JSON.parse(readFileSync(chainPath, 'utf8'));
      gates.push(gate('bootstrap:session-chain-valid', Array.isArray(chain.reads) || Array.isArray(chain.defaultHumanOrder), 'session-chain shape'));
    } catch {
      gates.push(gate('bootstrap:session-chain-valid', false, 'invalid JSON'));
    }
  }

  const routesPath = join(agentsDir, 'bootstrap/provider-routes.json');
  if (existsSync(routesPath)) {
    try {
      const routes = JSON.parse(readFileSync(routesPath, 'utf8'));
      gates.push(gate('bootstrap:provider-routes-valid', Array.isArray(routes.routes), 'provider-routes shape'));
    } catch {
      gates.push(gate('bootstrap:provider-routes-valid', false, 'invalid JSON'));
    }
  }

  emit(gates, repoName, resolution, profileKey);
}

function emit(gates, repoName, resolution, profileKey = null) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-agents-check/v1',
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
  console.log(`docs:agents:check — ${ok ? 'PASS' : 'FAIL'} (${gates.filter((g) => g.ok).length}/${gates.length})`);
  if (!ok) {
    for (const g of gates.filter((x) => !x.ok)) console.log(`  ✗ ${g.id}${g.detail ? `: ${g.detail}` : ''}`);
  }
  process.exit(ok ? 0 : 1);
}

main();
