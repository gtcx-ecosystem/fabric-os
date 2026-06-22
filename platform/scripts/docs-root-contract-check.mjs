#!/usr/bin/env node
/**
 * P48 — docs root contract gate (thin instances)
 * Spec: machine/spec/docs-root-contract.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';

const REPO = (() => {
  if (process.argv.includes('--repo')) {
    const arg = process.argv[process.argv.indexOf('--repo') + 1];
    return arg.startsWith('/') ? arg : join(process.cwd(), arg);
  }
  return repoRootFromImportMeta(import.meta.url);
})();
const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');
const WITNESS = join(REPO, 'audit/evidence/docs-root-contract-latest.json');

const IA_MAP_URL =
  'github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/docs-ia/IA-PILLAR-MAP.md';
const ROOT_CONTRACT_URL =
  'github.com/gtcx-ecosystem/canon-os/blob/main/pm/spec/docs-root-contract.json';
const HUB_CONVENTIONS_URL = 'github.com/gtcx-ecosystem/canon-os/blob/main/docs/conventions.md';
const DOCS_ROOT_SPEC_URL = 'github.com/gtcx-ecosystem/canon-os/blob/main/pm/spec/docs-folders/00-docs-root.json';

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function loadRootContract() {
  for (const path of [
    join(REPO, 'machine/spec/docs-root-contract.json'),
    join(REPO, '../canon-os/pm/spec/docs-root-contract.json'),
  ]) {
    if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  }
  return null;
}

function requiresRootFolderSpec(repo) {
  return repo === 'canon-os';
}

function readText(rel) {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

function lineCount(text) {
  return text.split('\n').length;
}

function mentionsRootContract(text) {
  return (
    /docs root contract|docs-root-contract|root contract/i.test(text) ||
    /P48.*docs root/i.test(text) ||
    text.includes('docs-root-contract.json')
  );
}

function main() {
  const gates = [];
  const spec = loadRootContract();
  const repoName = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;
  const hubFolderSpec = requiresRootFolderSpec(repoName);
  const docsDir = join(REPO, 'docs');

  gates.push(gate('spec:present', !!spec?.updated, spec?.updated ?? 'missing'));

  for (const file of ['README.md', 'INDEX.md', 'sor.json', 'conventions.md', 'CHANGELOG.md']) {
    gates.push(gate(`file:${file}`, existsSync(join(docsDir, file)), file));
  }

  const folderSpecPath = join(docsDir, 'FOLDER-SPEC.md');
  gates.push(
    gate(
      hubFolderSpec ? 'hub:folder-spec' : 'product:no-folder-spec',
      hubFolderSpec ? existsSync(folderSpecPath) : !existsSync(folderSpecPath),
      hubFolderSpec ? 'canon-os hub requires FOLDER-SPEC.md' : 'product repos omit root FOLDER-SPEC.md',
    ),
  );

  const indexText = readText('docs/INDEX.md');
  if (indexText) {
    gates.push(gate('index:ia-map-link', indexText.includes('IA-PILLAR-MAP'), IA_MAP_URL));
    gates.push(
      gate(
        'index:thin-max-lines',
        lineCount(indexText) <= (spec?.files?.INDEX?.maxRecommendedLines ?? 55),
        `${lineCount(indexText)} lines`,
      ),
    );
    gates.push(
      gate(
        'index:thin-instance',
        /thin instance|Fleet normative/i.test(indexText),
        'declares thin instance',
      ),
    );
    gates.push(
      gate(
        'index:root-contract-link',
        mentionsRootContract(indexText) || indexText.includes('docs-root-contract'),
        'links docs root contract spec',
      ),
    );
    gates.push(
      gate(
        'index:foundation-entry',
        /foundation/i.test(indexText),
        'links foundation layer (logical or primitives/)',
      ),
    );
  }

  const readmeText = readText('docs/README.md');
  if (readmeText) {
    gates.push(
      gate(
        'readme:central-ia',
        readmeText.includes('IA-PILLAR-MAP') || readmeText.includes('00-docs-root'),
        'links fleet IA or docs-root spec',
      ),
    );
    gates.push(
      gate(
        'readme:root-contract',
        mentionsRootContract(readmeText),
        'mentions P48 docs root contract',
      ),
    );
  }

  const convText = readText('docs/conventions.md');
  if (convText && !hubFolderSpec) {
    gates.push(
      gate(
        'conventions:hub-link',
        convText.includes(HUB_CONVENTIONS_URL) ||
          (convText.includes('canon-os') && /conventions/i.test(convText)),
        HUB_CONVENTIONS_URL,
      ),
    );
  }
  if (convText && hubFolderSpec) {
    gates.push(
      gate(
        'conventions:hub-sor',
        mentionsRootContract(convText) || convText.includes('INDEX.md'),
        'hub conventions SoR',
      ),
    );
  }

  const changelogText = readText('docs/CHANGELOG.md');
  if (changelogText) {
    gates.push(
      gate(
        'changelog:structural-scope',
        /structural/i.test(changelogText),
        'states structural-only scope',
      ),
    );
  }

  const sorText = readText('docs/sor.json');
  if (sorText) {
    try {
      const sor = JSON.parse(sorText);
      gates.push(gate('sor:repo', !!sor.repo, sor.repo ?? 'missing'));
      gates.push(gate('sor:repoKind', !!sor.repoKind, sor.repoKind ?? 'missing'));
    } catch {
      gates.push(gate('sor:parse', false, 'invalid JSON'));
    }
  }

  emit(gates, repoName, hubFolderSpec);
}

function emit(gates, repoName, hubFolderSpec) {
  const failed = gates.filter((g) => !g.ok);
  const pass = failed.length === 0;
  const witness = {
    schema: 'gtcx://canon-os/docs-root-contract-check/v1',
    generatedAt: new Date().toISOString(),
    repo: repoName,
    profile: hubFolderSpec ? 'canon-os-hub' : 'product',
    pass,
    strict: STRICT,
    gates,
    failed: failed.map((g) => g.id),
    fleetSoR: {
      iaMap: IA_MAP_URL,
      rootContract: ROOT_CONTRACT_URL,
      docsRootSpec: DOCS_ROOT_SPEC_URL,
    },
  };

  console.log('=== docs:root-contract:check ===\n');
  for (const g of gates) {
    console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  }
  console.log(`\n${pass ? 'PASS' : 'FAIL'} — ${gates.length - failed.length}/${gates.length}`);

  if (WRITE) {
    mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
    console.log(`witness: ${WITNESS}`);
  }

  process.exit(pass ? 0 : 1);
}

main();
