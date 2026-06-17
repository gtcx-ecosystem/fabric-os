#!/usr/bin/env node
/**
 * docs:tree:check — single enforceable /docs structure gate (P48 + IA)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { validateDocsTree } from './lib/docs-tree-gates.mjs';

const REPO = process.argv.includes('--repo')
  ? join(process.cwd(), process.argv[process.argv.indexOf('--repo') + 1])
  : repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');
const STRUCTURE_ONLY = process.argv.includes('--structure-only');

const result = validateDocsTree(REPO, {
  strict: STRICT,
  structureOnly: STRUCTURE_ONLY,
  strictFiles: !STRUCTURE_ONLY,
});

if (WRITE) {
  const out = join(REPO, 'audit/evidence/docs-tree-latest.json');
  mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
  writeFileSync(
    out,
    `${JSON.stringify(
      {
        schema: 'gtcx://canon-os/docs-tree-witness/v1',
        generatedAt: new Date().toISOString(),
        repo: REPO.split('/').pop(),
        strict: STRICT,
        structureOnly: STRUCTURE_ONLY,
        profile: result.profileKey,
        pass: result.pass,
        metrics: result.metrics,
        gates: result.gates,
        failed: result.gates.filter((g) => !g.ok).map((g) => g.id),
      },
      null,
      2,
    )}\n`,
  );
}

const failed = result.gates.filter((g) => !g.ok);
const shown = failed.length > 40 ? [...failed.slice(0, 40), { id: '…', ok: false, detail: `${failed.length - 40} more` }] : result.gates;

for (const g of shown) {
  if (!STRICT && g.ok) continue;
  console.log(`${g.ok ? 'PASS' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
}

console.log(`\nmetrics: ${result.metrics.mdFiles} md · ${result.metrics.folders} folders · ${result.metrics.missingReadme} no-README · ${result.metrics.missingFrontmatter} no-FM · ${result.metrics.missingDocumentType} no-type`);
console.log(`\n${result.pass ? 'PASS' : 'FAIL'} docs:tree:check (${result.gates.length - failed.length}/${result.gates.length})`);
process.exit(!result.pass ? 1 : 0);
