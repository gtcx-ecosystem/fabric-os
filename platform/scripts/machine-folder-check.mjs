#!/usr/bin/env node
/**
 * Validate the canonical machine/ product and workflow surface.
 *
 * The spec moved from pm/spec to machine/spec. Keep the pm:folder:check alias
 * executable during migration, but validate only the canonical machine paths.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';

const ROOT = repoRootFromImportMeta(import.meta.url);
const SPEC = join(ROOT, 'machine/spec/pm-folder-requirements.json');

const issues = [];
if (!existsSync(SPEC)) {
  issues.push(`missing spec: ${SPEC}`);
} else {
  const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
  for (const file of spec.required?.files ?? []) {
    if (!existsSync(join(ROOT, file.path))) issues.push(`missing file: ${file.path}`);
  }
  for (const dir of spec.required?.directories ?? []) {
    if (dir.optional || dir.optionalUntilR1) continue;
    const path = join(ROOT, dir.path);
    if (!existsSync(path)) {
      issues.push(`missing directory: ${dir.path}`);
      continue;
    }
    if (dir.minFiles) {
      const count = readdirSync(path).filter((name) => !name.startsWith('.')).length;
      if (count < dir.minFiles) issues.push(`${dir.path} needs ${dir.minFiles} entries; found ${count}`);
    }
  }
}

const total = issues.length === 0 ? 1 : issues.length + 1;
const score100 = issues.length === 0 ? 100 : Math.round((1 / total) * 100);
console.log(`machine folder score=${score100}/100`);
for (const issue of issues) console.log(`issue=${issue}`);
process.exit(issues.length === 0 ? 0 : 1);
